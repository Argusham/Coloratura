import {
  DailyRewardPaid as DailyRewardPaidEvent,
  DayFinalized as DayFinalizedEvent,
  ExpiredFundsReclaimed as ExpiredFundsReclaimedEvent,
  GameCompleted as GameCompletedEvent,
  GameStarted as GameStartedEvent,
  HighScoreSet as HighScoreSetEvent,
  ReserveUpdated as ReserveUpdatedEvent
} from "../generated/ColorMatchGame/ColorMatchGame"
import {
  DailyRewardPaid,
  DayFinalized,
  ExpiredFundsReclaimed,
  GameCompleted,
  GameStarted,
  HighScoreSet,
  ReserveUpdated
} from "../generated/schema"

export function handleDailyRewardPaid(event: DailyRewardPaidEvent): void {
  let entity = new DailyRewardPaid(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.player = event.params.player
  entity.rank = event.params.rank
  entity.reward = event.params.reward
  entity.day = event.params.day

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDayFinalized(event: DayFinalizedEvent): void {
  let entity = new DayFinalized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.day = event.params.day
  entity.totalCollected = event.params.totalCollected
  entity.totalPlayers = event.params.totalPlayers

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleExpiredFundsReclaimed(
  event: ExpiredFundsReclaimedEvent
): void {
  let entity = new ExpiredFundsReclaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.day = event.params.day
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleGameCompleted(event: GameCompletedEvent): void {
  let entity = new GameCompleted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.player = event.params.player
  entity.sessionId = event.params.sessionId
  entity.score = event.params.score

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleGameStarted(event: GameStartedEvent): void {
  let entity = new GameStarted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.player = event.params.player
  entity.sessionId = event.params.sessionId
  entity.day = event.params.day

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleHighScoreSet(event: HighScoreSetEvent): void {
  let entity = new HighScoreSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.player = event.params.player
  entity.score = event.params.score

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleReserveUpdated(event: ReserveUpdatedEvent): void {
  let entity = new ReserveUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newReserve = event.params.newReserve

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
