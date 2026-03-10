"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletResource = void 0;
const utils_js_1 = require("../utils.js");
class WalletResource {
    constructor(http) {
        this.http = http;
    }
    /** Get all wallets for a user */
    list(user) {
        return this.http.get(`/api/v3/wallet/${(0, utils_js_1.resolveUuid)(user)}`);
    }
    /** Get a specific wallet by user and asset ISO code */
    get(user, asset) {
        return this.http.get(`/api/v3/wallet/${(0, utils_js_1.resolveUuid)(user)}/${asset}`);
    }
}
exports.WalletResource = WalletResource;
//# sourceMappingURL=wallet.js.map