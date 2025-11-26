import { ENTRY_FEE } from "@/config/contract.config";
import type { PlayerStats } from "@/types/game.types";

interface WelcomeScreenProps {
  isConnected: boolean;
  address: string | undefined;
  playerStats: readonly [bigint, bigint, bigint, bigint] | undefined;
  isStartingGame: boolean;
  isStartGameLoading: boolean;
  onStartGame: () => void;
  onShowLeaderboard: () => void;
}

export function WelcomeScreen({
  isConnected,
  address,
  playerStats,
  isStartingGame,
  isStartGameLoading,
  onStartGame,
  onShowLeaderboard,
}: WelcomeScreenProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-gray-50">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#F47575] to-[#FF6B6B] opacity-40 blur-sm animate-float" />
        <div className="absolute top-20 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-[#00B17A] to-[#009962] opacity-60 blur-sm animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-36 h-36 rounded-full bg-gradient-to-br from-[#FFDA57] to-[#FFE57F] opacity-40 blur-sm animate-float" />
        <div className="absolute bottom-10 right-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-[#7DCAF6] to-[#5AB5E8] opacity-60 blur-sm animate-float-delayed" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-multi mb-4 sm:mb-6">
            🎯 Color Match
          </h1>
          <p className="text-gray-800 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed font-medium">
            Match falling colored circles by tapping the correct zones!
          </p>

          {/* {isConnected ? (
            <div className="mb-4 sm:mb-6">
              <p className="text-xs font-mono glass p-2 rounded-xl text-gray-800 border border-white/30">
                Connected: {address ? `${address.slice(0, 5)}...${address.slice(-3)}` : ""}
              </p>
              {playerStats && (
                <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-700 font-semibold">
                  <p>Games Played: {playerStats[0]?.toString()}</p>
                  <p>High Score: {playerStats[2]?.toString()}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#FF6B6B] mb-4 sm:mb-6 text-sm sm:text-base font-semibold">
              Please connect your wallet to play
            </p>
          )} */}

          <div className="mb-4 glass border border-white/30 rounded-xl p-3 sm:p-4">
            <p className="text-[#CC9A00] text-xs sm:text-sm font-bold">
              Game Cost: 0.1 cUSD
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={onStartGame}
              disabled={!isConnected || isStartingGame || isStartGameLoading}
              className="w-full bg-gradient-to-r from-[#00B17A] to-[#009962] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:from-[#009962] hover:to-[#00B17A] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-2 border-white/30"
            >
              {isStartingGame || isStartGameLoading ? "Starting..." : "🚀 Start Game"}
            </button>

            <button
              onClick={onShowLeaderboard}
              className="w-full bg-gradient-to-r from-[#7DCAF6] to-[#5AB5E8] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:from-[#5AB5E8] hover:to-[#7DCAF6] transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg border-2 border-white/30"
            >
              🏆 Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
