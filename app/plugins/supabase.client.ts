import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(async () => {
  const cfg = useRuntimeConfig().public
  let supabase: SupabaseClient | null = null
  if (cfg.supabaseUrl && cfg.supabaseKey) {
    supabase = createClient(cfg.supabaseUrl as string, cfg.supabaseKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
    })

    // retorno do link "esqueci minha senha": ?reset=1&code=...
    const url = new URL(window.location.href)
    if (url.searchParams.get('reset')) {
      const code = url.searchParams.get('code')
      const errDesc = url.searchParams.get('error_description')
      let ok = false
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        ok = !error
      }
      sessionStorage.setItem('reset-flow', ok ? 'ok' : (errDesc || 'Link inválido ou expirado. Peça um novo.'))
      for (const k of ['reset', 'code', 'error', 'error_code', 'error_description']) url.searchParams.delete(k)
      window.history.replaceState(null, '', url.pathname + url.search + (url.hash || '#/'))
    }
  }
  return { provide: { supabase } }
})
