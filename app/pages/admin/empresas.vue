<template>
  <div>
    <div class="page-head"><div><h1>Empresas</h1></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div class="tabs">
      <button v-for="t in tabs" :key="t.v" :class="{ on: st === t.v }" @click="st = t.v">{{ t.l }} ({{ countOf(t.v) }})</button>
    </div>
    <div class="card">
      <div v-if="!rows.length" class="empty">Nenhuma empresa.</div>
      <div v-else class="table-wrap">
        <table class="t">
          <thead><tr><th>Empresa</th><th>Razão social / CNPJ</th><th>Contato</th><th>Status</th><th></th></tr></thead>
          <tr v-for="c in rows" :key="c.id">
            <td><b>{{ c.name }}</b><div class="small muted">desde {{ dt(c.created_at) }}</div></td>
            <td class="small">{{ c.legal_name }}<div class="muted">{{ maskCnpj(c.document) }}</div></td>
            <td class="small">{{ c.email }}<div class="muted">{{ maskPhone(c.phone) }}</div></td>
            <td><StatusBadge :status="c.status" /><div v-if="c.status_note" class="small muted">{{ c.status_note }}</div></td>
            <td style="white-space:nowrap">
              <button v-if="c.status !== 'aprovado'" class="btn ok sm" :disabled="busy" @click="set(c, 'aprovado')">Aprovar</button>
              <button v-if="c.status === 'pendente'" class="btn danger sm" :disabled="busy" @click="set(c, 'reprovado')">Reprovar</button>
              <button v-if="c.status === 'aprovado'" class="btn danger sm" :disabled="busy" @click="set(c, 'bloqueado')">Bloquear</button>
              <ResetPasswordButton :user="c" />
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { dt } from '~/composables/useFormat'
import { maskCnpj, maskPhone } from '~/composables/useMask'
const api = useApi()
const tabs = [{ v: 'pendente', l: 'Pendentes' }, { v: 'aprovado', l: 'Aprovadas' }, { v: 'reprovado', l: 'Reprovadas' }, { v: 'bloqueado', l: 'Bloqueadas' }, { v: '', l: 'Todas' }]
const st = ref('pendente'); const items = ref<any[]>([]); const err = ref(''); const busy = ref(false)
const rows = computed(() => items.value.filter((c) => !st.value || c.status === st.value))
const countOf = (v: string) => items.value.filter((c) => !v || c.status === v).length
async function load() { try { items.value = (await api.get('/admin/companies')).items } catch (e: any) { err.value = e.message } }
async function set(c: any, status: string) {
  let note: string | null = null
  if (status !== 'aprovado') { note = prompt('Motivo:'); if (!note) return }
  busy.value = true; err.value = ''
  try { await api.post(`/admin/companies/${c.id}/status`, { status, note }); await load() } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
onMounted(load)
</script>
