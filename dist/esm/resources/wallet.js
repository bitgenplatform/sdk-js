import { resolveUuid } from '../utils.js';
export class WalletResource {
    constructor(http) {
        this.http = http;
    }
    /** Get all wallets for a user */
    list(user) {
        return this.http.get(`/api/v3/wallet/${resolveUuid(user)}`);
    }
    /** Get a specific wallet by user and asset ISO code */
    get(user, asset) {
        return this.http.get(`/api/v3/wallet/${resolveUuid(user)}/${asset}`);
    }
}
//# sourceMappingURL=wallet.js.map