// TypeScript consumer of the packed package — compiled by tests/compat/package.test.js
// under node16 (module / commonjs), bundler and node10 resolutions.
declare const console: { log: (...args: unknown[]) => void }
import {
  BitgenClient, BitgenError, Env, Asset,
  ApikeyState, AssetState, BankDirection, CoreState, CoreType, CustomerState, IdentityMode, IdentityState, Locale, OrderSide, OrderState,
  OrganizationCategory, StakingMovementKind, StakingMovementState, StakingPositionState, SubscriberState, TradingDirection, TransactionDirection, TransactionSource,
  TransactionState, WalletState, WalletType, WebhookEventName,
} from '@bitgen/sdk'
import type {
  BitgenConfig, BitgenEnv, UserRef, BitgenErrorBody, History, Page, AssetTicker, AssetRef, AssetInput, Created,
  UserSummary, OrganizationSummary,
  Customer, Account, Identity, CustomerSetup, CreateCustomerParams, UpdateCustomerParams,
  Amount, BankAccount, BankOperation, BankWithdrawParams, BankCreditParams,
  Wallet, CustodyPortfolio, TravelRule, CustodyWithdrawParams,
  Order, OrderUser, TradingOrderParams, TradingListParams,
  Transaction, TransactionAlert, TransactionListParams, Core, CoreListParams,
  StakingMovement, StakingPosition, CoreRef, StakingOperation, StakingPortfolio, StakeParams, StakingListParams, StakingAmountParams, PageParams,
  WebhookEvent, WebhookSubscriptions, Subscriber, DeliveryLog, WebhookType, VerifyInput,
  Apikey, ApikeyLog, ApikeyListParams,
} from '@bitgen/sdk'

// Env.* is assignable to BitgenEnv, the raw string too
const config: BitgenConfig = { scope: 's', apiKey: 'k', env: Env.PRODUCTION }
const raw: BitgenEnv = 'staging'
const client = new BitgenClient(config)

// Asset.* has a literal type
const eth: 'eth' = Asset.ETH
const anyAsset: string = Asset.SOL

// Every enumerated value is a frozen object of constants AND the type of its values — a raw string stays accepted
const coreType: CoreType = CoreType.STAKING
const rawCoreType: CoreType = 'RAMP'
const lowercase: TradingDirection = TradingDirection.BUY
const eventName: WebhookEventName = WebhookEventName.CUSTODY_SENT
const anyEventName: WebhookEventName = 'something.new'
const values: string[] = [AssetState.AVAILABLE, BankDirection.ALL, CoreState.ENABLED, CustomerState.CREATED, IdentityMode.KYC, IdentityState.VALIDATED, Locale.FR, OrderSide.BUY, OrderState.DONE, StakingMovementKind.STAKE, StakingMovementState.COMPLETED, StakingPositionState.ENABLED, TransactionDirection.IN, TransactionSource.BANK, TransactionState.PENDING, WalletState.CREATED, WalletType.USER]

// `Asset` is both the constant and the type of an asset
const asset: Asset = {
  uuid: 'u', state: AssetState.AVAILABLE, iso: 'ETH', label: 'Ethereum', contractAddress: '', baseUnit: 18, gasUnit: 9,
  logo: null, data: '{}',
  fees: { low: null, medium: null, high: null, computed: { gas: '1', native: '1' } },
  ticker: { price: 1, marketcap: 1, rank: 1, percentChange24h: 0 },
  history: { d: [[1, 1]], w: [], m: [], y: [], all: [] },
  network: { uuid: 'n', state: 'ENABLED', caip2: 'eip155:1', label: 'Ethereum', gasBase: 9, data: '{}', type: { uuid: 't', code: 'evm', label: 'EVM', data: '{}' } },
}
const state: AssetState = asset.state
const ticker: AssetTicker = asset.ticker
const assetRef: AssetRef = { uuid: 'a', iso: 'ETH', label: 'Ethereum' }
// an asset is given as a string (`Asset.ETH`, a uuid) or as a model
const assetInputs: AssetInput[] = [Asset.ETH, 'uuid', asset, assetRef]

