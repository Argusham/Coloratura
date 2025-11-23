# ColorMatchGame cUSD Contract Deployment Guide

This guide will walk you through deploying the ColorMatchGame contract (cUSD version) to Celo networks.

## Prerequisites

1. **Node.js and pnpm** installed
2. **A Celo wallet** with some CELO tokens for gas fees
3. **Your wallet's private key**

## Step-by-Step Deployment

### Step 1: Install Dependencies

```bash
cd /devhome/my-celo-app/apps/contracts
pnpm install
```

### Step 2: Set Up Your Environment Variables

Create a `.env` file in the `apps/contracts` directory:

```bash
# Navigate to contracts directory
cd /devhome/my-celo-app/apps/contracts

# Create .env file
touch .env
```

Add the following to your `.env` file:

```env
# Your wallet's private key (with 0x prefix)
PRIVATE_KEY=0xyourprivatekeyhere

# Optional: Custom RPC URLs
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org

# Optional: Celoscan API key for contract verification
CELOSCAN_API_KEY=your_celoscan_api_key
```

**⚠️ SECURITY WARNING:**
- Never commit your `.env` file to git
- Never share your private key
- Use a separate wallet for testing/deployment (not your main wallet)

### Step 3: Get Test Tokens (For Testnet Deployment)

If deploying to **Alfajores Testnet**, you need test CELO:

1. Visit the Celo Faucet: https://faucet.celo.org/alfajores
2. Enter your wallet address
3. Request test CELO tokens
4. You'll also need test cUSD tokens from the same faucet

### Step 4: Compile Your Contracts

```bash
npx hardhat compile
```

This will compile all contracts in the `contracts/` directory.

### Step 5: Choose Your Deployment Method

You have three deployment options:

#### **Option A: Using Hardhat Ignition (Recommended)**

1. Deploy to **Alfajores Testnet**:
```bash
npx hardhat ignition deploy ignition/modules/ColorMatchGameCUSD.ts --network alfajores
```

2. Deploy to **Celo Mainnet**:
```bash
npx hardhat ignition deploy ignition/modules/ColorMatchGameCUSD.ts --network celo
```

3. Deploy to **Local Hardhat Network** (for testing):
```bash
# Terminal 1 - Start local node
npx hardhat node

# Terminal 2 - Deploy
npx hardhat ignition deploy ignition/modules/ColorMatchGameCUSD.ts --network localhost
```

#### **Option B: Using Custom Deployment Script**

1. Deploy to **Alfajores Testnet**:
```bash
npx hardhat run scripts/deployCUSD.ts --network alfajores
```

2. Deploy to **Celo Mainnet**:
```bash
npx hardhat run scripts/deployCUSD.ts --network celo
```

#### **Option C: Using Direct Viem Script**

This method gives you more control:

```bash
# Alfajores
npx ts-node scripts/deployViemCUSD.ts alfajores

# Mainnet
npx ts-node scripts/deployViemCUSD.ts celo
```

### Step 6: Verify Your Deployment

After deployment, you should see output like:

```
✅ ColorMatchGame deployed to: 0x1234567890abcdef...
   cUSD Token: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
   Transaction: 0xabcdef...
   Block: 12345678
   Gas used: 3500000

View on Celoscan: https://alfajores.celoscan.io/address/0x1234567890abcdef...
```

**Save this contract address!** You'll need it to interact with your deployed contract.

### Step 7: Verify Contract on Celoscan (Optional but Recommended)

Verify your contract source code on Celoscan so users can read it:

```bash
npx hardhat verify --network alfajores YOUR_CONTRACT_ADDRESS "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
```

For mainnet:
```bash
npx hardhat verify --network celo YOUR_CONTRACT_ADDRESS "0x765DE816845861e75A25fCA122bb6898B8B1282a"
```

**Note:** Replace `YOUR_CONTRACT_ADDRESS` with the actual deployed contract address.

## Network Details

