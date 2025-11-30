"use client";

import { useRef, useEffect } from "react";
import { useGameContract } from "@/hooks/useGameContract";
import { useGameLogic } from "@/hooks/useGameLogic";
import { useCanvasRenderer } from "@/hooks/useCanvasRenderer";
import { useDailyTop3, useDailySummaries, usePlayerStats } from "@/hooks/useContractLeaderboard";
import { useClaimRewards } from "@/hooks/useClaimRewards";
import { WelcomeScreen } from "@/components/game/WelcomeScreen";
import { PlayingScreen } from "@/components/game/PlayingScreen";
import { GameOverScreen } from "@/components/game/GameOverScreen";
import { LeaderboardScreen } from "@/components/game/LeaderboardScreen";
import { ClaimScreen } from "@/components/game/ClaimScreen";
import { ClaimRewardsPopup } from "@/components/ClaimRewardsPopup";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract.config";

export default function ColorMatchGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();

  const {
    address,
    isConnected,
    isStartingGame,
    isStartGameLoading,
    isStartGameSuccess,
    isSubmittingScore,
    isSubmitScoreLoading,
    isSubmitScoreSuccess,
    playerStats,
    startGame,
    submitScore,
  } = useGameContract();

  // Read current day from contract
  const { data: currentDay } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "currentDay",
  });

  // Calculate previous day
  const previousDay = currentDay && currentDay > 0n ? currentDay - 1n : undefined;

  // Get previous day's top 3 from contract (finalized winners)
  const { data: previousDayTop3, isLoading: isPreviousDayLoading } = useDailyTop3(previousDay);

  // Get today's live scores from dailySummaries
  const { topScores: todayScores, isLoading: isTodayScoresLoading } = useDailySummaries(currentDay);

  // Get claimable rewards
  const { claimableRewards } = useClaimRewards();

  // Get player stats
  const { data: playerStatsData } = usePlayerStats(address);

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
    showClaimPage,
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

  // Use refs to track latest state without triggering effect re-runs
  const circlesRef = useRef(circles);
  const expectedColorRef = useRef(expectedColor);

  useEffect(() => {
    circlesRef.current = circles;
  }, [circles]);

  useEffect(() => {
    expectedColorRef.current = expectedColor;
  }, [expectedColor]);

  // Start gameplay when contract transaction succeeds
  useEffect(() => {
    if (isStartGameSuccess) {
      startGamePlay();
    }
  }, [isStartGameSuccess]);

  // Game loop effect - only depends on game state, not on circles/colors
  useEffect(() => {
    const gameLoop = () => {
      if (!gameRunning || gameState !== "playing") {
        return;
      }

      incrementFrameCount();
      spawnCircle();
      updateCircles();
      drawCircles(canvasRef.current, circlesRef.current, expectedColorRef.current);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    if (gameRunning && gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [
    gameRunning,
    gameState,
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
          playerStatsData={playerStatsData}
          isStartingGame={isStartingGame}
          isStartGameLoading={isStartGameLoading}
          onStartGame={startGame}
          onShowLeaderboard={showLeaderboard}
          onShowClaimPage={showClaimPage}
        />
      </>
    );
  }

  if (gameState === "leaderboard") {
    return (
      <>
        <ClaimRewardsPopup />
        <LeaderboardScreen
          previousDayTop3={previousDayTop3 || []}
          todayScores={todayScores || []}
          address={address}
          onGoToWelcome={goToWelcome}
          isLoading={isPreviousDayLoading || isTodayScoresLoading}
          claimableDays={claimableRewards.map(r => r.day)}
        />
      </>
    );
  }

  if (gameState === "claim") {
    return (
      <>
        <ClaimRewardsPopup />
        <ClaimScreen
          address={address}
          currentDay={currentDay}
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
