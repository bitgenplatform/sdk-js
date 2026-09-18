# Custody wallets

A custody wallet holds the crypto of a customer for one asset, at the custodian of the platform: a deposit address the customer sends funds to, an exact balance, and on-chain withdrawals to external addresses. `client.custody` lists and reads the wallets of a customer, provisions them, reads the EUR value of their custody, and withdraws.

Examples use `client`, a configured `BitgenClient` ([Configuration](../configuration.md)). A customer is designated by a `UserRef`: their uuid, or a model carrying it, such as the `Created` returned by `client.customer.create` ([User references](../concepts.md#user-references)). `wallets` and `wallet` also take the uuid of your organization (your `scope`) to read its treasury wallets (`type` `WalletType.TREASURY`, read-only); `portfolio` and `withdraw` are for customers only. A customer who is not an activated member of your organization is refused with `403 org_forbidden` ([Activation and identity](../concepts.md#activation-and-identity)); another organization, with `403 cross_org_forbidden`.

## Methods

| Method | What it does | Returns |
|---|---|---|
| `wallets(user)` | Lists the wallets of a customer, or of your organization | `Wallet[]` |
| `wallet(user, asset)` | Reads one wallet with its EUR value curve — provisions it on first read | `Wallet` |
| `portfolio(user)` | Reads the EUR value curve of the whole custody of a customer | `CustodyPortfolio` |
| `withdraw(user, params)` | Sends crypto from a wallet to an external address | `{ transaction }` |

TypeScript types of this resource, exported by the package: `Wallet`, `CustodyPortfolio`, `TravelRule`, `CustodyWithdrawParams` — the constants `WalletState`, `WalletType` (also types) — plus the shared `UserRef`, `AssetRef`, `AssetInput`, `Amount`.

## Wallets

```
client.custody.wallets(user: UserRef): Promise<Wallet[]>
```

```ts
const wallets = await client.custody.wallets('CUSTOMER_UUID')

for (const wallet of wallets) {
  console.log(wallet.asset.iso, wallet.balance, wallet.address)   // 'ETH' '0.5' '0xabc…'
}

const treasury = await client.custody.wallets('YOUR_SCOPE_UUID')   // the treasury wallets of your organization
```

Returns the wallets without their `history`:

| Field | Description |
|---|---|
| `uuid` | The wallet |
| `state` | `WalletState.CREATED` or `WalletState.FROZEN` |
| `type` | `WalletType.USER` for a customer, `WalletType.TREASURY` for your organization |
| `address` | The deposit address (or `null`) |
| `addressLegacy` | The same deposit address in the legacy format of the chain, for networks that have two address formats; `null` otherwise |
| `tag` | The memo / tag of the address, for the assets that use one (XRP, XLM…) — or `null` |
| `balance` | The exact quantity, as a string |
| `asset` | `AssetRef`: `{ uuid, iso, label }` ([Assets](../concepts.md#assets) — compare `iso` case-insensitively) |
| `history` | Only on `wallet`: the EUR value curve, a `History` ([Timestamps and histories](../concepts.md#timestamps-and-histories)) — `{}` on a new wallet until the curve has been computed |

## Wallet

```
client.custody.wallet(user: UserRef, asset: AssetInput): Promise<Wallet>
```

| Parameter | Type | Description |
|---|---|---|
| `asset` | `AssetInput` | The asset, by uuid or ISO code (`Asset.ETH`) or by model ([Assets](../concepts.md#assets)) — never the uuid of the wallet |

```ts
import { Asset } from '@bitgen/sdk'

const wallet = await client.custody.wallet('CUSTOMER_UUID', Asset.ETH)

// Show the customer where to send their ETH
console.log(wallet.address)         // '0xabc…'
console.log(wallet.tag)             // null — a memo / tag only for assets that need one
console.log(wallet.balance)         // '0.5'
console.log(wallet.history?.d)      // EUR value over the last 24 hours — only on this unit read
```

When the customer has no wallet for this asset yet, the API **provisions** it: a deposit address is created at the custodian. The customer must be activated, not frozen (`403 account_frozen`), with a validated identity if your organization uses BITGEN's identity verification (`403 kyc_not_validated` — [Activation and identity](../concepts.md#activation-and-identity)) and no active compliance alert (`423 blocked_by_alert`). Returns the `Wallet` with its `history`.

## Portfolio

```
client.custody.portfolio(user: UserRef): Promise<CustodyPortfolio>
```

```ts
const portfolio = await client.custody.portfolio('CUSTOMER_UUID')

console.log(portfolio.history.m)   // EUR value of the custody, one point per day over the last month
```

Returns `{ uuid, type, history }` — `uuid` is the custody account of the customer, `type` is `WalletType.USER` (a customer) or `WalletType.TREASURY` (the organization) — or a flat `{ history }` at zero while the customer has no custody. Customers only: your organization's uuid is refused with `415 custody_portfolio_treasury_unsupported`.

## Withdraw

```
client.custody.withdraw(user: UserRef, params: CustodyWithdrawParams): Promise<{ transaction: string | null }>
```

| Parameter | Type | Description |
|---|---|---|
| `params.asset` | `AssetInput` | The asset, by uuid or ISO code (`Asset.ETH`) or by model |
| `params.amount` | `Amount` | The quantity to send, as a string: more than 0, at most the decimals of the asset (`baseUnit`) — sent untouched; the EUR value of the quantity must reach a minimum — `416 withdraw_below_minimum` below it ([Amounts](../concepts.md#amounts)) |
| `params.targetAddress` | `string` | The destination address |
| `params.targetTag` | `string` | The destination memo / tag, for the assets that need one |
| `params.idempotencyKey` | `string` | Optional, 64 characters max, unique per customer: replaying the same key returns the same transaction |
| `params.travelRule` | `TravelRule` | Optional travel rule information on the destination: a person `{ firstname?, lastname?, address? }` **or** a platform `{ platform }` — one form or the other, 255 characters max per field |

```ts
import { Asset } from '@bitgen/sdk'

const { transaction } = await client.custody.withdraw('CUSTOMER_UUID', {
  asset: Asset.ETH,
  amount: '0.05',                   // string: up to 18 decimals, sent as is — above the asset's minimum (see Errors)
  targetAddress: '0xabc…',
  idempotencyKey: 'withdraw-42',
  travelRule: { platform: 'Kraken' },   // or { firstname: 'Jean', lastname: 'Valjean', address: '…' }
})

if (transaction !== null) {
  const movement = await client.transaction.get(transaction)   // follow it in the transaction journal
}
```

Customers only: your organization's uuid is refused with `415 custody_treasury_withdraw_unsupported`. The EUR value of the withdrawal must reach the minimum (`416 withdraw_below_minimum` — [Amounts](../concepts.md#amounts)). Returns the uuid of the `Transaction` created for the withdrawal ([Transactions](transaction.md)) — `null` while the analysis has not created it yet.

## Errors

In addition to the [common errors](../errors.md#common-errors):

| Status | `code` | Meaning |
|---|---|---|
| `400` | `invalid_amount` | The amount is not valid |
| `400` | `invalid_travel_rule` | `travelRule` mixes the two forms, or a field is too long |
| `403` | `org_forbidden` | The customer is not an activated member of your organization |
| `403` | `cross_org_forbidden` | The uuid belongs to another organization |
| `403` | `account_frozen` | The customer's account is frozen |
| `403` | `kyc_not_validated` | Your organization uses BITGEN's identity verification and the customer's identity is not validated ([Activation and identity](../concepts.md#activation-and-identity)) |
| `403` | `wallet_frozen` | The wallet is frozen |
| `403` | `user_actions_disabled` | Customer actions are disabled for your organization (`user_can_actions` flag) |
| `404` | `unknown_asset` | Unknown asset — the wallet uuid is not accepted |
| `404` | `unknown_organization` | The organization is unknown |
| `404` | `withdraw_organization_unresolved` | The organization of the withdrawal is unresolved |
| `409` | `duplicate_withdraw` | Duplicate withdrawal |
| `412` | `custody_not_enabled` | The `CUSTODY` connector of your organization is not enabled |
| `415` | `custody_portfolio_treasury_unsupported` | `portfolio` on your organization |
| `415` | `custody_treasury_withdraw_unsupported` | `withdraw` on your organization |
| `416` | `amount_precision_exceeded` | More decimals than the asset allows |
| `416` | `withdraw_below_minimum` | The EUR value of the quantity is below the minimum |
| `416` | `withdraw_price_unavailable` | No price is available to value the withdrawal |
| `416` | `requested_amount_error` | Insufficient balance |
| `416` | `custody_vault_insufficient` | The custody vault is insufficient |
| `416` | `withdraw_target_too_long` | `targetAddress` is too long |
| `422` | `withdraw_target_invalid` | `targetAddress` is not valid |
| `422` | `withdraw_target_tag_required` | The asset needs a `targetTag` |
| `422` | `withdraw_target_address_required` | `targetAddress` is missing |
| `422` | `invalid_idempotency_key` | `idempotencyKey` is not valid (64 characters max) |
| `422` | `asset_not_supported` | The custodian does not support this asset |
| `422` | `asset_address_unavailable` | No deposit address is available for this asset |
| `423` | `blocked_by_alert` | An active compliance alert blocks the customer |
| `423` | `custody_lock_unavailable` | The custody is locked by a concurrent operation |
| `503` | `custody_vault_unavailable` | The custodian's vault is unavailable |
| `503` | `custody_gas_unavailable` | Gas is unavailable at the custodian |
| `503` | `custody_address_unverifiable` | The destination address could not be verified |

## Related

- [Assets](../concepts.md#assets) — uuid or ISO code, case
- [Amounts](../concepts.md#amounts) — crypto amounts as strings, minimums
- [Assets catalogue](asset.md) — the decimals (`baseUnit`) and state of each asset
- [Trading](trading.md) — sales take crypto from custody
- [Staking](staking.md) — staking moves crypto from custody to the provider
- [Transactions](transaction.md) — the journal where deposits and withdrawals appear
- [Webhooks](webhooks.md) — `custody.wallet.created`, `custody.received`, `custody.sent`, `custody.transaction`
