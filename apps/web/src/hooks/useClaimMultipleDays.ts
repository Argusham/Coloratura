"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useChainId,
} from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract.config";

interface ClaimableDay {
  day: bigint;
  reward: bigint;
  rank: number;
  rewardFormatted: string;
}

export function useClaimMultipleDays() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [claimableDays, setClaimableDays] = useState<ClaimableDay[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Get current day from contract
  const { data: currentDay } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "currentDay",
    chainId,
  });

  // Write contract for claiming multiple days
  const { data: claimHash, writeContract: claimWrite } = useWriteContract();

  const {
    isLoading: isClaimLoading,
    isSuccess: isClaimSuccess,
  } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // Check for claimable rewards when user connects or currentDay changes
  useEffect(() => {
    const checkClaimableDays = async () => {
      if (!isConnected || !address || !currentDay) return;

      setIsChecking(true);
      const rewards: ClaimableDay[] = [];

      const currentDayNum = Number(currentDay);

      // Contract launch day is 20415 (based on deployment date)
      const CONTRACT_LAUNCH_DAY = 20415;

      // Check up to CLAIM_WINDOW_DAYS (7 days) backward from yesterday
      // Only check within the claim window as older days are expired
      const CLAIM_WINDOW_DAYS = 7;
      const oldestDayToCheck = Math.max(CONTRACT_LAUNCH_DAY, currentDayNum - CLAIM_WINDOW_DAYS);

      // Check from oldest day up to yesterday (currentDay - 1)
      for (let dayNum = oldestDayToCheck; dayNum < currentDayNum; dayNum++) {
        const dayToCheck = BigInt(dayNum);

        try {
          // Use the contract's canClaimReward function
          const result = await fetch(`https://forno.celo.org`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_call",
              params: [
                {
                  to: CONTRACT_ADDRESS,
                  data: `0x${getCanClaimRewardCalldata(address, dayToCheck)}`,
                },
                "latest",
              ],
              id: 1,
            }),
          });

          const data = await result.json();

          if (data.result && data.result !== "0x") {
            // Parse the result (bool canClaim, uint256 reward, uint8 rank)
            const resultData = data.result.slice(2);
            const canClaim = parseInt(resultData.slice(0, 64), 16) === 1;
            const reward = BigInt("0x" + resultData.slice(64, 128));
            const rank = parseInt(resultData.slice(128, 192), 16);

            if (canClaim && reward > 0n) {
              rewards.push({
                day: dayToCheck,
                reward,
                rank,
                rewardFormatted: parseFloat(formatEther(reward)).toFixed(2),
              });
            }
          }
        } catch (error) {
          console.error(`Error checking day ${dayToCheck}:`, error);
        }
      }

      setClaimableDays(rewards);
      setIsChecking(false);
    };

    checkClaimableDays();
  }, [isConnected, address, currentDay]);

  // Reset claiming state when transaction completes
  useEffect(() => {
    if (isClaimSuccess) {
      setIsClaiming(false);
      // Clear all claimable days after successful batch claim
      setClaimableDays([]);
    }
  }, [isClaimSuccess]);

  const claimAllDays = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (claimableDays.length === 0) {
      alert("No rewards to claim!");
      return;
    }

    setIsClaiming(true);
    try {
      const dayIds = claimableDays.map((day) => day.day);

      claimWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "claimMultipleDays",
        args: [dayIds],
        chainId,
      });
    } catch (error) {
      console.error("Error claiming rewards:", error);
      setIsClaiming(false);
      alert("Failed to claim rewards. Please try again.");
    }
  };

  const totalRewards = claimableDays.reduce(
    (sum, day) => sum + day.reward,
    0n
  );

  return {
    claimableDays,
    isChecking,
    isClaiming,
    isClaimLoading,
    isClaimSuccess,
    claimAllDays,
    hasClaimableDays: claimableDays.length > 0,
    totalRewards,
    totalRewardsFormatted: parseFloat(formatEther(totalRewards)).toFixed(2),
  };
}

// Helper function to encode the canClaimReward function call
function getCanClaimRewardCalldata(address: string, day: bigint): string {
  // Function selector for canClaimReward(address,uint256)
  const selector = "8c0b5e22";

  // Encode address (remove 0x and pad to 64 chars)
  const addressParam = address.slice(2).padStart(64, "0");

  // Encode day (convert to hex and pad to 64 chars)
  const dayParam = day.toString(16).padStart(64, "0");

  return selector + addressParam + dayParam;
}
