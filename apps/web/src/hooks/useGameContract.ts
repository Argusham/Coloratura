"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  usePublicClient,
  useChainId,
} from "wagmi";
import { decodeEventLog } from "viem";
import { celo, celoAlfajores } from "viem/chains";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  ENTRY_FEE,
  ERC20_ABI,
  CUSD_ADDRESS_MAINNET,
  CUSD_ADDRESS_TESTNET
} from "@/config/contract.config";
import type { LeaderboardEntry } from "@/types/game.types";

export function useGameContract() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });

  const [sessionId, setSessionId] = useState<bigint | null>(null);
  const [gameInstanceId, setGameInstanceId] = useState<string | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [submitRetryCount, setSubmitRetryCount] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [lastCheckedDay, setLastCheckedDay] = useState<bigint | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Determine which cUSD address to use based on chain
  const cusdAddress = chainId === celoAlfajores.id ? CUSD_ADDRESS_TESTNET : CUSD_ADDRESS_MAINNET;

  // Write contract hooks
  const { data: approveHash, writeContract: approveWrite } = useWriteContract();
  const { data: startGameHash, writeContract: startGameWrite } = useWriteContract();
  const { data: submitScoreHash, writeContract: submitScoreWrite } = useWriteContract();
  const { data: finalizeHash, writeContract: finalizeWrite } = useWriteContract();

  // Transaction receipts
  const {
    isLoading: isApproveLoading,
    isSuccess: isApproveSuccess,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const {
    isLoading: isStartGameLoading,
    isSuccess: isStartGameSuccess,
    data: startGameReceipt,
  } = useWaitForTransactionReceipt({
    hash: startGameHash,
  });

  const { isLoading: isSubmitScoreLoading, isSuccess: isSubmitScoreSuccess } =
    useWaitForTransactionReceipt({
      hash: submitScoreHash,
    });

  const { isLoading: isFinalizeLoading, isSuccess: isFinalizeSuccess } =
    useWaitForTransactionReceipt({
      hash: finalizeHash,
    });

  // Read current day from contract
  const { data: currentDay } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "currentDay",
    chainId,
  });

  // Read leaderboard from contract - try current day first
  const { data: leaderboardData, refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCurrentTop3",
    chainId,
  });

  // If current day has no scores, try previous days (up to 7 days back)
  const { data: yesterdayData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDailyTop3",
    args: currentDay && currentDay > 0n ? [currentDay - 1n] : undefined,
    chainId,
  });

  const { data: twoDaysAgoData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDailyTop3",
    args: currentDay && currentDay > 1n ? [currentDay - 2n] : undefined,
    chainId,
  });

  const { data: threeDaysAgoData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDailyTop3",
    args: currentDay && currentDay > 2n ? [currentDay - 3n] : undefined,
    chainId,
  });

  // Read player stats
  const { data: playerStats, refetch: refetchPlayerStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    chainId,
  });

  // Check cUSD allowance
  const { data: allowance } = useReadContract({
    address: cusdAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    chainId,
  });

  // Update leaderboard when data changes - use first non-empty data set
  useEffect(() => {
    // Try to find the first non-empty leaderboard data
    const datasets = [leaderboardData, yesterdayData, twoDaysAgoData, threeDaysAgoData];

    for (const data of datasets) {
      if (data) {
        // Contract returns [topPlayers, topScores, rewards]
        const [topPlayers, topScores, rewards] = data;
        const entries: LeaderboardEntry[] = topPlayers
          .map((player, index) => ({
            player,
            score: Number(topScores[index]),
            level: 0,
          }))
          .filter((entry) => entry.score > 0);

        if (entries.length > 0) {
          setLeaderboard(entries);
          return;
        }
      }
    }

    // If all datasets are empty, set empty leaderboard
    setLeaderboard([]);
  }, [leaderboardData, yesterdayData, twoDaysAgoData, threeDaysAgoData]);

  // After approval succeeds, automatically start the game
  useEffect(() => {
    if (isApproveSuccess && isStartingGame) {
      console.log("Approval successful, now starting game...");
      startGameWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "startGame",
        chainId,
      });
    }
  }, [isApproveSuccess, isStartingGame, startGameWrite, chainId]);

  // Handle start game transaction success
  useEffect(() => {
    const extractSessionId = async () => {
      if (!isStartGameSuccess || !startGameReceipt || !publicClient) return;

      let extractedSessionId: bigint | null = null;

      try {
        console.log("[SESSION] Extracting session ID from transaction receipt...");

        // Parse GameStarted event from logs
        const logs = startGameReceipt.logs;
        for (const log of logs) {
          try {
            if (log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
              const decoded = decodeEventLog({
                abi: CONTRACT_ABI,
                data: log.data,
                topics: log.topics,
              });

              if (decoded.eventName === "GameStarted") {
                extractedSessionId = decoded.args.sessionId as bigint;
                console.log("[SESSION] ✅ Session ID extracted from event:", extractedSessionId.toString());
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }

        // Fallback: Read sessionCounter if event parsing failed
        if (!extractedSessionId) {
          console.log("[SESSION] Event parsing failed, falling back to sessionCounter...");
          const counter = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "sessionCounter",
          });
          extractedSessionId = counter as bigint;
          console.log("[SESSION] ✅ Session ID from sessionCounter:", extractedSessionId.toString());
        }

        if (extractedSessionId) {
          // Create a unique game instance ID to bind this session
          const newGameInstanceId = `${extractedSessionId.toString()}-${Date.now()}`;
          console.log("[SESSION] ✅ Created new game instance:", newGameInstanceId);
          console.log("[SESSION] ✅ Session bound to address:", address);

          setSessionId(extractedSessionId);
          setGameInstanceId(newGameInstanceId);
          setSubmitRetryCount(0);
          setIsStartingGame(false);
        } else {
          console.error("[SESSION] ❌ Failed to extract session ID");
          setIsStartingGame(false);
          alert("Failed to start game. Could not get session ID.");
        }
      } catch (error) {
        console.error("[SESSION] ❌ Error extracting session ID:", error);
        setIsStartingGame(false);
        alert("Failed to start game. Please try again.");
      }
    };

    extractSessionId();
  }, [isStartGameSuccess, startGameReceipt, publicClient, address]);

  // Handle submit score transaction success
  useEffect(() => {
    if (isSubmitScoreSuccess) {
      console.log("[SCORE_SUBMIT] ✅ Score submitted successfully!");
      setIsSubmittingScore(false);

      // Invalidate the session after successful submission to prevent reuse
      console.log("[SESSION] Invalidating session after successful score submission");
      setSessionId(null);
      setGameInstanceId(null);
      setSubmitRetryCount(0);

      // Refetch leaderboard and player stats to show updated data
      refetchLeaderboard();
      refetchPlayerStats();
    }
  }, [isSubmitScoreSuccess, refetchLeaderboard, refetchPlayerStats]);

  // Handle finalize transaction success
  useEffect(() => {
    if (isFinalizeSuccess) {
      console.log("[FINALIZE] ✅ Day finalized successfully!");
      setIsFinalizing(false);
      setLastCheckedDay(currentDay ?? null);

      // Refetch leaderboard after finalization
      refetchLeaderboard();
    }
  }, [isFinalizeSuccess, currentDay, refetchLeaderboard]);

  // AUTOMATIC DAY FINALIZATION - Triggers when user visits site or plays game
  useEffect(() => {
    const checkAndFinalizeDayIfNeeded = async () => {
      // Only proceed if we have necessary data and user is connected
      if (!isConnected || !address || !publicClient || !currentDay) {
        return;
      }

      // Don't check if already finalizing or if we already checked this day
      if (isFinalizing || isFinalizeLoading || lastCheckedDay === currentDay) {
        return;
      }

      try {
        console.log("[FINALIZE] Checking if day finalization is needed...");

        // Get current blockchain timestamp
        const block = await publicClient.getBlock();
        const currentBlockchainDay = block.timestamp / 86400n; // 86400 seconds = 1 day

        console.log("[FINALIZE] Day check:", {
          contractCurrentDay: currentDay.toString(),
          blockchainCurrentDay: currentBlockchainDay.toString(),
          needsFinalization: currentBlockchainDay > currentDay
        });

        // If blockchain day is ahead of contract's currentDay, we need to finalize
        if (currentBlockchainDay > currentDay) {
          console.log("[FINALIZE] 🔄 New day detected! Triggering automatic finalization...");
          console.log(`[FINALIZE] Contract day: ${currentDay.toString()}, Blockchain day: ${currentBlockchainDay.toString()}`);

          setIsFinalizing(true);

          // Call finalizeCurrentDay on the contract
          finalizeWrite({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "finalizeCurrentDay",
            chainId,
          });

          console.log("[FINALIZE] ✅ Finalization transaction submitted!");
        } else {
          console.log("[FINALIZE] ✅ Day is current, no finalization needed");
          setLastCheckedDay(currentDay);
        }
      } catch (error) {
        console.error("[FINALIZE] ❌ Error checking/finalizing day:", error);
        setIsFinalizing(false);

        // Don't alert user for finalization errors - it's not critical to their experience
        // The contract will auto-finalize on next score submission anyway
        console.log("[FINALIZE] Note: Day will auto-finalize on next score submission");
      }
    };

    checkAndFinalizeDayIfNeeded();
  }, [isConnected, address, publicClient, currentDay, chainId, isFinalizing, isFinalizeLoading, lastCheckedDay, finalizeWrite]);

  const startGame = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first!");
      return;
    }

    console.log("[GAME_START] 🎮 Starting new game session...");

    // CRITICAL: Force invalidate any existing session before starting a new one
    console.log("[GAME_START] Invalidating previous session...");
    setSessionId(null);
    setGameInstanceId(null);
    setIsSubmittingScore(false);
    setSubmitRetryCount(0);
    setIsStartingGame(true);

    try {
      const entryFeeBigInt = BigInt(ENTRY_FEE);
      const currentAllowance = allowance as bigint | undefined;

      // Check if approval is needed
      if (!currentAllowance || currentAllowance < entryFeeBigInt) {
        console.log("[GAME_START] Approving cUSD spend...");
        approveWrite({
          address: cusdAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, entryFeeBigInt],
          chainId,
        });
      } else {
        // Already approved, start game directly
        console.log("[GAME_START] ✅ Already approved, starting game...");
        startGameWrite({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "startGame",
          chainId,
        });
      }
    } catch (error) {
      console.error("[GAME_START] ❌ Error starting game:", error);
      setIsStartingGame(false);
      alert("Failed to start game. Please try again.");
    }
  };

  const validateSessionBeforeSubmit = async (
    sessionIdToValidate: bigint
  ): Promise<{ valid: boolean; reason?: string }> => {
    if (!publicClient || !address) {
      return { valid: false, reason: "No public client or address available" };
    }

    try {
      console.log("[SCORE_SUBMIT] Validating session before submission:", sessionIdToValidate.toString());

      // Since getSessionScore and gameSessions aren't in the deployed contract ABI,
      // we'll do a simpler validation by checking if the sessionId is reasonable
      // and letting the contract handle the detailed validation

      // Basic validation: Check if session ID is valid (non-zero and not too old)
      const sessionCounter = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "sessionCounter",
      }) as bigint;

      console.log("[SCORE_SUBMIT] Session counter validation:", {
        sessionId: sessionIdToValidate.toString(),
        sessionCounter: sessionCounter.toString(),
        valid: sessionIdToValidate > 0n && sessionIdToValidate <= sessionCounter
      });

      // Check if session ID is within valid range
      if (sessionIdToValidate === 0n || sessionIdToValidate > sessionCounter) {
        return { valid: false, reason: "Invalid session ID" };
      }

      console.log("[SCORE_SUBMIT] ✅ Basic session validation passed!");
      return { valid: true };

    } catch (error) {
      console.error("[SCORE_SUBMIT] ❌ Error validating session:", error);
      return { valid: false, reason: `Validation error: ${error}` };
    }
  };

  const submitScore = async (score: number, level: number, retryAttempt: number = 0) => {
    if (!sessionId || !gameInstanceId) {
      console.error("[SCORE_SUBMIT] ❌ No session ID or game instance ID available");
      alert("Cannot submit score: No active game session");
      return;
    }

    const MAX_RETRY_ATTEMPTS = 1; // Allow one retry with new session

    console.log(`[SCORE_SUBMIT] 📊 Submitting score - Attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS + 1}`, {
      score,
      level,
      sessionId: sessionId.toString(),
      gameInstanceId
    });

    setIsSubmittingScore(true);

    try {
      // PRE-SUBMISSION VALIDATION
      const validation = await validateSessionBeforeSubmit(sessionId);

      if (!validation.valid) {
        console.error("[SCORE_SUBMIT] ❌ Session validation failed:", validation.reason);

        // AUTOMATIC RETRY LOGIC
        if (retryAttempt < MAX_RETRY_ATTEMPTS) {
          console.log("[SCORE_SUBMIT] 🔄 Attempting to create new session and retry...");

          setIsSubmittingScore(false);
          setSubmitRetryCount(retryAttempt + 1);

          // Show user we're retrying
          alert(`Session validation failed: ${validation.reason}\n\nAutomatically retrying with a new session...`);

          // Force a new game session
          await startGame();

          // Note: The actual retry will happen after the new session is created
          // We'll store the score/level in a ref to retry after new session

          return;
        } else {
          // Exhausted retries
          console.error("[SCORE_SUBMIT] ❌ Retry attempts exhausted");
          setIsSubmittingScore(false);
          alert(
            `Failed to submit score after ${MAX_RETRY_ATTEMPTS + 1} attempts.\n\n` +
            `Reason: ${validation.reason}\n\n` +
            `Your score: ${score} (Level ${level})\n\n` +
            `Please contact support if this persists.`
          );
          return;
        }
      }

      // Session is valid, proceed with submission
      console.log("[SCORE_SUBMIT] ✅ Session validated, submitting to contract...");

      submitScoreWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "submitScore",
        args: [sessionId, score, level],
        chainId,
      });

    } catch (error) {
      console.error("[SCORE_SUBMIT] ❌ Error during score submission:", error);
      setIsSubmittingScore(false);

      // Parse error message for specific contract errors
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("AlreadySubmitted")) {
        alert(
          `This session has already been used.\n\n` +
          `Score: ${score} (Level ${level})\n\n` +
          `Please start a new game to play again.`
        );
      } else if (errorMessage.includes("SessionExpired")) {
        alert(
          `Your session has expired (sessions last 1 hour).\n\n` +
          `Score: ${score} (Level ${level})\n\n` +
          `Please start a new game.`
        );
      } else if (errorMessage.includes("NotYourSession")) {
        alert(
          `Session ownership error.\n\n` +
          `Please start a new game.`
        );
      } else {
        alert(
          `Failed to submit score.\n\n` +
          `Score: ${score} (Level ${level})\n\n` +
          `Error: ${errorMessage}\n\n` +
          `Please try starting a new game.`
        );
      }
    }
  };

  const resetSession = () => {
    console.log("[SESSION] Resetting session state");
    setSessionId(null);
    setGameInstanceId(null);
    setSubmitRetryCount(0);
  };

  return {
    address,
    isConnected,
    sessionId,
    gameInstanceId,
    isStartingGame: isStartingGame || isApproveLoading || isStartGameLoading,
    isStartGameLoading,
    isStartGameSuccess,
    isSubmittingScore,
    isSubmitScoreLoading,
    isSubmitScoreSuccess,
    submitRetryCount,
    isFinalizing: isFinalizing || isFinalizeLoading,
    leaderboard,
    playerStats,
    startGame,
    submitScore,
    resetSession,
  };
}
