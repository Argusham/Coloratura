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
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-brutal-cream pattern-dots">
      {/* Neo-brutalist decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 bg-brutal-pink border-4 border-brutal-black rotate-12 animate-wiggle" />
        <div className="absolute top-40 right-10 w-32 h-32 bg-brutal-blue border-4 border-brutal-black -rotate-6" />
        <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-brutal-yellow border-4 border-brutal-black rotate-45" />
      </div>

      <div className="w-full max-w-md relative z-10 my-auto">
        {/* Main card */}
        <div className="card-brutal bg-brutal-white p-7 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="text-7xl sm:text-8xl mb-5 inline-block transform hover:rotate-12 transition-transform">
              {score > 1000 ? "🎉" : score > 500 ? "✨" : "🎮"}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-brutal-black mb-4 uppercase tracking-tight transform -rotate-1 inline-block">
              Game Over!
            </h2>
            <p className="text-brutal-black text-sm sm:text-base font-black uppercase">
              {score > 1000 ? "Incredible performance!" : score > 500 ? "Great job!" : "Nice try!"}
            </p>
          </div>

          {/* Score Display */}
          <div className="border-4 border-brutal-black bg-brutal-yellow p-6 sm:p-8 mb-6 shadow-brutal-sm transform -rotate-1">
            <div className="relative">
              <p className="text-brutal-black text-sm sm:text-base font-black mb-2 text-center uppercase">
                Final Score
              </p>
              <p className="text-6xl sm:text-7xl font-black text-brutal-black mb-4 text-center">
                {score}
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="border-4 border-brutal-black bg-brutal-white px-5 py-3 shadow-brutal-sm">
                  <p className="text-xs text-brutal-black font-black uppercase">Level</p>
                  <p className="text-2xl font-black text-brutal-blue">{level}</p>
                </div>
              </div>

              {/* Status Messages */}
              {isSubmittingScore || isSubmitScoreLoading ? (
                <div className="mt-4 border-4 border-brutal-black bg-brutal-blue p-3 text-center shadow-brutal-sm">
                  <p className="text-sm text-brutal-black font-black flex items-center justify-center gap-2 uppercase">
                    <span className="animate-spin">⏳</span>
                    <span>Submitting score...</span>
                  </p>
                </div>
              ) : isSubmitScoreSuccess ? (
                <div className="mt-4 border-4 border-brutal-black bg-brutal-green p-3 text-center shadow-brutal-sm">
                  <p className="text-sm text-brutal-black font-black flex items-center justify-center gap-2 uppercase">
                    <span>✓</span>
                    <span>Score submitted!</span>
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={onStartGame}
              disabled={isStartingGame || isStartGameLoading}
              className="w-full px-6 py-4 sm:py-5 text-base sm:text-lg btn-brutal-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
            >
              {isStartingGame || isStartGameLoading ? "Starting..." : "Play Again"}
            </button>

            <button
              type="button"
              onClick={onShowLeaderboard}
              className="w-full px-6 py-4 sm:py-5 text-base sm:text-lg btn-brutal-secondary"
            >
              View Leaderboard
            </button>

            <button
              type="button"
              onClick={onGoToWelcome}
              className="w-full px-6 py-4 text-base sm:text-lg btn-brutal-info"
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
