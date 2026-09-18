import type { AssetInput, OrganizationHub, OrganizationSummary, UserRef, UserSummary } from './index.js'

export type { TransactionState, TransactionSource, TransactionDirection } from '../constants.js'
import type { TransactionState, TransactionSource, TransactionDirection } from '../constants.js'

/** Compliance alert attached to a transaction */
export interface TransactionAlert {
  uuid: string
  state: 'OPEN' | 'RESOLVED' | 'DISMISSED' | 'DECLARATED' | 'CONFIRMED'
  severity: 'SUCCESS' | 'WARNING' | 'CRITICAL'
  type: 'KYT' | 'KYC_EXPIRE' | 'SUSPICIOUS_ACTIVITY' | 'AML' | 'SANCTIONS'
  description: string
  confidence: number
  recommendation: string | null
  factors: unknown
  sources: Record<string, unknown>
  history: unknown
  incidentKey: string | null
  createdAt: number
  updatedAt: number
  user: unknown
  assignee: unknown
  organization: unknown
}

/** Unified journal of fiat and crypto movements — created internally, never through REST */
export interface Transaction {
  uuid: string
  state: TransactionState
  source: TransactionSource
  direction: TransactionDirection
  asset: string
  amount: number
  eurValue: number | null
  reference: string | null
  credited: boolean
  /** Internal leg (staking, sale), not a customer operation */
  silent: boolean
  data: Record<string, unknown>
  createdAt: number
  updatedAt: number
  /** The customer */
  owner: UserSummary | null
  /** The compliance officer assigned while the transaction is on hold */
  assignee: UserSummary | null
  organization: (OrganizationSummary & { hub: OrganizationHub | null }) | null
  alert: TransactionAlert | null
}

export interface TransactionListParams {
  /** Customer uuid (unknown → `404 unknown_user`) */
  user?: UserRef
  /** One state (anything else → `400 invalid_transaction_state`) */
  status?: TransactionState
  source?: TransactionSource
  direction?: TransactionDirection
  /** Only this asset: ISO code, uuid, or an `Asset` / `AssetRef` model */
  asset?: AssetInput
  offset?: number
  /** Max 100 on this list */
  limit?: number
}
