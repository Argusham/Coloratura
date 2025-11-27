"use client";

import { useClaimMultipleDays } from "@/hooks/useClaimMultipleDays";

export function ClaimMultipleDays() {
  const {
    claimableDays,
    isChecking,
    isClaiming,
    isClaimLoading,
    claimAllDays,
    hasClaimableDays,
    totalRewardsFormatted,
  } = useClaimMultipleDays();

  if (isChecking) {
    return (
      <div className="w-full mt-4 p-4 glass rounded-2xl border border-white/30">
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <div className="w-4 h-4 border-2 border-[#00B17A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Checking for unclaimed rewards...</p>
        </div>
      </div>
    );
  }

  if (!hasClaimableDays) {
    return null;
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

  return (
    <div className="w-full mt-4">
      <div className="glass rounded-2xl border border-white/30 p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold bg-clip-text bg-gradient-to-r from-[#FFDA57] to-[#FF9500] text-transparent">
            💰 Unclaimed Rewards
          </h3>
          <div className="text-right">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-xl sm:text-2xl font-black text-[#00B17A]">
              {totalRewardsFormatted} cUSD
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {claimableDays.map((day) => (
            <div
              key={day.day.toString()}
              className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-white/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getRankEmoji(day.rank)}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {getRankText(day.rank)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Day {day.day.toString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-[#00B17A]">
                  {day.rewardFormatted}
                </p>
                <p className="text-xs text-gray-600">cUSD</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={claimAllDays}
          disabled={isClaiming || isClaimLoading}
          className="w-full bg-gradient-to-r from-[#FFDA57] to-[#FF9500] text-white px-6 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:from-[#FF9500] hover:to-[#FFDA57] transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg border-2 border-white/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isClaiming || isClaimLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Claiming...
            </span>
          ) : (
            `🎉 Claim All ${claimableDays.length} Reward${
              claimableDays.length > 1 ? "s" : ""
            }`
          )}
        </button>

        <p className="text-center text-gray-600 text-xs mt-3">
          ⚡ Claim within 7 days before they expire
        </p>
      </div>
    </div>
  );
}
