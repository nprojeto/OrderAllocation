export const HOME: Record<string, string> = {
  admin: '/admin',
  empresa: '/empresa',
  tecnico: '/tecnico',
  qualidade: '/qualidade',
}

export const useAuth = () => {
  const profile = useState<any>('profile', () => null)
  const ready = useState<boolean>('authReady', () => false)
  const nuxt = useNuxtApp()
  const sb = () => nuxt.$supabase as any

  async function load() {
    if (!sb()) { ready.value = true; return null }
    const { data } = await sb().auth.getSession()
    if (!data.session) { profile.value = null; ready.value = true; return null }
    try {
      profile.value = await useApi().get('/me')
    } catch (e: any) {
      profile.value = null
      await sb().auth.signOut()
      ready.value = true
      throw e
    }
    ready.value = true
    return profile.value
  }

  async function login(email: string, password: string) {
    const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
    return await load()
  }

  async function signup(email: string, password: string, meta: Record<string, unknown>) {
    const { data, error } = await sb().auth.signUp({ email: email.trim(), password, options: { data: meta } })
    if (error) {
      if (/registered/i.test(error.message)) throw new Error('Este e-mail já está cadastrado.')
      throw new Error(error.message)
    }
    return data
  }

  async function logout() {
    await sb()?.auth.signOut()
    profile.value = null
    await navigateTo('/')
  }

  return { profile, ready, load, login, signup, logout }
}
