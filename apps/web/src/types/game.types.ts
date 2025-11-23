export type Color = "red" | "blue" | "green" | "yellow";
export type GameState = "welcome" | "playing" | "gameOver" | "leaderboard";

export interface LeaderboardEntry {
  player: string;
  score: number;
  level: number;
}

export interface Circle {
  id: number;
  x: number;
  y: number;
  color: Color;
  radius: number;
}

export interface PlayerStats {
  gamesPlayed: bigint;
  lastPlayTime: bigint;
  highScore: bigint;
  totalEarnings: bigint;
}
