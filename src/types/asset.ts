import type { History } from './index.js'

export type { AssetState } from '../constants.js'
import type { AssetState } from '../constants.js'

export interface AssetTicker {
  price: number
  marketcap: number
  rank: number
  percentChange24h: number
}

export interface AssetFees {
  /** Raw fee schedule of the gas provider, opaque */
  low: unknown
  medium: unknown
  high: unknown
  computed: { gas: string, native: string }
}

export interface AssetNetworkType {
  uuid: string
  code: string
  label: string
  /** Raw JSON, not parsed */
  data: string
}

export interface AssetNetwork {
  uuid: string
  state: string
  caip2: string
  label: string
  gasBase: number
  /** Raw JSON, not parsed */
  data: string
  type: AssetNetworkType
}

export interface Asset {
  uuid: string
  state: AssetState
  /** ISO code as stored by the API (`BTC`, `ETH` today) — compare case-insensitively */
  iso: string
  label: string
  /** `''` for a native asset, never null */
  contractAddress: string
  /** Decimals of the asset (default 18, max 24) */
  baseUnit: number
  gasUnit: number
  logo: string | null
  /** Raw JSON, not parsed */
  data: string
  fees: AssetFees
  ticker: AssetTicker
  /** EUR price */
  history: History
  network: AssetNetwork
}
