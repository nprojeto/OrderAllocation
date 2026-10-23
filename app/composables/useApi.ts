export const useApi = () => {
  const nuxt = useNuxtApp()
  const cfg = useRuntimeConfig()

  async function req<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const sb = nuxt.$supabase as any
    let token = cfg.public.supabaseKey as string
    if (sb) {
      const { data } = await sb.auth.getSession()
      if (data.session?.access_token) token = data.session.access_token
    }
    const appUrl = window.location.origin + cfg.app.baseURL
    let res: Response
    try {
      res = await fetch(`${cfg.public.supabaseUrl}/functions/v1/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: cfg.public.supabaseKey as string,
        'x-app-url': appUrl,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch {
      throw new Error('Sem conexão com o servidor. Verifique sua internet e tente novamente.')
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
    return data as T
  }

  return {
    get: <T = any>(p: string) => req<T>('GET', p),
    post: <T = any>(p: string, b: unknown = {}) => req<T>('POST', p, b),
    put: <T = any>(p: string, b: unknown = {}) => req<T>('PUT', p, b),
  }
}
