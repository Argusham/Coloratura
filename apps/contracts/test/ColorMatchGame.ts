import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("ColorMatchGame", function () {
  // Constants from the contract
  const ENTRY_FEE = parseEther("0.1");
  const FIRST_PLACE_REWARD = parseEther("1");
  const SECOND_PLACE_REWARD = parseEther("0.5");
  const THIRD_PLACE_REWARD = parseEther("0.25");
  const MAX_SESSION_AGE = 3600; // 1 hour in seconds
  const ONE_DAY_IN_SECS = 86400;

  async function deployColorMatchGameFixture() {
    // Get wallet clients
    const [owner, player1, player2, player3, player4] = await hre.viem.getWalletClients();

    // Deploy the contract
    const game = await hre.viem.deployContract("ColorMatchGame");

    const publicClient = await hre.viem.getPublicClient();

    return {
      game,
      owner,
      player1,
      player2,
      player3,
      player4,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { game, owner } = await loadFixture(deployColorMatchGameFixture);

      expect(await game.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should initialize with sessionCounter at 0", async function () {
      const { game } = await loadFixture(deployColorMatchGameFixture);

      expect(await game.read.sessionCounter()).to.equal(0n);
    });

    it("Should initialize with totalPrizePool at 0", async function () {
      const { game } = await loadFixture(deployColorMatchGameFixture);

      expect(await game.read.totalPrizePool()).to.equal(0n);
    });

    it("Should set currentDay correctly", async function () {
      const { game } = await loadFixture(deployColorMatchGameFixture);

      const currentTimestamp = await time.latest();
      const expectedDay = BigInt(Math.floor(currentTimestamp / ONE_DAY_IN_SECS));

      expect(await game.read.currentDay()).to.equal(expectedDay);
    });

    it("Should initialize oldestTrackedDay equal to currentDay", async function () {
      const { game } = await loadFixture(deployColorMatchGameFixture);

      const currentDay = await game.read.currentDay();
      expect(await game.read.oldestTrackedDay()).to.equal(currentDay);
    });
  });

  describe("Starting a Game", function () {
    it("Should allow a player to start a game with correct entry fee", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await expect(
        gameAsPlayer1.write.startGame({ value: ENTRY_FEE })
      ).to.be.fulfilled;
    });

    it("Should revert if entry fee is incorrect", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await expect(
        gameAsPlayer1.write.startGame({ value: parseEther("0.05") })
      ).to.be.rejectedWith("WrongFee");
    });

    it("Should increment sessionCounter", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      expect(await game.read.sessionCounter()).to.equal(1n);

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      expect(await game.read.sessionCounter()).to.equal(2n);
    });

    it("Should add entry fee to prize pool", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      expect(await game.read.totalPrizePool()).to.equal(ENTRY_FEE);
    });

    it("Should emit GameStarted event", async function () {
      const { game, player1, publicClient } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      const hash = await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await game.getEvents.GameStarted();
      expect(events).to.have.lengthOf(1);
      expect(events[0].args.player).to.equal(getAddress(player1.account.address));
      expect(events[0].args.sessionId).to.equal(1n);
    });

    it("Should create a game session with correct initial values", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });

      const session = await game.read.gameSessions([1n]);
      expect(session[0]).to.equal(getAddress(player1.account.address)); // player
      expect(session[2]).to.equal(0); // score
      expect(session[3]).to.equal(0); // level
      expect(session[4]).to.equal(false); // completed
      expect(session[5]).to.equal(false); // rewarded
    });
  });

  describe("Submitting Scores", function () {
    it("Should allow player to submit score for their session", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await expect(
        gameAsPlayer1.write.submitScore([1n, 100, 5])
      ).to.be.fulfilled;
    });

    it("Should revert if submitting score for someone else's session", async function () {
      const { game, player1, player2 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      const gameAsPlayer2 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player2 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });

      await expect(
        gameAsPlayer2.write.submitScore([1n, 100, 5])
      ).to.be.rejectedWith("NotYourSession");
    });

    it("Should revert if submitting score twice for same session", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 100, 5]);

      await expect(
        gameAsPlayer1.write.submitScore([1n, 200, 10])
      ).to.be.rejectedWith("AlreadySubmitted");
    });

    it("Should revert if session is invalid (doesn't exist)", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      // When session doesn't exist, it reverts with NotYourSession since player is zero address
      await expect(
        gameAsPlayer1.write.submitScore([999n, 100, 5])
      ).to.be.rejectedWith("NotYourSession");
    });

    it("Should revert if session has expired", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });

      // Fast forward time beyond MAX_SESSION_AGE
      await time.increase(MAX_SESSION_AGE + 1);

      await expect(
        gameAsPlayer1.write.submitScore([1n, 100, 5])
      ).to.be.rejectedWith("SessionExpired");
    });

    it("Should update player statistics correctly", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 150, 7]);

      const stats = await game.read.getPlayerStats([player1.account.address]);
      expect(stats[0]).to.equal(1n); // gamesPlayed
      expect(stats[2]).to.equal(150n); // highScore
    });

    it("Should update high score when new score is higher", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 100, 5]);

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([2n, 200, 10]);

      const stats = await game.read.getPlayerStats([player1.account.address]);
      expect(stats[2]).to.equal(200n); // highScore should be updated
    });

    it("Should not update high score when new score is lower", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 200, 10]);

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([2n, 100, 5]);

      const stats = await game.read.getPlayerStats([player1.account.address]);
      expect(stats[2]).to.equal(200n); // highScore should remain 200
    });

    it("Should emit GameCompleted event", async function () {
      const { game, player1, publicClient } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      const hash = await gameAsPlayer1.write.submitScore([1n, 150, 7]);
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await game.getEvents.GameCompleted();
      expect(events).to.have.lengthOf(1);
      expect(events[0].args.player).to.equal(getAddress(player1.account.address));
      expect(events[0].args.sessionId).to.equal(1n);
      expect(events[0].args.score).to.equal(150);
    });

    it("Should emit HighScoreSet event when high score is achieved", async function () {
      const { game, player1, publicClient } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      const hash = await gameAsPlayer1.write.submitScore([1n, 250, 12]);
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await game.getEvents.HighScoreSet();
      expect(events).to.have.lengthOf(1);
      expect(events[0].args.player).to.equal(getAddress(player1.account.address));
      expect(events[0].args.score).to.equal(250);
    });
  });

  describe("Daily Leaderboard", function () {
    it("Should update daily leaderboard with first place", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);

      const currentDay = await game.read.currentDay();
      const [topPlayers, topScores] = await game.read.getDailyTop3([currentDay]);

      expect(topPlayers[0]).to.equal(getAddress(player1.account.address));
      expect(topScores[0]).to.equal(500);
    });

    it("Should correctly order top 3 players", async function () {
      const { game, player1, player2, player3 } = await loadFixture(deployColorMatchGameFixture);

      // Player 1 scores 300
      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 300, 10]);

      // Player 2 scores 500 (should be first)
      const gameAsPlayer2 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player2 } }
      );
      await gameAsPlayer2.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer2.write.submitScore([2n, 500, 15]);

      // Player 3 scores 200
      const gameAsPlayer3 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player3 } }
      );
      await gameAsPlayer3.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer3.write.submitScore([3n, 200, 8]);

      const currentDay = await game.read.currentDay();
      const [topPlayers, topScores] = await game.read.getDailyTop3([currentDay]);

      expect(topPlayers[0]).to.equal(getAddress(player2.account.address));
      expect(topScores[0]).to.equal(500);
      expect(topPlayers[1]).to.equal(getAddress(player1.account.address));
      expect(topScores[1]).to.equal(300);
      expect(topPlayers[2]).to.equal(getAddress(player3.account.address));
      expect(topScores[2]).to.equal(200);
    });

    it("Should only keep player's best score of the day", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      // First game with score 200
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 200, 8]);

      // Second game with score 400 (should replace)
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([2n, 400, 12]);

      // Third game with score 300 (should not replace, 400 is still best)
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([3n, 300, 10]);

      const currentDay = await game.read.currentDay();
      const [topPlayers, topScores] = await game.read.getDailyTop3([currentDay]);

      expect(topPlayers[0]).to.equal(getAddress(player1.account.address));
      expect(topScores[0]).to.equal(400); // Best score should be 400
    });

    it("Should get current top 3 using getCurrentTop3", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 350, 11]);

      const [topPlayers, topScores] = await game.read.getCurrentTop3();

      expect(topPlayers[0]).to.equal(getAddress(player1.account.address));
      expect(topScores[0]).to.equal(350);
    });
  });

  describe("Daily Summary", function () {
    it("Should track total players for the day", async function () {
      const { game, player1, player2 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 300, 10]);

      const gameAsPlayer2 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player2 } }
      );
      await gameAsPlayer2.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer2.write.submitScore([2n, 400, 12]);

      const currentDay = await game.read.currentDay();
      const [totalPlayers, finalized] = await game.read.getDailySummary([currentDay]);

      expect(totalPlayers).to.equal(2);
    });

    it("Should finalize day when new day begins", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 300, 10]);

      const firstDay = await game.read.currentDay();

      // Fast forward to next day
      await time.increase(ONE_DAY_IN_SECS);

      // Submit a new score to trigger day finalization
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([2n, 400, 12]);

      const [, finalized] = await game.read.getDailySummary([firstDay]);
      expect(finalized).to.equal(true);
    });
  });

  describe("Claiming Rewards", function () {
    async function setupRewardsScenario() {
      const { game, owner, player1, player2, player3, player4, publicClient } =
        await loadFixture(deployColorMatchGameFixture);

      // Owner adds funds to prize pool
      await game.write.addToPrizePool({ value: parseEther("10") });

      // Player 1 scores 500 (1st place)
      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);

      // Player 2 scores 400 (2nd place)
      const gameAsPlayer2 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player2 } }
      );
      await gameAsPlayer2.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer2.write.submitScore([2n, 400, 12]);

      // Player 3 scores 300 (3rd place)
      const gameAsPlayer3 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player3 } }
      );
      await gameAsPlayer3.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer3.write.submitScore([3n, 300, 10]);

      // Player 4 scores 200 (not in top 3)
      const gameAsPlayer4 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player4 } }
      );
      await gameAsPlayer4.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer4.write.submitScore([4n, 200, 8]);

      const dayToReward = await game.read.currentDay();

      // Fast forward to next day and finalize
      await time.increase(ONE_DAY_IN_SECS);
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([5n, 100, 5]);

      return {
        game,
        owner,
        player1,
        player2,
        player3,
        player4,
        gameAsPlayer1,
        gameAsPlayer2,
        gameAsPlayer3,
        gameAsPlayer4,
        dayToReward,
        publicClient,
      };
    }

    it("Should allow first place to claim reward", async function () {
      const { game, player1, dayToReward } = await setupRewardsScenario();

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await expect(
        gameAsPlayer1.write.claimDailyReward([dayToReward])
      ).to.be.fulfilled;
    });

    it("Should transfer correct reward amount to first place", async function () {
      const { game, player1, dayToReward, publicClient } = await setupRewardsScenario();

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      const balanceBefore = await publicClient.getBalance({
        address: player1.account.address,
      });

      const hash = await gameAsPlayer1.write.claimDailyReward([dayToReward]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const balanceAfter = await publicClient.getBalance({
        address: player1.account.address,
      });

      // Account for gas costs
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;
      const netChange = balanceAfter - balanceBefore + gasUsed;

      expect(netChange).to.equal(FIRST_PLACE_REWARD);
    });

    it("Should allow second place to claim reward", async function () {
      const { game, player2, dayToReward } = await setupRewardsScenario();

      const gameAsPlayer2 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player2 } }
      );

      await expect(
        gameAsPlayer2.write.claimDailyReward([dayToReward])
      ).to.be.fulfilled;
    });

    it("Should allow third place to claim reward", async function () {
      const { game, player3, dayToReward } = await setupRewardsScenario();

      const gameAsPlayer3 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player3 } }
      );

      await expect(
        gameAsPlayer3.write.claimDailyReward([dayToReward])
      ).to.be.fulfilled;
    });

    it("Should revert if player not in top 3 tries to claim", async function () {
      const { game, player4, dayToReward } = await setupRewardsScenario();

      const gameAsPlayer4 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player4 } }
      );

      await expect(
        gameAsPlayer4.write.claimDailyReward([dayToReward])
      ).to.be.rejectedWith("NotInTop3");
    });

    it("Should revert if trying to claim for current day", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);

      const currentDay = await game.read.currentDay();

      await expect(
        gameAsPlayer1.write.claimDailyReward([currentDay])
      ).to.be.rejectedWith("DayNotFinished");
    });

    it("Should revert if claiming twice", async function () {
      const { game, player1, dayToReward } = await setupRewardsScenario();

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.claimDailyReward([dayToReward]);

      await expect(
        gameAsPlayer1.write.claimDailyReward([dayToReward])
      ).to.be.rejectedWith("AlreadyClaimed");
    });

    it("Should update player total earnings", async function () {
      const { game, player1, dayToReward } = await setupRewardsScenario();

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.claimDailyReward([dayToReward]);

      const stats = await game.read.getPlayerStats([player1.account.address]);
      expect(stats[3]).to.equal(BigInt(FIRST_PLACE_REWARD)); // totalEarnings
    });

    it("Should decrease prize pool after claim", async function () {
      const { game, player1, dayToReward } = await setupRewardsScenario();

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      const poolBefore = await game.read.totalPrizePool();
      await gameAsPlayer1.write.claimDailyReward([dayToReward]);
      const poolAfter = await game.read.totalPrizePool();

      expect(poolBefore - poolAfter).to.equal(FIRST_PLACE_REWARD);
    });

    it("Should emit DailyRewardPaid event", async function () {
      const { game, player1, dayToReward, publicClient } = await setupRewardsScenario();

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      const hash = await gameAsPlayer1.write.claimDailyReward([dayToReward]);
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await game.getEvents.DailyRewardPaid();
      expect(events.length).to.be.greaterThan(0);

      const lastEvent = events[events.length - 1];
      expect(lastEvent.args.player).to.equal(getAddress(player1.account.address));
      expect(lastEvent.args.rank).to.equal(1);
      expect(lastEvent.args.reward).to.equal(FIRST_PLACE_REWARD);
      expect(lastEvent.args.day).to.equal(dayToReward);
    });

    it("Should revert if insufficient prize pool", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      // No funds added to prize pool, only entry fees (0.1 ether < 1 ether reward)
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);

      const dayToReward = await game.read.currentDay();

      // Fast forward to next day
      await time.increase(ONE_DAY_IN_SECS);
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([2n, 100, 5]);

      await expect(
        gameAsPlayer1.write.claimDailyReward([dayToReward])
      ).to.be.rejectedWith("InsufficientPool");
    });
  });

  describe("Batch Claiming Rewards", function () {
    it("Should allow claiming multiple days at once", async function () {
      const { game, owner, player1 } = await loadFixture(deployColorMatchGameFixture);

      // Add funds to prize pool
      await game.write.addToPrizePool({ value: parseEther("20") });

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      const days: bigint[] = [];
      let sessionId = 1n;

      // Play 3 days, winning each day
      for (let i = 0; i < 3; i++) {
        const currentDay = await game.read.currentDay();
        days.push(currentDay);

        await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
        await gameAsPlayer1.write.submitScore([sessionId++, 500, 15]);

        // Move to next day
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
        await gameAsPlayer1.write.submitScore([sessionId++, 100, 5]);
      }

      // Claim all three days at once
      await expect(
        gameAsPlayer1.write.claimMultipleDays([days])
      ).to.be.fulfilled;

      // Verify all are claimed
      for (const day of days) {
        const claimed = await game.read.dailyRewardsClaimed([day, player1.account.address]);
        expect(claimed).to.equal(true);
      }
    });
  });

  describe("CanClaimReward View Function", function () {
    it("Should correctly identify if player can claim reward", async function () {
      const { game, owner, player1, player2 } = await loadFixture(deployColorMatchGameFixture);

      // Add funds
      await game.write.addToPrizePool({ value: parseEther("10") });

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);

      const dayToCheck = await game.read.currentDay();

      // Fast forward to next day
      await time.increase(ONE_DAY_IN_SECS);
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([2n, 100, 5]);

      const [canClaim, reward, rank] = await game.read.canClaimReward([
        player1.account.address,
        dayToCheck,
      ]);

      expect(canClaim).to.equal(true);
      expect(reward).to.equal(FIRST_PLACE_REWARD);
      expect(rank).to.equal(1);
    });

    it("Should return false for player not in top 3", async function () {
      const { game, owner, player1, player2 } = await loadFixture(deployColorMatchGameFixture);

      await game.write.addToPrizePool({ value: parseEther("10") });

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);

      const dayToCheck = await game.read.currentDay();

      // Fast forward
      await time.increase(ONE_DAY_IN_SECS);
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([2n, 100, 5]);

      const [canClaim, reward, rank] = await game.read.canClaimReward([
        player2.account.address,
        dayToCheck,
      ]);

      expect(canClaim).to.equal(false);
      expect(reward).to.equal(0n);
      expect(rank).to.equal(0);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to add to prize pool", async function () {
      const { game } = await loadFixture(deployColorMatchGameFixture);

      const poolBefore = await game.read.totalPrizePool();
      await game.write.addToPrizePool({ value: parseEther("5") });
      const poolAfter = await game.read.totalPrizePool();

      expect(poolAfter - poolBefore).to.equal(parseEther("5"));
    });

    it("Should emit PrizePoolUpdated event when adding funds", async function () {
      const { game, publicClient } = await loadFixture(deployColorMatchGameFixture);

      const hash = await game.write.addToPrizePool({ value: parseEther("5") });
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await game.getEvents.PrizePoolUpdated();
      expect(events).to.have.lengthOf(1);
      expect(events[0].args.newTotal).to.equal(parseEther("5"));
    });

    it("Should revert if non-owner tries to add to prize pool", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await expect(
        gameAsPlayer1.write.addToPrizePool({ value: parseEther("5") })
      ).to.be.rejectedWith("OnlyOwner");
    });

    it("Should allow owner to withdraw excess funds", async function () {
      const { game } = await loadFixture(deployColorMatchGameFixture);

      await game.write.addToPrizePool({ value: parseEther("10") });

      await expect(
        game.write.withdrawExcess([parseEther("5")])
      ).to.be.fulfilled;

      expect(await game.read.totalPrizePool()).to.equal(parseEther("5"));
    });

    it("Should revert if trying to withdraw more than pool", async function () {
      const { game } = await loadFixture(deployColorMatchGameFixture);

      await game.write.addToPrizePool({ value: parseEther("5") });

      await expect(
        game.write.withdrawExcess([parseEther("10")])
      ).to.be.rejectedWith("ExceedsPool");
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      await game.write.addToPrizePool({ value: parseEther("5") });

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await expect(
        gameAsPlayer1.write.withdrawExcess([parseEther("1")])
      ).to.be.rejectedWith("OnlyOwner");
    });

    it("Should allow owner to cleanup old days", async function () {
      const { game, owner, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      // Create some game data
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);

      const oldDay = await game.read.currentDay();

      // Fast forward many days
      await time.increase(ONE_DAY_IN_SECS * 35);

      // Trigger a game to update the contract's currentDay
      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([2n, 100, 5]);

      // Now cleanup should work
      await game.write.cleanupOldDays([oldDay, oldDay]);

      // Verify the day was cleaned up by checking the summary is empty
      const [totalPlayers, finalized] = await game.read.getDailySummary([oldDay]);
      expect(totalPlayers).to.equal(0);
    });

    it("Should revert if trying to cleanup current day", async function () {
      const { game } = await loadFixture(deployColorMatchGameFixture);

      const currentDay = await game.read.currentDay();

      await expect(
        game.write.cleanupOldDays([currentDay, currentDay])
      ).to.be.rejectedWith("CantCleanupCurrentDay");
    });

    it("Should revert if cleanup range is invalid", async function () {
      const { game } = await loadFixture(deployColorMatchGameFixture);

      await expect(
        game.write.cleanupOldDays([10n, 5n])
      ).to.be.rejectedWith("InvalidRange");
    });

    it("Should revert if cleanup range exceeds 10 days", async function () {
      const { game } = await loadFixture(deployColorMatchGameFixture);

      await expect(
        game.write.cleanupOldDays([0n, 11n])
      ).to.be.rejectedWith("MaxTenDaysPerCall");
    });
  });

  describe("Manual Day Finalization", function () {
    it("Should allow manual finalization when day is over", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);

      // Fast forward to next day
      await time.increase(ONE_DAY_IN_SECS);

      await expect(game.write.finalizeCurrentDay()).to.be.fulfilled;
    });

    it("Should revert if day is not over", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);

      await expect(game.write.finalizeCurrentDay()).to.be.rejectedWith("DayNotOver");
    });
  });

  describe("Session Management", function () {
    it("Should return correct session information", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
      await gameAsPlayer1.write.submitScore([1n, 450, 14]);

      const [player, score, level, completed] = await game.read.getSessionScore([1n]);

      expect(player).to.equal(getAddress(player1.account.address));
      expect(score).to.equal(450);
      expect(level).to.equal(14);
      expect(completed).to.equal(true);
    });
  });

  describe("Edge Cases and Gas Optimization", function () {
    it("Should handle multiple games from same player efficiently", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      // Play 10 games
      for (let i = 0; i < 10; i++) {
        await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });
        await gameAsPlayer1.write.submitScore([BigInt(i + 1), 100 + i, 5]);
      }

      const stats = await game.read.getPlayerStats([player1.account.address]);
      expect(stats[0]).to.equal(10n); // gamesPlayed
    });

    it("Should handle zero scores", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });

      await expect(
        gameAsPlayer1.write.submitScore([1n, 0, 1])
      ).to.be.fulfilled;
    });

    it("Should handle maximum score values", async function () {
      const { game, player1 } = await loadFixture(deployColorMatchGameFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt(
        "ColorMatchGame",
        game.address,
        { client: { wallet: player1 } }
      );

      await gameAsPlayer1.write.startGame({ value: ENTRY_FEE });

      // uint32 max value
      const maxScore = 4294967295;
      await expect(
        gameAsPlayer1.write.submitScore([1n, maxScore, 100])
      ).to.be.fulfilled;
    });
  });
});
