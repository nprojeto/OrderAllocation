import { HOME } from '~/composables/useAuth'

const PUBLIC = ['/', '/cadastro', '/esqueci']

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/agendamento')) return
  const flow = sessionStorage.getItem('reset-flow')
  if (flow) {
    sessionStorage.removeItem('reset-flow')
    if (flow !== 'ok') return navigateTo({ path: '/esqueci', query: { erro: flow } })
    useState('resetOk', () => true).value = true
  }
  const auth = useAuth()
  if (!auth.ready.value) {
    try { await auth.load() } catch { /* sem sessão */ }
  }
  const p = auth.profile.value
  if (!p) return PUBLIC.includes(to.path) ? undefined : navigateTo('/')
  const home = HOME[p.role] || '/'
  if (useState('resetOk').value && to.path !== '/nova-senha') {
    useState('resetOk').value = false
    return navigateTo('/nova-senha')
  }
  if (PUBLIC.includes(to.path)) return navigateTo(home)
  const area = '/' + (to.path.split('/')[1] || '')
  if (area !== home && area !== '/perfil' && area !== '/nova-senha') return navigateTo(home)
})
