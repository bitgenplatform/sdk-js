import type { BitgenErrorBody } from './types/index.js'

/** Max length kept for `code`: the API sends short snake_case codes, anything longer is a foreign body (proxy page…) */
export const MAX_CODE_LENGTH = 200

/** Brand shared by every copy of the SDK loaded in a process (ESM and CJS builds side by side) */
const BRAND = Symbol.for('@bitgen/sdk:BitgenError')

export class BitgenError extends Error {
  /** HTTP status code — `0` when no HTTP response was received (`request_timeout`, `network_error`) */
  readonly status: number
  /** Stable BITGEN error code (e.g. `invalid_amount`), or the raw response text (≤ 200 chars) when the API did not answer JSON */
  readonly code: string

  constructor(status: number, body: BitgenErrorBody, options?: { cause?: unknown }) {
    const code = body.message.slice(0, MAX_CODE_LENGTH)
    super(`[${status}] ${code}`, options)
    this.name = 'BitgenError'
    this.status = status
    this.code = code
    Object.defineProperty(this, BRAND, { value: true })
  }

  /** `instanceof` also recognizes a BitgenError thrown by another copy of the SDK (ESM and CJS builds loaded together) */
  static override [Symbol.hasInstance](value: unknown): boolean {
    if (Function.prototype[Symbol.hasInstance].call(this, value)) {
      return true
    }
    return this === BitgenError && typeof value === 'object' && value !== null && BRAND in value
  }

  /** `JSON.stringify(err)` → `{ name, message, status, code }` (`cause` is left out) */
  toJSON(): { name: string, message: string, status: number, code: string } {
    return { name: this.name, message: this.message, status: this.status, code: this.code }
  }
}
