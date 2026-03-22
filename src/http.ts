import type { BitgenConfig } from './types/index.js'
import { BitgenError } from './error.js'

const BASE_URLS: Record<string, string> = {
  sandbox: 'https://api.staging.btgn.dev',
  production: 'https://api.bitgen.com',
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  /** Set to true for endpoints that return raw non-JSON errors (POST /tx) */
  rawErrors?: boolean
}

export class HttpClient {
  private readonly baseUrl: string
  private readonly headers: Record<string, string>

  constructor(config: BitgenConfig) {
    if (config.host) {
      const port = config.port ?? 80
      const scheme = config.isSsl !== false ? 'https' : 'http'
      this.baseUrl = `${scheme}://${config.host}:${port}`
    } else if (config.env === 'localhost') {
      const port = config.port ?? 14303
      this.baseUrl = `http://localhost:${port}`
    } else {
      this.baseUrl = BASE_URLS[config.env ?? 'production']
    }
    this.headers = {
      'Content-Type': 'application/json',
      'BITGEN-Scope': config.scope,
      'Api-key': config.apiKey,
    }
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query, rawErrors = false } = options

    // Build URL with optional query params
    const url = new URL(path, this.baseUrl)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value))
        }
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    // Handle raw HTTP errors (POST /api/v3/tx exception documented in API)
    if (rawErrors && (response.status === 500 || response.status === 400)) {
      const text = await response.text()
      throw new BitgenError(response.status, {
        module: 'create',
        service: 'transaction',
        code: response.status,
        message: text.trim(),
      })
    }

    // 204 No Content — no body to parse
    if (response.status === 204) {
      return undefined as unknown as T
    }

    const data = await response.json()

    // API embeds errors in body with an `error` key — all HTTP 200/201 with error key
    if (data && typeof data === 'object' && 'error' in data && data.error !== null) {
      throw new BitgenError(response.status, data.error)
    }

    return data as T
  }

  get<T>(path: string, query?: RequestOptions['query']): Promise<T> {
    return this.request<T>(path, { method: 'GET', query })
  }

  post<T>(path: string, body: unknown, rawErrors = false): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, rawErrors })
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body })
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}
