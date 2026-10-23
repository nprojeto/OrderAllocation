import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const cfg = useRuntimeConfig().public
  let supabase: SupabaseClient | null = null
  if (cfg.supabaseUrl && cfg.supabaseKey) {
    supabase = createClient(cfg.supabaseUrl as string, cfg.supabaseKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  }
  return { provide: { supabase } }
})
