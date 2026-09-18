/** Target environment — value goes in `BitgenConfig.env` (`env: Env.PRODUCTION`) */
export const Env = Object.freeze({
  PRODUCTION: 'production',
  SANDBOX: 'sandbox',
  STAGING: 'staging',
  LOCALHOST: 'localhost',
} as const)

/**
 * Asset ISO codes, accepted wherever an asset is expected (the API takes a uuid or an iso in any case).
 * The `iso` returned by the API has its stored case (`ETH` today): compare it case-insensitively.
 * Provisional list — extended once the production list is confirmed.
 */
export const Asset = Object.freeze({
  BTC: 'btc',
  ETH: 'eth',
  USDC: 'usdc',
  XRP: 'xrp',
  SOL: 'sol',
} as const)

// ─── Enumerated values (mirror of the API's; value and type share the name, like `Env` and `Asset`) ─────

/** States of an API key — `Apikey.state`; `client.apikeys.list` leaves the `REVOKED` ones out unless `includeRevoked` */
export const ApikeyState = Object.freeze({
  ENABLED: 'ENABLED',
  REVOKED: 'REVOKED',
} as const)
/** The values of `ApikeyState` */
export type ApikeyState = (typeof ApikeyState)[keyof typeof ApikeyState]

/** States of an asset — `Asset.state` is a string, compare it with `AssetState.AVAILABLE` */
export const AssetState = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  ARCHIVED: 'ARCHIVED',
  HIDDEN: 'HIDDEN',
} as const)
/** The values of `AssetState` */
export type AssetState = (typeof AssetState)[keyof typeof AssetState]

/** Filter of the EUR operations (`client.bank.operations`) — `ALL` (default), or one kind */
export const BankDirection = Object.freeze({
  ALL: 'ALL',
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  PURCHASE: 'PURCHASE',
  SELL: 'SELL',
} as const)
/** The values of `BankDirection` */
export type BankDirection = (typeof BankDirection)[keyof typeof BankDirection]

/** States of a connector — `Core.state`; also the `state` filter of `client.core.list` */
export const CoreState = Object.freeze({
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED',
} as const)
/** The values of `CoreState` */
export type CoreState = (typeof CoreState)[keyof typeof CoreState]

/** Kinds of connectors — `Core.type`; also the `type` filter of `client.core.list` */
export const CoreType = Object.freeze({
  /** Identity verification service */
  IDENTITY: 'IDENTITY',
  /** Anti-money-laundering service */
  AML: 'AML',
  /** Exchange */
  TRADING: 'TRADING',
  /** Custodian */
  CUSTODY: 'CUSTODY',
  /** Staking provider */
  STAKING: 'STAKING',
  /** Bank */
  RAMP: 'RAMP',
} as const)
/** The values of `CoreType` */
export type CoreType = (typeof CoreType)[keyof typeof CoreType]

/** States of a customer — `Customer.state`, compare it with `CustomerState.ENABLED` */
export const CustomerState = Object.freeze({
  CREATED: 'CREATED',
  ENABLED: 'ENABLED',
  CLOSED: 'CLOSED',
  FROZEN: 'FROZEN',
} as const)
/** The values of `CustomerState` */
export type CustomerState = (typeof CustomerState)[keyof typeof CustomerState]

/** `KYC` (a person) or `KYB` (a business) — `Identity.mode` */
export const IdentityMode = Object.freeze({
  KYC: 'KYC',
  KYB: 'KYB',
} as const)
/** The values of `IdentityMode` */
export type IdentityMode = (typeof IdentityMode)[keyof typeof IdentityMode]

/** States of an identity file — `Identity.state` */
export const IdentityState = Object.freeze({
  CREATED: 'CREATED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAIT: 'WAIT',
  PENDING: 'PENDING',
  VALIDATED: 'VALIDATED',
  REJECTED: 'REJECTED',
  FROZEN: 'FROZEN',
  EXPIRED: 'EXPIRED',
  CLOSED: 'CLOSED',
} as const)
/** The values of `IdentityState` */
export type IdentityState = (typeof IdentityState)[keyof typeof IdentityState]

