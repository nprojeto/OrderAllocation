import { HOME } from '~/composables/useAuth'

const PUBLIC = ['/', '/cadastro']

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/agendamento')) return
  const auth = useAuth()
  if (!auth.ready.value) {
    try { await auth.load() } catch { /* sem sessão */ }
  }
  const p = auth.profile.value
  if (!p) return PUBLIC.includes(to.path) ? undefined : navigateTo('/')
  const home = HOME[p.role] || '/'
  if (PUBLIC.includes(to.path)) return navigateTo(home)
  const area = '/' + (to.path.split('/')[1] || '')
  if (area !== home && area !== '/perfil') return navigateTo(home)
})
