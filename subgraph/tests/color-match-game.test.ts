import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { DailyRewardPaid } from "../generated/schema"
import { DailyRewardPaid as DailyRewardPaidEvent } from "../generated/ColorMatchGame/ColorMatchGame"
import { handleDailyRewardPaid } from "../src/color-match-game"
import { createDailyRewardPaidEvent } from "./color-match-game-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let player = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let rank = 123
    let reward = BigInt.fromI32(234)
    let day = BigInt.fromI32(234)
    let newDailyRewardPaidEvent = createDailyRewardPaidEvent(
      player,
      rank,
      reward,
      day
    )
    handleDailyRewardPaid(newDailyRewardPaidEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("DailyRewardPaid created and stored", () => {
    assert.entityCount("DailyRewardPaid", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "DailyRewardPaid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "player",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "DailyRewardPaid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "rank",
      "123"
    )
    assert.fieldEquals(
      "DailyRewardPaid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "reward",
      "234"
    )
    assert.fieldEquals(
      "DailyRewardPaid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "day",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
