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
import { useDivviReferral } from "@/hooks/useDivviReferral";

interface ClaimableReward {
  day: bigint;
  canClaim: boolean;
  reward: bigint;
  rank: number;
  rewardFormatted: string;
}

export function useClaimRewards() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { enabled: divviEnabled, addReferralToTxData, submitReferral } = useDivviReferral();
  const [claimableRewards, setClaimableRewards] = useState<ClaimableReward[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);

  // Get current day from contract
  const { data: currentDay } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "currentDay",
    chainId,
  });

  // Write contract for claiming
  const { data: claimHash, writeContract: claimWrite } = useWriteContract();

  const {
    isLoading: isClaimLoading,
    isSuccess: isClaimSuccess,
  } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // Check for claimable rewards when user connects or currentDay changes
  useEffect(() => {
    const checkClaimableRewards = async () => {
      if (!isConnected || !address || !currentDay) return;

      const rewards: ClaimableReward[] = [];

      // Check the last 7 days for claimable rewards
      const daysToCheck = 7;
      const currentDayNum = Number(currentDay);

      for (let i = 1; i <= daysToCheck; i++) {
        const dayToCheck = BigInt(currentDayNum - i);

        if (dayToCheck < 0) break;

        try {
          // This will be handled by wagmi's multicall under the hood
          const result = await fetch(`https://forno.celo.org`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_call',
              params: [
                {
                  to: CONTRACT_ADDRESS,
                  data: `0x8c0b5e22${address.slice(2).padStart(64, '0')}${dayToCheck.toString(16).padStart(64, '0')}`,
                },
                'latest',
              ],
              id: 1,
            }),
          });

          const data = await result.json();

          if (data.result && data.result !== '0x') {
            // Parse the result (bool canClaim, uint256 reward, uint8 rank)
            const resultData = data.result.slice(2);
            const canClaim = parseInt(resultData.slice(0, 64), 16) === 1;
            const reward = BigInt('0x' + resultData.slice(64, 128));
            const rank = parseInt(resultData.slice(128, 192), 16);

            if (canClaim && reward > 0n) {
              rewards.push({
                day: dayToCheck,
                canClaim,
                reward,
                rank,
                rewardFormatted: formatEther(reward),
              });
            }
          }
        } catch (error) {
          console.error(`Error checking day ${dayToCheck}:`, error);
        }
      }

      setClaimableRewards(rewards);
    };

    checkClaimableRewards();
  }, [isConnected, address, currentDay]);

  // Reset claiming state when transaction completes
  useEffect(() => {
    if (isClaimSuccess) {
      // Submit Divvi referral for claim transaction
      if (divviEnabled && claimHash) {
        submitReferral(claimHash);
      }

      setIsClaiming(false);
      // Refresh claimable rewards after successful claim
      setClaimableRewards((prev) =>
        prev.filter((reward) => reward.day !== claimableRewards[0]?.day)
      );
    }
  }, [isClaimSuccess, divviEnabled, claimHash, submitReferral, claimableRewards]);

  const claimReward = async (day: bigint) => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsClaiming(true);
    try {
      // Get referral tag for Divvi
      const referralTag = divviEnabled ? addReferralToTxData(undefined) : '0x';

      claimWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "claimDailyReward",
        args: [day],
        chainId,
        dataSuffix: referralTag,
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
      setIsClaiming(false);
      alert("Failed to claim reward. Please try again.");
    }
  };

  return {
    claimableRewards,
    isClaiming,
    isClaimLoading,
    isClaimSuccess,
    claimReward,
    hasClaimableRewards: claimableRewards.length > 0,
  };
}
