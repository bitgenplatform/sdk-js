import type { HttpClient } from '../http.js'
import type {
  CreateUserParams,
  UserDetail,
  UserList,
  UserListParams,
  UpdateUserParams,
  UserRef,
} from '../types/index.js'
import { resolveUuid } from '../utils.js'

export class UserResource {
  constructor(private readonly http: HttpClient) {}

  /** Create a new user — returns their UUID */
  create(params: CreateUserParams): Promise<{ uuid: string }> {
    return this.http.post<{ uuid: string }>('/api/v3/user', params)
  }

  /** List all users (paginated) */
  list(params: UserListParams): Promise<UserList> {
    return this.http.get<UserList>('/api/v3/user', {
      offset: params.offset,
      limit: params.limit,
    })
  }

  /** Get full user details (profile, wallets, bank) by UUID or User object */
  get(user: UserRef): Promise<UserDetail> {
    return this.http.get<UserDetail>(`/api/v3/user/${resolveUuid(user)}`)
  }

  /** Update a user's profile — returns nothing on success (204) */
  update(user: UserRef, params: UpdateUserParams): Promise<void> {
    return this.http.put<void>(`/api/v3/user/${resolveUuid(user)}`, params)
  }

  /**
   * Soft-disable a user account.
   * Data is retained — this is not a permanent deletion.
   */
  disable(user: UserRef): Promise<void> {
    return this.http.delete<void>(`/api/v3/user/${resolveUuid(user)}`)
  }
}
