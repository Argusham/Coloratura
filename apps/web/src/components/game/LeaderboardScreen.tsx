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
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-brutal-cream pattern-dots">
      {/* Neo-brutalist decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 w-28 h-28 bg-brutal-pink border-4 border-brutal-black rotate-12" />
        <div className="absolute top-32 right-8 w-36 h-36 bg-brutal-blue border-4 border-brutal-black -rotate-6" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-brutal-yellow border-4 border-brutal-black rotate-45" />
        <div className="absolute bottom-32 right-1/3 w-32 h-32 bg-brutal-green border-4 border-brutal-black -rotate-12" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="card-brutal bg-brutal-white p-5 sm:p-7">
          <h2 className="text-3xl sm:text-4xl font-black text-brutal-black mb-5 sm:mb-6 text-center uppercase tracking-tight transform -rotate-1 inline-block w-full">
            🏆 Leaderboard
          </h2>

          {/* Tab Switcher */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("yesterday")}
              className={`flex-1 py-3 px-4 font-black text-xs sm:text-sm transition-all uppercase tracking-tight border-4 border-brutal-black ${
                activeTab === "yesterday"
                  ? "bg-brutal-yellow text-brutal-black shadow-brutal-sm translate-x-0 translate-y-0"
                  : "bg-brutal-cream text-brutal-black hover:translate-x-[2px] hover:translate-y-[2px] shadow-brutal-sm"
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`flex-1 py-3 px-4 font-black text-xs sm:text-sm transition-all uppercase tracking-tight border-4 border-brutal-black ${
                activeTab === "today"
                  ? "bg-brutal-green text-brutal-black shadow-brutal-sm translate-x-0 translate-y-0"
                  : "bg-brutal-cream text-brutal-black hover:translate-x-[2px] hover:translate-y-[2px] shadow-brutal-sm"
              }`}
            >
              Today
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-brutal-black font-black uppercase">Loading...</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 max-h-80 overflow-y-auto">
              {activeTab === "yesterday" && previousDayTop3.length === 0 && (
                <div className="border-4 border-brutal-black bg-brutal-cream p-6 text-center">
                  <p className="text-brutal-black font-black uppercase text-sm">
                    No winners yesterday! Be the first to win today!
                  </p>
                </div>
              )}
              {activeTab === "today" && todayScores.length === 0 && (
                <div className="border-4 border-brutal-black bg-brutal-cream p-6 text-center">
                  <p className="text-brutal-black font-black uppercase text-sm">
                    No scores yet today! Be the first to play!
                  </p>
                </div>
              )}
              {activeTab === "yesterday" && previousDayTop3.map((entry) => {
                const isUser =
                  address && entry.player.toLowerCase() === address.toLowerCase();
                const needsToClaim = isUser && claimableDays.some(day => day === entry.day);

                return (
                  <div
                    key={entry.player + entry.rank}
                    className={`border-4 border-brutal-black p-3 sm:p-4 flex justify-between items-center transition-all ${
                      needsToClaim
                        ? "bg-brutal-yellow shadow-brutal-sm animate-wiggle"
                        : isUser
                        ? "bg-brutal-yellow shadow-brutal-sm"
                        : "bg-brutal-white shadow-brutal-sm"
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
                          <span className="text-xs sm:text-sm font-mono font-black block text-brutal-black uppercase">
                            {entry.player.slice(0, 5)}...{entry.player.slice(-3)}
                            {isUser && (
                              <span className="ml-1.5">(You)</span>
                            )}
                          </span>
                          {needsToClaim && (
                            <span className="text-[10px] sm:text-xs text-brutal-black font-black uppercase">
                              Claim reward!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-base sm:text-lg text-brutal-black">
                        {entry.rewardFormatted} cUSD
                      </p>
                      <p className="text-xs text-brutal-black font-bold uppercase">
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
                    className={`border-4 border-brutal-black p-3 sm:p-4 flex justify-between items-center transition-all ${
                      isUser
                        ? "bg-brutal-green shadow-brutal-sm"
                        : "bg-brutal-white shadow-brutal-sm"
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
                          <span className="text-xs sm:text-sm font-mono font-black block text-brutal-black uppercase">
                            {entry.player.slice(0, 5)}...{entry.player.slice(-3)}
                            {isUser && (
                              <span className="ml-1.5">(You)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-base sm:text-lg text-brutal-black">
                        {entry.score}
                      </p>
                      <p className="text-xs text-brutal-black font-bold uppercase">
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
            className="w-full px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg btn-brutal-info"
          >
            Back to Game
          </button>
        </div>
      </div>
    </div>
  );
}
