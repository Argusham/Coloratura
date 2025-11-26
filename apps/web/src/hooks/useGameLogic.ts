"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  const frameCountRef = useRef(0);
  const expectedColorRef = useRef<Color | null>(null);
  const gameRunningRef = useRef(false);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);

  const canvasWidth =
    typeof window !== "undefined"
      ? Math.min(GAME_CONFIG.canvasWidth, window.innerWidth - 64)
      : GAME_CONFIG.canvasWidth;
  const canvasHeight = GAME_CONFIG.canvasHeight;
  const circleRadius = GAME_CONFIG.circleRadius;

  // Keep refs in sync with state
  useEffect(() => {
    frameCountRef.current = frameCount;
  }, [frameCount]);

  useEffect(() => {
    expectedColorRef.current = expectedColor;
  }, [expectedColor]);

  useEffect(() => {
    gameRunningRef.current = gameRunning;
  }, [gameRunning]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const spawnCircle = useCallback(() => {
    if (frameCountRef.current % spawnRate.current === 0) {
      setCircles((prev) => {
        // Only spawn if there's less than 1 circle
        if (prev.length >= 1) return prev;

        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const x = Math.random() * (canvasWidth - circleRadius * 2) + circleRadius;

        const newCircle: Circle = {
          id: circleIdCounter.current++,
          x,
          y: -circleRadius,
          color,
          radius: circleRadius,
        };

        const updated = [...prev, newCircle];
        if (!expectedColorRef.current) {
          setExpectedColor(newCircle.color);
        }
        return updated;
      });
    }
  }, [canvasWidth, circleRadius]);

  const updateCircles = useCallback(() => {
    setCircles((prev) => {
      const updated = prev.map((circle) => ({
        ...circle,
        y: circle.y + fallSpeed.current,
      }));

      let gameEnded = false;
      const currentExpectedColor = expectedColorRef.current;
      const targetCircle = currentExpectedColor
        ? updated.find((circle) => circle.color === currentExpectedColor)
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
        const currentTarget = currentExpectedColor
          ? filtered.find((circle) => circle.color === currentExpectedColor)
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
  }, [canvasHeight]);

  const handleZoneClick = useCallback((color: Color) => {
    if (!gameRunningRef.current || gameState !== "playing") return;
    const currentExpectedColor = expectedColorRef.current;
    if (!currentExpectedColor) return;

    if (color === currentExpectedColor) {
      setScore((currentScore) => {
        const currentLevel = levelRef.current;
        const newScore = currentScore + GAME_CONFIG.pointsPerLevel * currentLevel;

        // Level up check
        if (newScore > 0 && newScore % GAME_CONFIG.levelUpScore === 0) {
          setLevel((prev) => prev + 1);
          fallSpeed.current += GAME_CONFIG.fallSpeedIncrease;
          spawnRate.current = Math.max(
            GAME_CONFIG.minSpawnRate,
            spawnRate.current - GAME_CONFIG.spawnRateDecrease
          );
        }

        return newScore;
      });

      setCircles((prev) => {
        const targetCircle = prev.find((circle) => circle.color === currentExpectedColor);
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
    } else {
      endGame();
    }
  }, [gameState]);

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

  const endGame = useCallback(() => {
    if (isEndingGame.current || !gameRunningRef.current) return;

    isEndingGame.current = true;
    setGameRunning(false);
    setGameState("gameOver");

    onGameEnd(scoreRef.current, levelRef.current);
  }, [onGameEnd]);

  const goToWelcome = () => {
    setGameState("welcome");
    setGameRunning(false);
  };

  const showLeaderboard = () => {
    setGameState("leaderboard");
  };

  const incrementFrameCount = useCallback(() => {
    setFrameCount((prev) => prev + 1);
  }, []);

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
