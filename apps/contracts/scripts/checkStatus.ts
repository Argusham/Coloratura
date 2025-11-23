import { createPublicClient, http, formatEther, parseAbi } from 'viem';
import { celo } from 'viem/chains';

// Contract address
const CONTRACT_ADDRESS = '0x286819f4ffc78124c3e74fc9997294af5ee4344d';

// ABI for the functions we need
const abi = parseAbi([
  'function getCurrentDay() view returns (uint256)',
  'function totalPrizePool() view returns (uint256)',
  'function currentDay() view returns (uint256)',
  'function getDailyTop3(uint256 day) view returns (address[3], uint32[3])',
  'function getDailySummary(uint256 day) view returns (uint16 totalPlayers, bool finalized)',
  'function canClaimReward(address player, uint256 day) view returns (bool canClaim, uint256 reward, uint8 rank)',
  'function FIRST_PLACE_REWARD() view returns (uint256)',
  'function SECOND_PLACE_REWARD() view returns (uint256)',
  'function THIRD_PLACE_REWARD() view returns (uint256)',
]);

async function checkContractStatus() {
  console.log('🔍 Checking ColorMatchGame Contract Status...\n');
  console.log(`Contract: ${CONTRACT_ADDRESS}\n`);

  // Create public client
  const client = createPublicClient({
    chain: celo,
    transport: http('https://forno.celo.org'),
  });

  try {
    // Get current day
    const currentDay = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'currentDay',
    }) as bigint;

    console.log(`📅 Current Day: ${currentDay.toString()}`);
    console.log(`   (Day ${currentDay} started at Unix timestamp: ${Number(currentDay) * 86400})`);

    const now = Math.floor(Date.now() / 1000);
    const currentDayFromTime = Math.floor(now / 86400);
    console.log(`   Current time day: ${currentDayFromTime}`);
    console.log(`   Days are ${currentDay === BigInt(currentDayFromTime) ? '✅ IN SYNC' : '⚠️  OUT OF SYNC'}\n`);

    // Get prize pool
    const prizePool = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'totalPrizePool',
    }) as bigint;

    console.log(`💰 Prize Pool: ${formatEther(prizePool)} CELO\n`);

    // Get reward amounts
    const firstPlaceReward = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'FIRST_PLACE_REWARD',
    }) as bigint;

    const secondPlaceReward = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'SECOND_PLACE_REWARD',
    }) as bigint;

    const thirdPlaceReward = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'THIRD_PLACE_REWARD',
    }) as bigint;

    console.log('🏆 Reward Structure:');
    console.log(`   1st Place: ${formatEther(firstPlaceReward)} CELO`);
    console.log(`   2nd Place: ${formatEther(secondPlaceReward)} CELO`);
    console.log(`   3rd Place: ${formatEther(thirdPlaceReward)} CELO`);
    console.log(`   Total needed for all 3: ${formatEther(firstPlaceReward + secondPlaceReward + thirdPlaceReward)} CELO\n`);

    const totalNeeded = firstPlaceReward + secondPlaceReward + thirdPlaceReward;
    if (prizePool < totalNeeded) {
      console.log(`⚠️  WARNING: Prize pool (${formatEther(prizePool)} CELO) is less than total rewards (${formatEther(totalNeeded)} CELO)`);
      console.log(`   Need to add: ${formatEther(totalNeeded - prizePool)} CELO\n`);
    } else {
      console.log(`✅ Prize pool has enough funds for at least one full payout\n`);
    }

    // Check current day
    console.log(`📊 Current Day (Day ${currentDay}) Status:`);
    const currentSummary = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'getDailySummary',
      args: [currentDay],
    }) as [number, boolean];

    console.log(`   Total Players: ${currentSummary[0]}`);
    console.log(`   Finalized: ${currentSummary[1] ? '✅ YES' : '❌ NO'}\n`);

    if (currentSummary[0] > 0) {
      const result = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getDailyTop3',
        args: [currentDay],
      }) as any;
      const topPlayers = result[0];
      const topScores = result[1];

      console.log(`   🥇 1st: ${topPlayers[0]} - Score: ${topScores[0]}`);
      console.log(`   🥈 2nd: ${topPlayers[1]} - Score: ${topScores[1]}`);
      console.log(`   🥉 3rd: ${topPlayers[2]} - Score: ${topScores[2]}\n`);

      // Check if winners can claim
      if (!currentSummary[1]) {
        console.log(`⚠️  Day ${currentDay} is NOT finalized yet - winners cannot claim rewards`);
        console.log(`   To finalize: Either wait for a new day to start, or call finalizeCurrentDay()\n`);
      } else {
        console.log(`✅ Day ${currentDay} is finalized - checking claim status...\n`);

        for (let i = 0; i < 3; i++) {
          if (topPlayers[i] !== '0x0000000000000000000000000000000000000000') {
            const canClaim = await client.readContract({
              address: CONTRACT_ADDRESS,
              abi,
              functionName: 'canClaimReward',
              args: [topPlayers[i], currentDay],
            }) as [boolean, bigint, number];

            const place = i === 0 ? '1st' : i === 1 ? '2nd' : '3rd';
            console.log(`   ${place} place (${topPlayers[i]}):`);
            console.log(`      Can claim: ${canClaim[0] ? '✅ YES' : '❌ NO'}`);
            console.log(`      Reward: ${formatEther(canClaim[1])} CELO`);
          }
        }
      }
    }

    // Check previous day if exists
    if (currentDay > 0n) {
      const previousDay = currentDay - 1n;
      console.log(`\n📊 Previous Day (Day ${previousDay}) Status:`);

      const prevSummary = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getDailySummary',
        args: [previousDay],
      }) as [number, boolean];

      console.log(`   Total Players: ${prevSummary[0]}`);
      console.log(`   Finalized: ${prevSummary[1] ? '✅ YES' : '❌ NO'}\n`);

      if (prevSummary[0] > 0) {
        const prevResult = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'getDailyTop3',
          args: [previousDay],
        }) as any;
        const topPlayers = prevResult[0];
        const topScores = prevResult[1];

        console.log(`   🥇 1st: ${topPlayers[0]} - Score: ${topScores[0]}`);
        console.log(`   🥈 2nd: ${topPlayers[1]} - Score: ${topScores[1]}`);
        console.log(`   🥉 3rd: ${topPlayers[2]} - Score: ${topScores[2]}\n`);

        if (prevSummary[1]) {
          console.log(`   Checking claim status for previous day winners...\n`);

          for (let i = 0; i < 3; i++) {
            if (topPlayers[i] !== '0x0000000000000000000000000000000000000000') {
              const canClaim = await client.readContract({
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'canClaimReward',
                args: [topPlayers[i], previousDay],
              }) as [boolean, bigint, number];

              const place = i === 0 ? '1st' : i === 1 ? '2nd' : '3rd';
              console.log(`   ${place} place (${topPlayers[i]}):`);
              console.log(`      Can claim: ${canClaim[0] ? '✅ YES' : '❌ NO'}`);
              console.log(`      Reward: ${formatEther(canClaim[1])} CELO`);
            }
          }
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 Summary:\n');

    if (prizePool < totalNeeded) {
      console.log('❌ ISSUE: Prize pool is insufficient!');
      console.log(`   Action needed: Add ${formatEther(totalNeeded - prizePool)} CELO to prize pool`);
      console.log(`   Command: cast send ${CONTRACT_ADDRESS} "addToPrizePool()" --value ${formatEther(totalNeeded - prizePool)}ether --rpc-url https://forno.celo.org --private-key $PRIVATE_KEY\n`);
    }

    if (!currentSummary[1] && currentSummary[0] > 0) {
      console.log('❌ ISSUE: Current day has players but is not finalized!');
      console.log('   Action needed: Finalize the day');
      console.log(`   Command: cast send ${CONTRACT_ADDRESS} "finalizeCurrentDay()" --rpc-url https://forno.celo.org --private-key $PRIVATE_KEY\n`);
    }

    if (currentSummary[1] && currentSummary[0] > 0) {
      console.log('✅ Day is finalized - winners can claim their rewards!');
      console.log(`   Command: cast send ${CONTRACT_ADDRESS} "claimDailyReward(uint256)" ${currentDay} --rpc-url https://forno.celo.org --private-key $PRIVATE_KEY\n`);
    }

  } catch (error) {
    console.error('Error checking contract status:', error);
  }
}

checkContractStatus();
