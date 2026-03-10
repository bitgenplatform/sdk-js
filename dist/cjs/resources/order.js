"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderResource = void 0;
const utils_js_1 = require("../utils.js");
class OrderResource {
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
            user: (0, utils_js_1.resolveUuid)(params.user),
        });
    }
    /** Get the current status of an order by its tunnel ID */
    get(tunnel) {
        return this.http.get(`/api/v3/order/${tunnel}`);
    }
    /** Get full order history for a user */
    history(user) {
        return this.http.get(`/api/v3/orders/${(0, utils_js_1.resolveUuid)(user)}`);
    }
}
exports.OrderResource = OrderResource;
//# sourceMappingURL=order.js.map