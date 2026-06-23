const store = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000 // 5 min

export function cached<T>(key: string, fn: () => Promise<T>, ttl = TTL): Promise<T> {
  const hit = store.get(key)
  if (hit && Date.now() - hit.ts < ttl) return Promise.resolve(hit.data as T)
  return fn().then(data => { store.set(key, { data, ts: Date.now() }); return data })
}
