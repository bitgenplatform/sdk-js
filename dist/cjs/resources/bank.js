"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankResource = void 0;
const utils_js_1 = require("../utils.js");
class BankResource {
    constructor(http) {
        this.http = http;
    }
    /** Get a user's EUR bank account balance and reference */
    get(user) {
        return this.http.get(`/api/v3/bank/${(0, utils_js_1.resolveUuid)(user)}`);
    }
    /** Withdraw EUR from a user's bank account */
    withdraw(user, amount) {
        return this.http.put(`/api/v3/bank/${(0, utils_js_1.resolveUuid)(user)}`, { amount });
    }
    /** Get bank operation history for a user */
    operations(user, filters) {
        return this.http.get(`/api/v3/bank/${(0, utils_js_1.resolveUuid)(user)}/operations`, filters);
    }
}
exports.BankResource = BankResource;
//# sourceMappingURL=bank.js.map