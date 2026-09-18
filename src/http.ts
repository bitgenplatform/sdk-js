import { Env } from './constants.js'
import { BitgenError, MAX_CODE_LENGTH } from './error.js'
import type { BitgenConfig, BitgenErrorBody } from './types/index.js'
import { VERSION } from './version.js'

const LOCALHOST_PORT = 3002

/** Default request timeout, in seconds (`BitgenConfig.timeout`) */
const DEFAULT_TIMEOUT = 30
/** Largest timeout, in seconds: `setTimeout` — hence `AbortSignal.timeout` — accepts at most 2^31 − 1 ms */
const MAX_TIMEOUT = 2_147_483

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Query string entries — `undefined` and `null` are skipped */
export type Query = Record<string, string | number | boolean | null | undefined>

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  query?: Query | undefined
}

export class HttpClient {
  /** Organization uuid of the key — resources use it where the API expects the organization */
  readonly scope: string
  private readonly baseUrl: string
  private readonly headers: Record<string, string>
  /** Request timeout in milliseconds (`BitgenConfig.timeout` × 1000), `0` = none */
  private readonly timeout: number

  constructor(config: BitgenConfig) {
    if (typeof fetch !== 'function') {
      throw new Error('@bitgen/sdk needs a global fetch: use Node.js 20 or later')
    }
    requireHeaderValue(config.scope, 'scope')
    requireHeaderValue(config.apiKey, 'apiKey')

    this.scope = config.scope
    this.baseUrl = resolveBaseUrl(config)
    this.timeout = resolveTimeout(config.timeout)
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': `bitgen-sdk-nodejs/${VERSION}`,
      'BITGEN-Scope': config.scope,
      'Api-key': config.apiKey,
    }
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query } = options

    // Build URL with optional query params — undefined and null entries are skipped
    const url = new URL(path, this.baseUrl)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      }
    }

    // Redirects are never followed: the API does not redirect, and following one would replay the key to another host
    const init: RequestInit = { method, headers: this.headers, redirect: 'manual' }
    if (body !== undefined) {
      init.body = JSON.stringify(body)
    }
    const signal = this.timeout > 0 ? AbortSignal.timeout(this.timeout) : undefined
    if (signal) {
      init.signal = signal
    }

    let response: Response
    let text: string
    try {
      response = await fetch(url, init)
      text = response.status === 204 ? '' : await response.text()
    } catch (cause) {
      // No HTTP response at all: our own timeout fired, or the network failed (DNS, refused, TLS…)
      const code = signal?.aborted ? 'request_timeout' : 'network_error'
      throw new BitgenError(0, { error: true, message: code, code: 0 }, { cause })
    }

    // v4 sends the real HTTP status: anything outside 2xx is an error
    if (!response.ok) {
      throw new BitgenError(response.status, parseErrorBody(text) ?? rawBody(text, response))
    }

    // 204 No Content or empty body — nothing to parse
    if (text.trim() === '') {
      return undefined as unknown as T
    }

    try {
      return JSON.parse(text) as T
    } catch {
      // A 2xx that is not JSON (proxy page…): reported like a non-JSON error, never rethrown raw
      throw new BitgenError(response.status, rawBody(text, response))
    }
  }

  get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>(path, { method: 'GET', query })
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body })
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body })
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body })
  }

  delete<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', body })
  }
}

/** Fails fast on a missing, empty or non-printable-ASCII header value — never echoes the value itself */
function requireHeaderValue(value: unknown, name: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`BitgenConfig.${name} must be a non-empty string`)
  }
  if (!/^[\x20-\x7E]+$/.test(value)) {
    throw new TypeError(`BitgenConfig.${name} contains invalid characters (printable ASCII expected)`)
  }
}

/** Seconds from the config → integer milliseconds for `AbortSignal.timeout` (`0` = no timeout, any positive value ≥ 1 ms) */
function resolveTimeout(value: number | undefined): number {
  const seconds = value === undefined ? DEFAULT_TIMEOUT : value
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0 || seconds > MAX_TIMEOUT) {
    throw new TypeError(`BitgenConfig.timeout must be a number of seconds between 0 (no timeout) and ${MAX_TIMEOUT}`)
  }
  return seconds === 0 ? 0 : Math.max(1, Math.round(seconds * 1000))
}

function resolveBaseUrl(config: BitgenConfig): string {
  if (config.port !== undefined && (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)) {
    throw new TypeError('BitgenConfig.port must be an integer between 1 and 65535')
  }
  const base = resolveBase(config)
  try {
    new URL(base)
  } catch {
    throw new TypeError('BitgenConfig.host and port do not form a valid URL')
  }
  return base
}

function resolveBase(config: BitgenConfig): string {
  // Custom host (e.g. Docker container): bare hostname, scheme and port come from isSsl / port
  if (config.host !== undefined) {
    // Letters, digits, dots, hyphens (and underscores of internal DNS names): a scheme, a port, a path, userinfo (`me@attacker`) or a bracketed IPv6 are refused
    if (typeof config.host !== 'string' || !/^[A-Za-z0-9._-]+$/.test(config.host)) {
      throw new TypeError('BitgenConfig.host must be a bare hostname (no scheme, port or path): use port and isSsl')
    }
    const port = config.port ?? 80
    const scheme = config.isSsl !== false ? 'https' : 'http'
    return `${scheme}://${config.host}:${port}`
  }

  const env = config.env ?? Env.PRODUCTION
  switch (env) {
    case Env.PRODUCTION: return 'https://api.bitgen.com'
    case Env.SANDBOX: return 'https://api.sandbox.bitgen.com'
    case Env.STAGING: return 'https://api.staging.btgn.dev'
    case Env.LOCALHOST: return `http://localhost:${config.port ?? LOCALHOST_PORT}`
    default:
      // The value given is not echoed: a config mix-up must not leak into logs
      throw new TypeError(`BitgenConfig.env must be one of ${Object.values(Env).join(', ')} (see Env)`)
  }
}

/** Error body built from a non-JSON response: the raw text, truncated, stands for the code */
function rawBody(text: string, response: Response): BitgenErrorBody {
  const message = text.trim().slice(0, MAX_CODE_LENGTH) || response.statusText || String(response.status)
  return { error: true, message, code: response.status }
}

/** Returns the parsed body when it is a v4 error payload `{ error: true, message, code }`, null otherwise */
function parseErrorBody(text: string): BitgenErrorBody | null {
  try {
    const data: unknown = JSON.parse(text)
    if (
      typeof data === 'object' &&
      data !== null &&
      (data as { error?: unknown }).error === true &&
      typeof (data as { message?: unknown }).message === 'string'
    ) {
      return data as BitgenErrorBody
    }
  } catch {
    // not JSON
  }
  return null
}
