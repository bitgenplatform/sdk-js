import { HttpClient } from './http.js'
import { ApikeysResource } from './resources/apikeys.js'
import { AssetResource } from './resources/asset.js'
import { BankResource } from './resources/bank.js'
import { CoreResource } from './resources/core.js'
import { CustodyResource } from './resources/custody.js'
import { CustomerResource } from './resources/customer.js'
import { StakingResource } from './resources/staking.js'
import { TradingResource } from './resources/trading.js'
import { TransactionResource } from './resources/transaction.js'
import { WebhooksResource } from './resources/webhooks.js'
import type { BitgenConfig } from './types/index.js'

/**
 * Entry point of the SDK: one instance per API key, resources hang off it (`client.asset`…).
 * Invalid config throws a `TypeError` here, before any request is sent.
 */
export class BitgenClient {
  protected readonly http: HttpClient

  readonly asset: AssetResource
  readonly customer: CustomerResource
  readonly bank: BankResource
  readonly custody: CustodyResource
  readonly trading: TradingResource
  readonly transaction: TransactionResource
  readonly core: CoreResource
  readonly staking: StakingResource
  readonly webhooks: WebhooksResource
  readonly apikeys: ApikeysResource

  constructor(config: BitgenConfig) {
    this.http = new HttpClient(config)

    this.asset = new AssetResource(this.http)
    this.customer = new CustomerResource(this.http)
    this.bank = new BankResource(this.http)
    this.custody = new CustodyResource(this.http)
    this.trading = new TradingResource(this.http)
    this.transaction = new TransactionResource(this.http)
    this.core = new CoreResource(this.http)
    this.staking = new StakingResource(this.http, this.core)
    this.webhooks = new WebhooksResource(this.http)
    this.apikeys = new ApikeysResource(this.http)
  }
}