// Resource methods are typed
const countOf = (r: Page<Asset>): number => r.count + r.items.length
export const list = (): Promise<Page<Asset>> => client.asset.list()
export const getEth = (): Promise<Asset> => client.asset.get(Asset.ETH)
export const getByModel = (): Promise<Asset> => client.asset.get(assetRef)
export const getTicker = (): Promise<{ iso: string, ticker: AssetTicker, history: History }> => client.asset.ticker(Asset.BTC)

// customer: params and results are typed; a UserRef is a uuid / email string or a model carrying a customer's uuid
const createParams: CreateCustomerParams = { account: { email: 'jean@valjean.fr', needActivation: false, notify: false }, group: { manager: 'm' }, locale: Locale.FR, organization: OrganizationCategory.CUSTOMER }
const updateParams: UpdateCustomerParams = { theme: 'dark', locale: Locale.EN, notifications: { newsletter: false } }
// `setup.choosenOrganization` is a string on the API's side: the constants compare, any other value is accepted
const setup: CustomerSetup = { theme: 'light', currency: 'EUR', locale: 'FR', choosenOrganization: OrganizationCategory.B2B, needActivation: false, notify: true }
const legacySetup: CustomerSetup = { ...setup, choosenOrganization: 'something-else' }
const category: string = setup.choosenOrganization
const isB2b: boolean = setup.choosenOrganization === OrganizationCategory.B2B && legacySetup.choosenOrganization !== OrganizationCategory.B2B
export const created = (): Promise<Created> => client.customer.create(createParams)
export const customers = (): Promise<Page<Customer>> => client.customer.list({ offset: 0, limit: 50, includeClosed: true })
export const account = (): Promise<Account> => client.customer.get({ uuid: 'u' })
export const updated = (): Promise<void> => client.customer.update('jean@valjean.fr', updateParams)
// Identity is a discriminated union on `mode`: `form` narrows with it (cast: keep the union, not the narrowed literal)
const identity = { uuid: 'i', state: IdentityState.VALIDATED, mode: IdentityMode.KYB, form: { activity: null, submittedAt: null, score: 0 }, data: { steps: {}, notifications: true, verificationUrl: null }, validatedAt: null, expiresAt: null, renewalNotifiedAt: null } as Identity
const narrowed: string | null = identity.mode === IdentityMode.KYC ? identity.form.source_income : identity.form.activity

// bank: Amount accepts 50 and '50', results are typed
const withdrawParams: BankWithdrawParams = { amount: 50, iban: 'FR76…' }
const creditParams: BankCreditParams = { amount: '50', user: { uuid: 'u' }, reference: 'r' }
export const bankAccount = (): Promise<BankAccount> => client.bank.get('jean@valjean.fr')
export const bankOperations = (): Promise<Page<BankOperation>> => client.bank.operations('u', { direction: BankDirection.DEPOSIT, from: 1, to: 2 })
export const withdrawal = (): Promise<{ transaction: string }> => client.bank.withdraw('u', withdrawParams)
export const credited = (): Promise<Created> => client.bank.credit(creditParams)
const anyAmount: Amount = withdrawParams.amount
// API shapes are assignable to the exported types (`history: {}` before the first cron, then a History)
const bankAcc: BankAccount = { uuid: 'b', message: 'BTGN-1', iban: null, bank: null, bic: null, balance: 0, history: {}, pending: { in: 0, out: 0 } }
const bankAccWithHistory: BankAccount = { ...bankAcc, history: { d: [[1, 1]], w: [], m: [], y: [], all: [] } }
const bankOp: BankOperation = { txId: 't', amount: 10, direction: BankDirection.DEPOSIT, date: 1, info: null }

// custody: Wallet with or without history, both portfolio shapes, both travel rule forms
const wallet: Wallet = { uuid: 'w', state: WalletState.CREATED, type: WalletType.USER, address: '0xabc', addressLegacy: null, tag: null, balance: '0.000000000000000001', asset: assetRef }
const walletWithHistory: Wallet = { ...wallet, history: { d: [], w: [], m: [], y: [], all: [] } }
const newWallet: Wallet = { ...wallet, history: {} }
const portfolio = { history: { d: [], w: [], m: [], y: [], all: [] } } as CustodyPortfolio
const portfolioUuid: string | undefined = 'uuid' in portfolio ? portfolio.uuid : undefined
const person: TravelRule = { firstname: 'Jean', lastname: 'Valjean' }
const platform: TravelRule = { platform: 'x' }
const withdrawCrypto: CustodyWithdrawParams = { asset: Asset.ETH, amount: '0.05', targetAddress: '0xabc', idempotencyKey: 'k', travelRule: person }
export const wallets = (): Promise<Wallet[]> => client.custody.wallets('u')
export const oneWallet = (): Promise<Wallet> => client.custody.wallet({ uuid: 'u' }, wallet.asset)
export const custodyPortfolio = (): Promise<CustodyPortfolio> => client.custody.portfolio('u')
export const cryptoWithdrawal = (): Promise<{ transaction: string | null }> => client.custody.withdraw('u', { ...withdrawCrypto, asset: asset, travelRule: platform })

