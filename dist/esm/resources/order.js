import { resolveUuid } from '../utils.js';
export class OrderResource {
    constructor(http) {
        this.http = http;
    }
    /**
     * Create a buy or sell order.
     * - BUY: amount is in EUR → delivers the target asset
     * - SELL: amount is in asset units → delivers EUR
     */
    create(params) {
        return this.http.post('/api/v3/order', {
            ...params,
            user: resolveUuid(params.user),
        });
    }
    /** Get the current status of an order by its tunnel ID */
    get(tunnel) {
        return this.http.get(`/api/v3/order/${tunnel}`);
    }
    /** Get full order history for a user */
    history(user) {
        return this.http.get(`/api/v3/orders/${resolveUuid(user)}`);
    }
}
//# sourceMappingURL=order.js.map