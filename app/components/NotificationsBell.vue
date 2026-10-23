<template>
  <div class="bell">
    <button class="btn secondary sm" @click="toggle">
      🔔 <span v-if="unread" class="dot">{{ unread }}</span>
    </button>
    <div v-if="open" class="panel card">
      <div class="row between" style="margin-bottom:8px">
        <b>Notificações</b>
        <a v-if="unread" href="#" class="small" @click.prevent="markRead">Marcar como lidas</a>
      </div>
      <div v-if="!items.length" class="muted small">Nada por aqui.</div>
      <div v-for="n in items" :key="n.id" :class="['item', { new: !n.read_at }]" @click="go(n)">
        <div class="t">{{ n.title }}</div>
        <div v-if="n.body" class="b">{{ n.body }}</div>
        <div class="d">{{ dt(n.created_at) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { dt } from '~/composables/useFormat'
const api = useApi()
const { profile } = useAuth()
const items = ref<any[]>([])
const unread = ref(0)
const open = ref(false)
let timer: any
let last = -1

async function load() {
  try {
    const r = await api.get('/notifications')
    items.value = r.items
    if (last >= 0 && r.unread > last) beep()
    last = r.unread
    unread.value = r.unread
  } catch { /* ignora */ }
}
function beep() {
  try {
    const c = new AudioContext(); const o = c.createOscillator(); const g = c.createGain()
    o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = 0.05
    o.start(); o.stop(c.currentTime + 0.15)
  } catch { /* sem som */ }
}
async function markRead() { await api.post('/notifications/read'); await load() }
function toggle() { open.value = !open.value; if (open.value) load() }
function go(n: any) {
  open.value = false
  if (!n.os_id) return
  const role = profile.value?.role
  const base = role === 'empresa' ? '/empresa/ordens/' : role === 'tecnico' ? '/tecnico/ordens/'
    : role === 'qualidade' ? '/qualidade/' : '/admin/ordens/'
  navigateTo(base + n.os_id)
}
onMounted(() => { load(); timer = setInterval(load, 30000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.bell { position: relative; }
.dot { background: var(--accent); color: #fff; border-radius: 999px; font-size: 11px; padding: 0 6px; margin-left: 2px; }
.panel { position: absolute; right: 0; top: 42px; width: 340px; max-height: 460px; overflow: auto; z-index: 40; box-shadow: 0 12px 32px #0002; }
.item { padding: 9px 8px; border-radius: 6px; cursor: pointer; border-bottom: 1px solid var(--line); }
.item:hover { background: #f7f8fa; }
.item.new { border-left: 3px solid var(--accent); }
.t { font-weight: 600; font-size: 14px; }
.b { font-size: 13px; color: #344054; }
.d { font-size: 11px; color: var(--muted); margin-top: 2px; }
</style>