// trading: buy / sell share the params, list filters are typed, the order and its user are models
const orderUser: OrderUser = { uuid: 'u', login: 'jean@valjean.fr' }
const orderParams: TradingOrderParams = { asset: Asset.ETH, amount: '25.00', reference: 'r1' }
const listParams: TradingListParams = { user: orderUser, direction: TradingDirection.SELL, asset: assetRef, offset: 0, limit: 50 }
const anOrder: Order = {
  uuid: 'o', state: OrderState.DONE, side: OrderSide.BUY, amount: '25.00', reference: null, received: 0.01, executedPrice: 2000, fee: 0.2, completedAt: 1, createdAt: 1,
  user: orderUser, organization: { uuid: 'org', name: 'ACME' }, asset: assetRef,
}
export const bought = (): Promise<{ tunnel: string, state: OrderState }> => client.trading.buy(anOrder.user, orderParams)
export const sold = (): Promise<{ tunnel: string, state: OrderState }> => client.trading.sell({ uuid: 'u' }, { asset: anOrder.asset, amount: '0.5' })
export const order = (): Promise<Order> => client.trading.get('tunnel')
export const orderByModel = (): Promise<Order> => client.trading.get(anOrder)
export const orders = (): Promise<Page<Order>> => client.trading.list(listParams)
const orderState: OrderState = OrderState.FILLED

// transaction / core: API shapes with their nullable branches, named UserSummary / OrganizationSummary
const owner: UserSummary = { uuid: 'u', state: CustomerState.ENABLED, login: 'jean@valjean.fr', account: { firstname: 'Jean', lastname: null, fin: null } }
const org: OrganizationSummary = { uuid: 'org', state: 'ENABLED', name: 'ACME' }
const txBase: Omit<Transaction, 'alert'> = {
  uuid: 't', state: TransactionState.PENDING, source: TransactionSource.CUSTODY, direction: TransactionDirection.IN, asset: 'ETH', amount: 0.5, eurValue: null, reference: null, credited: false, silent: false,
  data: {}, createdAt: 1, updatedAt: 1, owner, assignee: null, organization: { ...org, hub: null },
}
const txNoAlert: Transaction = { ...txBase, alert: null }
const alert: TransactionAlert = {
  uuid: 'al', state: 'OPEN', severity: 'WARNING', type: 'KYT', description: 'd', confidence: 0.9, recommendation: null, factors: null, sources: {},
  history: null, incidentKey: null, createdAt: 1, updatedAt: 1, user: null, assignee: null, organization: null,
}
const txWithAlert: Transaction = { ...txBase, alert }
const txParams: TransactionListParams = { user: owner, status: TransactionState.PENDING, source: TransactionSource.CUSTODY, direction: TransactionDirection.IN, asset: Asset.ETH, offset: 0, limit: 100 }
const stakingCore: Core = { uuid: 'c', state: CoreState.ENABLED, name: 'bitgen_eth', label: 'BITGEN', type: CoreType.STAKING, asset: assetRef, config: [] }
const bankCore: Core = { ...stakingCore, type: CoreType.RAMP, asset: null, config: [{ name: 'n', label: { fr: 'x' }, data: { type: 'string', value: 'v' } }] }
const coreParams: CoreListParams = { type: CoreType.STAKING, asset: stakingCore.asset ?? Asset.ETH, state: CoreState.ENABLED }
export const transactions = (): Promise<Page<Transaction>> => client.transaction.list(txParams)
export const transaction = (): Promise<Transaction> => client.transaction.get('BTGN-REF')
export const transactionByModel = (): Promise<Transaction> => client.transaction.get(txNoAlert)
export const cores = (): Promise<Page<Core>> => client.core.list(coreParams)
export const core = (): Promise<Core> => client.core.get('c')
export const coreByModel = (): Promise<Core> => client.core.get(stakingCore)

