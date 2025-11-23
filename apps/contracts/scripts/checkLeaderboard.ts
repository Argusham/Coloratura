import hre from "hardhat";
import { formatEther } from "viem";

const CONTRACT_ADDRESS = "0x266e31b4097B60D9e4b95CB899354060D5B58090" as `0x${string}`;

async function main() {
  console.log("Checking contract state...\n");

  const publicClient = await hre.viem.getPublicClient();
  const contract = await hre.viem.getContractAt("ColorMatchGame", CONTRACT_ADDRESS);

  try {
    // Get current day
    const currentDay = await contract.read.currentDay();
    console.log("Current Day:", currentDay.toString());

    // Get current top 3
    const [topPlayers, topScores, potentialRewards] = await contract.read.getCurrentTop3();
    console.log("\nCurrent Top 3:");
    console.log("Players:", topPlayers);
    console.log("Scores:", topScores.map((s: any) => s.toString()));
    console.log("Potential Rewards:", potentialRewards.map((r: any) => formatEther(r)));

    // Get daily summary for current day
    const [totalPlayers, totalCollected, finalized, rewardsAvailable] = await contract.read.getDailySummary([currentDay]);
    console.log("\nCurrent Day Summary:");
    console.log("Total Players:", totalPlayers.toString());
    console.log("Total Collected:", formatEther(totalCollected), "cUSD");
    console.log("Finalized:", finalized);
    console.log("Rewards Available:", rewardsAvailable);

    // Get session counter
    const sessionCounter = await contract.read.sessionCounter();
    console.log("\nTotal Sessions:", sessionCounter.toString());

  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
