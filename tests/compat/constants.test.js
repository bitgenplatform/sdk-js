// The enumerated values of the API are frozen objects of constants, exported with value and type of the same name (contract § 3–11).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as sdk from '../../dist/esm/index.js'

const EXPECTED = {
  Env: { PRODUCTION: 'production', SANDBOX: 'sandbox', STAGING: 'staging', LOCALHOST: 'localhost' },
  Asset: { BTC: 'btc', ETH: 'eth', USDC: 'usdc', XRP: 'xrp', SOL: 'sol' },
  ApikeyState: { ENABLED: 'ENABLED', REVOKED: 'REVOKED' },
  AssetState: { AVAILABLE: 'AVAILABLE', UNAVAILABLE: 'UNAVAILABLE', ARCHIVED: 'ARCHIVED', HIDDEN: 'HIDDEN' },
  BankDirection: { ALL: 'ALL', DEPOSIT: 'DEPOSIT', WITHDRAWAL: 'WITHDRAWAL', PURCHASE: 'PURCHASE', SELL: 'SELL' },
  CoreState: { ENABLED: 'ENABLED', DISABLED: 'DISABLED' },
  CoreType: { IDENTITY: 'IDENTITY', AML: 'AML', TRADING: 'TRADING', CUSTODY: 'CUSTODY', STAKING: 'STAKING', RAMP: 'RAMP' },
  CustomerState: { CREATED: 'CREATED', ENABLED: 'ENABLED', CLOSED: 'CLOSED', FROZEN: 'FROZEN' },
  IdentityMode: { KYC: 'KYC', KYB: 'KYB' },
  IdentityState: { CREATED: 'CREATED', IN_PROGRESS: 'IN_PROGRESS', WAIT: 'WAIT', PENDING: 'PENDING', VALIDATED: 'VALIDATED', REJECTED: 'REJECTED', FROZEN: 'FROZEN', EXPIRED: 'EXPIRED', CLOSED: 'CLOSED' },
  Locale: { FR: 'FR', EN: 'EN' },
  OrderSide: { BUY: 'BUY', SELL: 'SELL' },
  OrganizationCategory: { CUSTOMER: 'CUSTOMER', B2B: 'B2B' },
  OrderState: { REGISTERED: 'REGISTERED', TRANSFERRING: 'TRANSFERRING', DEPOSITED: 'DEPOSITED', EXECUTING: 'EXECUTING', FILLED: 'FILLED', DELIVERING: 'DELIVERING', DONE: 'DONE', PARKED: 'PARKED', FAILED: 'FAILED' },
  StakingMovementKind: { STAKE: 'STAKE', UNSTAKE: 'UNSTAKE', WITHDRAW: 'WITHDRAW', REWARD: 'REWARD' },
  StakingMovementState: { REQUESTED: 'REQUESTED', PENDING: 'PENDING', COMPLETED: 'COMPLETED', FAILED: 'FAILED', CANCELED: 'CANCELED' },
  StakingPositionState: { CREATED: 'CREATED', ENABLED: 'ENABLED', UNSTAKING: 'UNSTAKING', CLOSED: 'CLOSED', FAILED: 'FAILED' },
  SubscriberState: { ENABLED: 'ENABLED', ARCHIVED: 'ARCHIVED' },
  TradingDirection: { BUY: 'buy', SELL: 'sell' },
  TransactionDirection: { IN: 'IN', OUT: 'OUT' },
  TransactionSource: { BANK: 'BANK', CUSTODY: 'CUSTODY' },
  TransactionState: { ANALYZING: 'ANALYZING', PENDING: 'PENDING', COMPLETED: 'COMPLETED', FROZEN: 'FROZEN', FAILED: 'FAILED', TRANSFERING: 'TRANSFERING', SEIZED: 'SEIZED' },
  WalletState: { CREATED: 'CREATED', FROZEN: 'FROZEN' },
  WalletType: { USER: 'USER', TREASURY: 'TREASURY' },
  WebhookEventName: {
    USER_CREATED: 'user.created', ORGANIZATION_CREATED: 'organization.created',
    USER_IDENTITY_STARTED: 'user.identity.started', USER_IDENTITY_PENDING: 'user.identity.pending', USER_IDENTITY_STEP_VALIDATED: 'user.identity.step.validated',
    USER_IDENTITY_STEP_REJECTED: 'user.identity.step.rejected', USER_IDENTITY_STEP_REQUESTED: 'user.identity.step.requested', USER_IDENTITY_VALIDATED: 'user.identity.validated',
    USER_IDENTITY_RENEW: 'user.identity.renew', USER_IDENTITY_REQUEST: 'user.identity.request',
    ORGANIZATION_IDENTITY_STARTED: 'organization.identity.started', ORGANIZATION_IDENTITY_PENDING: 'organization.identity.pending',
    ORGANIZATION_IDENTITY_STEP_VALIDATED: 'organization.identity.step.validated', ORGANIZATION_IDENTITY_STEP_REJECTED: 'organization.identity.step.rejected',
    ORGANIZATION_IDENTITY_STEP_REQUESTED: 'organization.identity.step.requested', ORGANIZATION_IDENTITY_VALIDATED: 'organization.identity.validated',
    ORGANIZATION_IDENTITY_RENEW: 'organization.identity.renew', ORGANIZATION_IDENTITY_REQUEST: 'organization.identity.request',
    BANK_CREDITED: 'bank.credited', BANK_DEBITED: 'bank.debited', BANK_TRANSACTION: 'bank.transaction',
    CUSTODY_TRANSACTION: 'custody.transaction', CUSTODY_WALLET_CREATED: 'custody.wallet.created', CUSTODY_SENT: 'custody.sent', CUSTODY_RECEIVED: 'custody.received',
    TRADING_BUY: 'trading.buy', TRADING_SELL: 'trading.sell',
    STAKING_REQUESTED: 'staking.requested', STAKING_STATUS: 'staking.status', STAKING_REWARDS: 'staking.rewards', STAKING_CLAIMED: 'staking.claimed',
    ALERT_OPENED: 'alert.opened', ALERT_STATUS: 'alert.status',
  },
}

test('the 25 constant objects (Env, Asset + 23 enumerated sets): exact keys and values, declaration order, frozen', () => {
  assert.equal(Object.keys(EXPECTED).length, 25)
  for (const [name, expected] of Object.entries(EXPECTED)) {
    const actual = sdk[name]
    assert.ok(actual !== undefined, `${name} is exported`)
    assert.deepEqual(actual, expected, name)
    assert.deepEqual(Object.keys(actual), Object.keys(expected), `${name}: order of the keys`)
    assert.ok(Object.isFrozen(actual), `${name} is frozen`)
    assert.equal(new Set(Object.values(actual)).size, Object.values(actual).length, `${name}: no duplicate value`)
  }
  assert.equal(Object.keys(sdk.WebhookEventName).length, 33)
  // no constant object is exported without being listed here (and vice versa)
  const exported = Object.entries(sdk).filter(([, value]) => typeof value === 'object' && value !== null && Object.isFrozen(value)).map(([name]) => name)
  assert.deepEqual(exported.sort(), Object.keys(EXPECTED).sort())
  assert.throws(() => { sdk.CoreType.STAKING = 'x' }, TypeError)   // frozen: assigning throws in strict mode (ESM)
})
