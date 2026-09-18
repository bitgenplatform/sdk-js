# Trading

Trading buys crypto for a customer with the EUR of their bank account, and sells crypto from their custody wallets, through the exchange of the platform. `client.trading` places purchases and sales, reads an order and lists the orders of your organization.

Examples use `client`, a configured `BitgenClient` ([Configuration](../configuration.md)). The customer of an order is designated by a `UserRef` — their uuid, or a model carrying it, not an email ([User references](../concepts.md#user-references)) and must be an `ENABLED` member of your organization: a customer who has not activated their account is refused with `403 user_not_in_scope` ([Activation and identity](../concepts.md#activation-and-identity)).

## Methods

| Method | What it does | Returns |
|---|---|---|
| `buy(user, params)` | Buys crypto with EUR from the customer's bank account | `{ tunnel, state }` |
| `sell(user, params)` | Sells crypto from the customer's custody wallet | `{ tunnel, state }` |
| `get(order)` | Reads one order | `Order` |
| `list(params?)` | Lists the orders of your organization, optionally filtered by customer (`user`), side and asset | `Page<Order>` |

TypeScript types of this resource, exported by the package: `Order`, `OrderUser`, `OrderOrganization`, `TradingOrderParams`, `TradingListParams` — the constants `OrderState`, `OrderSide`, `TradingDirection` (also types) — plus the shared `UserRef`, `AssetRef`, `AssetInput`, `Amount`, `Page`.

## buy

```
client.trading.buy(user: UserRef, params: TradingOrderParams): Promise<{ tunnel: string, state: OrderState }>
```

| Parameter | Type | Description |
|---|---|---|
| `params.asset` | `AssetInput` | The asset to buy, by uuid or ISO code (`Asset.ETH`) or by model ([Assets](../concepts.md#assets)) — it must be `AVAILABLE` |
| `params.amount` | `Amount` | EUR to spend, 2 decimals max; a minimum applies — `416 invalid_amount` below it ([Amounts](../concepts.md#amounts)) |
| `params.reference` | `string` | Optional idempotency key, per customer, side and reference: replaying it returns the existing order |

```ts
import { Asset, OrderState } from '@bitgen/sdk'

const { tunnel, state } = await client.trading.buy('CUSTOMER_UUID', {
  asset: Asset.ETH,
  amount: '25.00',
  reference: 'order-42',
})

const order = await client.trading.get(tunnel)
console.log(order.state === OrderState.DONE, order.received, order.executedPrice)   // true 0.0123 2031.5
```

The API reserves `amount` on the customer's EUR account (`423 insufficient_funds` if the balance is insufficient, `404 unknown_bank` without an EUR account) and creates the order. `tunnel` is its uuid, `state` its initial state.

## sell

```
client.trading.sell(user: UserRef, params: TradingOrderParams): Promise<{ tunnel: string, state: OrderState }>
```

| Parameter | Type | Description |
|---|---|---|
| `params.asset` | `AssetInput` | The asset to sell, by uuid or ISO code (`Asset.ETH`) or by model — it must be `AVAILABLE` |
| `params.amount` | `Amount` | The crypto quantity to sell, as a string, at most the decimals of the asset; the EUR value of the quantity must reach a minimum — `416 invalid_amount` below it ([Amounts](../concepts.md#amounts)) |
| `params.reference` | `string` | Optional idempotency key, per customer, side and reference |

```ts
import { Asset } from '@bitgen/sdk'

const { tunnel } = await client.trading.sell('CUSTOMER_UUID', {
  asset: Asset.ETH,
  amount: '0.01',
})

const order = await client.trading.get(tunnel)
console.log(order.received)   // EUR credited to the bank account once the order is DONE
```

The sale takes the crypto from the customer's custody wallet through an internal transfer to the exchange: the errors of a custody withdrawal can surface ([Custody wallets › Errors](custody.md#errors)), in particular `416 requested_amount_error` for an insufficient crypto balance and `503 custody_vault_unavailable`.

## get

```
client.trading.get(order: string | Order): Promise<Order>
```

`order` is the uuid returned as `tunnel` by `buy` and `sell`, or an `Order`.

```ts
import { OrderSide, OrderState } from '@bitgen/sdk'

const order = await client.trading.get('ORDER_UUID')

console.log(order.side === OrderSide.BUY, order.state === OrderState.DONE)   // true true
```

Returns an `Order`:

| Field | Description |
|---|---|
| `uuid` | The order — the `tunnel` of `buy` / `sell` |
| `state` | A purchase goes `OrderState.REGISTERED` → `EXECUTING` → `FILLED` → `DELIVERING` → `DONE`; a sale `REGISTERED` → `TRANSFERRING` → `DEPOSITED` → `EXECUTING` → `FILLED` → `DONE`. `PARKED`: executed but nothing was received (terminal); `FAILED` |
| `side` | `OrderSide.BUY` or `OrderSide.SELL` |
| `amount` | What was asked, as a string: EUR for a purchase (`"25.00"`), a crypto quantity for a sale |
| `reference` | The idempotency key given, or `null` |
| `received` | What the customer got, or `null`: the crypto quantity for a purchase, the EUR credited for a sale |
| `executedPrice` | The EUR price of the token, or `null` |
| `fee` | Exchange fee, in EUR, or `null` |
| `completedAt`, `createdAt` | Epoch seconds — `completedAt` is `null` until the order completes |
| `user` | `OrderUser`: `{ uuid, login }` — a `UserRef` |
| `organization` | `OrderOrganization`: `{ uuid, name }` |
| `asset` | `AssetRef`: `{ uuid, iso, label }` |

An order outside your organization answers `404 unknown_order`.

## list

```
client.trading.list(params?: TradingListParams): Promise<Page<Order>>
```

The orders of your organization, optionally filtered by customer (`user`), side and asset.

| Parameter | Type | Description |
|---|---|---|
| `params.user` | `UserRef` | Only the orders of this customer (uuid or model; unknown → `404 unknown_user`) |
| `params.direction` | `TradingDirection` | `TradingDirection.BUY` or `TradingDirection.SELL` (lowercase values) — absent, both |
| `params.asset` | `AssetInput` | Only this asset, by ISO code, uuid or model |
| `params.offset`, `params.limit` | `number` | [Pagination](../concepts.md#pagination) |

```ts
import { Asset, TradingDirection } from '@bitgen/sdk'

const { count, items } = await client.trading.list({
  user: 'CUSTOMER_UUID',
  direction: TradingDirection.SELL,
  asset: Asset.ETH,
  offset: 0,
  limit: 50,
})
```

Returns a page of `Order`.

## Errors

In addition to the [common errors](../errors.md#common-errors), and the custody withdrawal errors a sale can surface ([Custody wallets › Errors](custody.md#errors)):

| Status | `code` | Meaning |
|---|---|---|
| `403` | `user_not_in_scope` | The customer is not an `ENABLED` member of your organization |
| `403` | `account_frozen` | The customer's account is frozen |
| `403` | `wallet_frozen` | The customer's wallet is frozen |
| `403` | `kyc_not_validated` | Your organization uses BITGEN's identity verification and the customer's identity is not validated ([Activation and identity](../concepts.md#activation-and-identity)) |
| `403` | `user_actions_disabled` | Customer actions are disabled for your organization (`user_can_actions` flag) |
| `404` | `unknown_bank` | The customer has no EUR account |
| `404` | `unknown_order` | Unknown order, or outside your organization |
| `404` | `unknown_user` | `list`: unknown `user` |
| `412` | `price_unavailable` | No price is available for the asset |
| `412` | `trading_not_enabled` | The `TRADING` connector of your organization is not enabled |
| `412` | `exchange_address_missing` | The deposit address of the exchange is missing |
| `416` | `invalid_amount` | The amount is not valid, or below the minimum |
| `416` | `amount_precision_exceeded` | More decimals than allowed |
| `416` | `amount_below_commission` | The amount does not cover the commission |
| `422` | `invalid_asset` | Unknown asset, or not `AVAILABLE` |
| `423` | `insufficient_funds` | `buy`: insufficient EUR balance |
| `423` | `blocked_by_alert` | An active compliance alert blocks the customer |
| `423` | `bank_lock_unavailable` | The EUR account is locked by a concurrent operation |

## Related

- [Amounts](../concepts.md#amounts) — EUR and crypto amounts, minimums
- [Bank accounts](bank.md) — the EUR account purchases are paid from
- [Custody wallets](custody.md) — the wallets sales take crypto from
- [Assets catalogue](asset.md) — which assets are `AVAILABLE`, their decimals
- [Webhooks](webhooks.md) — `trading.buy`, `trading.sell`
