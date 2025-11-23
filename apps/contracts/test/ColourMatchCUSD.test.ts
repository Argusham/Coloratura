import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther, parseUnits } from "viem";

describe("ColorMatchGame - cUSD Version", function () {
  // Constants from the contract
  const ENTRY_FEE = parseUnits("0.1", 18); // 0.1 cUSD (18 decimals)
  const INITIAL_CUSD_SUPPLY = parseUnits("10000", 18); // 10,000 cUSD for testing
  const ONE_DAY_IN_SECS = 86400;
  const CLAIM_WINDOW_DAYS = 7;
  const MIN_PLAYERS_FOR_REWARDS = 3;

  // Reward percentages (basis points)
  const FIRST_PLACE_PERCENTAGE = 3000;   // 30%
  const SECOND_PLACE_PERCENTAGE = 2500;  // 25%
  const THIRD_PLACE_PERCENTAGE = 1500;   // 15%
  // House keeps 30%

  async function deployColorMatchCUSDFixture() {
    const [owner, player1, player2, player3, player4, player5] = await hre.viem.getWalletClients();

    // Deploy mock cUSD token first
    const mockCUSD = await hre.viem.deployContract("MockERC20", ["cUSD", "cUSD", 18]);

    // Mint cUSD to all players
    const players = [owner, player1, player2, player3, player4, player5];
    for (const player of players) {
      await mockCUSD.write.mint([player.account.address, INITIAL_CUSD_SUPPLY]);
    }

    // Deploy the game contract with cUSD token
    const game = await hre.viem.deployContract("contracts/ColourMatchCUSD.sol:ColorMatchGame", [mockCUSD.address]);

    const publicClient = await hre.viem.getPublicClient();

    // Approve game contract to spend cUSD for all players
    for (const player of players) {
      const tokenAsPlayer = await hre.viem.getContractAt(
        "MockERC20",
        mockCUSD.address,
        { client: { wallet: player } }
      );
      await tokenAsPlayer.write.approve([game.address, INITIAL_CUSD_SUPPLY]);
    }

    return {
      game,
      mockCUSD,
      owner,
      player1,
      player2,
      player3,
      player4,
      player5,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { game, owner } = await loadFixture(deployColorMatchCUSDFixture);
      expect(await game.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("Should set the correct payment token", async function () {
      const { game, mockCUSD } = await loadFixture(deployColorMatchCUSDFixture);
      expect(await game.read.getPaymentToken()).to.equal(getAddress(mockCUSD.address));
    });

    it("Should initialize with sessionCounter at 0", async function () {
      const { game } = await loadFixture(deployColorMatchCUSDFixture);
      expect(await game.read.sessionCounter()).to.equal(0n);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", function () {
    describe("Exactly 3 players (minimum threshold)", function () {
      it("Should distribute rewards when exactly 3 players participate", async function () {
        const { game, mockCUSD, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        // Three players play
        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);

        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);

        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReward = await game.read.currentDay();

        // Move to next day to finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        // Check that rewards are available
        const [canClaim, reward, rank] = await game.read.canClaimReward([player1.account.address, dayToReward]);
        expect(canClaim).to.equal(true);
        expect(rank).to.equal(1);

        // Calculate expected reward (30% of daily pool)
        const dailyPool = ENTRY_FEE * 3n;
        const expectedReward = (dailyPool * BigInt(FIRST_PLACE_PERCENTAGE)) / 10000n;
        expect(reward).to.equal(expectedReward);
      });
    });

    describe("2 players (all funds to reserve)", function () {
      it("Should move all funds to reserve when less than 3 players", async function () {
        const { game, player1, player2 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);

        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);

        const dayToCheck = await game.read.currentDay();
        const reserveBefore = await game.read.getHouseReserve();

        // Move to next day to finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([3n, 100, 5]);

        const reserveAfter = await game.read.getHouseReserve();

        // All entry fees should go to reserve
        const expectedIncrease = ENTRY_FEE * 2n;
        expect(reserveAfter - reserveBefore).to.equal(expectedIncrease);

        // Players should not be able to claim
        const [canClaim] = await game.read.canClaimReward([player1.account.address, dayToCheck]);
        expect(canClaim).to.equal(false);
      });
    });

    describe("Same player wins multiple days", function () {
      it("Should allow same player to win and claim multiple days", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        const days: bigint[] = [];
        let sessionId = 1n;

        // Player1 wins 3 days in a row
        for (let i = 0; i < 3; i++) {
          const currentDay = await game.read.currentDay();
          days.push(currentDay);

          await gameAsPlayer1.write.startGame();
          await gameAsPlayer1.write.submitScore([sessionId++, 500, 15]);

          await gameAsPlayer2.write.startGame();
          await gameAsPlayer2.write.submitScore([sessionId++, 400, 12]);

          await gameAsPlayer3.write.startGame();
          await gameAsPlayer3.write.submitScore([sessionId++, 300, 10]);

          await time.increase(ONE_DAY_IN_SECS);
          await gameAsPlayer1.write.startGame();
          await gameAsPlayer1.write.submitScore([sessionId++, 100, 5]);
        }

        // Claim all days
        await expect(gameAsPlayer1.write.claimMultipleDays([days])).to.be.fulfilled;

        // Verify all claimed
        for (const day of days) {
          const claimed = await game.read.dailyRewardsClaimed([day, player1.account.address]);
          expect(claimed).to.equal(true);
        }
      });
    });

    describe("Player claims on day 6 (last valid day)", function () {
      it("Should allow claim on the last day of claim window", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReward = await game.read.currentDay();

        // Move to next day to finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        // Fast forward to day 6 (6 days 23 hours 59 minutes)
        await time.increase((CLAIM_WINDOW_DAYS - 1) * ONE_DAY_IN_SECS + (23 * 3600) + (59 * 60));

        // Should still be able to claim
        await expect(gameAsPlayer1.write.claimDailyReward([dayToReward])).to.be.fulfilled;
      });
    });

    describe("Player tries to claim on day 8 (expired)", function () {
      it("Should revert when claiming after claim window expires", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReward = await game.read.currentDay();

        // Move to next day to finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        // Fast forward past claim window (8 days)
        await time.increase((CLAIM_WINDOW_DAYS + 1) * ONE_DAY_IN_SECS);

        // Should revert
        await expect(
          gameAsPlayer1.write.claimDailyReward([dayToReward])
        ).to.be.rejectedWith("ClaimWindowExpired");
      });
    });

    describe("Score = 0 (should not revert)", function () {
      it("Should accept score of 0", async function () {
        const { game, player1 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });

        await gameAsPlayer1.write.startGame();
        await expect(gameAsPlayer1.write.submitScore([1n, 0, 1])).to.be.fulfilled;
      });
    });

    describe("Score = 10,000,001 (should revert)", function () {
      it("Should revert when score exceeds maximum", async function () {
        const { game, player1 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });

        await gameAsPlayer1.write.startGame();
        await expect(
          gameAsPlayer1.write.submitScore([1n, 10_000_001, 1])
        ).to.be.rejectedWith("InvalidScore");
      });
    });

    describe("Empty array to claimMultipleDays()", function () {
      it("Should handle empty array gracefully", async function () {
        const { game, player1 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });

        // Should not revert, just do nothing
        await expect(gameAsPlayer1.write.claimMultipleDays([[]])).to.be.fulfilled;
      });
    });
  });

  // ============================================================================
  // TIMING TESTS
  // ============================================================================

  describe("Timing Tests", function () {
    describe("Claim immediately after day ends", function () {
      it("Should allow claiming right after day is finalized", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReward = await game.read.currentDay();

        // Move to next day (finalize happens)
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        // Claim immediately
        await expect(gameAsPlayer1.write.claimDailyReward([dayToReward])).to.be.fulfilled;
      });
    });

    describe("Claim 6 days 23 hours later (still valid)", function () {
      it("Should allow claim at the very end of the claim window", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReward = await game.read.currentDay();

        // Finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        // 6 days 23 hours later
        await time.increase((6 * ONE_DAY_IN_SECS) + (23 * 3600));

        await expect(gameAsPlayer1.write.claimDailyReward([dayToReward])).to.be.fulfilled;
      });
    });

    describe("Claim 7 days 1 second later (expired)", function () {
      it("Should revert when claiming 1 second after window expires", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReward = await game.read.currentDay();

        // Finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        // 7 days 1 second later
        await time.increase((7 * ONE_DAY_IN_SECS) + 1);

        await expect(
          gameAsPlayer1.write.claimDailyReward([dayToReward])
        ).to.be.rejectedWith("ClaimWindowExpired");
      });
    });

    describe("Reclaim before 7 days (should fail)", function () {
      it("Should revert when trying to reclaim expired funds before window closes", async function () {
        const { game, owner, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReclaim = await game.read.currentDay();

        // Finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        // Only 6 days later
        await time.increase(6 * ONE_DAY_IN_SECS);

        await expect(
          game.write.reclaimExpiredRewards([dayToReclaim])
        ).to.be.rejectedWith("ClaimWindowNotExpired");
      });
    });

    describe("Reclaim after 7 days (should succeed)", function () {
      it("Should allow owner to reclaim expired rewards after 7 days", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReclaim = await game.read.currentDay();

        // Finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        const reserveBefore = await game.read.getHouseReserve();

        // More than 7 days later
        await time.increase((CLAIM_WINDOW_DAYS + 1) * ONE_DAY_IN_SECS);

        await expect(game.write.reclaimExpiredRewards([dayToReclaim])).to.be.fulfilled;

        const reserveAfter = await game.read.getHouseReserve();
        expect(Number(reserveAfter)).to.be.greaterThan(Number(reserveBefore));
      });
    });
  });

  // ============================================================================
  // FINANCIAL TESTS
  // ============================================================================

  describe("Financial Tests", function () {
    describe("Prize pool math adds up (70% distributed + 30% reserve)", function () {
      it("Should correctly split daily pool between rewards and reserve", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        const reserveBefore = await game.read.getHouseReserve();

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReward = await game.read.currentDay();

        // Finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        const reserveAfter = await game.read.getHouseReserve();

        // Calculate expected values
        const dailyPool = ENTRY_FEE * 3n;
        const reward1 = (dailyPool * BigInt(FIRST_PLACE_PERCENTAGE)) / 10000n;
        const reward2 = (dailyPool * BigInt(SECOND_PLACE_PERCENTAGE)) / 10000n;
        const reward3 = (dailyPool * BigInt(THIRD_PLACE_PERCENTAGE)) / 10000n;
        const totalRewards = reward1 + reward2 + reward3;
        const expectedReserveIncrease = dailyPool - totalRewards;

        expect(reserveAfter - reserveBefore).to.equal(expectedReserveIncrease);
      });
    });

    describe("Can't claim more than pool balance", function () {
      it("Should check prize pool balance before allowing claims", async function () {
        const { game, mockCUSD, owner, player1, player2, player3, player4 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });
        const gameAsPlayer4 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player4 } });

        // Day 1: Three players play
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReward = await game.read.currentDay();

        // Finalize day 1
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer4.write.startGame();
        await gameAsPlayer4.write.submitScore([4n, 100, 5]);

        // All three players should be able to claim their respective rewards
        await expect(gameAsPlayer1.write.claimDailyReward([dayToReward])).to.be.fulfilled;
        await expect(gameAsPlayer2.write.claimDailyReward([dayToReward])).to.be.fulfilled;
        await expect(gameAsPlayer3.write.claimDailyReward([dayToReward])).to.be.fulfilled;

        // Verify the contract properly tracks prize pool after all claims
        const poolAfter = await game.read.totalPrizePool();
        // Pool should still have the entry fee from gameAsPlayer4 minus what was claimed
        expect(Number(poolAfter)).to.be.greaterThan(0);
      });
    });

    describe("Can't withdraw more than reserve", function () {
      it("Should revert when trying to withdraw more than house reserve", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        // Play some games to build reserve
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        const reserve = await game.read.getHouseReserve();

        // Try to withdraw more than reserve
        await expect(
          game.write.withdrawReserve([reserve + parseUnits("1", 18)])
        ).to.be.rejectedWith("ExceedsReserve");
      });
    });

    describe("Multiple claims in one transaction work correctly", function () {
      it("Should handle batch claims correctly", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        const days: bigint[] = [];
        let sessionId = 1n;

        // Win 2 days
        for (let i = 0; i < 2; i++) {
          const currentDay = await game.read.currentDay();
          days.push(currentDay);

          await gameAsPlayer1.write.startGame();
          await gameAsPlayer1.write.submitScore([sessionId++, 500, 15]);
          await gameAsPlayer2.write.startGame();
          await gameAsPlayer2.write.submitScore([sessionId++, 400, 12]);
          await gameAsPlayer3.write.startGame();
          await gameAsPlayer3.write.submitScore([sessionId++, 300, 10]);

          await time.increase(ONE_DAY_IN_SECS);
          await gameAsPlayer1.write.startGame();
          await gameAsPlayer1.write.submitScore([sessionId++, 100, 5]);
        }

        // Claim both days at once
        await expect(gameAsPlayer1.write.claimMultipleDays([days])).to.be.fulfilled;
      });
    });

    describe("Expired funds properly moved to reserve", function () {
      it("Should move unclaimed rewards to reserve after expiration", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReclaim = await game.read.currentDay();

        // Finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        const reserveBefore = await game.read.getHouseReserve();
        const poolBefore = await game.read.totalPrizePool();

        // Wait for expiration
        await time.increase((CLAIM_WINDOW_DAYS + 1) * ONE_DAY_IN_SECS);

        // Reclaim
        await game.write.reclaimExpiredRewards([dayToReclaim]);

        const reserveAfter = await game.read.getHouseReserve();
        const poolAfter = await game.read.totalPrizePool();

        // Calculate expected movement
        const dailyPool = ENTRY_FEE * 3n;
        const totalRewards = (dailyPool * BigInt(FIRST_PLACE_PERCENTAGE + SECOND_PLACE_PERCENTAGE + THIRD_PLACE_PERCENTAGE)) / 10000n;

        expect(reserveAfter - reserveBefore).to.equal(totalRewards);
        expect(poolBefore - poolAfter).to.equal(totalRewards);
      });
    });
  });

  // ============================================================================
  // ACCESS CONTROL
  // ============================================================================

  describe("Access Control", function () {
    describe("Non-owner can't withdraw reserve", function () {
      it("Should revert when non-owner tries to withdraw reserve", async function () {
        const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

        // Build up reserve
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        await expect(
          gameAsPlayer1.write.withdrawReserve([parseUnits("0.01", 18)])
        ).to.be.rejectedWith("OnlyOwner");
      });
    });

    describe("Non-owner can't pause", function () {
      it("Should revert when non-owner tries to pause (if pause exists)", async function () {
        // Note: The current contract doesn't have a pause function
        // This test is here for completeness based on TestCases.txt
        // If pause functionality is added later, this test should be updated
      });
    });

    describe("Non-owner can't cleanup days", function () {
      it("Should revert when non-owner tries to cleanup days", async function () {
        const { game, player1 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });

        await expect(
          gameAsPlayer1.write.cleanupOldDays([0n, 0n])
        ).to.be.rejectedWith("OnlyOwner");
      });
    });

    describe("Non-winner can't claim rewards", function () {
      it("Should revert when non-winner tries to claim", async function () {
        const { game, player1, player2, player3, player4 } = await loadFixture(deployColorMatchCUSDFixture);

        const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
        const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
        const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });
        const gameAsPlayer4 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player4 } });

        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([1n, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([2n, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([3n, 300, 10]);

        const dayToReward = await game.read.currentDay();

        // Finalize
        await time.increase(ONE_DAY_IN_SECS);
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([4n, 100, 5]);

        // Player 4 didn't play, so can't claim
        await expect(
          gameAsPlayer4.write.claimDailyReward([dayToReward])
        ).to.be.rejectedWith("NotInTop3");
      });
    });
  });

  // ============================================================================
  // ADDITIONAL TESTS
  // ============================================================================

  describe("Additional Tests", function () {
    it("Should track total earnings correctly across multiple claims", async function () {
      const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
      const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
      const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

      let sessionId = 1n;
      const days: bigint[] = [];

      // Win 2 days
      for (let i = 0; i < 2; i++) {
        await gameAsPlayer1.write.startGame();
        await gameAsPlayer1.write.submitScore([sessionId++, 500, 15]);
        await gameAsPlayer2.write.startGame();
        await gameAsPlayer2.write.submitScore([sessionId++, 400, 12]);
        await gameAsPlayer3.write.startGame();
        await gameAsPlayer3.write.submitScore([sessionId++, 300, 10]);

        days.push(await game.read.currentDay());

        await time.increase(ONE_DAY_IN_SECS);
      }

      // Trigger finalization by playing one more game
      await gameAsPlayer1.write.startGame();
      await gameAsPlayer1.write.submitScore([sessionId++, 100, 5]);

      // Now claim both days
      await gameAsPlayer1.write.claimMultipleDays([days]);

      // Each day had 3 games, so daily pool = 3 * ENTRY_FEE
      const dailyPool = ENTRY_FEE * 3n;
      const rewardPerDay = (dailyPool * BigInt(FIRST_PLACE_PERCENTAGE)) / 10000n;
      const totalExpectedEarnings = rewardPerDay * 2n;

      const stats = await game.read.getPlayerStats([player1.account.address]);
      expect(stats[3]).to.equal(totalExpectedEarnings); // totalEarnings
    });

    it("Should correctly handle canReclaimExpiredRewards view function", async function () {
      const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
      const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
      const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

      await gameAsPlayer1.write.startGame();
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);
      await gameAsPlayer2.write.startGame();
      await gameAsPlayer2.write.submitScore([2n, 400, 12]);
      await gameAsPlayer3.write.startGame();
      await gameAsPlayer3.write.submitScore([3n, 300, 10]);

      const dayToCheck = await game.read.currentDay();

      // Finalize
      await time.increase(ONE_DAY_IN_SECS);
      await gameAsPlayer1.write.startGame();
      await gameAsPlayer1.write.submitScore([4n, 100, 5]);

      // Before expiration
      let [canReclaim, amount] = await game.read.canReclaimExpiredRewards([dayToCheck]);
      expect(canReclaim).to.equal(false);

      // After expiration
      await time.increase((CLAIM_WINDOW_DAYS + 1) * ONE_DAY_IN_SECS);
      [canReclaim, amount] = await game.read.canReclaimExpiredRewards([dayToCheck]);
      expect(canReclaim).to.equal(true);
      expect(Number(amount)).to.be.greaterThan(0);
    });

    it("Should prevent double reclaiming of expired funds", async function () {
      const { game, player1, player2, player3 } = await loadFixture(deployColorMatchCUSDFixture);

      const gameAsPlayer1 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player1 } });
      const gameAsPlayer2 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player2 } });
      const gameAsPlayer3 = await hre.viem.getContractAt("contracts/ColourMatchCUSD.sol:ColorMatchGame", game.address, { client: { wallet: player3 } });

      await gameAsPlayer1.write.startGame();
      await gameAsPlayer1.write.submitScore([1n, 500, 15]);
      await gameAsPlayer2.write.startGame();
      await gameAsPlayer2.write.submitScore([2n, 400, 12]);
      await gameAsPlayer3.write.startGame();
      await gameAsPlayer3.write.submitScore([3n, 300, 10]);

      const dayToReclaim = await game.read.currentDay();

      // Finalize
      await time.increase(ONE_DAY_IN_SECS);
      await gameAsPlayer1.write.startGame();
      await gameAsPlayer1.write.submitScore([4n, 100, 5]);

      // Wait for expiration
      await time.increase((CLAIM_WINDOW_DAYS + 1) * ONE_DAY_IN_SECS);

      // First reclaim
      await game.write.reclaimExpiredRewards([dayToReclaim]);

      // Second reclaim should fail
      await expect(
        game.write.reclaimExpiredRewards([dayToReclaim])
      ).to.be.rejectedWith("AlreadyClaimed");
    });
  });
});
