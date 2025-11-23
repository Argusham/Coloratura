"use client";

import { useClaimRewards } from "@/hooks/useClaimRewards";

export function ClaimRewardsPopup() {
  const {
    claimableRewards,
    isClaiming,
    isClaimLoading,
    claimReward,
    hasClaimableRewards,
  } = useClaimRewards();

  if (!hasClaimableRewards) return null;

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
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-2xl p-6 border-4 border-yellow-300 animate-bounce-slow">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            🎉 You Won! 🎉
          </h2>
          <p className="text-white text-sm">
            Claim your reward{claimableRewards.length > 1 ? "s" : ""} now!
          </p>
        </div>

        <div className="space-y-3">
          {claimableRewards.map((reward) => (
            <div
              key={reward.day.toString()}
              className="bg-white rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{getRankEmoji(reward.rank)}</span>
                  <div>
                    <p className="font-bold text-neutral-900">
                      {getRankText(reward.rank)}
                    </p>
                    <p className="text-xs text-neutral-600">
                      Day {reward.day.toString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {reward.rewardFormatted}
                  </p>
                  <p className="text-xs text-neutral-600">cUSD</p>
                </div>
              </div>

              <button
                onClick={() => claimReward(reward.day)}
                disabled={isClaiming || isClaimLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg font-bold text-base hover:from-green-600 hover:to-emerald-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isClaiming || isClaimLoading ? "Claiming..." : "💰 Claim Now"}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-white text-xs mt-4 opacity-90">
          ⚡ Claim before they expire!
        </p>
      </div>
    </div>
  );
}
