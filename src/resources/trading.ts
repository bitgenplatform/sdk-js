import type { HttpClient } from '../http.js'
import type { Order, OrderSide, OrderState, Page, TradingListParams, TradingOrderParams, UserRef } from '../types/index.js'
import { amount, assetFilter, assetId, idOf, pathSegment, resolveUuid } from '../utils.js'

/** `/trading` — permissions `trading.write`, `trading.read`. Buy or sell crypto for a customer. */
export class TradingResource {
  constructor(private readonly http: HttpClient) {}

  /** Buy crypto with EUR from the customer's bank account — `amount` in EUR (2 decimals max) */
  async buy(user: UserRef, params: TradingOrderParams): Promise<{ tunnel: string, state: OrderState }> {
    return await this.order(user, params, 'BUY')
  }

  /** Sell crypto from the customer's custody — `amount` is the crypto quantity (string recommended) */
  async sell(user: UserRef, params: TradingOrderParams): Promise<{ tunnel: string, state: OrderState }> {
    return await this.order(user, params, 'SELL')
  }

  /** One order by its uuid (the `tunnel` returned by `buy` / `sell`) or by model */
  async get(order: string | Order): Promise<Order> {
    return await this.http.get(`/trading/${pathSegment(idOf(order, 'order'), 'order')}`)
  }

  /** Orders of the organization, optionally filtered by customer, side and asset */
  async list(params: TradingListParams = {}): Promise<Page<Order>> {
    const { user } = params
    // spread first: the query keeps the order of the params, `user` and `asset` are replaced in place (absent or null = no filter)
    return await this.http.get('/trading/orders', { ...params, user: user === undefined || user === null ? undefined : resolveUuid(user), asset: assetFilter(params.asset) })
  }

  /** `POST /trading` — the customer must be an `ENABLED` member of the organization (uuid or model, no email here) */
  private async order(user: UserRef, params: TradingOrderParams, mode: OrderSide): Promise<{ tunnel: string, state: OrderState }> {
    return await this.http.post('/trading', {
      user: resolveUuid(user),
      asset: assetId(params.asset),
      amount: amount(params.amount),
      mode,
      reference: params.reference,
    })
  }
}
