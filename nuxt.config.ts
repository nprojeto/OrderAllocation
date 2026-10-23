// CampoOS — configuração do Nuxt
const SUPABASE_URL = 'https://jdzwycfvnkffadpcofjh.supabase.co'
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkend5Y2Z2bmtmZmFkcGNvZmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NzM0OTMsImV4cCI6MjEwODM0OTQ5M30.w61dMFXp2fMOZCzTXXSZeDirytqIovGUMwpP48y0088'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'CampoOS',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#14213d' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap' },
      ],
    },
  },
  router: { options: { hashMode: true } },
  css: ['~/assets/main.css'],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY || SUPABASE_KEY,
    },
  },
})
