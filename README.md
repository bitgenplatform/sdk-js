# @bitgen/sdk

Official Node.js SDK for the BITGEN Crypto-as-a-Service API v3.1.x.

## Installation

```bash
npm install @bitgen/sdk
```

## Quick start

```ts
import { BitgenClient } from '@bitgen/sdk'

const client = new BitgenClient({
scope:  'YOUR_SCOPE_UUID',
apiKey: 'YOUR_API_KEY'
})
```

## Environments

| env           |
|---------------|
| `production`  |
| `sandbox`     |

```ts
// Custom host (e.g. Docker container)
const client = new BitgenClient({
  scope: '...',
  apiKey: '...',
  host: 'my-container',
  port: 8080
})
```

## Resources

### `client.asset`
```ts
const assets = await client.asset.list()
const btc    = await client.asset.get('BTC')
```

### `client.user`
```ts
const { uuid } = await client.user.create({ email, iban, firstname, lastname })
const { items } = await client.user.list({ offset: 0, limit: 100 })
const user = await client.user.get('uuid')
await client.user.update(user, { email: 'new@email.com' })
await client.user.disable(user)
```

### `client.bank`
```ts
const account    = await client.bank.get(user)
const withdrawal = await client.bank.withdraw(user, 50)
const history    = await client.bank.operations(user, { direction: 'WITHDRAWAL' })
```

### `client.order`
```ts
const order = await client.order.create({ user, asset: 'ETH', amount: 25, mode: 'BUY' })
const order = await client.order.create({ user, asset: 'BTC', amount: 0.001, mode: 'SELL' })
const status  = await client.order.get(order.tunnel)
const history = await client.order.history(user)
```

### `client.transaction`
```ts
const tx = await client.transaction.create({
  user,
  asset: 'BTC',
  amount: 0.001,
  targetAddress: 'tb1q...',
})
const status  = await client.transaction.get(tx.txId)
const history = await client.transaction.history(user, { asset: 'BTC' })
```

### `client.wallet`
```ts
const wallets   = await client.wallet.list(user)
const btcWallet = await client.wallet.get(user, 'BTC')
```

### `client.stats`
```ts
const health = await client.stats.health()
const quotas = await client.stats.quotas()
```

## UserRef

Toutes les méthodes acceptant un `user` acceptent soit un UUID string, soit un objet `User` :

```ts
const user = await client.user.get('ed1a19bb-...')
await client.bank.get(user)          // objet User
await client.bank.get('ed1a19bb-...') // UUID string
```

## Error handling

```ts
import { BitgenClient, BitgenError } from '@bitgen/sdk'

try {
await client.order.create({ user, asset: 'ETH', amount: 25, mode: 'BUY' })
} catch (err) {
if (err instanceof BitgenError) {
console.log(err.service)    // e.g. "order"
console.log(err.code)       // e.g. 416
console.log(err.apiMessage) // e.g. "requested_amount_error"
}
}
```