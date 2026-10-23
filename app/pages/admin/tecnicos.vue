<template>
  <div>
    <div class="page-head"><div><h1>Técnicos</h1></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div class="tabs">
      <button v-for="t in tabs" :key="t.v" :class="{ on: st === t.v }" @click="st = t.v">{{ t.l }}</button>
    </div>
    <div class="card">
      <div v-if="!items.length" class="empty">Nenhum técnico.</div>
      <div class="table-wrap" v-else>
        <table class="t">
          <thead><tr><th>Técnico</th><th>Documento</th><th>Especialidades</th><th>Base / raio</th><th>Status</th><th></th></tr></thead>
          <tr v-for="t in items" :key="t.id">
            <td><b>{{ t.name }}</b><div class="small muted">{{ t.email }} · {{ t.phone }}</div><div class="small muted">desde {{ dt(t.created_at) }}</div></td>
            <td class="small">{{ t.document }}</td>
            <td class="small">{{ t.skills }}</td>
            <td class="small">{{ t.base_address || '—' }}<div v-if="t.base_lat" class="muted">{{ t.base_lat }}, {{ t.base_lng }} · {{ t.radius_km }} km</div>
              <span v-if="t.available" class="badge b-finalizada">disponível</span></td>
            <td><StatusBadge :status="t.status" /><div v-if="t.status_note" class="small muted">{{ t.status_note }}</div></td>
            <td style="white-space:nowrap">
              <button v-if="t.status !== 'aprovado'" class="btn ok sm" :disabled="busy" @click="set(t, 'aprovado')">Aprovar</button>
              <button v-if="t.status === 'pendente'" class="btn danger sm" :disabled="busy" @click="set(t, 'reprovado')">Reprovar</button>
              <button v-if="t.status === 'aprovado'" class="btn danger sm" :disabled="busy" @click="set(t, 'bloqueado')">Bloquear</button>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { dt } from '~/composables/useFormat'
const api = useApi()
const tabs = [{ v: 'pendente', l: 'Pendentes' }, { v: 'aprovado', l: 'Aprovados' }, { v: 'reprovado', l: 'Reprovados' }, { v: 'bloqueado', l: 'Bloqueados' }, { v: '', l: 'Todos' }]
const st = ref('pendente'); const items = ref<any[]>([]); const err = ref(''); const busy = ref(false)
async function load() { try { items.value = (await api.get('/admin/technicians' + (st.value ? '?status=' + st.value : ''))).items } catch (e: any) { err.value = e.message } }
async function set(t: any, status: string) {
  let note: string | null = null
  if (status !== 'aprovado') { note = prompt('Motivo:') ; if (note === null) return }
  busy.value = true; err.value = ''
  try { await api.post(`/admin/technicians/${t.id}/status`, { status, note }); await load() } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
watch(st, load); onMounted(load)
</script>
