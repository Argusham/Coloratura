"use client";

import { useQuery } from "@tanstack/react-query";
import { graphQLClient, GET_ALL_TIME_HIGH_SCORES, GET_PLAYER_HIGH_SCORE } from "@/lib/graphql-client";

interface HighScoreSet {
  id: string;
  player: string;
  score: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface HighScoresData {
  highScoreSets: HighScoreSet[];
}

export interface HighScoreEntry {
  player: string;
  score: number;
  timestamp: number;
  transactionHash: string;
}

// Get all-time top high scores
export function useHighScores(limit: number = 100) {
  return useQuery({
    queryKey: ["high-scores", limit],
    queryFn: async (): Promise<HighScoreEntry[]> => {
      const data = await graphQLClient.request<HighScoresData>(
        GET_ALL_TIME_HIGH_SCORES,
        { first: limit }
      );

      return data.highScoreSets.map((hs) => ({
        player: hs.player,
        score: Number(hs.score),
        timestamp: Number(hs.blockTimestamp),
        transactionHash: hs.transactionHash,
      }));
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

// Get specific player's high score
export function usePlayerHighScore(playerAddress: string | undefined) {
  return useQuery({
    queryKey: ["player-high-score", playerAddress?.toLowerCase()],
    queryFn: async (): Promise<HighScoreEntry | null> => {
      if (!playerAddress) return null;

      const data = await graphQLClient.request<HighScoresData>(
        GET_PLAYER_HIGH_SCORE,
        { player: playerAddress.toLowerCase() }
      );

      if (data.highScoreSets.length === 0) return null;

      const hs = data.highScoreSets[0];
      return {
        player: hs.player,
        score: Number(hs.score),
        timestamp: Number(hs.blockTimestamp),
        transactionHash: hs.transactionHash,
      };
    },
    enabled: !!playerAddress,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
