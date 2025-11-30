import { GraphQLClient } from 'graphql-request';

// The Graph Studio endpoint - UPDATE THIS with your actual deployed subgraph URL
// Format: https://api.studio.thegraph.com/query/<DEPLOY_KEY>/colour-match/version/latest
// or for production: https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/<SUBGRAPH_ID>
export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/query/YOUR_DEPLOY_KEY/colour-match/version/latest';

export const graphQLClient = new GraphQLClient(SUBGRAPH_URL);

// GraphQL Queries

// Get current day leaderboard by joining GameStarted and GameCompleted via sessionId
export const GET_CURRENT_DAY_LEADERBOARD = `
  query GetCurrentDayLeaderboard($day: BigInt!, $first: Int = 100) {
    gameStarteds(where: { day: $day }) {
      sessionId
      player
      day
    }
    gameCompleteds(
      orderBy: score
      orderDirection: desc
      first: $first
    ) {
      id
      player
      score
      sessionId
      blockTimestamp
      transactionHash
    }
  }
`;

// Get all-time high scores from HighScoreSet events
export const GET_ALL_TIME_HIGH_SCORES = `
  query GetAllTimeHighScores($first: Int = 100) {
    highScoreSets(
      orderBy: score
      orderDirection: desc
      first: $first
    ) {
      id
      player
      score
      blockTimestamp
      transactionHash
    }
  }
`;

// Get specific player's high score
export const GET_PLAYER_HIGH_SCORE = `
  query GetPlayerHighScore($player: String!) {
    highScoreSets(
      where: { player: $player }
      orderBy: score
      orderDirection: desc
      first: 1
    ) {
      id
      player
      score
      blockTimestamp
      transactionHash
    }
  }
`;

// Get all game sessions for a specific day
export const GET_DAY_SESSIONS = `
  query GetDaySessions($day: BigInt!) {
    gameStarteds(where: { day: $day }) {
      id
      sessionId
      player
      day
      blockTimestamp
    }
  }
`;

// Get player's game history
export const GET_PLAYER_GAMES = `
  query GetPlayerGames($player: String!, $first: Int = 10) {
    gameCompleteds(
      where: { player: $player }
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
    ) {
      id
      player
      score
      sessionId
      blockTimestamp
      transactionHash
    }
  }
`;

// Get previous day's leaderboard from DailyRewardPaid events
export const GET_PREVIOUS_DAY_LEADERBOARD = `
  query GetPreviousDayLeaderboard($day: BigInt!) {
    dailyRewardPaids(
      where: { day: $day }
      orderBy: rank
      orderDirection: asc
    ) {
      id
      day
      player
      rank
      reward
      blockTimestamp
    }
  }
`;
