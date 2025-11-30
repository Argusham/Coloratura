# Subgraph Integration Guide

This guide explains how the Color Match game integrates with The Graph subgraph for efficient data querying.

## Overview

The application uses The Graph Protocol to query blockchain data for:
- **Current Day Leaderboard**: Top scores for today's games
- **All-Time High Scores**: Highest scores ever achieved (from `HighScoreSet` events)

## Setup

### 1. Environment Configuration

Add your subgraph URL to `.env.local`:

```bash
# Copy the template
cp .env.template .env.local

# Edit and add your subgraph URL
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/<YOUR_DEPLOY_KEY>/colour-match/version/latest
```

### 2. Getting Your Subgraph URL

#### Option A: The Graph Studio (Development)
1. Deploy your subgraph to The Graph Studio
2. Get the query URL from your subgraph dashboard
3. Format: `https://api.studio.thegraph.com/query/<DEPLOY_KEY>/colour-match/version/latest`

#### Option B: Decentralized Network (Production)
1. Publish your subgraph to The Graph's decentralized network
2. Get an API key from The Graph
3. Format: `https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/<SUBGRAPH_ID>`

## Features

### Current Day Leaderboard (`useSubgraphLeaderboard`)

**Location**: `/home/cody/devhome/my-celo-app/apps/web/src/hooks/useSubgraphLeaderboard.ts:1`

Queries the subgraph for today's top scores by:
1. Fetching all `GameStarted` events for the current day
2. Fetching all `GameCompleted` events
3. Joining them via `sessionId` to filter games from the current day
4. Grouping by player to get their best score for the day
5. Sorting by score descending

**Usage**:
```typescript
const { data: leaderboard, isLoading } = useSubgraphLeaderboard(currentDay);
```

**Refresh Rate**: Every 30 seconds

### All-Time High Scores (`useHighScores`)

**Location**: `/home/cody/devhome/my-celo-app/apps/web/src/hooks/useHighScores.ts:1`

Queries `HighScoreSet` events to display players' all-time best scores.

**Usage**:
```typescript
// Get top 10 high scores
const { data: highScores, isLoading } = useHighScores(10);

// Get specific player's high score
const { data: playerHighScore } = usePlayerHighScore(address);
```

**Refresh Rate**: Every 60 seconds

## Leaderboard Component

The `LeaderboardScreen` component displays both:
- **Today's Top**: Current day leaderboard from the subgraph
- **All-Time High Scores**: Lifetime best scores from `HighScoreSet` events

Users can switch between tabs to view either leaderboard.

## GraphQL Queries

All queries are defined in `/home/cody/devhome/my-celo-app/apps/web/src/lib/graphql-client.ts:1`

### Current Day Leaderboard Query
```graphql
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
```

### High Scores Query
```graphql
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
```

## How It Works

### Data Flow

1. **User Plays Game**
   - Pays entry fee (0.1 cUSD)
   - `GameStarted` event emitted → Indexed by subgraph
   - Game plays
   - `GameCompleted` event emitted → Indexed by subgraph
   - If new personal best: `HighScoreSet` event emitted → Indexed by subgraph

2. **Leaderboard Display**
   - Component reads `currentDay` from contract
   - Queries subgraph with current day
   - Joins `GameStarted` and `GameCompleted` via `sessionId`
   - Displays filtered & sorted results

3. **Auto-Refresh**
   - React Query automatically refetches data
   - Current day leaderboard: every 30s
   - High scores: every 60s

## Troubleshooting

### Subgraph Not Syncing
- Check if subgraph is deployed and syncing
- Verify the subgraph URL is correct
- Check The Graph Studio dashboard for indexing status

### No Data Showing
- Ensure `NEXT_PUBLIC_SUBGRAPH_URL` is set in `.env.local`
- Check browser console for GraphQL errors
- Verify games have been played (events emitted)

### Stale Data
- Check React Query cache settings in hooks
- Verify `refetchInterval` is set correctly
- Clear browser cache and reload

## Performance Optimization

- **React Query Caching**: Data is cached and only refetched when stale
- **Efficient Queries**: Only fetches necessary fields
- **Client-Side Filtering**: Joins and filters happen in the hook, not on-chain
- **Pagination**: Supports limiting results with `first` parameter

## Future Enhancements

- Add player statistics dashboard
- Implement historical day leaderboards
- Add real-time updates with GraphQL subscriptions
- Display transaction links for verification
