export const CONTRACT_ADDRESS = "0x266e31b4097B60D9e4b95CB899354060D5B58090" as const;
export const ENTRY_FEE = "100000000000000000"; // 0.1 cUSD (18 decimals)

// cUSD Token addresses
export const CUSD_ADDRESS_MAINNET = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const;
export const CUSD_ADDRESS_TESTNET = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" as const;

// Divvi Referral Integration
export const DIVVI_CONSUMER_ADDRESS = "0x7320f31D71A5294f04f7eEeb101418FEEd3d3119" as const;

// ERC20 ABI for cUSD token interactions
export const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "startGame",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "sessionId", type: "uint256" },
      { internalType: "uint32", name: "score", type: "uint32" },
      { internalType: "uint16", name: "level", type: "uint16" },
    ],
    name: "submitScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentTop3",
    outputs: [
      { internalType: "address[3]", name: "topPlayers", type: "address[3]" },
      { internalType: "uint32[3]", name: "topScores", type: "uint32[3]" },
      { internalType: "uint256[3]", name: "potentialRewards", type: "uint256[3]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "playerAddr", type: "address" }],
    name: "getPlayerStats",
    outputs: [
      { internalType: "uint64", name: "gamesPlayed", type: "uint64" },
      { internalType: "uint64", name: "lastPlayTime", type: "uint64" },
      { internalType: "uint64", name: "highScore", type: "uint64" },
      { internalType: "uint128", name: "totalEarnings", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "sessionId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "day",
        type: "uint256",
      },
    ],
    name: "GameStarted",
    type: "event",
  },
  {
    inputs: [],
    name: "sessionCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentDay",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint256", name: "day", type: "uint256" },
    ],
    name: "canClaimReward",
    outputs: [
      { internalType: "bool", name: "canClaim", type: "bool" },
      { internalType: "uint256", name: "reward", type: "uint256" },
      { internalType: "uint8", name: "rank", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "day", type: "uint256" }],
    name: "claimDailyReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "day", type: "uint256" }],
    name: "getDailyTop3",
    outputs: [
      { internalType: "address[3]", name: "topPlayers", type: "address[3]" },
      { internalType: "uint32[3]", name: "topScores", type: "uint32[3]" },
      { internalType: "uint256[3]", name: "rewards", type: "uint256[3]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "day", type: "uint256" }],
    name: "getDailySummary",
    outputs: [
      { internalType: "uint16", name: "totalPlayers", type: "uint16" },
      { internalType: "uint128", name: "totalCollected", type: "uint128" },
      { internalType: "bool", name: "finalized", type: "bool" },
      { internalType: "bool", name: "rewardsAvailable", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256[]", name: "dayIds", type: "uint256[]" }],
    name: "claimMultipleDays",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getPaymentToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "day", type: "uint256" }],
    name: "dailySummaries",
    outputs: [
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint32", name: "score", type: "uint32" },
          { internalType: "uint16", name: "level", type: "uint16" },
        ],
        internalType: "struct ColorMatchGame.ScoreEntry",
        name: "first",
        type: "tuple",
      },
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint32", name: "score", type: "uint32" },
          { internalType: "uint16", name: "level", type: "uint16" },
        ],
        internalType: "struct ColorMatchGame.ScoreEntry",
        name: "second",
        type: "tuple",
      },
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint32", name: "score", type: "uint32" },
          { internalType: "uint16", name: "level", type: "uint16" },
        ],
        internalType: "struct ColorMatchGame.ScoreEntry",
        name: "third",
        type: "tuple",
      },
      { internalType: "uint128", name: "totalCollected", type: "uint128" },
      { internalType: "uint16", name: "totalPlayers", type: "uint16" },
      { internalType: "bool", name: "finalized", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "players",
    outputs: [
      { internalType: "uint64", name: "gamesPlayed", type: "uint64" },
      { internalType: "uint64", name: "lastPlayTime", type: "uint64" },
      { internalType: "uint64", name: "highScore", type: "uint64" },
      { internalType: "uint128", name: "totalEarnings", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "finalizeCurrentDay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "rank",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "day",
        type: "uint256",
      },
    ],
    name: "DailyRewardPaid",
    type: "event",
  },
] as const;
