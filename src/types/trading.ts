import type { Amount, AssetInput, AssetRef, UserRef } from './index.js'

export type { OrderState, OrderSide, TradingDirection } from '../constants.js'
import type { OrderState, OrderSide, TradingDirection } from '../constants.js'

export interface Order {
  uuid: string
  state: OrderState
  side: OrderSide
  /** BUY: EUR (`"25.00"`) — SELL: crypto quantity */
  amount: string
  reference: string | null
  /** BUY: crypto quantity received — SELL: EUR credited */
  received: number | null
  /** EUR price of the token */
  executedPrice: number | null
  fee: number | null
  completedAt: number | null
  createdAt: number
  user: OrderUser
  organization: OrderOrganization
  asset: AssetRef
}

/** The customer of an order — `{ uuid, login }`; carries the customer's uuid: accepted wherever a customer is expected */
export interface OrderUser {
  uuid: string
  /** Email */
  login: string
}

/** The organization of an order — `{ uuid, name }` */
export interface OrderOrganization {
  uuid: string
  name: string
}

export interface TradingOrderParams {
  /** uuid or ISO code (`Asset.ETH`), or an `Asset` / `AssetRef` model — must be `AVAILABLE` */
  asset: AssetInput
  /** BUY: EUR, 2 decimals max, ≥ MIN_BUY_CRYPTO — SELL: crypto quantity, ≤ the asset's decimals, EUR value ≥ MIN_SELL_CRYPTO */
  amount: Amount
  /** Idempotency per (user, side, reference): replaying returns the existing order */
  reference?: string
}

export interface TradingListParams {
  /** Customer uuid (unknown → `404 unknown_user`) */
  user?: UserRef
  /** `TradingDirection.BUY` or `TradingDirection.SELL` — absent = both sides */
  direction?: TradingDirection
  /** Only this asset: ISO code, uuid, or an `Asset` / `AssetRef` model */
  asset?: AssetInput
  offset?: number
  limit?: number
}