/** Language of the BITGEN web application and of the emails — `Locale.FR` (default) or `Locale.EN` */
export const Locale = Object.freeze({
  FR: 'FR',
  EN: 'EN',
} as const)
/** The values of `Locale` */
export type Locale = (typeof Locale)[keyof typeof Locale]

/** Side of an order — `Order.side` */
export const OrderSide = Object.freeze({
  BUY: 'BUY',
  SELL: 'SELL',
} as const)
/** The values of `OrderSide` */
export type OrderSide = (typeof OrderSide)[keyof typeof OrderSide]

/** States of an order — `Order.state`. A purchase goes `REGISTERED` → `EXECUTING` → `FILLED` → `DELIVERING` → `DONE`; a sale `REGISTERED` → `TRANSFERRING` → `DEPOSITED` → `EXECUTING` → `FILLED` → `DONE`. `PARKED`: executed but nothing was received (terminal); `FAILED` */
export const OrderState = Object.freeze({
  REGISTERED: 'REGISTERED',
  TRANSFERRING: 'TRANSFERRING',
  DEPOSITED: 'DEPOSITED',
  EXECUTING: 'EXECUTING',
  FILLED: 'FILLED',
  DELIVERING: 'DELIVERING',
  DONE: 'DONE',
  PARKED: 'PARKED',
  FAILED: 'FAILED',
} as const)
/** The values of `OrderState` */
export type OrderState = (typeof OrderState)[keyof typeof OrderState]

/** Category of a customer — the `organization` of `client.customer.create` (`CUSTOMER` by default; `B2B` also opens a KYB file) and `setup.choosenOrganization` */
export const OrganizationCategory = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  B2B: 'B2B',
} as const)
/** The values of `OrganizationCategory` */
export type OrganizationCategory = (typeof OrganizationCategory)[keyof typeof OrganizationCategory]

/** Kinds of staking movements — `StakingMovement.kind`; also the `direction` filter of `client.staking.list` / `movements` */
export const StakingMovementKind = Object.freeze({
  STAKE: 'STAKE',
  UNSTAKE: 'UNSTAKE',
  WITHDRAW: 'WITHDRAW',
  REWARD: 'REWARD',
} as const)
/** The values of `StakingMovementKind` */
export type StakingMovementKind = (typeof StakingMovementKind)[keyof typeof StakingMovementKind]

/** States of a staking movement — `StakingMovement.state` */
export const StakingMovementState = Object.freeze({
  REQUESTED: 'REQUESTED',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
} as const)
/** The values of `StakingMovementState` */
export type StakingMovementState = (typeof StakingMovementState)[keyof typeof StakingMovementState]

/** States of a staking position — `StakingPosition.state` */
export const StakingPositionState = Object.freeze({
  CREATED: 'CREATED',
  ENABLED: 'ENABLED',
  UNSTAKING: 'UNSTAKING',
  CLOSED: 'CLOSED',
  FAILED: 'FAILED',
} as const)
/** The values of `StakingPositionState` */
export type StakingPositionState = (typeof StakingPositionState)[keyof typeof StakingPositionState]

/** States of a webhook subscription (`Subscriber.state`) and of an event of the catalogue (`WebhookType.state`) — `ARCHIVED` ones are left out of `client.webhooks.list` unless `includeArchived` */
export const SubscriberState = Object.freeze({
  ENABLED: 'ENABLED',
  ARCHIVED: 'ARCHIVED',
} as const)
/** The values of `SubscriberState` */
export type SubscriberState = (typeof SubscriberState)[keyof typeof SubscriberState]

/** Filter of `client.trading.list`: only purchases, or only sales — lowercase, as the API expects it */
export const TradingDirection = Object.freeze({
  BUY: 'buy',
  SELL: 'sell',
} as const)
/** The values of `TradingDirection` */
export type TradingDirection = (typeof TradingDirection)[keyof typeof TradingDirection]

/** Direction of a transaction — `Transaction.direction`; also a filter of `client.transaction.list` */
export const TransactionDirection = Object.freeze({
  IN: 'IN',
  OUT: 'OUT',
} as const)
/** The values of `TransactionDirection` */
export type TransactionDirection = (typeof TransactionDirection)[keyof typeof TransactionDirection]

