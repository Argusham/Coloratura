// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract ColorMatchGame {
    
    // ============================================
    // CONSTANTS
    // ============================================
    
    uint256 public constant ENTRY_FEE = 100000000000000000; // 0.1 cUSD (18 decimals)
    uint256 public constant MAX_SESSION_AGE = 1 hours;
    uint256 public constant LEADERBOARD_RETENTION_DAYS = 30;
    uint256 public constant CLAIM_WINDOW_DAYS = 7;
    uint256 public constant MAX_SCORE = 10_000_000;
    uint256 public constant CLEANUP_BATCH_SIZE = 5;
    uint256 public constant MAX_CLEANUP_DAYS_PER_CALL = 10;
    
    // Percentage distribution (basis points: 10000 = 100%)
    uint256 public constant FIRST_PLACE_PERCENTAGE = 3000;   // 30%
    uint256 public constant SECOND_PLACE_PERCENTAGE = 2500;  // 25%
    uint256 public constant THIRD_PLACE_PERCENTAGE = 1500;   // 15%
    
    uint256 public constant MIN_PLAYERS_FOR_REWARDS = 3;
    
    // cUSD Token on Celo Mainnet: 0x765DE816845861e75A25fCA122bb6898B8B1282a
    // cUSD Token on Celo Alfajores Testnet: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
    IERC20 public immutable paymentToken;
    
    // ============================================
    // STRUCTS
    // ============================================
    
    struct Player {
        uint64 gamesPlayed;
        uint64 lastPlayTime;
        uint64 highScore;
        uint128 totalEarnings;
    }
    
    struct GameSession {
        address player;
        uint64 timestamp;
        uint32 score;
        uint16 level;
        bool completed;
        bool rewarded;
    }
    
    struct LeaderboardEntry {
        address player;
        uint32 score;
        uint32 sessionId;
    }
    
    struct DailyWinners {
        address first;
        address second;
        address third;
        uint128 dailyPool;
        uint64 finalizedAt;
        uint16 totalPlayers;
        bool finalized;
        bool expiredFundsClaimed;
    }
    
    struct DailySummary {
        LeaderboardEntry first;
        LeaderboardEntry second;
        LeaderboardEntry third;
        uint128 totalCollected;
        uint16 totalPlayers;
        bool finalized;
    }
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    mapping(address => Player) public players;
    mapping(uint256 => GameSession) public gameSessions;
    uint256 public sessionCounter;
    uint256 public totalPrizePool;
    uint256 public houseReserve;
    address public owner;
    
    // Pause state
    bool public paused;
    
    // Reentrancy guard
    uint256 private _reentrancyStatus;
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    
    // Daily tracking
    mapping(uint256 => DailyWinners) public dailyWinners;
    mapping(uint256 => DailySummary) internal dailySummaries;
    mapping(uint256 => mapping(address => bool)) public dailyRewardsClaimed;
    mapping(uint256 => mapping(address => uint32)) internal dailyBestScores;
    mapping(uint256 => mapping(address => bool)) internal dailyPlayerParticipated;
    uint256 public currentDay;
    uint256 public oldestTrackedDay;
    
    // ============================================
    // ERRORS
    // ============================================
    
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
    error ContractPaused();
    error ContractNotPaused();
    error ReentrancyGuard();
    error AlreadyFinalized();
    
    // ============================================
    // EVENTS
    // ============================================
    
    // Existing events
    event GameStarted(address indexed player, uint256 sessionId, uint256 day);
    event GameCompleted(address indexed player, uint256 sessionId, uint32 score, uint16 level);
    event DailyRewardPaid(address indexed player, uint8 rank, uint256 reward, uint256 day);
    event DayFinalized(uint256 indexed day, uint256 totalCollected, uint16 totalPlayers);
    event ReserveUpdated(uint256 newReserve);
    event ExpiredFundsReclaimed(uint256 indexed day, uint256 amount);
    
    // New events for The Graph indexing
    event LeaderboardUpdated(uint256 indexed day, address indexed player, uint32 score, uint8 rank);
    event DailyWinnersSet(
        uint256 indexed day, 
        address first, 
        address second, 
        address third,
        uint256 firstPrize,
        uint256 secondPrize,
        uint256 thirdPrize
    );
    event PlayerStatsUpdated(address indexed player, uint64 gamesPlayed, uint64 highScore);
    event HighScoreSet(address indexed player, uint32 score);
    
    // Pause events
    event Paused(address account);
    event Unpaused(address account);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }
    
    modifier whenPaused() {
        if (!paused) revert ContractNotPaused();
        _;
    }
    
    modifier nonReentrant() {
        if (_reentrancyStatus == ENTERED) revert ReentrancyGuard();
        _reentrancyStatus = ENTERED;
        _;
        _reentrancyStatus = NOT_ENTERED;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(address _paymentToken) {
        if (_paymentToken == address(0)) revert InvalidTokenAddress();
        owner = msg.sender;
        paymentToken = IERC20(_paymentToken);
        currentDay = block.timestamp / 1 days;
        oldestTrackedDay = currentDay;
        _reentrancyStatus = NOT_ENTERED;
    }
    
    // ============================================
    // GAME FUNCTIONS
    // ============================================
    
    function startGame() external whenNotPaused returns (uint256) {
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
        
        DailySummary storage summary = dailySummaries[day];
        summary.totalCollected += uint128(ENTRY_FEE);
        
        totalPrizePool += ENTRY_FEE;
        
        emit GameStarted(msg.sender, sessionCounter, day);
        return sessionCounter;
    }
    
    function submitScore(uint256 sessionId, uint32 score, uint16 level) external whenNotPaused {
        GameSession storage session = gameSessions[sessionId];

        if (session.player != msg.sender) revert NotYourSession();
        if (session.completed) revert AlreadySubmitted();
        if (session.timestamp == 0) revert InvalidSession();
        if (block.timestamp > session.timestamp + MAX_SESSION_AGE) revert SessionExpired();
        if (score > MAX_SCORE) revert InvalidScore();
        
        session.score = score;
        session.level = level;
        session.completed = true;
        
        uint256 day = block.timestamp / 1 days;
        if (day != currentDay) {
            _finalizeDay(currentDay);
            currentDay = day;
            _cleanupOldData();
        }
        
        Player storage player = players[msg.sender];
        unchecked {
            ++player.gamesPlayed;
        }
        player.lastPlayTime = uint64(block.timestamp);
        
        if (score > player.highScore) {
            player.highScore = uint64(score);
            emit HighScoreSet(msg.sender, score);
        }
        
        // Emit player stats update for The Graph
        emit PlayerStatsUpdated(msg.sender, player.gamesPlayed, player.highScore);
        
        uint32 currentBest = dailyBestScores[day][msg.sender];
        if (score > currentBest) {
            dailyBestScores[day][msg.sender] = score;
            _updateDailySummary(day, msg.sender, score, uint32(sessionId));
        }
        
        emit GameCompleted(msg.sender, sessionId, score, level);
    }
    
    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================
    
    function _updateDailySummary(uint256 day, address player, uint32 score, uint32 sessionId) internal {
        DailySummary storage summary = dailySummaries[day];

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

        if (score > summary.first.score) {
            summary.third = summary.second;
            summary.second = summary.first;
            summary.first = newEntry;
            emit LeaderboardUpdated(day, player, score, 1);
        } else if (score > summary.second.score) {
            summary.third = summary.second;
            summary.second = newEntry;
            emit LeaderboardUpdated(day, player, score, 2);
        } else if (score > summary.third.score) {
            summary.third = newEntry;
            emit LeaderboardUpdated(day, player, score, 3);
        }
    }
    
    function _finalizeDay(uint256 day) internal {
        DailySummary storage summary = dailySummaries[day];
        if (summary.finalized) return;
        
        summary.finalized = true;

        DailyWinners storage winners = dailyWinners[day];
        winners.dailyPool = summary.totalCollected;
        winners.totalPlayers = summary.totalPlayers;
        winners.finalized = true;
        winners.finalizedAt = uint64(block.timestamp);

        if (summary.totalPlayers >= MIN_PLAYERS_FOR_REWARDS) {
            winners.first = summary.first.player;
            winners.second = summary.second.player;
            winners.third = summary.third.player;

            uint256 dailyPool = summary.totalCollected;
            uint256 firstPrize = (dailyPool * FIRST_PLACE_PERCENTAGE) / 10000;
            uint256 secondPrize = (dailyPool * SECOND_PLACE_PERCENTAGE) / 10000;
            uint256 thirdPrize = (dailyPool * THIRD_PLACE_PERCENTAGE) / 10000;
            uint256 distributed = firstPrize + secondPrize + thirdPrize;
            uint256 reserve = dailyPool - distributed;
            houseReserve += reserve;
            
            emit DailyWinnersSet(
                day,
                winners.first,
                winners.second,
                winners.third,
                firstPrize,
                secondPrize,
                thirdPrize
            );
        } else {
            houseReserve += summary.totalCollected;
        }

        emit DayFinalized(day, summary.totalCollected, summary.totalPlayers);
    }
    
    function _cleanupOldData() internal {
        uint256 cutoffDay = currentDay > LEADERBOARD_RETENTION_DAYS 
            ? currentDay - LEADERBOARD_RETENTION_DAYS 
            : 0;
        
        if (oldestTrackedDay < cutoffDay) {
            uint256 end = cutoffDay < oldestTrackedDay + CLEANUP_BATCH_SIZE 
                ? cutoffDay 
                : oldestTrackedDay + CLEANUP_BATCH_SIZE;
            for (uint256 i = oldestTrackedDay; i < end; ) {
                delete dailySummaries[i];
                unchecked {
                    ++i;
                }
            }
            oldestTrackedDay = cutoffDay;
        }
    }
    
    // ============================================
    // DAY FINALIZATION (Public)
    // ============================================
    
    function finalizeDay(uint256 day) external {
        if (day >= block.timestamp / 1 days) revert DayNotOver();
        if (dailyWinners[day].finalized) revert AlreadyFinalized();
        
        _finalizeDay(day);
        
        uint256 actualCurrentDay = block.timestamp / 1 days;
        if (currentDay < actualCurrentDay) {
            currentDay = actualCurrentDay;
        }
    }
    
    function finalizeDays(uint256[] calldata dayIds) external {
        uint256 actualCurrentDay = block.timestamp / 1 days;
        uint256 length = dayIds.length;
        
        for (uint256 i = 0; i < length;) {
            uint256 day = dayIds[i];
            
            if (day < actualCurrentDay && !dailyWinners[day].finalized) {
                _finalizeDay(day);
            }
            
            unchecked { ++i; }
        }
        
        if (currentDay < actualCurrentDay) {
            currentDay = actualCurrentDay;
        }
    }
    
    // ============================================
    // REWARD FUNCTIONS
    // ============================================
    
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
    
    function claimDailyReward(uint256 day) external nonReentrant {
        if (day >= currentDay) revert DayNotFinished();
        if (dailyRewardsClaimed[day][msg.sender]) revert AlreadyClaimed();

        DailyWinners storage winners = dailyWinners[day];
        if (!winners.finalized) revert DayNotFinalized();
        if (winners.totalPlayers < MIN_PLAYERS_FOR_REWARDS) revert NotEnoughPlayers();

        if (block.timestamp > winners.finalizedAt + (CLAIM_WINDOW_DAYS * 1 days)) {
            revert ClaimWindowExpired();
        }

        uint8 rank = 0;

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

        bool success = paymentToken.transfer(msg.sender, reward);
        if (!success) revert TransferFailed();

        emit DailyRewardPaid(msg.sender, rank, reward, day);
    }
    
    function claimMultipleDays(uint256[] calldata dayIds) external nonReentrant {
        uint256 length = dayIds.length;
        uint256 totalReward = 0;
        address sender = msg.sender;
        uint256 currentTimestamp = block.timestamp;

        for (uint256 i = 0; i < length; ) {
            uint256 day = dayIds[i];

            if (day < currentDay && !dailyRewardsClaimed[day][sender]) {
                DailyWinners storage winners = dailyWinners[day];

                if (winners.finalized && winners.totalPlayers >= MIN_PLAYERS_FOR_REWARDS) {
                    if (currentTimestamp <= winners.finalizedAt + (CLAIM_WINDOW_DAYS * 1 days)) {
                        uint8 rank = 0;

                        if (winners.first == sender) {
                            rank = 1;
                        } else if (winners.second == sender) {
                            rank = 2;
                        } else if (winners.third == sender) {
                            rank = 3;
                        }

                        if (rank > 0) {
                            uint256 reward = calculateReward(day, rank);

                            if (reward > 0 && totalPrizePool >= reward) {
                                dailyRewardsClaimed[day][sender] = true;

                                Player storage player = players[sender];
                                player.totalEarnings += uint128(reward);
                                totalPrizePool -= reward;
                                totalReward += reward;

                                emit DailyRewardPaid(sender, rank, reward, day);
                            }
                        }
                    }
                }
            }

            unchecked {
                ++i;
            }
        }

        if (totalReward > 0) {
            bool success = paymentToken.transfer(sender, totalReward);
            if (!success) revert TransferFailed();
        }
    }
    
    // ============================================
    // OWNER FUNCTIONS
    // ============================================
    
    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    function cleanupOldDays(uint256 startDay, uint256 endDay) external onlyOwner {
        if (endDay >= currentDay) revert CantCleanupCurrentDay();
        if (endDay < startDay) revert InvalidRange();
        if (endDay - startDay > MAX_CLEANUP_DAYS_PER_CALL) revert MaxTenDaysPerCall();
        for (uint256 i = startDay; i <= endDay; ) {
            delete dailySummaries[i];
            unchecked {
                ++i;
            }
        }
    }
    
    function reclaimExpiredRewards(uint256 day) external onlyOwner {
        DailyWinners storage winners = dailyWinners[day];

        if (!winners.finalized) revert DayNotFinalized();
        if (winners.totalPlayers < MIN_PLAYERS_FOR_REWARDS) revert NotEnoughPlayers();
        if (winners.expiredFundsClaimed) revert AlreadyClaimed();

        if (block.timestamp <= winners.finalizedAt + (CLAIM_WINDOW_DAYS * 1 days)) {
            revert ClaimWindowNotExpired();
        }

        winners.expiredFundsClaimed = true;

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
            totalPrizePool -= unclaimedAmount;
            houseReserve += unclaimedAmount;

            emit ExpiredFundsReclaimed(day, unclaimedAmount);
        }
    }
    
    function addToPrizePool(uint256 amount) external onlyOwner {
        bool success = paymentToken.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();
        houseReserve += amount;
        emit ReserveUpdated(houseReserve);
    }
    
    function withdrawReserve(uint256 amount) external onlyOwner nonReentrant {
        if (amount > houseReserve) revert ExceedsReserve();
        houseReserve -= amount;
        bool success = paymentToken.transfer(owner, amount);
        if (!success) revert TransferFailed();
        emit ReserveUpdated(houseReserve);
    }
    
    function emergencyWithdrawToken(address token, uint256 amount) external onlyOwner {
        if (token == address(paymentToken)) revert UseWithdrawReserve();
        IERC20(token).transfer(owner, amount);
    }
}
