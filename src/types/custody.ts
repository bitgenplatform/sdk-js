import type { Amount, AssetInput, AssetRef, History } from './index.js'

export type { WalletState, WalletType } from '../constants.js'
import type { WalletState, WalletType } from '../constants.js'

export interface Wallet {
  uuid: string
  state: WalletState
  type: WalletType
  /** Deposit address */
  address: string | null
  addressLegacy: string | null
  /** Memo / tag (XRP, XLM…) */
  tag: string | null
  /** Exact quantity, as a string */
  balance: string
  /** EUR value curve — only on the unit read (`client.custody.wallet`), `{}` on a new wallet until it has been computed */
  history?: History | Record<string, never>
  asset: AssetRef
}

/** `{ uuid, type, history }` — or a flat `{ history }` at 0 while the customer has no custody */
export type CustodyPortfolio = { uuid: string, type: WalletType, history: History } | { history: History }

/** Exclusive forms — a person, or a platform — each field ≤ 255 characters (validated by the API); mixing them is a type error */
export type TravelRule =
  | { firstname?: string, lastname?: string, address?: string, platform?: never }
  | { platform: string, firstname?: never, lastname?: never, address?: never }

export interface CustodyWithdrawParams {
  /** uuid or ISO code (`Asset.ETH`), or an `Asset` / `AssetRef` model — its uuid is sent */
  asset: AssetInput
  /** Prefer a string: up to 18 decimals, a JavaScript `number` loses precision beyond ~15 significant digits */
  amount: Amount
  targetAddress: string
  targetTag?: string
  /** ≤ 64 characters, unique per customer: replaying returns the same transaction */
  idempotencyKey?: string
  travelRule?: TravelRule
}
