<template>
  <div>
    <div class="page-head"><div><h1>Agenda</h1><div class="muted small">Horários confirmados ficam reservados — não é possível sobrepor.</div></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>

    <div v-if="pending.length" class="card" style="margin-bottom:14px">
      <h2>Aguardando confirmação</h2>
      <div v-for="o in pending" :key="o.id" class="row between item" @click="navigateTo('/tecnico/ordens/' + o.id)">
        <span><span class="mono">#{{ o.number }}</span> {{ o.title }}</span><StatusBadge :status="o.status" />
      </div>
    </div>

    <div v-if="loading" class="empty">Carregando…</div>
    <div v-else-if="!groups.length" class="card empty">Nenhum atendimento confirmado.</div>
    <div v-for="g in groups" :key="g.day" class="card day">
      <div class="dh"><b>{{ g.label }}</b><span v-if="g.today" class="badge b-agendada">Hoje</span></div>
      <div v-for="o in g.items" :key="o.id" class="slot" @click="navigateTo('/tecnico/ordens/' + o.id)">
        <div class="tm mono">{{ tOnly(o.scheduled_start) }}<br /><span class="muted">{{ tOnly(o.scheduled_end) }}</span></div>
        <div style="flex:1">
          <div><b>#{{ o.number }} · {{ o.title }}</b> <StatusBadge :status="o.status" /></div>
          <div class="small muted">{{ o.client_name }} · {{ o.address }}</div>
        </div>
        <a class="btn secondary sm" :href="mapsUrl(o.lat, o.lng)" target="_blank" @click.stop>Rota</a>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { tOnly, mapsUrl } from '~/composables/useFormat'
const api = useApi()
const items = ref<any[]>([]); const pending = ref<any[]>([]); const loading = ref(true); const err = ref('')
const groups = computed(() => {
  const m = new Map<string, any[]>()
  for (const o of items.value) {
    const k = new Date(o.scheduled_start).toDateString()
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(o)
  }
  return [...m.entries()].map(([day, list]) => ({
    day, items: list, today: day === new Date().toDateString(),
    label: new Date(list[0].scheduled_start).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
  }))
})
onMounted(async () => {
  try { const r = await api.get('/tech/agenda'); items.value = r.items; pending.value = r.pending }
  catch (e: any) { err.value = e.message } finally { loading.value = false }
})
</script>
<style scoped>
.day { margin-bottom: 12px; }
.dh { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; text-transform: capitalize; }
.slot { display: flex; gap: 14px; align-items: center; padding: 10px 0; border-top: 1px solid var(--line); cursor: pointer; }
.tm { width: 56px; font-size: 14px; }
.item { padding: 8px 0; border-top: 1px solid var(--line); cursor: pointer; }
</style>