// staking: movement (returned by stake) vs position (movement.staking, taken by rewards / unstake) — each by uuid or model
const coreRef: CoreRef = { uuid: 'c', name: 'bitgen_eth', label: 'BITGEN' }
const position: StakingPosition = { uuid: 'p', state: StakingPositionState.CREATED, amount: '2', error: null, data: { rewards: '0.1', lastRewardAt: 1 }, createdAt: 1, updatedAt: 1, core: coreRef }
const movement: StakingMovement = {
  uuid: 'm', state: StakingMovementState.PENDING, kind: StakingMovementKind.STAKE, provider: 'bitgen_eth', amount: '2', createdAt: 1, updatedAt: 1,
  staking: position, owner, asset: assetRef, organization: org,
}
const operation: StakingOperation = { txId: 't', movement: null, asset: 'ETH', kind: StakingMovementKind.STAKE, amount: '2', price: 1, value: 2, event: 'created', provider: 'bitgen_eth', date: 1 }
const otherEvent: StakingOperation = { ...operation, event: 'something-new' }
const stakingPortfolio: StakingPortfolio = { uuid: 'sp', balances: { capital: 1, revenues: 0 }, histories: { capital: { d: [], w: [], m: [], y: [], all: [] }, revenues: { d: [], w: [], m: [], y: [], all: [] } } }
const stakeParams: StakeParams = { asset: movement.asset, amount: '2', provider: movement.staking.core.name }
const stakingList: StakingListParams = { user: movement.owner, direction: StakingMovementKind.STAKE, offset: 0, limit: 50 }
const partial: StakingAmountParams = { amount: 0.5 }
const pageParams: PageParams = { offset: 10, limit: 50 }
export const providers = (): Promise<Page<Core>> => client.staking.providers(Asset.ETH)
export const providersByModel = (): Promise<Page<Core>> => client.staking.providers(movement.asset)
export const staked = (): Promise<Created> => client.staking.stake('u', stakeParams)
export const movements = (): Promise<Page<StakingMovement>> => client.staking.movements(stakingList)
export const oneMovement = (): Promise<StakingMovement> => client.staking.get('m')
export const movementByModel = (): Promise<StakingMovement> => client.staking.get(movement)
export const claimed = (): Promise<void> => client.staking.rewards(movement.staking, partial)
export const unstaked = (): Promise<void> => client.staking.unstake(movement.staking.uuid)
export const stakingOps = (): Promise<Page<StakingOperation>> => client.staking.operations('u', pageParams)
export const stakingPf = (): Promise<StakingPortfolio> => client.staking.portfolio({ uuid: 'u' })

// webhooks: the 11 methods are typed, the envelope narrows on `event`, unknown events stay strings
const webhookType: WebhookType = { uuid: 'w', state: SubscriberState.ENABLED, name: WebhookEventName.CUSTODY_SENT, label: '{"fr":"x"}', data: '{}' }
const subscriber: Subscriber = { uuid: 's', state: SubscriberState.ARCHIVED, updatedAt: 1, webhook: webhookType }
const subscriptions: WebhookSubscriptions = { secret: 'whsec', endpoint: 'https://x', items: [subscriber] }
const deliveryLog: DeliveryLog = { date: 1, webhook: WebhookEventName.CUSTODY_SENT, url: 'https://x', status: 'delivered', http_code: null, duration_ms: null, attempts: 1, payload: {}, error: null }
const verifyInput: VerifyInput = { rawBody: '{}', headers: { 'x-bitgen-signature': 'sha256=…', 'x-bitgen-timestamp': ['1'] }, secret: subscriptions.secret, tolerance: 300 }
export const activated = (): Promise<void> => client.webhooks.activate({ endpoint: 'https://x' })
export const endpointUpdated = (): Promise<void> => client.webhooks.updateEndpoint({ endpoint: 'https://y' })
export const regenerated = (): Promise<void> => client.webhooks.regenerate()
export const subs = (): Promise<WebhookSubscriptions> => client.webhooks.list({ includeArchived: true })
export const subscribed = (): Promise<Created> => client.webhooks.subscribe(WebhookEventName.CUSTODY_SENT)
export const subscribedByModel = (): Promise<Created> => client.webhooks.subscribe(webhookType)
export const archived = (): Promise<void> => client.webhooks.archive(subscriber)
export const reactivated = (): Promise<void> => client.webhooks.reactivate('s')
export const deliveries = (): Promise<Page<DeliveryLog>> => client.webhooks.logs(subscriber, { limit: 50 })
export const catalog = (): Promise<Page<WebhookType>> => client.webhooks.catalog()
export const catalogItem = (): Promise<WebhookType> => client.webhooks.catalogItem(webhookType)
export const verified = (): Promise<WebhookEvent> => client.webhooks.verify(verifyInput)
const knownEvent = { delivery_id: 'd', timestamp: 1, event: WebhookEventName.CUSTODY_SENT, data: null } as WebhookEvent
const eventLabel: string = knownEvent.event === WebhookEventName.CUSTODY_SENT ? 'sent' : knownEvent.event
const customEvent: WebhookEvent = { ...knownEvent, event: 'something.new' }

