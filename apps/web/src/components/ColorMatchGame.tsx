"use client";

import { useRef, useEffect } from "react";
import { useGameContract } from "@/hooks/useGameContract";
import { useGameLogic } from "@/hooks/useGameLogic";
import { useCanvasRenderer } from "@/hooks/useCanvasRenderer";
import { WelcomeScreen } from "@/components/game/WelcomeScreen";
import { PlayingScreen } from "@/components/game/PlayingScreen";
import { GameOverScreen } from "@/components/game/GameOverScreen";
import { LeaderboardScreen } from "@/components/game/LeaderboardScreen";
import { ClaimRewardsPopup } from "@/components/ClaimRewardsPopup";

export default function ColorMatchGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    address,
    isConnected,
    isStartingGame,
    isStartGameLoading,
    isStartGameSuccess,
    isSubmittingScore,
    isSubmitScoreLoading,
    isSubmitScoreSuccess,
    leaderboard,
    playerStats,
    startGame,
    submitScore,
  } = useGameContract();

  const {
    gameState,
    score,
    level,
    gameRunning,
    circles,
    expectedColor,
    canvasWidth,
    canvasHeight,
    circleRadius,
    spawnCircle,
    updateCircles,
    handleZoneClick,
    startGamePlay,
    goToWelcome,
    showLeaderboard,
    incrementFrameCount,
  } = useGameLogic({
    onGameEnd: (finalScore, finalLevel) => {
      submitScore(finalScore, finalLevel);
    },
  });

  const { drawCircles } = useCanvasRenderer({
    canvasWidth,
    canvasHeight,
    circleRadius,
  });

  // Start gameplay when contract transaction succeeds
  useEffect(() => {
    if (isStartGameSuccess) {
      startGamePlay();
    }
  }, [isStartGameSuccess]);

  // Game loop effect
  useEffect(() => {
    let animationId: number;

    const gameLoop = () => {
      if (!gameRunning || gameState !== "playing") return;

      incrementFrameCount();
      spawnCircle();
      updateCircles();
      drawCircles(canvasRef.current, circles, expectedColor);

      animationId = requestAnimationFrame(gameLoop);
    };

    if (gameRunning && gameState === "playing") {
      animationId = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [
    gameRunning,
    gameState,
    circles,
    expectedColor,
    spawnCircle,
    updateCircles,
    drawCircles,
    incrementFrameCount,
  ]);

  if (gameState === "welcome") {
    return (
      <>
        <ClaimRewardsPopup />
        <WelcomeScreen
          isConnected={isConnected}
          address={address}
          playerStats={playerStats}
          isStartingGame={isStartingGame}
          isStartGameLoading={isStartGameLoading}
          onStartGame={startGame}
          onShowLeaderboard={showLeaderboard}
        />
      </>
    );
  }

  if (gameState === "leaderboard") {
    return (
      <>
        <ClaimRewardsPopup />
        <LeaderboardScreen
          leaderboard={leaderboard}
          address={address}
          onGoToWelcome={goToWelcome}
        />
      </>
    );
  }

  if (gameState === "gameOver") {
    return (
      <>
        <ClaimRewardsPopup />
        <GameOverScreen
          score={score}
          level={level}
          isSubmittingScore={isSubmittingScore}
          isSubmitScoreLoading={isSubmitScoreLoading}
          isSubmitScoreSuccess={isSubmitScoreSuccess}
          isStartingGame={isStartingGame}
          isStartGameLoading={isStartGameLoading}
          onStartGame={startGame}
          onShowLeaderboard={showLeaderboard}
          onGoToWelcome={goToWelcome}
        />
      </>
    );
  }

  return (
    <>
      <ClaimRewardsPopup />
      <PlayingScreen
        canvasRef={canvasRef}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        score={score}
        level={level}
        onZoneClick={handleZoneClick}
        onGoToWelcome={goToWelcome}
      />
    </>
  );
}
