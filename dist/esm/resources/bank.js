import { resolveUuid } from '../utils.js';
export class BankResource {
    constructor(http) {
        this.http = http;
    }
    /** Get a user's EUR bank account balance and reference */
    get(user) {
        return this.http.get(`/api/v3/bank/${resolveUuid(user)}`);
    }
    /** Withdraw EUR from a user's bank account */
    withdraw(user, amount) {
        return this.http.put(`/api/v3/bank/${resolveUuid(user)}`, { amount });
    }
    /** Get bank operation history for a user */
    operations(user, filters) {
        return this.http.get(`/api/v3/bank/${resolveUuid(user)}/operations`, filters);
    }
}
//# sourceMappingURL=bank.js.map