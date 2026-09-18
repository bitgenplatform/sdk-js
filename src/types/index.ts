import type { Env } from '../constants.js'
import type { Asset as AssetModel } from './asset.js'
import type { Account, Customer } from './customer.js'
import type { OrderUser } from './trading.js'

// ─── Client config ────────────────────────────────────────────────────────────

/** `'production' | 'sandbox' | 'staging' | 'localhost'` — the values of `Env` */
export type BitgenEnv = (typeof Env)[keyof typeof Env]

export interface BitgenConfig {
  scope: string
  apiKey: string
  env?: BitgenEnv
  host?: string
  port?: number
  isSsl?: boolean
  /** Request timeout in seconds — default 30, `0` = no timeout. Expiry → `BitgenError { status: 0, code: 'request_timeout' }` */
  timeout?: number
}

// ─── Shared ───────────────────────────────────────────────────────────────────

/** `{ uuid }` — what a creation answers (`customer.create`, `bank.credit`, `staking.stake`, `webhooks.subscribe`); carries a customer's uuid where it is one */
export interface Created {
  uuid: string
}

/** The asset of a wallet, an order, a movement, a connector — `{ uuid, iso, label }`; `iso` has the case the API stores: compare it case-insensitively */
export interface AssetRef {
  uuid: string
  iso: string
  label: string
}

/** An asset as accepted by every method expecting one: its uuid or ISO code (`Asset.ETH`), or an `Asset` / `AssetRef` returned by the SDK — its uuid is then sent */
export type AssetInput = string | AssetModel | AssetRef

/**
 * A user as a transaction or a staking movement references them — `{ uuid, state, login, account: { firstname, lastname, fin } }`:
 * the customer (`owner`) or the compliance officer in charge (`assignee`). An `owner` carries the customer's uuid.
 */
export interface UserSummary {
  uuid: string
  state: string
  /** Email */
  login: string
  account: { firstname: string, lastname: string | null, fin: string | null }
}

/** The hub an organization belongs to — `{ uuid, name }` */
export interface OrganizationHub {
  uuid: string
  name: string
}

/** An organization as a transaction or a staking movement references it — `hub` is only given on a transaction */
export interface OrganizationSummary {
  uuid: string
  state: string
  name: string
  hub?: OrganizationHub | null
}

/**
 * A customer, as accepted by every method expecting one: their uuid (or an email, where the API resolves it) as a string,
 * or one of the models that carry a customer's uuid — the `Created` of `customer.create`, a `Customer`, an `Account`,
 * the `user` of an `Order`, the `owner` of a `Transaction` or of a `StakingMovement`. The SDK sends the uuid.
 */
export type UserRef = string | Created | Customer | Account | UserSummary | OrderUser

/** An amount as accepted by the SDK — always sent to the API as a string; prefer strings, a `number` only keeps ~15 significant digits */
export type Amount = string | number

/** Pagination query — `limit` default 10, max 50 (100 on `/transaction`) */
export interface PageParams {
  offset?: number
  limit?: number
}

/** Paginated list: query `offset` / `limit` in, `{ count, items }` out */
export interface Page<T> {
  count: number
  items: T[]
}

/**
 * Time series returned by the API: `d` = last 24 h (hourly), `w`/`m` = daily,
 * `y`/`all` = monthly. Each point is `[epoch seconds, value]`, last point = current value.
 */
export type History = Record<'d' | 'w' | 'm' | 'y' | 'all', [number, number][]>

// ─── Error ────────────────────────────────────────────────────────────────────

/** Error body sent by the API along with the real HTTP status */
export interface BitgenErrorBody {
  error: true
  /** Stable snake_case error code (e.g. `invalid_amount`), never a sentence */
  message: string
  /** HTTP status, duplicated in the body */
  code: number
}

// ─── Resources ────────────────────────────────────────────────────────────────

export type {
  Asset,
  AssetState,
  AssetTicker,
  AssetFees,
  AssetNetwork,
  AssetNetworkType,
} from './asset.js'

export type {
  Locale,
  CustomerState,
  IdentityState,
  IdentityMode,
  OrganizationCategory,
  KycIdentity,
  KybIdentity,
  Identity,
  CustomerAccount,
  CustomerClient,
  CustomerSetup,
  CollaboratorLink,
  ManagerLink,
  CustomerAlert,
  CustomerBusiness,
  Customer,
  AccountAddress,
  Account,
  CreateCustomerParams,
  CustomerListParams,
  UpdateCustomerParams,
} from './customer.js'

export type {
  BankDirection,
  BankAccount,
  BankOperation,
  BankOperationsParams,
  BankWithdrawParams,
  BankCreditParams,
} from './bank.js'

export type {
  WalletState,
  WalletType,
  Wallet,
  CustodyPortfolio,
  TravelRule,
  CustodyWithdrawParams,
} from './custody.js'

export type {
  OrderState,
  OrderSide,
  TradingDirection,
  OrderUser,
  OrderOrganization,
  Order,
  TradingOrderParams,
  TradingListParams,
} from './trading.js'

export type {
  TransactionState,
  TransactionSource,
  TransactionDirection,
  TransactionAlert,
  Transaction,
  TransactionListParams,
} from './transaction.js'

export type {
  CoreType,
  CoreState,
  CoreConfigField,
  Core,
  CoreListParams,
} from './core.js'

export type {
  StakingMovementState,
  StakingMovementKind,
  StakingPositionState,
  CoreRef,
  StakingPosition,
  StakingMovement,
  StakingOperation,
  StakingPortfolio,
  StakeParams,
  StakingListParams,
  StakingAmountParams,
} from './staking.js'

export type {
  WebhookEventName,
  SubscriberState,
  WebhookType,
  Subscriber,
  WebhookSubscriptions,
  DeliveryLog,
  WebhookEvent,
  VerifyInput,
} from './webhooks.js'

export type {
  ApikeyState,
  Apikey,
  ApikeyLog,
  ApikeyListParams,
} from './apikeys.js'