// apikeys (read-only): nullable hub / owner, both ways; the key by uuid or by model
const apikeyBare: Apikey = { uuid: 'k', state: ApikeyState.ENABLED, name: 'backend', permissions: ['asset.read'], expireAt: 2, createdAt: 1, organization: { uuid: 'o', state: 'ENABLED', name: 'BITGEN', hub: null, owner: null } }
const apikeyFull: Apikey = { ...apikeyBare, state: ApikeyState.REVOKED, organization: { ...apikeyBare.organization, hub: { uuid: 'h', state: 'ENABLED', name: 'Hub', options: {} }, owner: { uuid: 'u', login: 'a@b.c', firstname: 'Ada', lastname: null } } }
const apikeyLog: ApikeyLog = { date: 1, path: 'GET /asset', payload: '{}', status: 200, error: null }
const apikeyList: ApikeyListParams = { offset: 0, limit: 50, includeRevoked: true }
export const keys = (): Promise<Page<Apikey>> => client.apikeys.list(apikeyList)
export const key = (): Promise<Apikey> => client.apikeys.get('k')
export const keyByModel = (): Promise<Apikey> => client.apikeys.get(apikeyFull)
export const keyLogs = (): Promise<Page<ApikeyLog>> => client.apikeys.logs(apikeyBare, { limit: 50 })
const customerState: Customer['state'] = CustomerState.CREATED
const locale: Locale = updateParams.locale ?? Locale.FR

const body: BitgenErrorBody = { error: true, message: 'invalid_amount', code: 400 }
const err = new BitgenError(400, body)
// a UserRef: uuid string, `{ uuid }` (the Created of `customer.create`), a Customer / Account, the user of an Order, the owner of a Transaction / StakingMovement
const refs: UserRef[] = ['u', { uuid: 'u' }, orderUser, owner, movement.owner]

