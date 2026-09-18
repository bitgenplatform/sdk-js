export type { Locale, CustomerState, IdentityState, IdentityMode, OrganizationCategory } from '../constants.js'
import type { Locale, CustomerState, IdentityState, IdentityMode, OrganizationCategory } from '../constants.js'

interface IdentityBase {
  uuid: string
  state: IdentityState
  /** Steps: KYC `info`, `selfie`, `identity`, `residency` — KYB `info`, `kbis`, `status`, `domiciliation`, `rbe` */
  data: {
    steps: Record<string, { status: string, submittedAt: number | null }>
    notifications: boolean
    verificationUrl: string | null
    hosted?: boolean
  }
  validatedAt: number | null
  expiresAt: number | null
  renewalNotifiedAt: number | null
}

/** KYC file of an individual */
export interface KycIdentity extends IdentityBase {
  mode: typeof IdentityMode.KYC
  form: {
    european_residency: unknown
    ppe: unknown
    ppp: unknown
    source_income: string | null
    net_income: string | null
    experience: string | null
    submittedAt: number | null
    score: number
  }
}

/** KYB file of a business */
export interface KybIdentity extends IdentityBase {
  mode: typeof IdentityMode.KYB
  form: {
    activity: string | null
    submittedAt: number | null
    score: number
  }
}

/** KYC or KYB file of a customer — narrow on `mode` to type `form` */
export type Identity = KycIdentity | KybIdentity

export interface CustomerAccount {
  email: string
  firstname: string
  lastname: string | null
  fin: string | null
  birthdate: number | null
  phoneNumber: number | null
  phoneZone: string | null
  address: { uuid: string, state: string, address: string } | null
  referralCode: string
}

export interface CustomerClient {
  roles: string[]
  hasTfa: boolean
  hasPhishing: boolean
  isValid: boolean
}

export interface CustomerSetup {
  theme: string
  currency: 'EUR'
  locale: string
  /** Category chosen at signup (`OrganizationCategory.CUSTOMER`, `B2B`) — a string on the API's side: any other value stays as is */
  choosenOrganization: OrganizationCategory | (string & {})
  /** Activation email pending: the customer is invisible to bank / custody / trading / staking until they activate */
  needActivation: boolean
  notify: boolean
  onboarding?: boolean
}

/** Link between the customer and an organization */
export interface CollaboratorLink {
  uuid: string
  state: string
  roles: string[]
  /** Organization name */
  organization: string
  organizationUuid: string
  manager: string | null
}

/** Link where this user is the manager — empty for a customer */
export interface ManagerLink {
  uuid: string
  state: string
  mandate: unknown
  /** `d/m/Y` */
  mandatedUntil: string | null
  /** Email */
  account: string | null
  organizationUuid: string
  roles: string[]
}

/** Active compliance alert */
export interface CustomerAlert {
  uuid: string
  state: 'OPEN' | 'DECLARATED' | 'CONFIRMED'
  severity: 'SUCCESS' | 'WARNING' | 'CRITICAL'
  sources: Record<string, unknown>
}

export interface CustomerBusiness {
  identity: Identity
}

/** Item of `GET /customer` */
export interface Customer {
  uuid: string
  state: CustomerState
  isAvailable: boolean
  createdAt: number
  /** = email */
  login: string
  canLogin: boolean
  account: CustomerAccount
  client: CustomerClient
  action: { setup: CustomerSetup }
  identity: Identity
  business: CustomerBusiness[]
  collaborations: {
    collaborator: CollaboratorLink[]
    manager: ManagerLink[]
  }
  alert: CustomerAlert[]
}

export interface AccountAddress {
  uuid: string
  address: string
}

/** `GET /account/{uuid}` — `account.address` is reduced to `{ uuid, address }` */
export interface Account {
  uuid: string
  identity: Identity
  business: CustomerBusiness[]
  account: Omit<CustomerAccount, 'address'> & { address: AccountAddress | null }
  notifications: { login: boolean, newsletter: boolean }
  setup: CustomerSetup
}

// ─── Parameters ───────────────────────────────────────────────────────────────

export interface CreateCustomerParams {
  account: {
    email: string
    firstname?: string
    lastname?: string
    /** Tax identification number, 100 characters max */
    fin?: string
    /**
     * Default `true`: BITGEN emails the customer an activation link and the account stays `CREATED` (no financial
     * route accepts it) until they activate. `false`: usable right away, BITGEN sends no email — for an organization
     * that handles activation and notifications with its own system, or through webhooks.
     */
    needActivation?: boolean
    /** Default `true`: the customer receives BITGEN's emails (newsletter). `false`: none */
    notify?: boolean
  }
  /** `manager` = uuid of the collaborator of the organization who follows this customer — the customer is created in the key's organization */
  group: { manager: string }
  /** Default `FR` */
  locale?: Locale
  /** Category, default `OrganizationCategory.CUSTOMER` — `B2B` also opens a KYB file */
  organization?: OrganizationCategory
}

export interface CustomerListParams {
  offset?: number
  limit?: number
  includeClosed?: boolean
  /** Only customers directly managed by this collaborator uuid */
  manager?: string
}

/** The only settings a key may write (`PUT /account/{uuid}` in API mode) */
export interface UpdateCustomerParams {
  theme?: string
  locale?: Locale
  notifications?: { login?: boolean, newsletter?: boolean }
}
