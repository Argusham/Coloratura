import hre from "hardhat";
import { formatEther } from "viem";

const CONTRACT_ADDRESS = "0x266e31b4097B60D9e4b95CB899354060D5B58090" as `0x${string}`;

async function main() {
  console.log("Checking game sessions and days...\n");

  const contract = await hre.viem.getContractAt("ColorMatchGame", CONTRACT_ADDRESS);
  const publicClient = await hre.viem.getPublicClient();

  try {
    // Get current day
    const currentDay = await contract.read.currentDay();
    console.log("Current Day:", currentDay.toString());

    // Get current block timestamp to understand what day we're in
    const block = await publicClient.getBlock();
    const blockTimestamp = block.timestamp;
    const calculatedDay = blockTimestamp / BigInt(86400); // 1 day = 86400 seconds
    console.log("Calculated Day from current block:", calculatedDay.toString());

    // Get session counter
    const sessionCounter = await contract.read.sessionCounter();
    console.log("\nTotal Sessions:", sessionCounter.toString());

    // Get GameStarted events to see which day each session was played on
    console.log("\nFetching GameStarted events...");
    const events = await publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      event: {
        type: 'event',
        name: 'GameStarted',
        inputs: [
          { type: 'address', name: 'player', indexed: true },
          { type: 'uint256', name: 'sessionId' },
          { type: 'uint256', name: 'day' }
        ]
      },
      fromBlock: BigInt(0),
      toBlock: 'latest'
    });

    console.log(`Found ${events.length} GameStarted events\n`);

    for (const event of events) {
      const { player, sessionId, day } = event.args as any;
      console.log(`Session ${sessionId}:`);
      console.log(`  Player: ${player}`);
      console.log(`  Day: ${day.toString()}`);

      // Get the session score
      const [sessionPlayer, score, level, completed] = await contract.read.getSessionScore([sessionId]);
      console.log(`  Score: ${score.toString()}`);
      console.log(`  Completed: ${completed}`);

      // Check leaderboard for that day
      if (completed) {
        const [topPlayers, topScores] = await contract.read.getDailyTop3([day]);
        console.log(`  Top 3 for day ${day}:`);
        console.log(`    Players: ${topPlayers.join(', ')}`);
        console.log(`    Scores: ${topScores.map((s: bigint) => s.toString()).join(', ')}`);
      }
      console.log();
    }

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
