# @bitgen/sdk — v1.0.6

Official Node.js SDK for the BITGEN API v4 — server-side, TypeScript, ESM and CommonJS, no runtime dependency.
Install it with `npm install @bitgen/sdk` (Node.js 20 or later).

```ts
import { BitgenClient, Env } from '@bitgen/sdk'

const client = new BitgenClient({
  scope: 'YOUR_SCOPE_UUID',   // uuid of the organization that owns the key
  apiKey: 'YOUR_API_KEY',
  env: Env.SANDBOX,           // Env.PRODUCTION by default
})

const account = await client.bank.get('CUSTOMER_UUID')
console.log(account.balance)  // EUR balance of the customer
```

- [Installation](readme/installation.md) — Node.js 20+, ESM, CommonJS, TypeScript
- [Quick start](readme/quick-start.md) — a customer, their EUR account, a wallet, a purchase
- [Configuration](readme/configuration.md) — credentials, environments, custom host, timeout
- [Concepts](readme/concepts.md) — user references, amounts, pagination, assets, activation, constants, the flows of a purchase, a sale, a deposit and a withdrawal
- [Errors](readme/errors.md) — `BitgenError`, error codes, rejected promises

Resources, in the order of an integration:

- [Customers](readme/resource/customer.md) — `client.customer`
- [Bank accounts](readme/resource/bank.md) — `client.bank`
- [Custody wallets](readme/resource/custody.md) — `client.custody`
- [Trading](readme/resource/trading.md) — `client.trading`
- [Transactions](readme/resource/transaction.md) — `client.transaction`
- [Staking](readme/resource/staking.md) — `client.staking`
- [Connectors](readme/resource/core.md) — `client.core`
- [Webhooks](readme/resource/webhooks.md) — `client.webhooks`
- [API keys](readme/resource/apikeys.md) — `client.apikeys`
- [Assets](readme/resource/asset.md) — `client.asset`

## License

Private — © BITGEN
