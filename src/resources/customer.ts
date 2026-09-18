import type { HttpClient } from '../http.js'
import type {
  Account,
  CreateCustomerParams,
  Created,
  Customer,
  CustomerListParams,
  Page,
  UpdateCustomerParams,
  UserRef,
} from '../types/index.js'
import { pathSegment, resolveUuid } from '../utils.js'

/** `/customer`, `/account` — permissions `customer.write`, `customer.read`, `account.read`, `account.write` */
export class CustomerResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a customer of the key's organization — or attach an existing, KYC-validated account to it.
   * By default an activation email is sent: the customer stays `CREATED` and invisible to the financial
   * routes (bank, custody, trading, staking) until they activate (`account.needActivation: false` skips it).
   */
  async create(params: CreateCustomerParams): Promise<Created> {
    const { group, ...rest } = params
    // Only `manager` is taken from the caller: the organization is always the scope, and no role is ever sent (the API takes ROLE_USER)
    return await this.http.post('/customer', { ...rest, group: { manager: group?.manager, organization: this.http.scope } })
  }

  /** List the organization's customers (a freshly created one appears as `CREATED`) */
  async list(params: CustomerListParams = {}): Promise<Page<Customer>> {
    return await this.http.get('/customer', { ...params })
  }

  /** Get an account by uuid, email (login) or model (`Created`, `Customer`…) */
  async get(user: UserRef): Promise<Account> {
    return await this.http.get(`/account/${pathSegment(resolveUuid(user), 'user')}`)
  }

  /** Update the settings a key may write: theme, locale, notifications — nothing else is sent */
  async update(user: UserRef, params: UpdateCustomerParams): Promise<void> {
    await this.http.put(`/account/${pathSegment(resolveUuid(user), 'user')}`, {
      action: { theme: params.theme, locale: params.locale },
      notifications: params.notifications,
    })
  }
}
