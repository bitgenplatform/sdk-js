import { resolveUuid } from '../utils.js';
export class UserResource {
    constructor(http) {
        this.http = http;
    }
    /** Create a new user — returns their UUID */
    create(params) {
        return this.http.post('/api/v3/user', params);
    }
    /** List all users (paginated) */
    list(params) {
        return this.http.get('/api/v3/user', {
            offset: params.offset,
            limit: params.limit,
        });
    }
    /** Get full user details (profile, wallets, bank) by UUID or User object */
    get(user) {
        return this.http.get(`/api/v3/user/${resolveUuid(user)}`);
    }
    /** Update a user's profile — returns nothing on success (204) */
    update(user, params) {
        return this.http.put(`/api/v3/user/${resolveUuid(user)}`, params);
    }
    /**
     * Soft-disable a user account.
     * Data is retained — this is not a permanent deletion.
     */
    disable(user) {
        return this.http.delete(`/api/v3/user/${resolveUuid(user)}`);
    }
}
//# sourceMappingURL=user.js.map