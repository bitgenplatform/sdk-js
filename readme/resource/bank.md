# Bank accounts

Every customer has an EUR account on the BITGEN platform: a **ledger** of the EUR they hold with the bank provider of your organization — the provider receives their bank transfers and pays their withdrawals to their IBAN, BITGEN keeps the account and notifies you ([Following a deposit and a withdrawal](../concepts.md#following-a-deposit-and-a-withdrawal)). The balance pays their purchases and is credited by their sales. `client.bank` reads the account and its operations, withdraws EUR, and credits deposits.

Examples use `client`, a configured `BitgenClient` ([Configuration](../configuration.md)). A customer is designated by a `UserRef`: their uuid, or a model carrying it, such as the `Created` returned by `client.customer.create` ([User references](../concepts.md#user-references)). The customer must belong to your organization and be activated, otherwise the API answers `404 unknown_bank` ([Activation and identity](../concepts.md#activation-and-identity)).

## Methods

| Method | What it does | Returns |
|---|---|---|
| `get(user)` | Reads the EUR account of a customer — creates it on first read | `BankAccount` |
| `operations(user, params?)` | Lists the EUR operations of a customer | `Page<BankOperation>` |
| `withdraw(user, params)` | Withdraws EUR to the customer's IBAN | `{ transaction }` |
| `credit(params)` | Credits an EUR deposit to a customer's account | `Created` (the deposit) |

TypeScript types of this resource, exported by the package: `BankAccount`, `BankOperation`, `BankOperationsParams`, `BankWithdrawParams`, `BankCreditParams` — the constant `BankDirection` (also a type) — plus the shared `UserRef`, `Created`, `Amount`.

## Get

```
client.bank.get(user: UserRef): Promise<BankAccount>
```

The account is created on first read — if your organization uses BITGEN's identity verification, the customer's identity must be validated first ([Activation and identity](../concepts.md#activation-and-identity)). The `message` of the account is the reference the customer must indicate on their bank transfers.

```ts
const account = await client.bank.get('CUSTOMER_UUID')

// 1. Give the customer the reference to put on their wire transfer
console.log(account.message)   // 'BTGN…'

// 2. Once the transfer is received, the balance is credited
console.log(account.balance)   // 150
console.log(account.pending)   // { in: 0, out: 0 }
```

Returns a `BankAccount`:

| Field | Description |
|---|---|
| `uuid` | The account |
| `message` | The wire transfer reference the customer must indicate (`BTGN` prefix) |
| `iban`, `bank`, `bic` | The customer's bank details, `null` until set — `withdraw` can set them |
| `balance` | EUR balance (number) |
| `pending` | `{ in, out }` — `in`: reported deposits not credited yet (BITGEN processing and compliance analysis); `out`: withdrawals requested and purchase reserves, not settled yet |
| `history` | EUR balance curve, a `History` ([Timestamps and histories](../concepts.md#timestamps-and-histories)); `{}` until the hourly computation has run for this account |

## Operations

```
client.bank.operations(user: UserRef, params?: BankOperationsParams): Promise<Page<BankOperation>>
```

| Parameter | Type | Description |
|---|---|---|
| `params.direction` | `BankDirection` | `BankDirection.ALL` (default), `DEPOSIT`, `WITHDRAWAL`, `PURCHASE` or `SELL` — an unknown value means `ALL` |
| `params.from`, `params.to` | `number` | Epoch seconds; both together, otherwise ignored |
| `params.offset`, `params.limit` | `number` | [Pagination](../concepts.md#pagination) |

```ts
import { BankDirection } from '@bitgen/sdk'

const { count, items } = await client.bank.operations('CUSTOMER_UUID', {
  direction: BankDirection.DEPOSIT,
  from: 1700000000,
  to: 1702592000,
  offset: 0,
  limit: 50,
})

for (const operation of items) {
  console.log(operation.date, operation.direction === BankDirection.DEPOSIT, operation.amount)   // 1701000000 true 150
}
```

Returns a page of `BankOperation`: `txId` (identifier of the ledger entry), `amount` (EUR, number), `direction` (`BankDirection.DEPOSIT`, `WITHDRAWAL`, `PURCHASE` or `SELL` — never `ALL`), `date` (epoch seconds), `info` (free label of the operation — for instance the asset bought or sold — or `null`).

## Withdraw

```
client.bank.withdraw(user: UserRef, params: BankWithdrawParams): Promise<{ transaction: string }>
```

| Parameter | Type | Description |
|---|---|---|
| `params.amount` | `Amount` | EUR, rounded to 2 decimals ([Amounts](../concepts.md#amounts)) |
| `params.iban`, `params.bank`, `params.bic` | `string` | Optional: update the customer's bank details before the withdrawal |

```ts
const { transaction } = await client.bank.withdraw('CUSTOMER_UUID', {
  amount: '50.00',
  iban: 'FR76…',      // optional, sets or replaces the customer's bank details
  bic: 'BNPAFRPP',
})

const movement = await client.transaction.get(transaction)   // follow the withdrawal in the transaction journal
```

The withdrawal goes to the customer's IBAN: the amount is reserved in `pending.out` and debited from the balance when the provider confirms the wire; the event `bank.debited` reports it then, with `amount`, `fee` and `net` — what the customer receives ([Following a deposit and a withdrawal](../concepts.md#following-a-deposit-and-a-withdrawal)). The account must have bank details (`412 bank_rib_required`), a sufficient balance (`416 requested_amount_error`) and an amount above the fee (`416 amount_below_fee`). `transaction` identifies the withdrawal — its `Transaction` in the journal ([Transactions](transaction.md)).

![An EUR withdrawal: the reserve on the ledger, the compliance analysis, the wire from the organization account to the customer IBAN, the debit at confirmation](../media/withdrawal-flow.svg)

## Credit

```
client.bank.credit(params: BankCreditParams): Promise<Created>
```

`credit` only applies when your organization's bank provider is **manual** — deposits are not reported to BITGEN automatically: you tell BITGEN a wire has arrived on the organization's account. The amount enters `pending.in`, goes through BITGEN's processing and the compliance analysis, and the account is credited then — `bank.credited` at that moment ([Following a deposit and a withdrawal](../concepts.md#following-a-deposit-and-a-withdrawal)). With an automated provider, deposits are detected and credited automatically and you are notified by the `bank.credited` webhook ([Webhooks](webhooks.md)) — do not call `credit`: the API refuses it (`412 deposit_reported_by_provider`). The account is designated either by the customer (`user`) or by the wire transfer reference of the account (`message`).

| Parameter | Type | Description |
|---|---|---|
| `params.amount` | `Amount` | EUR ([Amounts](../concepts.md#amounts)) |
| `params.currency` | `'EUR'` | Optional |
| `params.user` | `UserRef` | The customer — or `message` |
| `params.message` | `string` | The wire transfer reference of the account (`BTGN…`) — or `user` |
| `params.reference` | `string` | The bank's transfer reference — it makes the call idempotent: calling twice with the same reference declares once (and returns the same `uuid`) |

```ts
const { uuid } = await client.bank.credit({
  amount: '100.00',
  user: 'CUSTOMER_UUID',
  reference: 'BANK-TRANSFER-REF-42',   // the bank's transfer reference: credited once, however many times it is sent
})
```

Returns a `Created` — the `uuid` of the declared deposit: the incoming movement, not credited yet. Without `user` nor `message`, the API answers `400 bank_target_required`.

![An EUR deposit: the wire to the organization account at the bank provider, its report, the matching by reference, the compliance analysis, the credit of the ledger](../media/deposit-flow.svg)

## Errors

In addition to the [common errors](../errors.md#common-errors):

| Status | `code` | Meaning |
|---|---|---|
| `400` | `invalid_amount` | The amount is not valid |
| `400` | `bank_target_required` | `credit` without `user` nor `message` |
| `400` | `invalid_currency` | `credit` with a currency other than `EUR` |
| `403` | `user_actions_disabled` | Customer actions are disabled for your organization (`user_can_actions` flag) |
| `404` | `unknown_bank` | The customer is not an activated member of your organization, or the account was not found |
| `404` | `unknown_organization` | `credit`: the organization is unknown |
| `412` | `owner_identity_not_validated` | Your organization uses BITGEN's identity verification and the customer's identity is not validated: the account cannot be created |
| `412` | `bank_rib_required` | `withdraw` without an IBAN or a bank on the account |
| `412` | `ramp_not_enabled` | The `CoreType.RAMP` (bank) connector of your organization is not enabled |
| `412` | `deposit_reported_by_provider` | `credit` on an automated bank provider: deposits are reported by the provider itself |
| `412` | `trading_not_enabled` | The `CoreType.TRADING` connector of your organization is not enabled |
| `416` | `requested_amount_error` | Insufficient balance |
| `416` | `amount_below_fee` | The amount does not cover the fee |
| `422` | `invalid_iban` | The IBAN is not valid |
| `423` | `account_frozen` | The customer's account is frozen |
| `423` | `blocked_by_alert` | An active compliance alert blocks the customer |
| `423` | `bank_lock_unavailable` | The account is locked by a concurrent operation (creation, withdrawal) |

## Related

- [Following a deposit and a withdrawal](../concepts.md#following-a-deposit-and-a-withdrawal) — who holds the funds, what the ledger shows, when the events are sent
- [Amounts](../concepts.md#amounts) — EUR amounts as strings, 2 decimals
- [Trading](trading.md) — purchases paid from the EUR balance, sales credited to it
- [Transactions](transaction.md) — the journal where withdrawals appear
- [Webhooks](webhooks.md) — `bank.credited`, `bank.debited`, `bank.transaction`
