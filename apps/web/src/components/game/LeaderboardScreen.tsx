import type { LeaderboardEntry } from "@/types/game.types";

interface LeaderboardScreenProps {
  leaderboard: LeaderboardEntry[];
  address: string | undefined;
  onGoToWelcome: () => void;
}

export function LeaderboardScreen({
  leaderboard,
  address,
  onGoToWelcome,
}: LeaderboardScreenProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-gray-50">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#F47575] to-[#FF6B6B] opacity-20 blur-3xl animate-float" />
        <div className="absolute top-20 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-[#00B17A] to-[#009962] opacity-20 blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-36 h-36 rounded-full bg-gradient-to-br from-[#7DCAF6] to-[#5AB5E8] opacity-20 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-[#FFDA57] to-[#FFE57F] opacity-20 blur-3xl animate-float-delayed" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-black bg-clip-text bg-gradient-multi mb-4 sm:mb-6 text-center">
            🏆 Leaderboard
          </h2>

          <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 max-h-80 overflow-y-auto">
            {leaderboard.length === 0 ? (
              <p className="text-gray-700 text-center py-8 font-medium">
                No scores yet! Be the first to play!
              </p>
            ) : (
              leaderboard.map((entry, index) => {
                const isUser =
                  address && entry.player.toLowerCase() === address.toLowerCase();

                return (
                  <div
                    key={index}
                    className={`rounded-xl p-3 sm:p-4 flex justify-between items-center shadow-sm transition-all ${
                      isUser
                        ? "bg-gradient-to-r from-[#FFDA57] to-[#FFE57F] ring-2 ring-[#FFDA57] shadow-lg border-0"
                        : "glass border border-white/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl flex-shrink-0">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `${index + 1}.`}
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-mono ${
                            isUser
                              ? "text-[#100F06] font-extrabold"
                              : "text-gray-800 font-bold"
                          }`}
                        >
                          {entry.player.slice(0, 5)}...{entry.player.slice(-3)}
                          {isUser && (
                            <span className="ml-1.5 text-[#100F06]">(You)</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-base sm:text-lg ${
                          isUser ? "text-[#100F06]" : "text-[#00B17A]"
                        }`}
                      >
                        {entry.score}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={onGoToWelcome}
            className="w-full bg-gradient-to-r from-[#7DCAF6] to-[#5AB5E8] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:from-[#5AB5E8] hover:to-[#7DCAF6] transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg border-2 border-white/30"
          >
           Back to Game
          </button>
        </div>
      </div>
    </div>
  );
}
