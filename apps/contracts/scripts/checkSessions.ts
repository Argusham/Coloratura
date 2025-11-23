import hre from "hardhat";

const CONTRACT_ADDRESS = "0x266e31b4097B60D9e4b95CB899354060D5B58090" as `0x${string}`;

async function main() {
  console.log("Checking game sessions...\n");

  const contract = await hre.viem.getContractAt("ColorMatchGame", CONTRACT_ADDRESS);

  try {
    // Get session counter
    const sessionCounter = await contract.read.sessionCounter();
    console.log("Total Sessions:", sessionCounter.toString());

    // Check each session
    for (let i = 1; i <= Number(sessionCounter); i++) {
      const [player, score, level, completed] = await contract.read.getSessionScore([BigInt(i)]);
      console.log(`\nSession ${i}:`);
      console.log("  Player:", player);
      console.log("  Score:", score.toString());
      console.log("  Level:", level.toString());
      console.log("  Completed:", completed);
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
