"use client";

import { useState } from "react";
import { useCanClaimReward } from "@/hooks/useContractLeaderboard";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract.config";

interface ClaimScreenProps {
  address: string | undefined;
  currentDay: bigint | undefined;
  onGoToWelcome: () => void;
}

export function ClaimScreen({
  address,
  currentDay,
  onGoToWelcome,
}: ClaimScreenProps) {
  const [claimingDay, setClaimingDay] = useState<bigint | null>(null);

  // Calculate last two days
  const yesterday = currentDay && currentDay > 0n ? currentDay - 1n : undefined;
  const dayBeforeYesterday =
    currentDay && currentDay > 1n ? currentDay - 2n : undefined;

  // Check claimability for both days
  const { data: yesterdayClaim, refetch: refetchYesterday } = useCanClaimReward(
    address,
    yesterday
  );
  const { data: dayBeforeClaim, refetch: refetchDayBefore } = useCanClaimReward(
    address,
    dayBeforeYesterday
  );

  // Claim contract write
  const { data: claimHash, writeContract: claimWrite } = useWriteContract();

  const { isLoading: isClaimLoading, isSuccess: isClaimSuccess } =
    useWaitForTransactionReceipt({
      hash: claimHash,
    });

  const handleClaim = async (day: bigint) => {
    if (!address) return;

    setClaimingDay(day);
    try {
      claimWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "claimDailyReward",
        args: [day],
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
      setClaimingDay(null);
    }
  };

  // Reset claiming state on success
  if (isClaimSuccess && claimingDay) {
    setClaimingDay(null);
    // Refetch claim status
    if (claimingDay === yesterday) {
      refetchYesterday();
    } else if (claimingDay === dayBeforeYesterday) {
      refetchDayBefore();
    }
  }

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏆";
    }
  };

  const getRankText = (rank: number) => {
    switch (rank) {
      case 1:
        return "1st Place";
      case 2:
        return "2nd Place";
      case 3:
        return "3rd Place";
      default:
        return `${rank}th Place`;
    }
  };

  const claimableRewards = [
    yesterdayClaim?.canClaim ? yesterdayClaim : null,
    dayBeforeClaim?.canClaim ? dayBeforeClaim : null,
  ].filter(Boolean);

  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-gray-50">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#FFDA57] to-[#FFE57F] opacity-20 blur-3xl animate-float" />
        <div className="absolute top-20 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-[#00B17A] to-[#009962] opacity-20 blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-36 h-36 rounded-full bg-gradient-to-br from-[#F47575] to-[#FF6B6B] opacity-20 blur-3xl animate-float" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-black bg-clip-text bg-gradient-multi mb-4 sm:mb-6 text-center">
            💰 Claim Rewards
          </h2>

          {/* Claim Rules */}
          <div className="glass border border-white/30 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3 text-center">
              📋 Claim Rules
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#00B17A] font-bold">✓</span>
                <span>You can claim rewards for the last 2 days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00B17A] font-bold">✓</span>
                <span>Rewards are only available after the day is finalized</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00B17A] font-bold">✓</span>
                <span>Top 3 players each day win rewards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFDA57] font-bold">⚠</span>
                <span className="font-semibold">Claim before they expire!</span>
              </li>
            </ul>
          </div>

          {/* Claimable Rewards */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3 text-center">
              Available Rewards
            </h3>

            {!address ? (
              <p className="text-gray-700 text-center py-8 text-sm">
                Connect your wallet to check for rewards
              </p>
            ) : claimableRewards.length === 0 ? (
              <div className="glass border border-white/30 rounded-xl p-6 text-center">
                <p className="text-gray-700 text-sm mb-2">
                  No claimable rewards available
                </p>
                <p className="text-xs text-gray-600">
                  Win a top 3 spot to earn rewards!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {claimableRewards.map((claim) => {
                  if (!claim) return null;
                  const isClaiming = claimingDay === claim.day;

                  return (
                    <div
                      key={claim.day.toString()}
                      className="bg-gradient-to-r from-[#FFDA57] to-[#FFE57F] rounded-xl p-4 shadow-lg border-2 border-[#FFDA57]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{getRankEmoji(claim.rank)}</span>
                          <div>
                            <p className="font-bold text-[#100F06]">
                              {getRankText(claim.rank)}
                            </p>
                            <p className="text-xs text-[#100F06]/70">
                              Day {claim.day.toString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#00B17A]">
                            {claim.rewardFormatted}
                          </p>
                          <p className="text-xs text-[#100F06]/70">cUSD</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClaim(claim.day)}
                        disabled={isClaiming || isClaimLoading}
                        className="w-full bg-gradient-to-r from-[#00B17A] to-[#009962] text-white px-4 py-3 rounded-lg font-bold text-base hover:from-[#009962] hover:to-[#00B17A] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        {isClaiming || isClaimLoading
                          ? "Claiming..."
                          : "💰 Claim Now"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Claims History */}
          <div className="glass border border-white/30 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3 text-center">
              Recent Days Status
            </h3>
            <div className="space-y-2">
              {yesterday !== undefined && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 font-medium">
                    Day {yesterday.toString()} (Yesterday)
                  </span>
                  <span
                    className={`font-bold ${
                      yesterdayClaim?.canClaim
                        ? "text-[#00B17A]"
                        : "text-gray-500"
                    }`}
                  >
                    {yesterdayClaim?.canClaim ? "✓ Claimable" : "No reward"}
                  </span>
                </div>
              )}
              {dayBeforeYesterday !== undefined && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 font-medium">
                    Day {dayBeforeYesterday.toString()} (2 days ago)
                  </span>
                  <span
                    className={`font-bold ${
                      dayBeforeClaim?.canClaim
                        ? "text-[#00B17A]"
                        : "text-gray-500"
                    }`}
                  >
                    {dayBeforeClaim?.canClaim ? "✓ Claimable" : "No reward"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToWelcome}
            className="w-full bg-gradient-to-r from-[#7DCAF6] to-[#5AB5E8] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:from-[#5AB5E8] hover:to-[#7DCAF6] transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg border-2 border-white/30"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
