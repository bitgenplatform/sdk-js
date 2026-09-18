# Customers

A customer is an end user of your organization on the BITGEN platform: a person (KYC) or a business (KYB) with a login, an identity file, settings and — once activated and verified — an EUR account, custody wallets, orders and staking positions. `client.customer` creates customers, lists them, and reads or updates an account.

Examples use `client`, a configured `BitgenClient` ([Configuration](../configuration.md)). A customer is designated by a `UserRef`: their uuid, or a model carrying it — the `Created` returned by `create`, a `Customer` of `list`, an `Account` of `get` ([User references](../concepts.md#user-references)).

![Activation and identity: from the creation of a customer to the financial resources](../media/activation.svg)

## Methods

| Method | What it does | Returns |
|---|---|---|
| `create(params)` | Creates a customer in your organization and sends them the activation email | `Created` |
| `list(params?)` | Lists the customers of your organization | `Page<Customer>` |
| `get(user)` | Reads one account: identity files, details, settings | `Account` |
| `update(user, params)` | Updates the settings a key may write: theme, locale, notifications | `void` |

TypeScript types of this resource, exported by the package: `KycIdentity`, `KybIdentity`, `Identity`, `CustomerAccount`, `CustomerClient`, `CustomerSetup`, `CollaboratorLink`, `ManagerLink`, `CustomerAlert`, `CustomerBusiness`, `Customer`, `AccountAddress`, `Account`, `CreateCustomerParams`, `CustomerListParams`, `UpdateCustomerParams` — the constants `Locale`, `CustomerState`, `IdentityState`, `IdentityMode`, `OrganizationCategory` (also types) — plus the shared `UserRef`, `Created`.

## Create

```
client.customer.create(params: CreateCustomerParams): Promise<Created>
```

| Parameter | Type | Description |
|---|---|---|
| `params.account.email` | `string` | Login of the customer — required |
| `params.account.firstname` | `string` | Optional |
| `params.account.lastname` | `string` | Optional |
| `params.account.fin` | `string` | Tax identification number of the customer — optional, 100 characters max |
| `params.account.needActivation` | `boolean` | Default `true`: BITGEN emails the customer an activation link and the account stays `CustomerState.CREATED` (the bank, custody, trading and staking resources refuse it) until they activate. `false`: the account is usable right away and BITGEN sends no email — for an organization that handles activation and notifications with its own system, or through webhooks |
| `params.account.notify` | `boolean` | Default `true`: the customer receives BITGEN's emails (newsletter). `false`: none |
| `params.group.manager` | `string` | uuid of the collaborator of your organization who follows this customer — required; the customer is created in your organization |
| `params.locale` | `Locale` | `Locale.FR` (default) or `Locale.EN` |
| `params.organization` | `OrganizationCategory` | Category: `OrganizationCategory.CUSTOMER` (default) or `OrganizationCategory.B2B` — `B2B` also opens a KYB file |

```ts
import { Locale, OrganizationCategory } from '@bitgen/sdk'

const created = await client.customer.create({
  account: { email: 'jean@valjean.fr', firstname: 'Jean', lastname: 'Valjean' },
  group: { manager: 'MANAGER_UUID' },
  locale: Locale.FR,
  organization: OrganizationCategory.B2B,   // a business: a KYB file is opened too — CUSTOMER by default
})

const account = await client.customer.get(created)   // a `Created` is a `UserRef`
```

Returns a `Created` — the uuid of the customer, a `UserRef` for every other method. By default the API creates the account and sends the customer an activation email. Until they click it, the account stays `CustomerState.CREATED` (`setup.needActivation` is `true`) and the bank, custody, trading and staking resources do not accept it — only `list`, where it appears as `CREATED`, and `get` see it ([Activation and identity](../concepts.md#activation-and-identity)).

```ts
const { uuid } = await client.customer.create({
  account: { email: 'jean@valjean.fr', needActivation: false, notify: false },   // you handle onboarding yourself
  group: { manager: 'MANAGER_UUID' },
})
```

With `needActivation: false` the account is usable right away and BITGEN sends no activation email — for an organization that handles activation and notifications with its own system, or through webhooks ([Webhooks](webhooks.md)); with `notify: false` the customer receives no BITGEN email at all.

When the email already belongs to an active account whose KYC is validated, that account is **attached** to your organization instead of being created. An active account without a validated KYC cannot be attached (`412 user_not_attachable`), an account already attached to another organization is refused (`409 user_already_assigned`), and so is an account still being created, for 15 minutes (`409 account_unavailable`).

## List

```
client.customer.list(params?: CustomerListParams): Promise<Page<Customer>>
```

| Parameter | Type | Description |
|---|---|---|
| `params.offset`, `params.limit` | `number` | [Pagination](../concepts.md#pagination) |
| `params.includeClosed` | `boolean` | Also returns the `CustomerState.CLOSED` customers — default `false` ([Query booleans](../concepts.md#query-booleans)) |
| `params.manager` | `string` | Only the customers whose direct manager is this collaborator (uuid) |

```ts
import { CustomerState } from '@bitgen/sdk'

const { count, items } = await client.customer.list({ offset: 0, limit: 50 })

for (const customer of items) {
  console.log(customer.login, customer.state === CustomerState.ENABLED)   // 'jean@valjean.fr' true
}
```

Returns a page of `Customer`:

| Field | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
|---|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uuid`, `createdAt` | Identifier and creation time (epoch seconds)                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `state` | `CustomerState.CREATED` (activation pending), `ENABLED`, `CLOSED` or `FROZEN`                                                                                                                                                                                                                                                                                                                                                                                                               |
| `isAvailable` | `false` until the customer has activated their account, then `true`                                                                                                                                                                                                                                                                                                                                                                                                           |
| `canLogin` | Whether the customer may sign in to the BITGEN web application                                                                                                                                                                                                                                                                                                                                                                                                                |
| `login` | The email                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `account` | `email`, `firstname`, `lastname`, `fin` (tax identification number), `birthdate` (date of birth, epoch seconds, or `null`), `phoneZone` and `phoneNumber` (dialing code, `+33` by default, and the number as an integer), `address` (`{ uuid, state, address }` or `null` — `state` is the state of the address record), `referralCode` (the customer's own referral code, generated at creation)                                                                             |
| `client` | `roles` (platform roles of the account — always `ROLE_USER` for a customer), `hasTfa` (two-factor authentication enabled), `hasPhishing` (anti-phishing code enabled), `isValid` (`true` once the account has been activated)                                                                                                                                                                                                                                                 |
| `action.setup` | `theme` (theme of the BITGEN web application, `light` by default), `currency` (display currency, `EUR`), `locale` (language of the web application and of the emails, `Locale.FR` or `Locale.EN`), `choosenOrganization` (category chosen at signup: `OrganizationCategory.CUSTOMER`, `B2B` — a string, compare it with the constants), `needActivation` (activation email pending), `notify` (whether the customer accepts BITGEN emails), `onboarding` (whether the web onboarding has been completed) |
| `identity` | The KYC or KYB file of the customer ([Identity](#identity))                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `business` | The businesses of the customer, each with its KYB file: `{ identity }[]`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `collaborations.collaborator` | The customer's attachment to your organization: `uuid`, `state` (`WAIT` until activation, then `ENABLED`; `REVOKED` once removed), `roles` (`ROLE_USER` for a customer), `organization` (its name), `organizationUuid`, `manager` (uuid of the collaborator in charge of them)                                                                                                                                                                                                |
| `collaborations.manager` | Attachments where this account manages other people — always empty for a customer (`mandate`, `mandatedUntil`: CRM data, not needed for an integration)                                                                                                                                                                                                                                                                                                                       |
| `alert` | Active compliance alerts: `uuid`, `state` (`OPEN`, `DECLARATED`, `CONFIRMED`), `severity` (`SUCCESS`, `WARNING`, `CRITICAL`), `sources` (the observations behind the alert — analysis data)                                                                                                                                                                                                                                                                                   |

## Get

```
client.customer.get(user: UserRef): Promise<Account>
```

`user` is the customer, by uuid or model.

```ts
import { IdentityState } from '@bitgen/sdk'

const account = await client.customer.get('CUSTOMER_UUID')

console.log(account.setup.needActivation)                              // true until the activation email is clicked
console.log(account.identity.state === IdentityState.VALIDATED)        // true once the verification is done
```

Returns an `Account`:

| Field | Description |
|---|---|
| `uuid` | The customer |
| `identity` | The KYC or KYB file of the customer ([Identity](#identity)) |
| `business` | The businesses of the customer, each with its KYB file: `{ identity }[]` |
| `account` | The same fields as `Customer.account`, with `address` reduced to `{ uuid, address }` (or `null`) |
| `notifications` | Email preferences: `login` (login-related emails), `newsletter` (BITGEN newsletter) |
| `setup` | The same fields as `Customer.action.setup`: theme, display currency, language, category chosen at signup, activation pending, BITGEN emails accepted, onboarding completed |

An unknown customer answers `404 unknown_user`.

### Identity

`Identity` is the verification file of a person (`mode` `IdentityMode.KYC`) or of a business (`IdentityMode.KYB`). The verification itself — questionnaire, documents — is not part of this SDK: read its progress here. Whether a validated identity is required before the financial resources depends on your organization ([Activation and identity](../concepts.md#activation-and-identity)).

| Field | Description |
|---|---|
| `uuid` | The file |
| `state` | `IdentityState.CREATED`, `IN_PROGRESS`, `WAIT`, `PENDING`, `VALIDATED`, `REJECTED`, `FROZEN`, `EXPIRED` or `CLOSED` |
| `mode` | `IdentityMode.KYC` or `IdentityMode.KYB` |
| `form` | KYC — the answers of the KYC questionnaire: `european_residency` (boolean), `ppe` (politically exposed person, boolean), `ppp` (relative of a politically exposed person, boolean), `source_income`, `net_income`, `experience` (crypto experience); plus `score` (internal scoring) and `submittedAt` — KYB: `activity` (business activity), `score`, `submittedAt` |
| `data.steps` | One entry per step, `{ status, submittedAt }` — KYC: `info`, `selfie`, `identity`, `residency`; KYB: `info`, `kbis`, `status`, `domiciliation`, `rbe` |
| `data.verificationUrl` | URL of the identity verification when the provider hosts it, `null` otherwise |
| `data.hosted` | Whether the verification is hosted by the provider |
| `data.notifications` | Internal flag |
| `validatedAt`, `expiresAt` | Epoch seconds, or `null` |
| `renewalNotifiedAt` | When the renewal reminder was sent (epoch seconds, or `null`) — an identity expires after 12 months (6 for a politically exposed person) |

In TypeScript, `Identity` is the union `KycIdentity | KybIdentity`, discriminated on `mode`: narrow on it to type `form`.

```ts
import { IdentityMode } from '@bitgen/sdk'

const { identity } = await client.customer.get('CUSTOMER_UUID')

if (identity.mode === IdentityMode.KYC) {
  console.log(identity.form.source_income)   // KycIdentity
} else {
  console.log(identity.form.activity)        // KybIdentity
}
```

## Update

```
client.customer.update(user: UserRef, params: UpdateCustomerParams): Promise<void>
```

`user` is the customer, by uuid or model.

| Parameter | Type | Description |
|---|---|---|
| `params.theme` | `string` | Theme of the BITGEN web application (`light` by default) |
| `params.locale` | `Locale` | Language of the web application and of the emails: `Locale.FR` or `Locale.EN` |
| `params.notifications` | `{ login?: boolean, newsletter?: boolean }` | Email preferences: `login` (login-related emails), `newsletter` (BITGEN newsletter) |

```ts
import { Locale } from '@bitgen/sdk'

await client.customer.update('CUSTOMER_UUID', {
  locale: Locale.EN,
  notifications: { login: true, newsletter: false },
})
```

These are the only settings an API key may write — the account details, the identity state and the address are not — and the SDK sends nothing else. The API answers with an empty body: the promise resolves with `undefined`.

## Errors

In addition to the [common errors](../errors.md#common-errors):

| Status | `code` | Meaning |
|---|---|---|
| `400` | `invalid_fin` | `account.fin` (tax identification number) is longer than 100 characters, or not a scalar |
| `403` | `missing_group_organization_or_manager` | `group.manager` is missing |
| `404` | `unknown_user` | Unknown customer (`get`), or unknown `manager` (`list`) |
| `409` | `user_already_assigned` | The email belongs to an account attached to another organization |
| `409` | `account_unavailable` | The email belongs to an account still being created (less than 15 minutes ago) |
| `412` | `user_not_attachable` | The email belongs to an active account without a validated KYC |
| `422` | `invalid_include_closed` | `includeClosed` is not a boolean value |

## Related

- [User references](../concepts.md#user-references) — uuid or model (`Created`, `Customer`, `Account`…)
- [Activation and identity](../concepts.md#activation-and-identity) — what a customer can do before and after activation, and when a validated identity is required
- [Bank accounts](bank.md) — the EUR account of a customer
- [Custody wallets](custody.md) — their crypto wallets
- [Webhooks](webhooks.md) — `user.created` and the `user.identity.*` events
