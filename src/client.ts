import { HttpClient } from './http.js'
import { AssetResource } from './resources/asset.js'
import { BankResource } from './resources/bank.js'
import { OrderResource } from './resources/order.js'
import { TransactionResource } from './resources/transaction.js'
import { UserResource } from './resources/user.js'
import { WalletResource } from './resources/wallet.js'
import { StatsResource } from './resources/stats.js'
import type { BitgenConfig } from './types/index.js'

export class BitgenClient {
  readonly asset: AssetResource
  readonly bank: BankResource
  readonly order: OrderResource
  readonly transaction: TransactionResource
  readonly user: UserResource
  readonly wallet: WalletResource
  readonly stats: StatsResource

  constructor(config: BitgenConfig) {
    const http = new HttpClient(config)

    this.asset = new AssetResource(http)
    this.bank = new BankResource(http)
    this.order = new OrderResource(http)
    this.transaction = new TransactionResource(http)
    this.user = new UserResource(http)
    this.wallet = new WalletResource(http)
    this.stats = new StatsResource(http)
  }
}
