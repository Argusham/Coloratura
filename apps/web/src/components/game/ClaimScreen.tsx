"use client";

import { useState } from "react";
import { useCanClaimReward } from "@/hooks/useContractLeaderboard";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract.config";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-brutal-cream pattern-dots">
      {/* Neo-brutalist decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 w-28 h-28 bg-brutal-yellow border-4 border-brutal-black rotate-12 animate-wiggle" />
        <div className="absolute top-32 right-8 w-36 h-36 bg-brutal-green border-4 border-brutal-black -rotate-6" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-brutal-pink border-4 border-brutal-black rotate-45" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="card-brutal bg-brutal-white p-5 sm:p-7">
          <h2 className="text-3xl sm:text-4xl font-black text-brutal-black mb-5 sm:mb-6 text-center uppercase tracking-tight transform -rotate-1 inline-block w-full">
            💰 Claim Rewards
          </h2>

          {/* Claim Rules */}
          <div className="border-4 border-brutal-black bg-brutal-cream p-4 mb-6 shadow-brutal-sm">
            <h3 className="text-sm font-black text-brutal-black mb-4 text-center uppercase">
              📋 Claim Rules
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-brutal-black font-bold">
              <li className="flex items-start gap-2 border-l-4 border-brutal-green pl-3 py-1">
                <span className="font-black">✓</span>
                <span>You can claim rewards for the last 2 days</span>
              </li>
              <li className="flex items-start gap-2 border-l-4 border-brutal-green pl-3 py-1">
                <span className="font-black">✓</span>
                <span>Rewards are only available after the day is finalized</span>
              </li>
              <li className="flex items-start gap-2 border-l-4 border-brutal-green pl-3 py-1">
                <span className="font-black">✓</span>
                <span>Top 3 players each day win rewards</span>
              </li>
              <li className="flex items-start gap-2 border-l-4 border-brutal-yellow pl-3 py-1">
                <span className="font-black">⚠</span>
                <span className="font-black">Claim before they expire!</span>
              </li>
            </ul>
          </div>

          {/* Claimable Rewards */}
          <div className="mb-6">
            <h3 className="text-sm font-black text-brutal-black mb-4 text-center uppercase">
              Available Rewards
            </h3>

            {!address ? (
              <div className="border-4 border-brutal-black bg-brutal-cream p-6 text-center shadow-brutal-sm">
                <p className="text-brutal-black font-black text-sm uppercase">
                  Connect your wallet to check for rewards
                </p>
              </div>
            ) : claimableRewards.length === 0 ? (
              <div className="border-4 border-brutal-black bg-brutal-cream p-6 text-center shadow-brutal-sm">
                <p className="text-brutal-black font-black text-sm mb-2 uppercase">
                  No claimable rewards available
                </p>
                <p className="text-xs text-brutal-black font-bold">
                  Win a top 3 spot to earn rewards!
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {claimableRewards.map((claim) => {
                  if (!claim) return null;
                  const isClaiming = claimingDay === claim.day;

                  return (
                    <div
                      key={claim.day.toString()}
                      className="border-4 border-brutal-black bg-brutal-yellow p-4 shadow-brutal-sm transform -rotate-1"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{getRankEmoji(claim.rank)}</span>
                          <div>
                            <p className="font-black text-brutal-black uppercase text-sm">
                              {getRankText(claim.rank)}
                            </p>
                            <p className="text-xs text-brutal-black font-bold">
                              Day {claim.day.toString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-brutal-black">
                            {claim.rewardFormatted}
                          </p>
                          <p className="text-xs text-brutal-black font-bold uppercase">cUSD</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClaim(claim.day)}
                        disabled={isClaiming || isClaimLoading}
                        className="w-full px-4 py-3 text-base btn-brutal-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                      >
                        {isClaiming || isClaimLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="border-t-brutal-white" />
                            <span>Claiming...</span>
                          </>
                        ) : (
                          "Claim Now"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Claims History */}
          <div className="border-4 border-brutal-black bg-brutal-cream p-4 mb-6 shadow-brutal-sm">
            <h3 className="text-sm font-black text-brutal-black mb-4 text-center uppercase">
              Recent Days Status
            </h3>
            <div className="space-y-3">
              {yesterday !== undefined && (
                <div className="flex items-center justify-between text-xs sm:text-sm border-l-4 border-brutal-black pl-3 py-1">
                  <span className="text-brutal-black font-bold uppercase">
                    Day {yesterday.toString()} (Yesterday)
                  </span>
                  <span
                    className={`font-black uppercase ${
                      yesterdayClaim?.canClaim
                        ? "text-brutal-green"
                        : "text-brutal-black opacity-50"
                    }`}
                  >
                    {yesterdayClaim?.canClaim ? "✓ Claimable" : "No reward"}
                  </span>
                </div>
              )}
              {dayBeforeYesterday !== undefined && (
                <div className="flex items-center justify-between text-xs sm:text-sm border-l-4 border-brutal-black pl-3 py-1">
                  <span className="text-brutal-black font-bold uppercase">
                    Day {dayBeforeYesterday.toString()} (2 days ago)
                  </span>
                  <span
                    className={`font-black uppercase ${
                      dayBeforeClaim?.canClaim
                        ? "text-brutal-green"
                        : "text-brutal-black opacity-50"
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
            className="w-full px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg btn-brutal-info"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
