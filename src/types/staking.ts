import type { Amount, AssetInput, AssetRef, History, OrganizationSummary, UserRef, UserSummary } from './index.js'

export type { StakingMovementState, StakingMovementKind, StakingPositionState } from '../constants.js'
import type { StakingMovementState, StakingMovementKind, StakingPositionState } from '../constants.js'

/** The position carried by a movement — its `uuid` is what `rewards` / `unstake` take */
export interface StakingPosition {
  uuid: string
  state: StakingPositionState
  /** Net capital placed */
  amount: string
  error: string | null
  data: { rewards?: string, lastRewardAt?: number }
  createdAt: number
  updatedAt: number
  /** The provider */
  core: CoreRef
}

/** The connector of a staking position — `{ uuid, name, label }` */
export interface CoreRef {
  uuid: string
  /** Connector identifier (`figment_sol`) */
  name: string
  label: string
}

/** A staking request — its `uuid` is what `stake` returns and `get` / `list` / `movements` handle */
export interface StakingMovement {
  uuid: string
  state: StakingMovementState
  kind: StakingMovementKind
  provider: string
  amount: string
  createdAt: number
  updatedAt: number
  staking: StakingPosition
  /** The customer */
  owner: UserSummary
  asset: AssetRef
  /** `hub` is never given here */
  organization: OrganizationSummary | null
}

export interface StakingOperation {
  txId: string
  movement: string | null
  asset: string
  kind: string
  amount: string
  price: number
  value: number
  /** Known events, but the API may send others: any string is accepted */
  event: 'created' | 'pending' | 'validated' | 'failed' | 'reward' | 'claimed' | 'unstake' | 'closed' | (string & {})
  provider: string
  date: number
}

export interface StakingPortfolio {
  uuid: string
  /** EUR */
  balances: { capital: number, revenues: number }
  histories: { capital: History, revenues: History }
}

export interface StakeParams {
  /** uuid or ISO code (`Asset.SOL`), or an `Asset` / `AssetRef` model — its uuid is sent */
  asset: AssetInput
  /** Crypto quantity — prefer a string */
  amount: Amount
  /** `uuid` or `name` of a `STAKING` core of the organization (see `providers()`) */
  provider: string
}

export interface StakingListParams {
  /** Customer (unknown → `404 unknown_user`) */
  user?: UserRef
  /** Movement kind — any other value = all */
  direction?: StakingMovementKind
  offset?: number
  limit?: number
}

/** `amount` absent = everything (a full exit ignores the minimums) */
export interface StakingAmountParams {
  amount?: Amount
}
