"use client";

import { useState, useCallback, useRef } from "react";
import type { Circle, Color, GameState } from "@/types/game.types";
import { COLORS, GAME_CONFIG } from "@/config/game.config";

interface UseGameLogicProps {
  onGameEnd: (score: number, level: number) => void;
}

export function useGameLogic({ onGameEnd }: UseGameLogicProps) {
  const [gameState, setGameState] = useState<GameState>("welcome");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameRunning, setGameRunning] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [expectedColor, setExpectedColor] = useState<Color | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  const fallSpeed = useRef(GAME_CONFIG.initialFallSpeed);
  const spawnRate = useRef(GAME_CONFIG.initialSpawnRate);
  const circleIdCounter = useRef(0);
  const isEndingGame = useRef(false);

  const canvasWidth =
    typeof window !== "undefined"
      ? Math.min(GAME_CONFIG.canvasWidth, window.innerWidth - 64)
      : GAME_CONFIG.canvasWidth;
  const canvasHeight = GAME_CONFIG.canvasHeight;
  const circleRadius = GAME_CONFIG.circleRadius;

  const spawnCircle = useCallback(() => {
    if (frameCount % spawnRate.current === 0 && circles.length < 1) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const x = Math.random() * (canvasWidth - circleRadius * 2) + circleRadius;

      const newCircle: Circle = {
        id: circleIdCounter.current++,
        x,
        y: -circleRadius,
        color,
        radius: circleRadius,
      };

      setCircles((prev) => {
        const updated = [...prev, newCircle];
        if (!expectedColor) {
          setExpectedColor(newCircle.color);
        }
        return updated;
      });
    }
  }, [frameCount, expectedColor, canvasWidth, circleRadius, circles.length]);

  const updateCircles = useCallback(() => {
    setCircles((prev) => {
      const updated = prev.map((circle) => ({
        ...circle,
        y: circle.y + fallSpeed.current,
      }));

      let gameEnded = false;
      const targetCircle = expectedColor
        ? updated.find((circle) => circle.color === expectedColor)
        : null;

      const filtered = updated.filter((circle) => {
        if (circle.y > canvasHeight + circle.radius) {
          if (targetCircle && circle.id === targetCircle.id) {
            gameEnded = true;
          }
          return false;
        }
        return true;
      });

      if (filtered.length > 0) {
        const currentTarget = expectedColor
          ? filtered.find((circle) => circle.color === expectedColor)
          : null;

        if (!currentTarget) {
          const bottomMostCircle = filtered.reduce((bottom, current) =>
            current.y > bottom.y ? current : bottom
          );
          setExpectedColor(bottomMostCircle.color);
        }
      } else {
        setExpectedColor(null);
      }

      if (gameEnded) {
        setTimeout(() => {
          setGameRunning(false);
          endGame();
        }, 0);
      }

      return filtered;
    });
  }, [canvasHeight, expectedColor]);

  const handleZoneClick = (color: Color) => {
    if (!gameRunning || gameState !== "playing") return;
    if (!expectedColor) return;

    if (color === expectedColor) {
      const newScore = score + GAME_CONFIG.pointsPerLevel * level;
      setScore(newScore);

      setCircles((prev) => {
        const targetCircle = prev.find((circle) => circle.color === expectedColor);
        if (!targetCircle) return prev;

        const filtered = prev.filter((circle) => circle.id !== targetCircle.id);

        if (filtered.length > 0) {
          const bottomMostCircle = filtered.reduce((bottom, current) =>
            current.y > bottom.y ? current : bottom
          );
          setExpectedColor(bottomMostCircle.color);
        } else {
          setExpectedColor(null);
        }

        return filtered;
      });

      if (newScore > 0 && newScore % GAME_CONFIG.levelUpScore === 0) {
        setLevel((prev) => prev + 1);
        fallSpeed.current += GAME_CONFIG.fallSpeedIncrease;
        spawnRate.current = Math.max(
          GAME_CONFIG.minSpawnRate,
          spawnRate.current - GAME_CONFIG.spawnRateDecrease
        );
      }
    } else {
      endGame();
    }
  };

  const startGamePlay = () => {
    setScore(0);
    setLevel(1);
    setCircles([]);
    setExpectedColor(null);
    setFrameCount(0);
    fallSpeed.current = GAME_CONFIG.initialFallSpeed;
    spawnRate.current = GAME_CONFIG.initialSpawnRate;
    circleIdCounter.current = 0;
    isEndingGame.current = false;
    setGameState("playing");
    setGameRunning(true);
  };

  const endGame = () => {
    if (isEndingGame.current || !gameRunning) return;

    isEndingGame.current = true;
    setGameRunning(false);
    setGameState("gameOver");

    onGameEnd(score, level);
  };

  const goToWelcome = () => {
    setGameState("welcome");
    setGameRunning(false);
  };

  const showLeaderboard = () => {
    setGameState("leaderboard");
  };

  const incrementFrameCount = () => {
    setFrameCount((prev) => prev + 1);
  };

  return {
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
    endGame,
    goToWelcome,
    showLeaderboard,
    incrementFrameCount,
  };
}
