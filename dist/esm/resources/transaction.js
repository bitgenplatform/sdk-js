import { resolveUuid } from '../utils.js';
export class TransactionResource {
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
            user: resolveUuid(params.user),
        }, true);
    }
    /** Get a transaction by its ID */
    get(txId) {
        return this.http.get(`/api/v3/tx/${txId}`);
    }
    /** Get transaction history for a user */
    history(user, filters) {
        return this.http.get(`/api/v3/txs/${resolveUuid(user)}`, filters);
    }
}
//# sourceMappingURL=transaction.js.map