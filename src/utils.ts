import type { Amount, AssetInput, UserRef } from './types/index.js'

/**
 * Resolve a UserRef (uuid or email string, or a model carrying a `uuid`) to its string.
 * Used by all resource methods that accept a user parameter.
 */
export function resolveUuid(ref: UserRef): string {
  const value = typeof ref === 'string' ? ref : ref?.uuid
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('user must be a non-empty uuid or email, or a model with a non-empty uuid')
  }
  return value
}

/**
 * The uuid of a reference given as a string (sent as is) or as a model carrying a `uuid` (an `Order`, a
 * `StakingPosition`, an `Apikey`…). An empty string, or a model without one, is refused before any request.
 */
export function idOf(ref: string | { uuid: string }, name: string): string {
  const value = typeof ref === 'string' ? ref : ref?.uuid
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} must be a non-empty string, or a model with a non-empty uuid`)
  }
  return value
}

/** An asset as given — a uuid or ISO code string as is, or the uuid of an `Asset` / `AssetRef` model; empty → `TypeError` before any request */
export function assetId(asset: AssetInput): string {
  const value = typeof asset === 'string' ? asset : asset?.uuid
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('asset must be a uuid or an ISO code, or a model with a non-empty uuid')
  }
  return value
}

/** An optional asset filter of a list: absent or `null` stays absent, otherwise `assetId` */
export function assetFilter(asset: AssetInput | null | undefined): string | undefined {
  return asset === undefined || asset === null ? undefined : assetId(asset)
}

/** Validate and encode a value used as a path segment (`/asset/{asset}`, `/account/{user}`…) */
export function pathSegment(value: string, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} must be a non-empty string`)
  }
  // `.` and `..` are not encoded by encodeURIComponent and would be normalized away by the URL parser
  if (value === '.' || value === '..') {
    throw new TypeError(`${name} must not be "." or ".."`)
  }
  return encodeURIComponent(value)
}

/**
 * Normalize an amount for the API, which always receives a string: a string is sent as is
 * (trimmed), a finite number ≥ 0 is converted with `String(n)`. Numbers that `String()` writes
 * in exponent notation (below 1e-6 or from 1e21) are refused: pass them as strings.
 */
export function amount(value: Amount): string {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') {
      throw new TypeError('amount must be a non-empty string or a finite number >= 0')
    }
    return trimmed
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError('amount must be a non-empty string or a finite number >= 0')
  }
  const text = String(value)
  if (text.includes('e')) {
    throw new TypeError(`amount ${text} would be sent in exponent notation: pass it as a decimal string`)
  }
  return text
}
