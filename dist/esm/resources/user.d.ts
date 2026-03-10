import type { HttpClient } from '../http.js';
import type { CreateUserParams, UserDetail, UserList, UserListParams, UpdateUserParams, UserRef } from '../types/index.js';
export declare class UserResource {
    private readonly http;
    constructor(http: HttpClient);
    /** Create a new user — returns their UUID */
    create(params: CreateUserParams): Promise<{
        uuid: string;
    }>;
    /** List all users (paginated) */
    list(params: UserListParams): Promise<UserList>;
    /** Get full user details (profile, wallets, bank) by UUID or User object */
    get(user: UserRef): Promise<UserDetail>;
    /** Update a user's profile — returns nothing on success (204) */
    update(user: UserRef, params: UpdateUserParams): Promise<void>;
    /**
     * Soft-disable a user account.
     * Data is retained — this is not a permanent deletion.
     */
    disable(user: UserRef): Promise<void>;
}
//# sourceMappingURL=user.d.ts.map