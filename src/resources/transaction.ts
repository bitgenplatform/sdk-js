import type { HttpClient } from '../http.js'
import type { Page, Transaction, TransactionListParams } from '../types/index.js'
import { assetFilter, idOf, pathSegment, resolveUuid } from '../utils.js'

/** `/transaction` — permission `transaction.read`. Unified journal of fiat and crypto movements, read-only. */
export class TransactionResource {
  constructor(private readonly http: HttpClient) {}

  /** Transactions of the organization, optionally filtered — `limit` up to 100 on this route */
  async list(params: TransactionListParams = {}): Promise<Page<Transaction>> {
    const { user } = params
    // spread first: the query keeps the order of the params, `user` and `asset` are replaced in place (absent or null = no filter)
    return await this.http.get('/transaction', { ...params, user: user === undefined || user === null ? undefined : resolveUuid(user), asset: assetFilter(params.asset) })
  }

  /** One transaction by uuid, by reference, or by model */
  async get(transaction: string | Transaction): Promise<Transaction> {
    return await this.http.get(`/transaction/${pathSegment(idOf(transaction, 'transaction'), 'transaction')}`)
  }
}
