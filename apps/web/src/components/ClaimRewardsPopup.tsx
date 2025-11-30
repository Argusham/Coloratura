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
      <div className="card-brutal bg-brutal-yellow p-5 sm:p-6 animate-wiggle">
        <div className="text-center mb-5">
          <h2 className="text-2xl sm:text-3xl font-black text-brutal-black mb-2 flex items-center justify-center gap-2 uppercase tracking-tight">
            🎉 You Won! 🎉
          </h2>
          <p className="text-brutal-black font-bold text-sm uppercase">
            Claim your reward{claimableRewards.length > 1 ? "s" : ""} now!
          </p>
        </div>

        <div className="space-y-3">
          {claimableRewards.map((reward) => (
            <div
              key={reward.day.toString()}
              className="border-4 border-brutal-black bg-brutal-white p-4 shadow-brutal-sm transform -rotate-1"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{getRankEmoji(reward.rank)}</span>
                  <div>
                    <p className="font-black text-brutal-black uppercase text-sm">
                      {getRankText(reward.rank)}
                    </p>
                    <p className="text-xs text-brutal-black font-bold">
                      Day {reward.day.toString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-brutal-black">
                    {reward.rewardFormatted}
                  </p>
                  <p className="text-xs text-brutal-black font-bold uppercase">cUSD</p>
                </div>
              </div>

              <button
                onClick={() => claimReward(reward.day)}
                disabled={isClaiming || isClaimLoading}
                type="button"
                className="w-full px-4 py-3 text-base btn-brutal-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              >
                {isClaiming || isClaimLoading ? "Claiming..." : "Claim Now"}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-brutal-black font-black text-xs mt-4 uppercase">
          ⚡ Claim before they expire!
        </p>
      </div>
    </div>
  );
}
