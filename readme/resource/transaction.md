# Transactions

The transaction journal is the unified, read-only record of the fiat and crypto movements of your organization: bank deposits and withdrawals, custody deposits and withdrawals, and the internal legs of sales and staking. Transactions are created by the platform — never through the API — and referenced by the other resources: `bank.withdraw` and `custody.withdraw` return the uuid of the transaction they create. `client.transaction` lists and reads them.

Examples use `client`, a configured `BitgenClient` ([Configuration](../configuration.md)).

![The lifecycle of a transaction: the compliance analysis, the nominal path of an incoming and of an outgoing transaction, the hold, the freeze, the refusal and the seizure](../media/transaction-lifecycle.svg)

## Methods

| Method | What it does | Returns |
|---|---|---|
| `list(params?)` | Lists the transactions of your organization | `Page<Transaction>` |
| `get(transaction)` | Reads one transaction, by uuid or reference | `Transaction` |

TypeScript types of this resource, exported by the package: `TransactionAlert`, `Transaction`, `TransactionListParams` — the constants `TransactionState`, `TransactionSource`, `TransactionDirection` (also types) — plus the shared `UserRef`, `UserSummary`, `OrganizationSummary`, `OrganizationHub`, `AssetInput`, `Page`.

## List

```
client.transaction.list(params?: TransactionListParams): Promise<Page<Transaction>>
```

