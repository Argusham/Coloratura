// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract ColorMatchGame {
    
    // Game Configuration
    uint256 public constant ENTRY_FEE = 100000000000000000; // 0.1 cUSD (18 decimals)
    uint256 public constant MAX_SESSION_AGE = 1 hours;
    uint256 public constant LEADERBOARD_RETENTION_DAYS = 30;
    uint256 public constant CLAIM_WINDOW_DAYS = 7; // Winners have 7 days to claim
    
    // Percentage distribution (basis points: 10000 = 100%)
    uint256 public constant FIRST_PLACE_PERCENTAGE = 3000;   // 30% of daily pool
    uint256 public constant SECOND_PLACE_PERCENTAGE = 2500;  // 25% of daily pool
    uint256 public constant THIRD_PLACE_PERCENTAGE = 1500;   // 15% of daily pool
    // House keeps 30% (3000 basis points)
    
    // Minimum players required for rewards
    uint256 public constant MIN_PLAYERS_FOR_REWARDS = 3;
    
    // cUSD Token on Celo Mainnet: 0x765DE816845861e75A25fCA122bb6898B8B1282a
    // cUSD Token on Celo Alfajores Testnet: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
    IERC20 public immutable paymentToken;
    
    // Packed Player Data (optimized for overflow protection)
    struct Player {
        uint64 gamesPlayed;        // 8 bytes
        uint64 lastPlayTime;       // 8 bytes
        uint64 highScore;          // 8 bytes
        uint128 totalEarnings;     // 16 bytes - increased to prevent overflow
    }
    
    // Packed Game Session (fits in 2 slots)
    struct GameSession {
        address player;            // slot 0: 20 bytes
        uint64 timestamp;          // slot 0: 8 bytes
        uint32 score;              // slot 0: 4 bytes
        uint16 level;              // slot 1: 2 bytes
        bool completed;            // slot 1: 1 byte
        bool rewarded;             // slot 1: 1 byte
    }
    
    // Packed Leaderboard Entry (fits in 1 slot - 28 bytes)
    struct LeaderboardEntry {
        address player;            // 20 bytes
        uint32 score;              // 4 bytes
        uint32 sessionId;          // 4 bytes
    }
    
    // PERMANENT: Winner records that never get deleted
    struct DailyWinners {
        address first;
        address second;
        address third;
        uint128 dailyPool;         // Total collected that day
        uint64 finalizedAt;        // Timestamp when day was finalized
        uint16 totalPlayers;
        bool finalized;
        bool expiredFundsClaimed;  // Track if expired funds moved to reserve
    }
    
    // TEMPORARY: Detailed leaderboard (can be cleaned up)
    struct DailySummary {
        LeaderboardEntry first;
        LeaderboardEntry second;
        LeaderboardEntry third;
        uint128 totalCollected;
        uint16 totalPlayers;
        bool finalized;
    }
    
    // State Variables
    mapping(address => Player) public players;
    mapping(uint256 => GameSession) public gameSessions;
    uint256 public sessionCounter;
    uint256 public totalPrizePool;
    uint256 public houseReserve;
    address public owner;
    
    // PERMANENT: Winner records (NEVER deleted)
    mapping(uint256 => DailyWinners) public dailyWinners;
    
    // TEMPORARY: Detailed leaderboard (can be cleaned up after 30 days)
    mapping(uint256 => DailySummary) public dailySummaries;
    mapping(uint256 => mapping(address => bool)) public dailyRewardsClaimed;
    mapping(uint256 => mapping(address => uint32)) public dailyBestScores;
    mapping(uint256 => mapping(address => bool)) public dailyPlayerParticipated; // Track unique players per day
    uint256 public currentDay;
    
    // Circular buffer for cleanup tracking
    uint256 public oldestTrackedDay;
    
    // Custom Errors (gas efficient)
    error WrongFee();
    error TransferFailed();
    error NotYourSession();
    error AlreadySubmitted();
    error InvalidSession();
    error SessionExpired();
    error DayNotFinished();
    error AlreadyClaimed();
    error DayNotFinalized();
    error NotInTop3();
    error InsufficientPool();
    error OnlyOwner();
    error ExceedsReserve();
    error CantCleanupCurrentDay();
    error InvalidRange();
    error MaxTenDaysPerCall();
    error DayNotOver();
    error InvalidTokenAddress();
    error NotEnoughPlayers();
    error ClaimWindowExpired();
    error ClaimWindowNotExpired();
    error InvalidScore();
    error UseWithdrawReserve();
    
    // Events
    event GameStarted(address indexed player, uint256 sessionId, uint256 day);
    event GameCompleted(address indexed player, uint256 sessionId, uint32 score);
    event DailyRewardPaid(address indexed player, uint8 rank, uint256 reward, uint256 day);
    event HighScoreSet(address indexed player, uint32 score);
    event DayFinalized(uint256 day, uint256 totalCollected, uint16 totalPlayers);
    event ReserveUpdated(uint256 newReserve);
    event ExpiredFundsReclaimed(uint256 day, uint256 amount);
    
    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    constructor(address _paymentToken) {
        if (_paymentToken == address(0)) revert InvalidTokenAddress();
        owner = msg.sender;
        paymentToken = IERC20(_paymentToken);
        currentDay = block.timestamp / 1 days;
        oldestTrackedDay = currentDay;
    }
    
    // Start a new game session
    function startGame() external returns (uint256) {
        // Transfer cUSD from player to contract
        bool success = paymentToken.transferFrom(msg.sender, address(this), ENTRY_FEE);
        if (!success) revert TransferFailed();
        
        unchecked {
            ++sessionCounter;
        }
        
        uint256 day = block.timestamp / 1 days;
        
        gameSessions[sessionCounter] = GameSession({
            player: msg.sender,
            timestamp: uint64(block.timestamp),
            score: 0,
            level: 0,
            completed: false,
            rewarded: false
        });
        
        // Add to daily pool
        DailySummary storage summary = dailySummaries[day];
        summary.totalCollected += uint128(ENTRY_FEE);
        
        totalPrizePool += ENTRY_FEE;
        
        emit GameStarted(msg.sender, sessionCounter, day);
        return sessionCounter;
    }
    
    // Submit score after completing the game
    function submitScore(uint256 sessionId, uint32 score, uint16 level) external {
        GameSession storage session = gameSessions[sessionId];

        if (session.player != msg.sender) revert NotYourSession();
        if (session.completed) revert AlreadySubmitted();
        if (session.timestamp == 0) revert InvalidSession();
        if (block.timestamp > session.timestamp + MAX_SESSION_AGE) revert SessionExpired();

        // Validate score is reasonable (max 10 million points)
        if (score > 10_000_000) revert InvalidScore();
        
        // Update session
        session.score = score;
        session.level = level;
        session.completed = true;
        
        // Update day and cleanup old data if needed
        uint256 day = block.timestamp / 1 days;
        if (day != currentDay) {
            _finalizeDay(currentDay);
            currentDay = day;
            _cleanupOldData();
        }
        
        // Update player stats
        Player storage player = players[msg.sender];
        unchecked {
            ++player.gamesPlayed;
        }
        player.lastPlayTime = uint64(block.timestamp);
        
        if (score > player.highScore) {
            player.highScore = uint64(score);
            emit HighScoreSet(msg.sender, score);
        }
        
        // Update daily leaderboard only if this is player's best score today
        uint32 currentBest = dailyBestScores[day][msg.sender];
        if (score > currentBest) {
            dailyBestScores[day][msg.sender] = score;
            _updateDailySummary(day, msg.sender, score, uint32(sessionId));
        }
        
        emit GameCompleted(msg.sender, sessionId, score);
    }
    
    // Optimized leaderboard update (O(1) operations)
    function _updateDailySummary(uint256 day, address player, uint32 score, uint32 sessionId) internal {
        DailySummary storage summary = dailySummaries[day];

        // Track unique players per day
        if (!dailyPlayerParticipated[day][player]) {
            dailyPlayerParticipated[day][player] = true;
            if (summary.totalPlayers == 0) {
                summary.totalPlayers = 1;
            } else {
                unchecked {
                    ++summary.totalPlayers;
                }
            }
        }

        LeaderboardEntry memory newEntry = LeaderboardEntry({
            player: player,
            score: score,
            sessionId: sessionId
        });

        // Direct comparison with top 3 (no sorting needed)
        if (score > summary.first.score) {
            summary.third = summary.second;
            summary.second = summary.first;
            summary.first = newEntry;
        } else if (score > summary.second.score) {
            summary.third = summary.second;
            summary.second = newEntry;
        } else if (score > summary.third.score) {
            summary.third = newEntry;
        }
    }
    
    // Finalize a day's competition
    function _finalizeDay(uint256 day) internal {
        DailySummary storage summary = dailySummaries[day];
        if (!summary.finalized) {
            summary.finalized = true;

            // CRITICAL: Store permanent winner records
            DailyWinners storage winners = dailyWinners[day];
            winners.dailyPool = summary.totalCollected;
            winners.totalPlayers = summary.totalPlayers;
            winners.finalized = true;
            winners.finalizedAt = uint64(block.timestamp); // Set finalization timestamp

            // Only set winners and distribute if we have enough players
            if (summary.totalPlayers >= MIN_PLAYERS_FOR_REWARDS) {
                winners.first = summary.first.player;
                winners.second = summary.second.player;
                winners.third = summary.third.player;

                // Calculate house reserve (30% of daily pool)
                uint256 dailyPool = summary.totalCollected;
                uint256 distributed = (dailyPool * FIRST_PLACE_PERCENTAGE) / 10000 +
                                       (dailyPool * SECOND_PLACE_PERCENTAGE) / 10000 +
                                       (dailyPool * THIRD_PLACE_PERCENTAGE) / 10000;
                uint256 reserve = dailyPool - distributed;
                houseReserve += reserve;
            } else {
                // Less than 3 players: ALL funds go to house reserve
                houseReserve += summary.totalCollected;
            }

            emit DayFinalized(day, summary.totalCollected, summary.totalPlayers);
        }
    }
    
    // Cleanup old data to prevent unbounded growth
    // IMPORTANT: Only deletes temporary leaderboard data, NOT winner records
    function _cleanupOldData() internal {
        uint256 cutoffDay = currentDay > LEADERBOARD_RETENTION_DAYS 
            ? currentDay - LEADERBOARD_RETENTION_DAYS 
            : 0;
        
        if (oldestTrackedDay < cutoffDay) {
            // Delete ONLY temporary summary data (batch cleanup, max 5 per call)
            uint256 end = cutoffDay < oldestTrackedDay + 5 ? cutoffDay : oldestTrackedDay + 5;
            for (uint256 i = oldestTrackedDay; i < end; ) {
                delete dailySummaries[i];  // Delete temporary data
                // Cannot delete a mapping type (mapping(address => uint32)) directly; entries remain but
                // the temporary summary is deleted and oldestTrackedDay advances so they become unreachable.
                // NOTE: dailyWinners[i] is NEVER deleted - winners can always claim!
                unchecked {
                    ++i;
                }
            }
            oldestTrackedDay = cutoffDay;
        }
    }
    
    // Manual cleanup function for owner (only cleans temporary data)
    function cleanupOldDays(uint256 startDay, uint256 endDay) external onlyOwner {
        if (endDay >= currentDay) revert CantCleanupCurrentDay();
        if (endDay < startDay) revert InvalidRange();
        if (endDay - startDay > 10) revert MaxTenDaysPerCall();
        for (uint256 i = startDay; i <= endDay; ) {
            delete dailySummaries[i];  // Delete temporary data only
            // Cannot delete mapping(address => uint32) directly; individual entries cannot be cleared without addresses.
            // dailyWinners is NEVER deleted
            unchecked {
                ++i;
            }
        }
    }
    
    // Calculate reward for a specific rank on a specific day
    function calculateReward(uint256 day, uint8 rank) public view returns (uint256) {
        DailyWinners storage winners = dailyWinners[day];
        
        if (!winners.finalized) return 0;
        if (winners.totalPlayers < MIN_PLAYERS_FOR_REWARDS) return 0;
        
        uint256 dailyPool = winners.dailyPool;
        
        if (rank == 1) {
            return (dailyPool * FIRST_PLACE_PERCENTAGE) / 10000;
        } else if (rank == 2) {
            return (dailyPool * SECOND_PLACE_PERCENTAGE) / 10000;
        } else if (rank == 3) {
            return (dailyPool * THIRD_PLACE_PERCENTAGE) / 10000;
        }
        
        return 0;
    }
    
    // Get score for a completed game session
    function getSessionScore(uint256 sessionId) external view returns (
        address player,
        uint32 score,
        uint16 level,
        bool completed
    ) {
        GameSession memory session = gameSessions[sessionId];
        return (session.player, session.score, session.level, session.completed);
    }
    
    // Claim daily reward (top 3 players)
    // USES PERMANENT dailyWinners mapping - works even after cleanup!
    function claimDailyReward(uint256 day) external {
        if (day >= currentDay) revert DayNotFinished();
        if (dailyRewardsClaimed[day][msg.sender]) revert AlreadyClaimed();

        // Use PERMANENT winner records (never deleted)
        DailyWinners storage winners = dailyWinners[day];
        if (!winners.finalized) revert DayNotFinalized();
        if (winners.totalPlayers < MIN_PLAYERS_FOR_REWARDS) revert NotEnoughPlayers();

        // Check if claim window has expired (7 days after finalization)
        if (block.timestamp > winners.finalizedAt + (CLAIM_WINDOW_DAYS * 1 days)) {
            revert ClaimWindowExpired();
        }

        uint8 rank = 0;

        // Check rank using permanent records
        if (winners.first == msg.sender) {
            rank = 1;
        } else if (winners.second == msg.sender) {
            rank = 2;
        } else if (winners.third == msg.sender) {
            rank = 3;
        }

        if (rank == 0) revert NotInTop3();

        uint256 reward = calculateReward(day, rank);
        if (reward == 0) revert InsufficientPool();
        if (totalPrizePool < reward) revert InsufficientPool();

        dailyRewardsClaimed[day][msg.sender] = true;

        Player storage player = players[msg.sender];
        player.totalEarnings += uint128(reward);
        totalPrizePool -= reward;

        // Transfer cUSD reward to player
        bool success = paymentToken.transfer(msg.sender, reward);
        if (!success) revert TransferFailed();

        emit DailyRewardPaid(msg.sender, rank, reward, day);
    }
    
    // Get player statistics
    function getPlayerStats(address playerAddr) external view returns (
        uint64 gamesPlayed,
        uint64 lastPlayTime,
        uint64 highScore,
        uint128 totalEarnings
    ) {
        Player memory p = players[playerAddr];
        return (p.gamesPlayed, p.lastPlayTime, p.highScore, p.totalEarnings);
    }
    
    // Get daily top 3 with scores (uses temporary data if available, otherwise just addresses)
    function getDailyTop3(uint256 day) external view returns (
        address[3] memory topPlayers,
        uint32[3] memory topScores,
        uint256[3] memory rewards
    ) {
        // Try to get from temporary summary first (has scores)
        DailySummary storage summary = dailySummaries[day];
        // Use a single permanent winners reference to avoid shadowing
        DailyWinners storage winners = dailyWinners[day];

        // Check if we have ANY summary data (finalized or not) - prioritize this for current day
        if (summary.first.score > 0 || summary.second.score > 0 || summary.third.score > 0) {
            topPlayers[0] = summary.first.player;
            topPlayers[1] = summary.second.player;
            topPlayers[2] = summary.third.player;

            topScores[0] = summary.first.score;
            topScores[1] = summary.second.score;
            topScores[2] = summary.third.score;
        } else if (winners.finalized) {
            // Fallback to permanent records (no scores stored, only for old finalized days)
            topPlayers[0] = winners.first;
            topPlayers[1] = winners.second;
            topPlayers[2] = winners.third;
            // Scores will be 0 if summary was cleaned up
        }

        // Calculate rewards using permanent records (only for finalized days)
        if (winners.finalized && winners.totalPlayers >= MIN_PLAYERS_FOR_REWARDS) {
            rewards[0] = calculateReward(day, 1);
            rewards[1] = calculateReward(day, 2);
            rewards[2] = calculateReward(day, 3);
        }

        return (topPlayers, topScores, rewards);
    }
    
    // Get current day's top 3
    function getCurrentTop3() external view returns (
        address[3] memory topPlayers,
        uint32[3] memory topScores,
        uint256[3] memory potentialRewards
    ) {
        return this.getDailyTop3(currentDay);
    }
    
    // Get daily summary info (uses permanent records)
    function getDailySummary(uint256 day) external view returns (
        uint16 totalPlayers,
        uint128 totalCollected,
        bool finalized,
        bool rewardsAvailable
    ) {
        DailyWinners storage winners = dailyWinners[day];
        return (
            winners.totalPlayers, 
            winners.dailyPool, 
            winners.finalized,
            winners.totalPlayers >= MIN_PLAYERS_FOR_REWARDS
        );
    }
    
    // Check if player can claim reward for a specific day (uses permanent records)
    function canClaimReward(address player, uint256 day) external view returns (
        bool canClaim,
        uint256 reward,
        uint8 rank
    ) {
        if (day >= currentDay) return (false, 0, 0);
        if (dailyRewardsClaimed[day][player]) return (false, 0, 0);

        DailyWinners storage winners = dailyWinners[day];
        if (!winners.finalized) return (false, 0, 0);
        if (winners.totalPlayers < MIN_PLAYERS_FOR_REWARDS) return (false, 0, 0);

        // Check if claim window has expired
        if (block.timestamp > winners.finalizedAt + (CLAIM_WINDOW_DAYS * 1 days)) {
            return (false, 0, 0);
        }

        if (winners.first == player) {
            return (true, calculateReward(day, 1), 1);
        } else if (winners.second == player) {
            return (true, calculateReward(day, 2), 2);
        } else if (winners.third == player) {
            return (true, calculateReward(day, 3), 3);
        }

        return (false, 0, 0);
    }
    
    // Batch claim for multiple days (uses permanent records)
    function claimMultipleDays(uint256[] calldata dayIds) external {
        uint256 length = dayIds.length;
        uint256 totalReward = 0;

        for (uint256 i = 0; i < length; ) {
            uint256 day = dayIds[i];

            if (day < currentDay && !dailyRewardsClaimed[day][msg.sender]) {
                DailyWinners storage winners = dailyWinners[day];

                if (winners.finalized && winners.totalPlayers >= MIN_PLAYERS_FOR_REWARDS) {
                    // Check if claim window has NOT expired
                    if (block.timestamp <= winners.finalizedAt + (CLAIM_WINDOW_DAYS * 1 days)) {
                        uint8 rank = 0;

                        if (winners.first == msg.sender) {
                            rank = 1;
                        } else if (winners.second == msg.sender) {
                            rank = 2;
                        } else if (winners.third == msg.sender) {
                            rank = 3;
                        }

                        if (rank > 0) {
                            uint256 reward = calculateReward(day, rank);

                            if (reward > 0 && totalPrizePool >= reward) {
                                dailyRewardsClaimed[day][msg.sender] = true;

                                Player storage player = players[msg.sender];
                                player.totalEarnings += uint128(reward);
                                totalPrizePool -= reward;
                                totalReward += reward;

                                emit DailyRewardPaid(msg.sender, rank, reward, day);
                            }
                        }
                    }
                }
            }

            unchecked {
                ++i;
            }
        }

        // Single transfer for all rewards (gas optimization)
        if (totalReward > 0) {
            bool success = paymentToken.transfer(msg.sender, totalReward);
            if (!success) revert TransferFailed();
        }
    }
    
    // Finalize current day manually
    function finalizeCurrentDay() external {
        if (block.timestamp / 1 days <= currentDay) revert DayNotOver();
        _finalizeDay(currentDay);
        currentDay = block.timestamp / 1 days;
    }

    // Reclaim expired unclaimed rewards and move them to house reserve
    // Only owner can reclaim expired rewards
    function reclaimExpiredRewards(uint256 day) external onlyOwner {
        DailyWinners storage winners = dailyWinners[day];

        if (!winners.finalized) revert DayNotFinalized();
        if (winners.totalPlayers < MIN_PLAYERS_FOR_REWARDS) revert NotEnoughPlayers();
        if (winners.expiredFundsClaimed) revert AlreadyClaimed();

        // Check if claim window has expired
        if (block.timestamp <= winners.finalizedAt + (CLAIM_WINDOW_DAYS * 1 days)) {
            revert ClaimWindowNotExpired();
        }

        winners.expiredFundsClaimed = true;

        // Calculate total unclaimed rewards
        uint256 unclaimedAmount = 0;

        if (!dailyRewardsClaimed[day][winners.first]) {
            unclaimedAmount += calculateReward(day, 1);
        }
        if (!dailyRewardsClaimed[day][winners.second]) {
            unclaimedAmount += calculateReward(day, 2);
        }
        if (!dailyRewardsClaimed[day][winners.third]) {
            unclaimedAmount += calculateReward(day, 3);
        }

        if (unclaimedAmount > 0) {
            // Move unclaimed funds from prize pool to house reserve
            totalPrizePool -= unclaimedAmount;
            houseReserve += unclaimedAmount;

            emit ExpiredFundsReclaimed(day, unclaimedAmount);
        }
    }
    
    // Owner function to add funds (for promotions/bonuses)
    function addToPrizePool(uint256 amount) external onlyOwner {
        bool success = paymentToken.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();
        houseReserve += amount;
        emit ReserveUpdated(houseReserve);
    }
    
    // Owner function to withdraw house reserve
    function withdrawReserve(uint256 amount) external onlyOwner {
        if (amount > houseReserve) revert ExceedsReserve();
        houseReserve -= amount;
        bool success = paymentToken.transfer(owner, amount);
        if (!success) revert TransferFailed();
        emit ReserveUpdated(houseReserve);
    }
    
    // Emergency withdraw function (only for tokens sent by mistake)
    function emergencyWithdrawToken(address token, uint256 amount) external onlyOwner {
        if (token == address(paymentToken)) revert UseWithdrawReserve();
        IERC20(token).transfer(owner, amount);
    }
    
    // Get current day number
    function getCurrentDay() external view returns (uint256) {
        return currentDay;
    }
    
    // Get contract's cUSD balance
    function getContractBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }
    
    // Get payment token address
    function getPaymentToken() external view returns (address) {
        return address(paymentToken);
    }
    
    // Get house reserve amount
    function getHouseReserve() external view returns (uint256) {
        return houseReserve;
    }
    
    // Get permanent winner records for any day (even after cleanup)
    function getDailyWinners(uint256 day) external view returns (
        address first,
        address second,
        address third,
        uint128 dailyPool,
        uint64 finalizedAt,
        uint16 totalPlayers,
        bool finalized,
        bool expiredFundsClaimed
    ) {
        DailyWinners storage winners = dailyWinners[day];
        return (
            winners.first,
            winners.second,
            winners.third,
            winners.dailyPool,
            winners.finalizedAt,
            winners.totalPlayers,
            winners.finalized,
            winners.expiredFundsClaimed
        );
    }

    // Check if a day has expired unclaimed rewards available to reclaim
    function canReclaimExpiredRewards(uint256 day) external view returns (
        bool canReclaim,
        uint256 unclaimedAmount
    ) {
        DailyWinners storage winners = dailyWinners[day];

        if (!winners.finalized) return (false, 0);
        if (winners.totalPlayers < MIN_PLAYERS_FOR_REWARDS) return (false, 0);
        if (winners.expiredFundsClaimed) return (false, 0);

        // Check if claim window has expired
        if (block.timestamp <= winners.finalizedAt + (CLAIM_WINDOW_DAYS * 1 days)) {
            return (false, 0);
        }

        // Calculate total unclaimed rewards
        uint256 totalUnclaimed = 0;

        if (!dailyRewardsClaimed[day][winners.first]) {
            totalUnclaimed += calculateReward(day, 1);
        }
        if (!dailyRewardsClaimed[day][winners.second]) {
            totalUnclaimed += calculateReward(day, 2);
        }
        if (!dailyRewardsClaimed[day][winners.third]) {
            totalUnclaimed += calculateReward(day, 3);
        }

        return (totalUnclaimed > 0, totalUnclaimed);
    }
}