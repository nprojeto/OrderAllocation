<template>
  <div>
    <div class="page-head"><div><h1>Empresas</h1></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div class="card">
      <div v-if="!items.length" class="empty">Nenhuma empresa.</div>
      <table v-else class="t">
        <thead><tr><th>Empresa</th><th>Razão social / CNPJ</th><th>Contato</th><th>Status</th><th></th></tr></thead>
        <tr v-for="c in items" :key="c.id">
          <td><b>{{ c.name }}</b><div class="small muted">desde {{ dt(c.created_at) }}</div></td>
          <td class="small">{{ c.legal_name }}<div class="muted">{{ c.document }}</div></td>
          <td class="small">{{ c.email }}<div class="muted">{{ c.phone }}</div></td>
          <td><StatusBadge :status="c.status" /></td>
          <td>
            <button v-if="c.status === 'aprovado'" class="btn danger sm" :disabled="busy" @click="set(c, 'bloqueado')">Bloquear</button>
            <button v-else class="btn ok sm" :disabled="busy" @click="set(c, 'aprovado')">Liberar</button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { dt } from '~/composables/useFormat'
const api = useApi()
const items = ref<any[]>([]); const err = ref(''); const busy = ref(false)
async function load() { try { items.value = (await api.get('/admin/companies')).items } catch (e: any) { err.value = e.message } }
async function set(c: any, status: string) {
  busy.value = true; err.value = ''
  try { await api.post(`/admin/users/${c.id}/status`, { status }); await load() } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
onMounted(load)
</script>
