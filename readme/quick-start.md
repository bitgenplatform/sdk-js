# Quick start

Create the client once, then run a first journey: create a customer, read their EUR account, open a wallet, buy crypto.

## 1. Create the client

```ts
import { BitgenClient, Env } from '@bitgen/sdk'

const client = new BitgenClient({
  scope: 'YOUR_SCOPE_UUID',   // uuid of the organization that owns the key
  apiKey: 'YOUR_API_KEY',
  env: Env.SANDBOX,           // Env.PRODUCTION by default
})
```

One instance per API key, reused for every call. `scope`, `apiKey`, environments and the other options are detailed in [Configuration](configuration.md).

## 2. Create a customer

```ts
import { Locale } from '@bitgen/sdk'

const customer = await client.customer.create({
  account: { email: 'jean@valjean.fr', firstname: 'Jean', lastname: 'Valjean' },
  group: { manager: 'MANAGER_UUID' },   // the collaborator of your organization who follows this customer
  locale: Locale.FR,
})
```

The customer receives an activation email: until they click it, their account stays `CustomerState.CREATED` and the bank, custody, trading and staking resources do not see it (unless you create them with `needActivation: false` — [Customers › create](resource/customer.md#create)). If your organization uses BITGEN's identity verification, their identity must also be validated before the next steps ([Activation and identity](concepts.md#activation-and-identity)). The `Created` object the API returned is a `UserRef`: the next steps pass it as is, wherever a customer is expected ([User references](concepts.md#user-references)).

## 3. Read the EUR account

```ts
const account = await client.bank.get(customer)

console.log(account.message)   // wire reference: the customer puts it on their bank transfer
console.log(account.balance)   // EUR balance, credited once the transfer is received
```

The EUR account is created on first read. Balance, operations and withdrawals: [Bank accounts](resource/bank.md).

## 4. Open a wallet

```ts
import { Asset } from '@bitgen/sdk'

const wallet = await client.custody.wallet(customer, Asset.ETH)

console.log(wallet.address)    // deposit address, created at the custodian on first read
console.log(wallet.balance)    // exact quantity, as a string
```

Wallets, balances and on-chain withdrawals: [Custody wallets](resource/custody.md).

## 5. Buy crypto

```ts
const { tunnel, state } = await client.trading.buy(customer, {
  asset: Asset.ETH,
  amount: '25.00',            // EUR, taken from the customer's EUR account
  reference: 'order-42',      // optional idempotency key
})

const order = await client.trading.get(tunnel)   // `tunnel` is the order uuid; `order.state` follows its lifecycle (`OrderState`)
```

Orders, states and sales: [Trading](resource/trading.md).

## Handling errors

Every call returns a promise. An error of the API rejects it with a `BitgenError` carrying the HTTP `status` and a stable `code`:

```ts
import { BitgenError } from '@bitgen/sdk'

try {
  await client.bank.withdraw(customer, { amount: '50.00' })
} catch (err) {
  if (err instanceof BitgenError && err.code === 'requested_amount_error') {
    // insufficient EUR balance
  }
}
```

All the details, including the errors that happen before any request is sent: [Errors](errors.md).
