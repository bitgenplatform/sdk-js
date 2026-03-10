import type { HttpClient } from '../http.js'
import type {
  CreateOrderParams,
  CreatedOrder,
  Order,
  UserRef,
} from '../types/index.js'
import { resolveUuid } from '../utils.js'

export class OrderResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a buy or sell order.
   * - BUY: amount is in EUR → delivers the target asset
   * - SELL: amount is in asset units → delivers EUR
   */
  create(params: CreateOrderParams): Promise<CreatedOrder> {
    return this.http.post<CreatedOrder>('/api/v3/order', {
      ...params,
      user: resolveUuid(params.user),
    })
  }

  /** Get the current status of an order by its tunnel ID */
  get(tunnel: string): Promise<Order> {
    return this.http.get<Order>(`/api/v3/order/${tunnel}`)
  }

  /** Get full order history for a user */
  history(user: UserRef): Promise<Order[]> {
    return this.http.get<Order[]>(`/api/v3/orders/${resolveUuid(user)}`)
  }
}
