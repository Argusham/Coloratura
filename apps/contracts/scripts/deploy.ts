import { createPublicClient, createWalletClient, http } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import fs from "fs";
import path from "path";

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;

  if (!privateKey) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }

  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: celo,
    transport: http("https://forno.celo.org"),
  });

  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http("https://forno.celo.org"),
  });

  console.log(`Deploying ColorMatchGame from account: ${account.address}`);

  // Read the compiled contract
  const artifactPath = path.join(__dirname, "../artifacts/contracts/ColourMatch.sol/ColorMatchGame.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
    account,
    args: [],
  });

  console.log(`Transaction hash: ${hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log(`\n✅ ColorMatchGame deployed to: ${receipt.contractAddress}`);
  console.log(`   Transaction: ${receipt.transactionHash}`);
  console.log(`   Block: ${receipt.blockNumber}`);
  console.log(`   Gas used: ${receipt.gasUsed}`);
  console.log(`\nView on Celoscan: https://celoscan.io/address/${receipt.contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