// Type-level probes only — never executed (Env/Asset are frozen at runtime)
export function typeProbes(): void {
  // @ts-expect-error 'prod' is not a BitgenEnv
  const bad: BitgenEnv = 'prod'
  // @ts-expect-error Env is readonly
  Env.PRODUCTION = 'production'
  // @ts-expect-error Asset is readonly
  Asset.ETH = 'eth'
  // @ts-expect-error the constants are readonly
  CoreType.STAKING = 'STAKING'
  // @ts-expect-error 'staking' is not a CoreType (the case matters)
  const badType: CoreType = 'staking'
  // @ts-expect-error http is protected
  client.http
  // @ts-expect-error missing fields
  const partial: Asset = { uuid: 'u' }
  // @ts-expect-error manager is required
  const noManager: CreateCustomerParams = { account: { email: 'a@b.c' }, group: {} }
  // @ts-expect-error group only carries the manager: no organization, no role
  const withRole: CreateCustomerParams = { account: { email: 'a@b.c' }, group: { manager: 'm', role: 'ROLE_USER' } }
  // @ts-expect-error BUSINESS is reserved to platform administrators: only CUSTOMER or B2B
  const business: CreateCustomerParams = { account: { email: 'a@b.c' }, group: { manager: 'm' }, organization: 'BUSINESS' }
  // @ts-expect-error ES is no longer a Locale: FR or EN
  const spanish: CreateCustomerParams = { account: { email: 'a@b.c' }, group: { manager: 'm' }, locale: 'ES' }
  // @ts-expect-error only theme / locale / notifications may be updated
  const extra: UpdateCustomerParams = { email: 'x' }
  // @ts-expect-error a KYC identity has no `activity`
  const wrongForm: Identity = { ...identity, mode: 'KYC' }
  // @ts-expect-error amount is required
  const noAmount: BankWithdrawParams = { iban: 'x' }
  // @ts-expect-error a bank operation never has direction ALL
  const allOp: BankOperation = { ...bankOp, direction: BankDirection.ALL }
  // @ts-expect-error targetAddress is required
  const noTarget: CustodyWithdrawParams = { asset: 'eth', amount: '1' }
  // @ts-expect-error a travel rule is a person OR a platform, never both
  const mixedRule: TravelRule = { platform: 'x', firstname: 'y' }
  // @ts-expect-error direction is lowercase
  const upperDirection: TradingListParams = { direction: 'BUY' }
  // @ts-expect-error asset is required
  const noAsset: TradingOrderParams = { amount: 25 }
  // @ts-expect-error a wallet is not an asset: only an Asset or an AssetRef (or a string)
  const walletAsAsset: AssetInput = wallet
  // @ts-expect-error a wallet is not an order
  client.trading.get(wallet)
  // @ts-expect-error a movement is not a position: `rewards` takes `movement.staking`
  client.staking.rewards(movement)
  // @ts-expect-error a subscription is not an event of the catalogue
  client.webhooks.catalogItem(subscriber)
  // @ts-expect-error a core is not a key
  client.apikeys.get(stakingCore)
  // a UserRef stays structural: `Created` is `{ uuid }`, so any object carrying a uuid is accepted (TypeScript has no nominal types)
  const notACustomer: UserRef = wallet
  // @ts-expect-error BANK is not a core type (RAMP is)
  const badCoreType: CoreListParams = { type: 'BANK' }
  // @ts-expect-error transaction direction is uppercase
  const lowerDirection: TransactionListParams = { direction: 'in' }
  // @ts-expect-error staking direction is an uppercase kind
  const lowerKind: StakingListParams = { direction: 'stake' }
  // @ts-expect-error provider is required
  const noProvider: StakeParams = { asset: 'eth', amount: '1' }
  // @ts-expect-error secret is required
  const noSecret: VerifyInput = { rawBody: '{}', headers: {} }
  console.log(bad, badType, partial, noManager, withRole, business, spanish, extra, wrongForm, noAmount, allOp, noTarget, mixedRule, upperDirection, noAsset, walletAsAsset, notACustomer, badCoreType, lowerDirection, lowerKind, noProvider, noSecret, legacySetup)
}

console.log(JSON.stringify({
  client: client instanceof BitgenClient,
  error: err instanceof BitgenError && err instanceof Error,
  status: err.status,
  code: err.code,
  env: raw,
  eth,
  anyAsset,
  state,
  price: ticker.price,
  count: countOf({ count: 1, items: [asset] }),
  refs: refs.length,
  customerState,
  locale: identity.mode === IdentityMode.KYC ? locale : Locale.FR,
  narrowed,
  anyAmount,
  bankHistories: [Object.keys(bankAcc.history).length, Object.keys(bankAccWithHistory.history).length],
  bankOp: bankOp.direction,
  walletHistory: walletWithHistory.history !== undefined && Object.keys(newWallet.history ?? {}).length === 0,
  portfolioUuid: portfolioUuid ?? null,
  orderState,
  txAlerts: [txNoAlert.alert === null, txWithAlert.alert?.type ?? null],
  coreAssets: [stakingCore.asset?.iso ?? null, bankCore.asset],
  staking: [movement.staking.uuid, otherEvent.event, stakingPortfolio.balances.capital],
  webhooks: [eventLabel, customEvent.event, deliveryLog.http_code],
  apikeys: [apikeyBare.organization.hub, apikeyFull.organization.hub?.name ?? null, apikeyLog.status],
  constants: [coreType, rawCoreType, lowercase, eventName, anyEventName, values.length, assetInputs.length, Object.isFrozen(CoreType), Object.keys(WebhookEventName).length, category, isB2b, apikeyFull.state === ApikeyState.REVOKED, subscriber.state],
}))
