"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/config/contract.config";
import { formatEther } from "viem";

export interface DailyTop3Entry {
  player: string;
  score: number;
  reward: bigint;
  rewardFormatted: string;
  rank: number;
  day: bigint;
}

export function useDailyTop3(day: bigint | undefined, enabled: boolean = true) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDailyTop3",
    args: day !== undefined ? [day] : undefined,
    query: {
      enabled: enabled && day !== undefined,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 15000, // Consider data stale after 15 seconds
    },
  });

  const formattedData: DailyTop3Entry[] = [];

  if (data && day !== undefined) {
    const [topPlayers, topScores, rewards] = data as unknown as [
      readonly `0x${string}`[],
      readonly number[],
      readonly bigint[]
    ];

    // Only include entries with non-zero addresses
    for (let i = 0; i < 3; i++) {
      if (topPlayers[i] && topPlayers[i] !== "0x0000000000000000000000000000000000000000") {
        formattedData.push({
          player: topPlayers[i],
          score: Number(topScores[i]),
          reward: rewards[i],
          rewardFormatted: formatEther(rewards[i]),
          rank: i + 1,
          day: day,
        });
      }
    }
  }

  return {
    data: formattedData,
    isLoading,
    error,
    refetch,
  };
}

export function useCurrentTop3() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCurrentTop3",
    query: {
      refetchInterval: 30000,
      staleTime: 15000,
    },
  });

  const formattedData: Omit<DailyTop3Entry, "day">[] = [];

  if (data) {
    const [topPlayers, topScores, potentialRewards] = data as unknown as [
      readonly `0x${string}`[],
      readonly number[],
      readonly bigint[]
    ];

    for (let i = 0; i < 3; i++) {
      if (topPlayers[i] && topPlayers[i] !== "0x0000000000000000000000000000000000000000") {
        formattedData.push({
          player: topPlayers[i],
          score: Number(topScores[i]),
          reward: potentialRewards[i],
          rewardFormatted: formatEther(potentialRewards[i]),
          rank: i + 1,
        });
      }
    }
  }

  return {
    data: formattedData,
    isLoading,
    error,
    refetch,
  };
}

export interface DailySummary {
  totalPlayers: number;
  totalCollected: bigint;
  totalCollectedFormatted: string;
  finalized: boolean;
  rewardsAvailable: boolean;
}

export function useDailySummary(day: bigint | undefined, enabled: boolean = true) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDailySummary",
    args: day !== undefined ? [day] : undefined,
    query: {
      enabled: enabled && day !== undefined,
      refetchInterval: 30000,
      staleTime: 15000,
    },
  });

  let formattedData: DailySummary | undefined;

  if (data) {
    const [totalPlayers, totalCollected, finalized, rewardsAvailable] = data as [
      number,
      bigint,
      boolean,
      boolean
    ];

    formattedData = {
      totalPlayers,
      totalCollected,
      totalCollectedFormatted: formatEther(totalCollected),
      finalized,
      rewardsAvailable,
    };
  }

  return {
    data: formattedData,
    isLoading,
    error,
    refetch,
  };
}

export interface ScoreEntry {
  player: string;
  score: number;
  level: number;
  rank: number;
}

export interface DailySummaryWithScores {
  first: ScoreEntry;
  second: ScoreEntry;
  third: ScoreEntry;
  totalCollected: bigint;
  totalCollectedFormatted: string;
  totalPlayers: number;
  finalized: boolean;
}

export function useDailySummaries(day: bigint | undefined, enabled: boolean = true) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "dailySummaries",
    args: day !== undefined ? [day] : undefined,
    query: {
      enabled: enabled && day !== undefined,
      refetchInterval: 10000, // Refetch every 10 seconds for live scores
      staleTime: 5000,
    },
  });

  let formattedData: DailySummaryWithScores | undefined;
  let topScores: ScoreEntry[] = [];

  if (data) {
    const [first, second, third, totalCollected, totalPlayers, finalized] = data as [
      { player: string; score: number; level: number },
      { player: string; score: number; level: number },
      { player: string; score: number; level: number },
      bigint,
      number,
      boolean
    ];

    formattedData = {
      first: { ...first, rank: 1 },
      second: { ...second, rank: 2 },
      third: { ...third, rank: 3 },
      totalCollected,
      totalCollectedFormatted: formatEther(totalCollected),
      totalPlayers,
      finalized,
    };

    // Build array of non-zero entries
    if (first.player !== "0x0000000000000000000000000000000000000000") {
      topScores.push({ ...first, rank: 1 });
    }
    if (second.player !== "0x0000000000000000000000000000000000000000") {
      topScores.push({ ...second, rank: 2 });
    }
    if (third.player !== "0x0000000000000000000000000000000000000000") {
      topScores.push({ ...third, rank: 3 });
    }
  }

  return {
    data: formattedData,
    topScores,
    isLoading,
    error,
    refetch,
  };
}

export interface PlayerStats {
  gamesPlayed: bigint;
  lastPlayTime: bigint;
  highScore: bigint;
  totalEarnings: bigint;
  totalEarningsFormatted: string;
}

export function usePlayerStats(playerAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "players",
    args: playerAddress ? [playerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!playerAddress,
      refetchInterval: 30000,
      staleTime: 15000,
    },
  });

  let formattedData: PlayerStats | undefined;

  if (data) {
    const [gamesPlayed, lastPlayTime, highScore, totalEarnings] = data as [
      bigint,
      bigint,
      bigint,
      bigint
    ];

    formattedData = {
      gamesPlayed,
      lastPlayTime,
      highScore,
      totalEarnings,
      totalEarningsFormatted: formatEther(totalEarnings),
    };
  }

  return {
    data: formattedData,
    isLoading,
    error,
    refetch,
  };
}

export interface CanClaimResult {
  canClaim: boolean;
  reward: bigint;
  rewardFormatted: string;
  rank: number;
  day: bigint;
}

export function useCanClaimReward(
  playerAddress: string | undefined,
  day: bigint | undefined
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "canClaimReward",
    args:
      playerAddress && day !== undefined
        ? [playerAddress as `0x${string}`, day]
        : undefined,
    query: {
      enabled: !!playerAddress && day !== undefined,
      refetchInterval: 15000,
      staleTime: 10000,
    },
  });

  let formattedData: CanClaimResult | undefined;

  if (data && day !== undefined) {
    const [canClaim, reward, rank] = data as [boolean, bigint, number];

    formattedData = {
      canClaim,
      reward,
      rewardFormatted: formatEther(reward),
      rank,
      day,
    };
  }

  return {
    data: formattedData,
    isLoading,
    error,
    refetch,
  };
}
