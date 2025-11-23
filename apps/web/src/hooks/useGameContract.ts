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
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Determine which cUSD address to use based on chain
  const cusdAddress = chainId === celoAlfajores.id ? CUSD_ADDRESS_TESTNET : CUSD_ADDRESS_MAINNET;

  // Write contract hooks
  const { data: approveHash, writeContract: approveWrite } = useWriteContract();
  const { data: startGameHash, writeContract: startGameWrite } = useWriteContract();
  const { data: submitScoreHash, writeContract: submitScoreWrite } = useWriteContract();

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
        const [topPlayers, topScores] = data;
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
                console.log("Session ID extracted from event:", extractedSessionId.toString());
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }

        // Fallback: Read sessionCounter if event parsing failed
        if (!extractedSessionId) {
          console.log("Event parsing failed, falling back to sessionCounter...");
          const counter = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "sessionCounter",
          });
          extractedSessionId = counter as bigint;
          console.log("Session ID from sessionCounter:", extractedSessionId.toString());
        }

        if (extractedSessionId) {
          setSessionId(extractedSessionId);
          setIsStartingGame(false);
        } else {
          console.error("Failed to extract session ID");
          setIsStartingGame(false);
          alert("Failed to start game. Could not get session ID.");
        }
      } catch (error) {
        console.error("Error extracting session ID:", error);
        setIsStartingGame(false);
        alert("Failed to start game. Please try again.");
      }
    };

    extractSessionId();
  }, [isStartGameSuccess, startGameReceipt, publicClient]);

  // Handle submit score transaction success
  useEffect(() => {
    if (isSubmitScoreSuccess) {
      setIsSubmittingScore(false);
      // Refetch leaderboard and player stats to show updated data
      refetchLeaderboard();
      refetchPlayerStats();
    }
  }, [isSubmitScoreSuccess, refetchLeaderboard, refetchPlayerStats]);

  const startGame = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsStartingGame(true);
    try {
      const entryFeeBigInt = BigInt(ENTRY_FEE);
      const currentAllowance = allowance as bigint | undefined;

      // Check if approval is needed
      if (!currentAllowance || currentAllowance < entryFeeBigInt) {
        console.log("Approving cUSD spend...");
        approveWrite({
          address: cusdAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, entryFeeBigInt],
          chainId,
        });
      } else {
        // Already approved, start game directly
        console.log("Already approved, starting game...");
        startGameWrite({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "startGame",
          chainId,
        });
      }
    } catch (error) {
      console.error("Error starting game:", error);
      setIsStartingGame(false);
      alert("Failed to start game. Please try again.");
    }
  };

  const submitScore = async (score: number, level: number) => {
    if (!sessionId) return;

    setIsSubmittingScore(true);
    try {
      submitScoreWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "submitScore",
        args: [sessionId, score, level],
        chainId,
      });
    } catch (error) {
      console.error("Error submitting score:", error);
      setIsSubmittingScore(false);
    }
  };

  const resetSession = () => {
    setSessionId(null);
  };

  return {
    address,
    isConnected,
    sessionId,
    isStartingGame: isStartingGame || isApproveLoading || isStartGameLoading,
    isStartGameLoading,
    isStartGameSuccess,
    isSubmittingScore,
    isSubmitScoreLoading,
    isSubmitScoreSuccess,
    leaderboard,
    playerStats,
    startGame,
    submitScore,
    resetSession,
  };
}
