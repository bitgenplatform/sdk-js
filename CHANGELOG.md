## [1.0.6] - 2026-09-23

### Changed
- Documentation only, no code change. `readme/resource/bank.md`: `credit` on a provider that reports the deposit itself answers `201` with an empty body and no `uuid` (it answered `202` before) — `uuid` is `undefined`, the movement appears in `pending.in` a second later
- `readme/resource/trading.md`: new `429 daily_buy_limit_exceeded` on `buy` — **sandbox only**, purchases are capped per customer and per calendar day because the sandbox buys with test tokens. No such cap exists in production

## [1.0.4] - 2026-09-18

### Changed
- Documentation only, no code change. Ten diagrams in `readme/media/` (shipped with the package): the states of a purchase and of a sale, the activation and identity of a customer, the receiving of a webhook delivery, the movement and the position of a staking, the lifecycle of a transaction, the path of a purchase, of a sale, of an EUR deposit and of an EUR withdrawal
- `readme/concepts.md`: two new sections, `Following a purchase and a sale` and `Following a deposit and a withdrawal` — where the money goes, resource by resource, and what your organization reads afterwards
- Resource pages aligned with the platform's behaviour: `trading` — from which states an order reaches `FAILED` or `PARKED`, and what happens to the money; `staking` — one movement per position, rewritten `UNSTAKE` on a full exit, the cycle of the position, what `rewards` and `unstake` change, the events of the operations journal (`validated`, `failed`, `canceled`, `reward`, `claim`, `closed`) and their `movement`; `transaction` — the lifecycle of a transaction and `credited` for incoming transactions; `bank` — the bank provider holds the funds and BITGEN keeps the ledger, a declared deposit is credited after processing and compliance analysis, a withdrawal is reserved then debited at the confirmation of the wire, `pending.in` and `pending.out`
- Section titles of the resource pages start with a capital letter (`## Get`, `## Wallets`, `## UpdateEndpoint`…); anchors are unchanged

## [1.0.2] - 2026-09-17

### Added
- Constants for every value the API enumerates, exported as frozen objects with a type of the same name: `ApikeyState`, `AssetState`, `BankDirection`, `CoreState`, `CoreType`, `CustomerState`, `IdentityMode`, `IdentityState`, `Locale`, `OrderSide`, `OrderState`, `OrganizationCategory`, `StakingMovementKind`, `StakingMovementState`, `StakingPositionState`, `SubscriberState`, `TradingDirection`, `TransactionDirection`, `TransactionSource`, `TransactionState`, `WalletState`, `WalletType`, `WebhookEventName` — `CreateCustomerParams.organization`, `Apikey.state`, `Subscriber.state` and `WebhookType.state` are typed with them (`CustomerSetup.choosenOrganization` stays open: `OrganizationCategory | string`)
- Typed references: wherever a method expects the uuid of something the SDK returns, it also accepts the model and sends its uuid — `UserRef` is `string | Created | Customer | Account | UserSummary | OrderUser`; assets take `AssetInput` (`string | Asset | AssetRef`); `trading.get(string | Order)`, `transaction.get(string | Transaction)`, `core.get(string | Core)`, `staking.get(string | StakingMovement)`, `staking.rewards` / `unstake(string | StakingPosition)`, `webhooks.subscribe` / `catalogItem(string | WebhookType)`, `webhooks.archive` / `reactivate` / `logs(string | Subscriber)`, `apikeys.get` / `logs(string | Apikey)`
- Types `Created`, `AssetRef`, `AssetInput`, `UserSummary`, `OrganizationSummary`, `OrganizationHub`, `OrderUser`, `OrderOrganization`, `CoreRef`; `customer.create`, `bank.credit`, `staking.stake` and `webhooks.subscribe` return a `Created`

### Changed
- `Locale` is `FR` or `EN` — `ES` and `DE` are gone: the API knows no other value (anything else falls back to `FR` on its side)
- `host` must be a bare hostname (letters, digits, `.`, `-`, `_`): credentials, query, fragment, brackets and spaces are refused
- An empty `asset` — or a model without uuid — is refused with a `TypeError` before any request, in request bodies too (`trading.buy` / `sell`, `custody.withdraw`, `staking.stake`); in the lists, `asset: null` means no filter, like `user: null`
- `Wallet.history` is typed `History | {}`: `{}` on a new wallet until its curve has been computed, as the API answers
- Documentation: the SDK's methods, types and constants — no API routes; constants instead of string literals; minimums stated with their error code, without figures

## [1.0.1] - 2026-09-16

### Changed
- `User-Agent` header is now `bitgen-sdk-nodejs/<version>` (was `bitgen-sdk/<version>`)

## [1.0.0] - 2026-09-16

### Breaking
- Targets the BITGEN API v4: no more `/api/v3` prefix, real HTTP status codes
- `BitgenError` exposes `status` (the HTTP status) and `code` (the stable error code); `service`, `module` and `apiMessage` are removed
- Requires Node.js 20 or later
- Every resource method is `async`: an invalid argument rejects the returned promise with a `TypeError` (the constructor stays synchronous)
- The 0.1.x resources are replaced by the ones below

### Added
- `customer` resource: `create` (with the `needActivation` / `notify` options), `list`, `get`, `update`
- `bank` resource: `get`, `operations`, `withdraw`, `credit`
- `custody` resource: `wallets`, `wallet`, `portfolio`, `withdraw`
- `trading` resource: `buy`, `sell`, `get`, `list`
- `transaction` resource: `list`, `get`
- `staking` resource: `providers`, `stake`, `list`, `movements`, `get`, `rewards`, `unstake`, `operations`, `portfolio`
- `core` resource: `list`, `get`
- `webhooks` resource: `activate`, `updateEndpoint`, `regenerate`, `list`, `subscribe`, `archive`, `reactivate`, `logs`, `catalog`, `catalogItem`, `verify`
- `apikeys` resource: `list`, `get`, `logs`
- `asset` resource: `list`, `get`, `tickers`, `ticker`
- `Env` (`PRODUCTION`, `SANDBOX`) and `Asset` (`BTC`, `ETH`, `USDC`, `XRP`, `SOL` — provisional list) constants, usable from JavaScript and TypeScript
- `Page<T>` and `PageParams` types for paginated lists (`{ count, items }`, `offset` / `limit`)
- `Amount` type: amounts accept `string | number` and are always sent as strings
- `Identity` type as a union discriminated on `mode` (`KycIdentity | KybIdentity`)
- `timeout` option, in seconds (default `30`, `0` disables)
- `request_timeout` / `network_error` errors (`status: 0`, native error in `cause`)
- `webhooks.verify`: HMAC verification of a received delivery (raw bytes, constant time, anti-replay window)
- `User-Agent: bitgen-sdk/<version>` header on every request
- `BitgenError.toJSON()`, and `instanceof` reliable when the ESM and CommonJS builds are both loaded

## [0.1.6] - 2026-03-22

### Changed
- Added `isSsl` config option (default `true`) for custom host mode
- Localhost default port changed from `80` to `14303`

## [0.1.5] - 2026-03-22

### Changed
- Sandbox URL updated from `api.btgn.dev` to `api.staging.btgn.dev`
- Removed `dist/` from repository (built by CI on release)

## [0.1.3] - 2026-03-11

### Changed
- `BitgenRawError` removed — `transaction.create()` now throws `BitgenError` like all other methods

### Breaking
- `BitgenRawError` is no longer exported