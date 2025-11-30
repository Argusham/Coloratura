import { useState } from "react";
import type { DailyTop3Entry, ScoreEntry } from "@/hooks/useContractLeaderboard";

interface LeaderboardScreenProps {
  previousDayTop3: DailyTop3Entry[];
  todayScores: ScoreEntry[];
  address: string | undefined;
  onGoToWelcome: () => void;
  isLoading?: boolean;
  claimableDays: bigint[];
}

export function LeaderboardScreen({
  previousDayTop3,
  todayScores,
  address,
  onGoToWelcome,
  isLoading = false,
  claimableDays,
}: LeaderboardScreenProps) {
  const [activeTab, setActiveTab] = useState<"yesterday" | "today">("yesterday");

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

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("yesterday")}
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-all ${
                activeTab === "yesterday"
                  ? "bg-gradient-to-r from-[#FFDA57] to-[#FFE57F] text-[#100F06] shadow-lg"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              Yesterday's Winners
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-all ${
                activeTab === "today"
                  ? "bg-gradient-to-r from-[#00B17A] to-[#009962] text-white shadow-lg"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              Today's Scores
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-700 font-medium">Loading...</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 max-h-80 overflow-y-auto">
              {activeTab === "yesterday" && previousDayTop3.length === 0 && (
                <p className="text-gray-700 text-center py-8 font-medium">
                  No winners yesterday! Be the first to win today!
                </p>
              )}
              {activeTab === "today" && todayScores.length === 0 && (
                <p className="text-gray-700 text-center py-8 font-medium">
                  No scores yet today! Be the first to play!
                </p>
              )}
              {activeTab === "yesterday" && previousDayTop3.map((entry) => {
                const isUser =
                  address && entry.player.toLowerCase() === address.toLowerCase();
                const needsToClaim = isUser && claimableDays.some(day => day === entry.day);

                return (
                  <div
                    key={entry.player + entry.rank}
                    className={`rounded-xl p-3 sm:p-4 flex justify-between items-center shadow-sm transition-all ${
                      needsToClaim
                        ? "bg-gradient-to-r from-[#FFDA57] to-[#FFE57F] ring-2 ring-[#FFDA57] shadow-lg border-0 animate-pulse-slow"
                        : isUser
                        ? "bg-gradient-to-r from-[#FFDA57]/50 to-[#FFE57F]/50 ring-2 ring-[#FFDA57]/50 shadow-lg border-0"
                        : "glass border border-white/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl flex-shrink-0">
                          {entry.rank === 1
                            ? "🥇"
                            : entry.rank === 2
                            ? "🥈"
                            : entry.rank === 3
                            ? "🥉"
                            : `${entry.rank}.`}
                        </span>
                        <div>
                          <span
                            className={`text-xs sm:text-sm font-mono block ${
                              needsToClaim
                                ? "text-[#100F06] font-extrabold"
                                : isUser
                                ? "text-[#100F06] font-bold"
                                : "text-gray-800 font-bold"
                            }`}
                          >
                            {entry.player.slice(0, 5)}...{entry.player.slice(-3)}
                            {isUser && (
                              <span className="ml-1.5 text-[#100F06]">(You)</span>
                            )}
                          </span>
                          {needsToClaim && (
                            <span className="text-[10px] sm:text-xs text-[#100F06] font-bold">
                              💰 Claim your reward!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-base sm:text-lg ${
                          needsToClaim || isUser ? "text-[#100F06]" : "text-[#00B17A]"
                        }`}
                      >
                        {entry.rewardFormatted} cUSD
                      </p>
                      <p className="text-xs text-gray-600">
                        Score: {entry.score}
                      </p>
                    </div>
                  </div>
                );
              })}
              {activeTab === "today" && todayScores.map((entry) => {
                const isUser =
                  address && entry.player.toLowerCase() === address.toLowerCase();

                return (
                  <div
                    key={entry.player + entry.rank}
                    className={`rounded-xl p-3 sm:p-4 flex justify-between items-center shadow-sm transition-all ${
                      isUser
                        ? "bg-gradient-to-r from-[#00B17A]/30 to-[#009962]/30 ring-2 ring-[#00B17A] shadow-lg border-0"
                        : "glass border border-white/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl flex-shrink-0">
                          {entry.rank === 1
                            ? "🥇"
                            : entry.rank === 2
                            ? "🥈"
                            : entry.rank === 3
                            ? "🥉"
                            : `${entry.rank}.`}
                        </span>
                        <div>
                          <span
                            className={`text-xs sm:text-sm font-mono block ${
                              isUser
                                ? "text-[#00B17A] font-extrabold"
                                : "text-gray-800 font-bold"
                            }`}
                          >
                            {entry.player.slice(0, 5)}...{entry.player.slice(-3)}
                            {isUser && (
                              <span className="ml-1.5 text-[#00B17A]">(You)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-base sm:text-lg ${
                          isUser ? "text-[#00B17A]" : "text-gray-800"
                        }`}
                      >
                        {entry.score}
                      </p>
                      <p className="text-xs text-gray-600">
                        Level {entry.level}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
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
