<template>
  <div v-if="profile" class="shell">
    <aside :class="['side', { open }]">
      <div class="brand">
        <span class="logo">◆</span> CampoOS
      </div>
      <div class="who">
        <div class="name">{{ profile.name }}</div>
        <div class="role">{{ ROLE[profile.role] }}</div>
      </div>
      <nav>
        <NuxtLink v-for="m in menu" :key="m.to" :to="m.to" :class="{ on: isOn(m.to) }" @click="open = false">
          <span class="ic">{{ m.ic }}</span>{{ m.label }}
          <span v-if="m.badge" class="cnt">{{ m.badge }}</span>
        </NuxtLink>
      </nav>
      <div class="bottom">
        <NuxtLink to="/perfil" :class="{ on: isOn('/perfil') }" @click="open = false"><span class="ic">☺</span>Meu perfil</NuxtLink>
        <a href="#" @click.prevent="logout"><span class="ic">⇥</span>Sair</a>
      </div>
    </aside>
    <div class="main">
      <header class="top">
        <button class="burger" @click="open = !open">☰</button>
        <div style="flex:1" />
        <NotificationsBell />
      </header>
      <main class="content">
        <slot />
      </main>
    </div>
    <div v-if="open" class="scrim" @click="open = false" />
  </div>
  <div v-else class="bare"><slot /></div>
</template>

<script setup lang="ts">
import { ROLE } from '~/composables/useFormat'
const { profile, logout } = useAuth()
const route = useRoute()
const open = ref(false)

const MENUS: Record<string, { to: string; label: string; ic: string; badge?: any }[]> = {
  empresa: [
    { to: '/empresa', label: 'Painel', ic: '▦' },
    { to: '/empresa/ordens', label: 'Ordens de serviço', ic: '≡' },
    { to: '/empresa/ordens/nova', label: 'Nova OS', ic: '+' },
    { to: '/empresa/criterios', label: 'Critérios de validação', ic: '✓' },
  ],
  tecnico: [
    { to: '/tecnico', label: 'OS próximas', ic: '◎' },
    { to: '/tecnico/ordens', label: 'Minhas OS', ic: '≡' },
    { to: '/tecnico/agenda', label: 'Agenda', ic: '▤' },
  ],
  qualidade: [
    { to: '/qualidade', label: 'Fila de validação', ic: '✓' },
    { to: '/qualidade/historico', label: 'Histórico', ic: '↺' },
  ],
  admin: [
    { to: '/admin', label: 'Painel', ic: '▦' },
    { to: '/admin/tecnicos', label: 'Técnicos', ic: '⚒' },
    { to: '/admin/criterios', label: 'Critérios', ic: '✓' },
    { to: '/admin/ordens', label: 'Ordens de serviço', ic: '≡' },
    { to: '/admin/empresas', label: 'Empresas', ic: '▣' },
    { to: '/admin/usuarios', label: 'Usuários internos', ic: '☺' },
    { to: '/admin/config', label: 'Configurações', ic: '⚙' },
  ],
}
const menu = computed(() => MENUS[profile.value?.role] || [])
const isOn = (to: string) => {
  const home = '/' + route.path.split('/')[1]
  if (to === home) return route.path === to
  if (to === '/empresa/ordens') return route.path.startsWith(to) && route.path !== '/empresa/ordens/nova'
  return route.path.startsWith(to)
}
</script>

<style scoped>
.shell { display: flex; min-height: 100vh; }
.side { width: 240px; background: var(--ink); color: #c9d1e3; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; flex-shrink: 0; }
.brand { padding: 20px 20px 14px; color: #fff; font-weight: 700; font-size: 18px; letter-spacing: .02em; }
.logo { color: var(--accent); }
.who { margin: 0 14px 12px; padding: 10px 12px; background: var(--ink-2); border-radius: 8px; }
.who .name { color: #fff; font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.who .role { font-size: 12px; color: var(--accent); text-transform: uppercase; letter-spacing: .06em; }
nav, .bottom { display: flex; flex-direction: column; padding: 4px 10px; gap: 2px; }
.bottom { margin-top: auto; padding-bottom: 16px; border-top: 1px solid #ffffff14; padding-top: 10px; }
nav a, .bottom a { color: #c9d1e3; padding: 9px 10px; border-radius: 7px; font-size: 14px; display: flex; align-items: center; gap: 10px; text-decoration: none; }
nav a:hover, .bottom a:hover { background: #ffffff0f; color: #fff; }
nav a.on, .bottom a.on { background: #ffffff1a; color: #fff; box-shadow: inset 3px 0 0 var(--accent); }
.ic { width: 18px; text-align: center; opacity: .85; }
.cnt { margin-left: auto; background: var(--accent); color: #fff; border-radius: 999px; font-size: 11px; padding: 0 7px; }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.top { height: 56px; display: flex; align-items: center; padding: 0 22px; border-bottom: 1px solid var(--line); background: #fff; position: sticky; top: 0; z-index: 5; }
.burger { display: none; font-size: 20px; background: none; border: 0; cursor: pointer; }
.content { padding: 24px; max-width: 1200px; width: 100%; }
.scrim { display: none; }
@media (max-width: 860px) {
  .side { position: fixed; left: -260px; z-index: 30; transition: left .2s; }
  .side.open { left: 0; }
  .burger { display: block; }
  .scrim { display: block; position: fixed; inset: 0; background: #0006; z-index: 20; }
  .content { padding: 16px; }
}
</style>