| Parameter | Type | Description |
|---|---|---|
| `params.user` | `UserRef` | Only the transactions of this customer (uuid or model; unknown → `404 unknown_user`) |
| `params.status` | `TransactionState` | Only this state: `TransactionState.ANALYZING`, `PENDING`, `COMPLETED`, `FROZEN`, `FAILED`, `TRANSFERING` or `SEIZED` — anything else → `400 invalid_transaction_state` |
| `params.source` | `TransactionSource` | `TransactionSource.BANK` or `TransactionSource.CUSTODY` |
| `params.direction` | `TransactionDirection` | `TransactionDirection.IN` or `TransactionDirection.OUT` |
| `params.asset` | `AssetInput` | Only this asset, by ISO code (`Asset.ETH`), uuid or model |
| `params.offset`, `params.limit` | `number` | [Pagination](../concepts.md#pagination) — `limit` up to 100 on this list |

```ts
import { Asset, TransactionDirection, TransactionSource, TransactionState } from '@bitgen/sdk'

const { count, items } = await client.transaction.list({
  user: 'CUSTOMER_UUID',
  status: TransactionState.PENDING,
  source: TransactionSource.CUSTODY,
  direction: TransactionDirection.IN,
  asset: Asset.ETH,
  offset: 0,
  limit: 100,
})

for (const transaction of items) {
  console.log(transaction.direction, transaction.asset, transaction.amount, transaction.state)
}
```

Returns a page of `Transaction`.

## Get

```
client.transaction.get(transaction: string | Transaction): Promise<Transaction>
```

`transaction` is the uuid of the transaction, its `reference`, or a `Transaction` of `list()`.

```ts
import { TransactionState } from '@bitgen/sdk'

const { transaction } = await client.bank.withdraw('CUSTOMER_UUID', { amount: '50.00' })

const withdrawal = await client.transaction.get(transaction)
console.log(withdrawal.state === TransactionState.PENDING)   // true
```

Returns a `Transaction`:

| Field | Description |
|---|---|
| `uuid` | The transaction |
| `state` | `TransactionState.ANALYZING`, `PENDING`, `COMPLETED`, `FROZEN`, `FAILED`, `TRANSFERING` or `SEIZED` — the cycle is below the table |
| `source` | `TransactionSource.BANK` (EUR) or `TransactionSource.CUSTODY` (crypto) |
| `direction` | `TransactionDirection.IN` or `TransactionDirection.OUT` |
| `asset` | The asset iso — `EUR` for bank transactions |
| `amount` | The amount, in that asset (a number — for crypto, the exact amount is the string held by the custody wallet) |
| `eurValue` | EUR value when recorded, or `null` |
| `reference` | The reference, or `null` |
| `credited` | For an incoming transaction: `true` once the EUR account or the wallet has actually been credited, right after `COMPLETED` |
| `silent` | `true` for an internal leg (staking, sale) that is not an operation of the customer |
| `data` | Additional context set by the platform (compliance details, internal flags) — varies with the transaction, not needed for an integration |
| `createdAt`, `updatedAt` | Epoch seconds |
| `owner` | The customer, a `UserSummary`: `{ uuid, state, login, account: { firstname, lastname, fin } }` — a `UserRef` — or `null` |
| `assignee` | The compliance officer assigned while the transaction is on hold (`PENDING`, `FROZEN`), same shape as `owner`; `null` otherwise |
| `organization` | `OrganizationSummary` with its `hub`: `{ uuid, state, name, hub }` — `hub` is the hub the organization belongs to (`OrganizationHub`, `{ uuid, name }`, or `null`) — or `null` |
| `alert` | The compliance alert attached to the transaction (`TransactionAlert`), or `null`: `uuid`, `state` (`OPEN`, `RESOLVED`, `DISMISSED`, `DECLARATED`, `CONFIRMED`), `severity` (`SUCCESS`, `WARNING`, `CRITICAL`), `type` (`KYT`, `KYC_EXPIRE`, `SUSPICIOUS_ACTIVITY`, `AML`, `SANCTIONS`), `description`, `confidence` (confidence of the analysis, 0–100), `recommendation` (suggested action), `factors` (elements that weighed in the analysis), `sources` (the observations analysed), `history` (state changes of the alert), `incidentKey` (groups the alerts of a same incident), `createdAt`, `updatedAt`, `user` (the customer), `assignee` (the compliance officer), `organization` |

An unknown uuid or reference, or a transaction outside your organization, answers `404 unknown_transaction`.

Every transaction is born `ANALYZING`, the compliance analysis — the internal legs too. A clean verdict sends an incoming transaction to `COMPLETED`, then the EUR account or the wallet is credited; an outgoing one to `TRANSFERING` — the wire or the on-chain send executes — then `COMPLETED` at its confirmation. An alert, or a crypto deposit on a frozen wallet, holds it in `PENDING`: an `alert` is attached and the compliance of your organization becomes the `assignee`. The compliance then freezes it (`PENDING` → `FROZEN`), validates it (`PENDING` or `FROZEN` → `COMPLETED` for an incoming transaction, `TRANSFERING` for an outgoing one; the alert is `RESOLVED`), refuses it (`PENDING` or `FROZEN` → `FAILED`) or seizes it (`FROZEN` → `SEIZED`); an execution that fails also ends `FAILED` (`TRANSFERING` → `FAILED`). `COMPLETED`, `FAILED` and `SEIZED` are terminal. A failed incoming transaction was never credited; a failed outgoing one releases its reserve or re-credits the wallet. Two exceptions appear in the list: a crypto deposit that failed on chain is recorded `FAILED` right away, and the return or the seizure of a refused or seized deposit is a separate outgoing transaction, born `TRANSFERING`. The internal legs (`silent`) go through the analysis like the others and send no event.

## Errors

In addition to the [common errors](../errors.md#common-errors):

| Status | `code` | Meaning |
|---|---|---|
| `400` | `invalid_transaction_state` | `status` is not one of the transaction states |
| `404` | `unknown_user` | `list`: unknown `user` |
| `404` | `unknown_transaction` | Unknown uuid or reference, or outside your organization |

## Related

- [Bank accounts](bank.md) — EUR withdrawals return a transaction uuid
- [Custody wallets](custody.md) — on-chain withdrawals return a transaction uuid
- [Pagination](../concepts.md#pagination) — `limit` up to 100 on this list
- [Webhooks](webhooks.md) — `bank.transaction`, `custody.transaction`, `alert.opened`, `alert.status`
