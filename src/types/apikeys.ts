export type { ApikeyState } from '../constants.js'
import type { ApikeyState } from '../constants.js'

export interface Apikey {
  uuid: string
  state: ApikeyState
  name: string
  permissions: string[]
  expireAt: number
  createdAt: number
  organization: {
    uuid: string
    state: string
    name: string
    hub: { uuid: string, state: string, name: string, options: Record<string, unknown> } | null
    owner: { uuid: string, login: string, firstname: string, lastname: string | null } | null
  }
}

/** One call made with the key (`GET …/apikeys/{apikey}/logs`) */
export interface ApikeyLog {
  date: number
  /** `"GET /custody/…"` */
  path: string
  /** JSON of the inputs, PII masked */
  payload: string
  status: number
  error: string | null
}

export interface ApikeyListParams {
  offset?: number
  limit?: number
  includeRevoked?: boolean
}
