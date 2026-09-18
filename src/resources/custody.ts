import type { HttpClient } from '../http.js'
import type { AssetInput, CustodyPortfolio, CustodyWithdrawParams, UserRef, Wallet } from '../types/index.js'
import { amount, assetId, pathSegment, resolveUuid } from '../utils.js'

/**
 * `/custody` — permissions `custody.read`, `custody.write`. Crypto wallets per customer and asset.
 * `{user}` = customer uuid — or the organization uuid (the scope) for its treasury wallets, read-only.
 */
export class CustodyResource {
  constructor(private readonly http: HttpClient) {}

  /** Wallets of a customer (or of the organization), without `history` */
  async wallets(user: UserRef): Promise<Wallet[]> {
    return await this.http.get(`/custody/${pathSegment(resolveUuid(user), 'user')}`)
  }

  /**
   * One wallet by asset uuid or iso, with `history`. A missing wallet is provisioned on first read
   * (deposit address created at the custodian): the key then needs `custody.write`.
   */
  async wallet(user: UserRef, asset: AssetInput): Promise<Wallet> {
    return await this.http.get(`/custody/${pathSegment(resolveUuid(user), 'user')}/${pathSegment(assetId(asset), 'asset')}`)
  }

  /** EUR value curve of the customer's custody (customers only) */
  async portfolio(user: UserRef): Promise<CustodyPortfolio> {
    return await this.http.get(`/custody/${pathSegment(resolveUuid(user), 'user')}/portfolio`)
  }

  /**
   * On-chain withdrawal (customers only). The amount string goes to the API untouched — never
   * rounded or reformatted. `transaction` is null while the analysis has not created the line yet.
   */
  async withdraw(user: UserRef, params: CustodyWithdrawParams): Promise<{ transaction: string | null }> {
    return await this.http.put(`/custody/${pathSegment(resolveUuid(user), 'user')}`, { ...params, asset: assetId(params.asset), amount: amount(params.amount) })
  }
}
