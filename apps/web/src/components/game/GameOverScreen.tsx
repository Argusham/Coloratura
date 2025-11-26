interface GameOverScreenProps {
  score: number;
  level: number;
  isSubmittingScore: boolean;
  isSubmitScoreLoading: boolean;
  isSubmitScoreSuccess: boolean;
  isStartingGame: boolean;
  isStartGameLoading: boolean;
  onStartGame: () => void;
  onShowLeaderboard: () => void;
  onGoToWelcome: () => void;
}

export function GameOverScreen({
  score,
  level,
  isSubmittingScore,
  isSubmitScoreLoading,
  isSubmitScoreSuccess,
  isStartingGame,
  isStartGameLoading,
  onStartGame,
  onShowLeaderboard,
  onGoToWelcome,
}: GameOverScreenProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-gray-50">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-gradient-to-br from-[#FFB8F4] to-[#F47575] opacity-20 blur-3xl animate-float" />
        <div className="absolute top-40 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#7DCAF6] to-[#A5B3FF] opacity-20 blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-36 h-36 rounded-full bg-gradient-to-br from-[#FFDA57] to-[#00B17A] opacity-20 blur-3xl animate-float" />
      </div>

      <div className="w-full max-w-md relative z-10 my-auto">
        {/* Main glass card */}
        <div className="glass-card rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="text-7xl sm:text-8xl mb-4 animate-bounce-slow">
              {score > 1000 ? "🎉" : score > 500 ? "✨" : "🎮"}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black bg-clip-text bg-gradient-to-r from-[#F47575] via-[#FFB8F4] to-[#A5B3FF] mb-3 animate-gradient">
              Game Over!
            </h2>
            <p className="text-gray-900 text-sm sm:text-base font-semibold opacity-70">
              {score > 1000 ? "Incredible performance!" : score > 500 ? "Great job!" : "Nice try!"}
            </p>
          </div>

          {/* Score Display */}
          <div className="glass rounded-3xl p-6 sm:p-8 mb-6 border-2 border-white/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7DCAF6] to-transparent rounded-full opacity-30 blur-2xl" />
            <div className="relative">
              <p className="text-gray-900 text-sm sm:text-base font-semibold opacity-70 mb-2 text-center">
                Final Score
              </p>
              <p className="text-5xl sm:text-6xl font-black bg-clip-text bg-gradient-to-r from-[#00B17A] to-[#7DCAF6] mb-4 text-center animate-pulse-glow">
                {score}
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="glass rounded-xl px-4 py-2 border border-white/30">
                  <p className="text-xs text-gray-900 opacity-50 font-semibold">Level</p>
                  <p className="text-xl font-black text-[#A5B3FF]">{level}</p>
                </div>
              </div>

              {/* Status Messages */}
              {isSubmittingScore || isSubmitScoreLoading ? (
                <div className="mt-4 glass rounded-xl p-3 border border-white/30 text-center">
                  <p className="text-sm text-[#7DCAF6] font-semibold flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    <span>Submitting score...</span>
                  </p>
                </div>
              ) : isSubmitScoreSuccess ? (
                <div className="mt-4 glass rounded-xl p-3 border border-white/30 text-center">
                  <p className="text-sm text-[#00B17A] font-semibold flex items-center justify-center gap-2">
                    <span>✓</span>
                    <span>Score submitted!</span>
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onStartGame}
              disabled={isStartingGame || isStartGameLoading}
              className="w-full relative overflow-hidden rounded-2xl font-black text-lg sm:text-xl py-4 sm:py-5 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: "linear-gradient(135deg, #00B17A 0%, #7DCAF6 100%)",
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isStartingGame || isStartGameLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Play Again</span>
                  </>
                )}
              </span>
              {!isStartingGame && !isStartGameLoading && (
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              )}
            </button>

            <button
              onClick={onShowLeaderboard}
              className="w-full relative overflow-hidden rounded-2xl font-black text-lg sm:text-xl py-4 sm:py-5 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #FFDA57 0%, #F47575 100%)",
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>🏆</span>
                <span>View Leaderboard</span>
              </span>
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </button>

            <button
              onClick={onGoToWelcome}
              className="w-full relative overflow-hidden rounded-2xl font-black text-lg sm:text-xl py-4 text-gray-900 shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95 glass border-2 border-white/40"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>←</span>
                <span>Main Menu</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
