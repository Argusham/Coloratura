import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  DailyRewardPaid,
  DayFinalized,
  ExpiredFundsReclaimed,
  GameCompleted,
  GameStarted,
  HighScoreSet,
  ReserveUpdated
} from "../generated/ColorMatchGame/ColorMatchGame"

export function createDailyRewardPaidEvent(
  player: Address,
  rank: i32,
  reward: BigInt,
  day: BigInt
): DailyRewardPaid {
  let dailyRewardPaidEvent = changetype<DailyRewardPaid>(newMockEvent())

  dailyRewardPaidEvent.parameters = new Array()

  dailyRewardPaidEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )
  dailyRewardPaidEvent.parameters.push(
    new ethereum.EventParam(
      "rank",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(rank))
    )
  )
  dailyRewardPaidEvent.parameters.push(
    new ethereum.EventParam("reward", ethereum.Value.fromUnsignedBigInt(reward))
  )
  dailyRewardPaidEvent.parameters.push(
    new ethereum.EventParam("day", ethereum.Value.fromUnsignedBigInt(day))
  )

  return dailyRewardPaidEvent
}

export function createDayFinalizedEvent(
  day: BigInt,
  totalCollected: BigInt,
  totalPlayers: i32
): DayFinalized {
  let dayFinalizedEvent = changetype<DayFinalized>(newMockEvent())

  dayFinalizedEvent.parameters = new Array()

  dayFinalizedEvent.parameters.push(
    new ethereum.EventParam("day", ethereum.Value.fromUnsignedBigInt(day))
  )
  dayFinalizedEvent.parameters.push(
    new ethereum.EventParam(
      "totalCollected",
      ethereum.Value.fromUnsignedBigInt(totalCollected)
    )
  )
  dayFinalizedEvent.parameters.push(
    new ethereum.EventParam(
      "totalPlayers",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(totalPlayers))
    )
  )

  return dayFinalizedEvent
}

export function createExpiredFundsReclaimedEvent(
  day: BigInt,
  amount: BigInt
): ExpiredFundsReclaimed {
  let expiredFundsReclaimedEvent =
    changetype<ExpiredFundsReclaimed>(newMockEvent())

  expiredFundsReclaimedEvent.parameters = new Array()

  expiredFundsReclaimedEvent.parameters.push(
    new ethereum.EventParam("day", ethereum.Value.fromUnsignedBigInt(day))
  )
  expiredFundsReclaimedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return expiredFundsReclaimedEvent
}

export function createGameCompletedEvent(
  player: Address,
  sessionId: BigInt,
  score: BigInt
): GameCompleted {
  let gameCompletedEvent = changetype<GameCompleted>(newMockEvent())

  gameCompletedEvent.parameters = new Array()

  gameCompletedEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )
  gameCompletedEvent.parameters.push(
    new ethereum.EventParam(
      "sessionId",
      ethereum.Value.fromUnsignedBigInt(sessionId)
    )
  )
  gameCompletedEvent.parameters.push(
    new ethereum.EventParam("score", ethereum.Value.fromUnsignedBigInt(score))
  )

  return gameCompletedEvent
}

export function createGameStartedEvent(
  player: Address,
  sessionId: BigInt,
  day: BigInt
): GameStarted {
  let gameStartedEvent = changetype<GameStarted>(newMockEvent())

  gameStartedEvent.parameters = new Array()

  gameStartedEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )
  gameStartedEvent.parameters.push(
    new ethereum.EventParam(
      "sessionId",
      ethereum.Value.fromUnsignedBigInt(sessionId)
    )
  )
  gameStartedEvent.parameters.push(
    new ethereum.EventParam("day", ethereum.Value.fromUnsignedBigInt(day))
  )

  return gameStartedEvent
}

export function createHighScoreSetEvent(
  player: Address,
  score: BigInt
): HighScoreSet {
  let highScoreSetEvent = changetype<HighScoreSet>(newMockEvent())

  highScoreSetEvent.parameters = new Array()

  highScoreSetEvent.parameters.push(
    new ethereum.EventParam("player", ethereum.Value.fromAddress(player))
  )
  highScoreSetEvent.parameters.push(
    new ethereum.EventParam("score", ethereum.Value.fromUnsignedBigInt(score))
  )

  return highScoreSetEvent
}

export function createReserveUpdatedEvent(newReserve: BigInt): ReserveUpdated {
  let reserveUpdatedEvent = changetype<ReserveUpdated>(newMockEvent())

  reserveUpdatedEvent.parameters = new Array()

  reserveUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newReserve",
      ethereum.Value.fromUnsignedBigInt(newReserve)
    )
  )

  return reserveUpdatedEvent
}
