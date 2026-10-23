<template>
  <div>
    <div class="page-head"><div><h1>Critérios de validação</h1><div class="muted small">Aprove os critérios definidos pelas empresas</div></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div class="tabs">
      <button v-for="t in tabs" :key="t.v" :class="{ on: st === t.v }" @click="st = t.v">{{ t.l }}</button>
    </div>
    <div v-if="!items.length" class="card empty">Nada por aqui.</div>
    <div class="grid g2">
      <div v-for="t in items" :key="t.id" class="card">
        <div class="row between"><div><b>{{ t.name }}</b><div class="small muted">{{ t.company_name }} · {{ dt(t.created_at) }}</div></div><StatusBadge :status="t.status" /></div>
        <p v-if="t.description" class="small">{{ t.description }}</p>
        <ol class="small">
          <li v-for="i in [...t.items].sort((a, b) => a.position - b.position)" :key="i.id">{{ i.description }} <span v-if="i.required" class="muted">(obrigatório)</span></li>
        </ol>
        <div v-if="t.admin_note" class="small muted">Nota: {{ t.admin_note }}</div>
        <div v-if="t.status === 'pendente'" class="row" style="margin-top:10px">
          <button class="btn ok sm" :disabled="busy" @click="set(t, 'aprovado')">Aprovar</button>
          <button class="btn danger sm" :disabled="busy" @click="set(t, 'reprovado')">Reprovar</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { dt } from '~/composables/useFormat'
const api = useApi()
const tabs = [{ v: 'pendente', l: 'Pendentes' }, { v: 'aprovado', l: 'Aprovados' }, { v: 'reprovado', l: 'Reprovados' }, { v: '', l: 'Todos' }]
const st = ref('pendente'); const items = ref<any[]>([]); const err = ref(''); const busy = ref(false)
async function load() { try { items.value = (await api.get('/admin/criteria' + (st.value ? '?status=' + st.value : ''))).items } catch (e: any) { err.value = e.message } }
async function set(t: any, status: string) {
  let note: string | null = null
  if (status === 'reprovado') { note = prompt('Motivo da reprovação:'); if (!note) return }
  busy.value = true; err.value = ''
  try { await api.post(`/admin/criteria/${t.id}/status`, { status, note }); await load() } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
watch(st, load); onMounted(load)
</script>
