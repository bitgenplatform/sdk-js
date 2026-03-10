import type { HttpClient } from '../http.js';
import type { CreateOrderParams, CreatedOrder, Order, UserRef } from '../types/index.js';
export declare class OrderResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Create a buy or sell order.
     * - BUY: amount is in EUR → delivers the target asset
     * - SELL: amount is in asset units → delivers EUR
     */
    create(params: CreateOrderParams): Promise<CreatedOrder>;
    /** Get the current status of an order by its tunnel ID */
    get(tunnel: string): Promise<Order>;
    /** Get full order history for a user */
    history(user: UserRef): Promise<Order[]>;
}
//# sourceMappingURL=order.d.ts.map