### Alfajores Testnet
- **RPC URL:** https://alfajores-forno.celo-testnet.org
- **Chain ID:** 44787
- **Block Explorer:** https://alfajores.celoscan.io
- **cUSD Token:** `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
- **Faucet:** https://faucet.celo.org/alfajores

### Celo Mainnet
- **RPC URL:** https://forno.celo.org
- **Chain ID:** 42220
- **Block Explorer:** https://celoscan.io
- **cUSD Token:** `0x765DE816845861e75A25fCA122bb6898B8B1282a`

### Celo Sepolia Testnet (Alternative)
- **RPC URL:** https://forno.celo-sepolia.celo-testnet.org
- **Chain ID:** 11142220
- **Block Explorer:** https://celo-sepolia.blockscout.com

## Post-Deployment Steps

### 1. Test Your Contract

Use the check status script:
```bash
npx hardhat run scripts/checkStatus.ts --network alfajores
```

### 2. Interact with Your Contract

You can interact with your contract using:

- **Hardhat Console:**
```bash
npx hardhat console --network alfajores
```

Then in the console:
```javascript
const game = await ethers.getContractAt("ColorMatchGame", "YOUR_CONTRACT_ADDRESS");
await game.currentDay();
```

- **Frontend Integration:** Update your web app's contract address in `web/src/config/contracts.ts`

### 3. Fund the Contract (Optional)

If you want to add initial liquidity to the prize pool:

```bash
npx hardhat run scripts/fundContract.ts --network alfajores
```

## Troubleshooting

### Error: "Insufficient funds for gas"
- Make sure your wallet has enough CELO tokens
- Get more test CELO from the faucet (testnet)
- Check your balance: `npx hardhat run scripts/checkBalance.ts --network alfajores`

### Error: "Invalid private key"
- Ensure your private key in `.env` starts with `0x`
- Make sure there are no extra spaces or quotes
- Verify it's a valid 64-character hex string (plus 0x prefix)

### Error: "Network connection failed"
- Check your internet connection
- Try using a different RPC URL
- Wait a few minutes and try again (network might be congested)

### Contract Address Not Appearing
- Wait for transaction confirmation (can take 5-10 seconds)
- Check the transaction on the block explorer
- Verify you're on the correct network

## Gas Costs Estimation

Typical deployment costs:

- **Alfajores Testnet:** ~3-5 million gas (FREE with test tokens)
- **Celo Mainnet:** ~3-5 million gas (~0.001-0.002 CELO at current prices)

## Security Checklist Before Mainnet Deployment

- [ ] All tests passing (`npx hardhat test`)
- [ ] Contract audited (if handling significant funds)
- [ ] Private key is secure and not your main wallet
- [ ] `.env` file is in `.gitignore`
- [ ] Contract parameters are correct (entry fee, percentages, etc.)
- [ ] Emergency procedures documented
- [ ] Team has access to owner wallet backup
- [ ] Verified contract source code on Celoscan

## Useful Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run specific test file
npx hardhat test test/ColourMatchCUSD.test.ts

# Clean artifacts
npx hardhat clean

# Check account balance
npx hardhat run scripts/checkBalance.ts --network alfajores

# List available networks
npx hardhat run scripts/listNetworks.ts
```

## Next Steps After Deployment

1. **Update Frontend:** Add the deployed contract address to your web app
2. **Set Up Monitoring:** Monitor contract events and transactions
3. **Create Admin Dashboard:** Build tools to manage the contract (withdraw reserve, cleanup, etc.)
4. **Test Thoroughly:** Play the game on testnet before mainnet
5. **Document:** Write user guides and game rules

## Support

If you encounter issues:
1. Check the Hardhat documentation: https://hardhat.org/docs
2. Visit Celo documentation: https://docs.celo.org
3. Ask in Celo Discord: https://discord.gg/celo

## Important Contract Addresses to Save

After deployment, document these:

```
Network: [Alfajores/Mainnet]
Contract Address: 0x...
Deployer Address: 0x...
Deployment Transaction: 0x...
Deployment Block: #...
Deployment Date: YYYY-MM-DD
cUSD Token Address: 0x...
```

Keep this information safe and share it with your team!
