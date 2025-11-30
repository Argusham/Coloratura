import type { Color } from "@/types/game.types";

export const COLORS: Color[] = ["red", "green", "blue", "yellow"];

export const COLOR_STYLES = {
  red: "bg-red-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
};

export const COLOR_HEX = {
  red: "#ef4444",
  green: "#10b981",
  blue: "#3b82f6",
  yellow: "#eab308",
};

export const GAME_CONFIG = {
  canvasWidth: 350,
  canvasHeight: 400,
  circleRadius: 25,
  initialFallSpeed: 3,
  initialSpawnRate: 120,
  fallSpeedIncrease: 0.5,
  spawnRateDecrease: 10,
  minSpawnRate: 60,
  pointsPerLevel: 10,
  levelUpScore: 100,
};
