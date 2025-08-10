const DEFAULT_TTL_MS = 60 * 60 * 1000 // 1h
export class ApiClient {
  private cache = new Map<string, { data:any; ts:number; ttl:number }>()

  private key(url: string, options?: RequestInit) {
    const method = (options?.method || 'GET').toUpperCase()
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  async fetchWithCache(url: string, options?: RequestInit, ttlMs = DEFAULT_TTL_MS) {
    const k = this.key(url, options)
    const now = Date.now()
    const cached = this.cache.get(k)
    if (cached && now - cached.ts < cached.ttl) return cached.data

    let retries = 3
    while (retries > 0) {
      try {
        const res = await fetch(url, { ...options, headers: { 'Accept': 'application/json', ...(options?.headers||{}) }})
        if (res.status === 429) throw new Error('RateLimited')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        this.cache.set(k, { data, ts: now, ttl: ttlMs })
        return data
      } catch (err:any) {
        retries--
        if (retries === 0) throw err
        const base = 500; const factor = 2 ** (3 - retries)
        const jitter = Math.floor(Math.random() * 200)
        await new Promise(r => setTimeout(r, base * factor + jitter))
      }
    }
  }
}
