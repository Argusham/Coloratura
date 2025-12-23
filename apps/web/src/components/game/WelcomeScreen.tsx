import { ENTRY_FEE } from "@/config/contract.config";
import type { PlayerStats as PlayerStatsData } from "@/hooks/useContractLeaderboard";
import { PlayerStatsSkeleton } from "@/components/ui/SkeletonLoader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface WelcomeScreenProps {
  isConnected: boolean;
  address: string | undefined;
  playerStats: readonly [bigint, bigint, bigint, bigint] | undefined;
  playerStatsData: PlayerStatsData | undefined;
  isStartingGame: boolean;
  isStartGameLoading: boolean;
  onStartGame: () => void;
  onShowLeaderboard: () => void;
  onShowClaimPage: () => void;
}

export function WelcomeScreen({
  isConnected,
  address,
  playerStats,
  playerStatsData,
  isStartingGame,
  isStartGameLoading,
  onStartGame,
  onShowLeaderboard,
  onShowClaimPage,
}: WelcomeScreenProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-brutal-cream pattern-dots">
      {/* Neo-brutalist decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 w-28 h-28 bg-brutal-pink border-4 border-brutal-black rotate-12 animate-wiggle" />
        <div className="absolute top-32 right-8 w-36 h-36 bg-brutal-blue border-4 border-brutal-black -rotate-6" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-brutal-yellow border-4 border-brutal-black rotate-45" />
        <div className="absolute bottom-32 right-1/3 w-32 h-32 bg-brutal-green border-4 border-brutal-black -rotate-12 animate-bounce-slow" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="card-brutal bg-brutal-white p-5 sm:p-7 text-center mb-4">
          <h1 className="text-4xl sm:text-5xl font-black text-brutal-black mb-5 sm:mb-6 uppercase tracking-tight transform -rotate-1 inline-block">
            🎯 Color Match
          </h1>
          <p className="text-brutal-black mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed font-bold">
            Match falling colored circles by tapping the correct zones!
          </p>

          <div className="mb-5 space-y-3">
            <div className="border-4 border-brutal-black bg-brutal-yellow p-3 sm:p-4 transform -rotate-1 shadow-brutal-sm">
              <p className="text-brutal-black text-xs sm:text-sm font-black uppercase">
                Game Cost: 0.1 cUSD
              </p>
            </div>
            <div className="border-4 border-brutal-black bg-brutal-green p-3 sm:p-4 transform rotate-1 shadow-brutal-sm">
              <p className="text-brutal-black text-xs sm:text-sm font-black text-center uppercase tracking-tight">
                Need 3+ players daily to earn rewards. Invite friends!
              </p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <button
              type="button"
              onClick={onStartGame}
              disabled={!isConnected || isStartingGame || isStartGameLoading}
              className="w-full px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg btn-brutal-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
            >
              {isStartingGame || isStartGameLoading ? (
                <>
                  <LoadingSpinner size="sm" className="border-t-brutal-white" />
                  <span>Starting Game...</span>
                </>
              ) : (
                "Start Game"
              )}
            </button>

            {/* Player Stats Display */}
            {isConnected && (
              playerStatsData ? (
                <div className="card-brutal bg-brutal-cream p-4 space-y-2">
                  <h3 className="text-sm font-black text-brutal-black text-center mb-3 uppercase">
                    Your Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center border-4 border-brutal-black bg-brutal-white p-3">
                      <p className="text-xs text-brutal-black font-black uppercase">Games</p>
                      <p className="text-2xl font-black text-brutal-black">
                        {playerStatsData.gamesPlayed.toString()}
                      </p>
                    </div>
                    <div className="text-center border-4 border-brutal-black bg-brutal-white p-3">
                      <p className="text-xs text-brutal-black font-black uppercase">High Score</p>
                      <p className="text-2xl font-black text-brutal-blue">
                        {playerStatsData.highScore.toString()}
                      </p>
                    </div>
                    <div className="text-center col-span-2 border-4 border-brutal-black bg-brutal-yellow p-3">
                      <p className="text-xs text-brutal-black font-black uppercase">Total Earnings</p>
                      <p className="text-2xl font-black text-brutal-black">
                        {playerStatsData.totalEarningsFormatted} cUSD
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <PlayerStatsSkeleton />
              )
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onShowClaimPage}
                className="px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base btn-brutal-secondary"
              >
                Claim
              </button>
              <button
                type="button"
                onClick={onShowLeaderboard}
                className="px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base btn-brutal-info"
              >
                Board
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
