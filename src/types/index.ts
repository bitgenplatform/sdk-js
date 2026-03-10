// ─── Client config ────────────────────────────────────────────────────────────

export type BitgenEnv = 'sandbox' | 'production' | 'localhost'

export interface BitgenConfig {
  /** BITGEN-Scope header (UUID) */
  scope: string
  /** Api-key header */
  apiKey: string
  /** Target environment — defaults to 'production' */
  env?: BitgenEnv
  /** Port used when env is 'localhost' — defaults to 3000 */
  port?: number
}

// ─── Shared ───────────────────────────────────────────────────────────────────

/** Accept either a raw UUID string or a User object */
export type UserRef = string | User

// ─── Asset ────────────────────────────────────────────────────────────────────

export interface Asset {
  name: string
  iso: string
  rank: number
  price: number
  marketcap: number
  percentChange24h: number
}

// ─── Bank ─────────────────────────────────────────────────────────────────────

export interface BankAccount {
  amount: number
  ref: string
}

export interface BankWithdrawResult {
  txId: string
  amount: {
    requestedAmount: number
    finalWithdrawnAmount: number
    feesAmount: number
  }
}

export type BankOperationDirection = 'ALL' | 'PURCHASE' | 'WITHDRAWAL' | 'DEPOSIT'

export interface BankOperationsFilter {
  direction?: BankOperationDirection
  /** Unix timestamp */
  from?: number
  /** Unix timestamp */
  to?: number
}

export interface BankOperation {
  txId: string
  amount: number
  direction: string
  date: number
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderMode = 'BUY' | 'SELL'

export type OrderStateBuy = 'REGISTERED' | 'ORDERED' | 'PAID'
export type OrderStateSell =
  | 'REGISTERED'
  | 'PROCESSING'
  | 'WAIT_FOR_SELL'
  | 'ORDERED'
  | 'COMPLETED'
  | 'FINISHED'
export type OrderState = OrderStateBuy | OrderStateSell

export interface CreateOrderParams {
  user: UserRef
  asset: string
  amount: number
  mode: OrderMode
}

export interface CreatedOrder {
  tunnel: string
  state: OrderState
}

export interface OrderData {
  label: string
  asset: string
  mode: OrderMode
  deliveredAmount: number
  deliveredPrice: number
}

export interface Order {
  createdAt: number
  state: OrderState
  owner: string
  data: OrderData
  amount: string | number
  currency: string
  deliveredAt: number
  error: string | null
  /** Present in history list only */
  tunnel?: string
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export type TransactionState = 'INITIALIZED' | 'SUBMITTED' | 'VALIDATED' | 'CONFIRMED'

export interface CreateTransactionParams {
  user: UserRef
  asset: string
  amount: number
  targetAddress: string
  /** Required for some assets e.g. XRP */
  targetTag?: string
}

export interface CreatedTransaction {
  txId: string
  state: TransactionState
}

export interface Transaction {
  createdAt: number
  state: TransactionState
  amount: number
  owner: string
  error: string | null
  targetAddress: string
  targetTag: string | null
  asset: string
}

export type TransactionDirection = 'ALL' | 'TRANSACTION_SENT' | 'TRANSACTION_RECEIVED'

export interface TransactionHistoryFilter {
  /** Filter by asset ISO code — omit for all assets */
  asset?: string
  direction?: TransactionDirection
  /** Unix timestamp */
  from?: number
  /** Unix timestamp */
  to?: number
}

export interface TransactionHistoryItem {
  asset: string
  direction: TransactionDirection
  amount: number
  date: number
  usdTokenPrice: number
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type IdentityState = 'CREATED' | 'PENDING' | 'APPROVED' | 'REJECTED'
export type UserState = 'ENABLED' | 'DISABLED'

export interface CreateUserParams {
  email: string
  iban: string
  firstname: string
  lastname: string
}

export interface UserAddress {
  street: string
  postalCode: string
  city: string
  country: string
}

export interface UserAccount {
  createdAt: number
  email: string
  firstname: string
  lastname: string
  birthdate?: number
  address?: UserAddress
}

export interface UserIdentity {
  state: IdentityState
  isVerified: boolean
  verificationUrl?: string
}

export interface User {
  uuid: string
  state?: UserState
  account: UserAccount
  identity: UserIdentity
}

export interface WalletAssetRef {
  iso: string
  mode: string
}

export interface ActiveWallet {
  asset: WalletAssetRef
  address: string
  tag: string | null
  balance: number
}

export interface UserDetail {
  user: User
  active_wallets: ActiveWallet[]
  bank: BankAccount
}

export interface UserListMeta {
  offset: number
  limit: number
  total: number
}

export interface UserListParams {
  offset: number
  limit: number
}

export interface UserList {
  meta: UserListMeta
  items: User[]
}

export interface UpdateUserParams {
  email?: string
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface WalletAsset {
  iso: string
  mode: string
  baseUnit: number
}

export interface Wallet {
  asset: WalletAsset
  address: string
  tag: string | null
  balance: number
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface HealthCheck {
  name: string
  version: string
}

export interface UserQuota {
  total: number
  remain: number
  registered: number
  reset: string
}

export interface Stats {
  users: UserQuota
}

// ─── Error ────────────────────────────────────────────────────────────────────

export interface BitgenErrorBody {
  module: string
  service: string
  code: number
  message: string
}
