"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionResource = void 0;
const utils_js_1 = require("../utils.js");
class TransactionResource {
    constructor(http) {
        this.http = http;
    }
    /**
     * Create a crypto withdrawal transaction.
     *
     * ⚠ This endpoint throws `BitgenRawError` (not `BitgenError`) for
     * HTTP 500 (invalid_asset) and HTTP 400 (missing field) — both return
     * a plain text body, not a JSON error object.
     */
    create(params) {
        return this.http.post('/api/v3/tx', {
            ...params,
            user: (0, utils_js_1.resolveUuid)(params.user),
        }, true);
    }
    /** Get a transaction by its ID */
    get(txId) {
        return this.http.get(`/api/v3/tx/${txId}`);
    }
    /** Get transaction history for a user */
    history(user, filters) {
        return this.http.get(`/api/v3/txs/${(0, utils_js_1.resolveUuid)(user)}`, filters);
    }
}
exports.TransactionResource = TransactionResource;
//# sourceMappingURL=transaction.js.map