/** Where a transaction comes from: the EUR account (`BANK`) or a custody wallet (`CUSTODY`) — `Transaction.source`; also a filter of `client.transaction.list` */
export const TransactionSource = Object.freeze({
  BANK: 'BANK',
  CUSTODY: 'CUSTODY',
} as const)
/** The values of `TransactionSource` */
export type TransactionSource = (typeof TransactionSource)[keyof typeof TransactionSource]

/** States of a transaction (`TRANSFERING` is the API's spelling) — `Transaction.state`; also the `status` filter of `client.transaction.list` */
export const TransactionState = Object.freeze({
  ANALYZING: 'ANALYZING',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FROZEN: 'FROZEN',
  FAILED: 'FAILED',
  TRANSFERING: 'TRANSFERING',
  SEIZED: 'SEIZED',
} as const)
/** The values of `TransactionState` */
export type TransactionState = (typeof TransactionState)[keyof typeof TransactionState]

/** States of a wallet — `Wallet.state` */
export const WalletState = Object.freeze({
  CREATED: 'CREATED',
  FROZEN: 'FROZEN',
} as const)
/** The values of `WalletState` */
export type WalletState = (typeof WalletState)[keyof typeof WalletState]

/** `USER`: the wallet of a customer — `TREASURY`: a wallet of the organization itself (read-only). `Wallet.type` */
export const WalletType = Object.freeze({
  USER: 'USER',
  TREASURY: 'TREASURY',
} as const)
/** The values of `WalletType` */
export type WalletType = (typeof WalletType)[keyof typeof WalletType]

/** Events of the catalogue — `WebhookEvent.event` and `WebhookType.name` (the catalogue may grow: any string stays accepted); `client.webhooks.subscribe` takes a constant, any name or uuid of the catalogue, or a `WebhookType` */
export const WebhookEventName = Object.freeze({
  USER_CREATED: 'user.created',
  ORGANIZATION_CREATED: 'organization.created',
  USER_IDENTITY_STARTED: 'user.identity.started',
  USER_IDENTITY_PENDING: 'user.identity.pending',
  USER_IDENTITY_STEP_VALIDATED: 'user.identity.step.validated',
  USER_IDENTITY_STEP_REJECTED: 'user.identity.step.rejected',
  USER_IDENTITY_STEP_REQUESTED: 'user.identity.step.requested',
  USER_IDENTITY_VALIDATED: 'user.identity.validated',
  USER_IDENTITY_RENEW: 'user.identity.renew',
  USER_IDENTITY_REQUEST: 'user.identity.request',
  ORGANIZATION_IDENTITY_STARTED: 'organization.identity.started',
  ORGANIZATION_IDENTITY_PENDING: 'organization.identity.pending',
  ORGANIZATION_IDENTITY_STEP_VALIDATED: 'organization.identity.step.validated',
  ORGANIZATION_IDENTITY_STEP_REJECTED: 'organization.identity.step.rejected',
  ORGANIZATION_IDENTITY_STEP_REQUESTED: 'organization.identity.step.requested',
  ORGANIZATION_IDENTITY_VALIDATED: 'organization.identity.validated',
  ORGANIZATION_IDENTITY_RENEW: 'organization.identity.renew',
  ORGANIZATION_IDENTITY_REQUEST: 'organization.identity.request',
  BANK_CREDITED: 'bank.credited',
  BANK_DEBITED: 'bank.debited',
  BANK_TRANSACTION: 'bank.transaction',
  CUSTODY_TRANSACTION: 'custody.transaction',
  CUSTODY_WALLET_CREATED: 'custody.wallet.created',
  CUSTODY_SENT: 'custody.sent',
  CUSTODY_RECEIVED: 'custody.received',
  TRADING_BUY: 'trading.buy',
  TRADING_SELL: 'trading.sell',
  STAKING_REQUESTED: 'staking.requested',
  STAKING_STATUS: 'staking.status',
  STAKING_REWARDS: 'staking.rewards',
  STAKING_CLAIMED: 'staking.claimed',
  ALERT_OPENED: 'alert.opened',
  ALERT_STATUS: 'alert.status',
} as const)
/** Known event names — the catalogue may grow: any string is accepted */
export type WebhookEventName = (typeof WebhookEventName)[keyof typeof WebhookEventName] | (string & {})
