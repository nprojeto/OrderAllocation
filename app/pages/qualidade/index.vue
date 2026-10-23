<template>
  <div>
    <div class="page-head"><div><h1>Fila de validação</h1><div class="muted small">Mais antigas primeiro</div></div>
      <button class="btn secondary sm" @click="load">↻ Atualizar</button></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div class="tabs">
      <button :class="{ on: st === 'em_validacao' }" @click="st = 'em_validacao'">Aguardando validação</button>
      <button :class="{ on: st === 'retrabalho' }" @click="st = 'retrabalho'">Em retrabalho</button>
      <button :class="{ on: st === 'finalizada' }" @click="st = 'finalizada'">Finalizadas</button>
    </div>
    <div class="card">
      <div v-if="loading" class="empty">Carregando…</div>
      <div v-else-if="!items.length" class="empty">Fila vazia.</div>
      <table v-else class="t">
        <thead><tr><th>OS</th><th>Título</th><th>Empresa</th><th>Técnico</th><th>Concluída em</th><th>Na fila há</th><th>Validações</th></tr></thead>
        <tr v-for="o in items" :key="o.id" class="click" @click="navigateTo('/qualidade/' + o.id)">
          <td class="mono">#{{ o.number }}</td><td><b>{{ o.title }}</b></td><td>{{ o.company_name }}</td><td>{{ o.tech_name }}</td>
          <td class="small">{{ dt(o.completed_at) }}</td>
          <td class="small">{{ o.completed_at ? hours((Date.now() - new Date(o.completed_at).getTime()) / 3600000) : '—' }}</td>
          <td>{{ o.validations_count }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { dt, hours } from '~/composables/useFormat'
const api = useApi()
const items = ref<any[]>([]); const loading = ref(true); const err = ref(''); const st = ref('em_validacao')
async function load() {
  loading.value = true
  try { items.value = (await api.get('/quality/queue?status=' + st.value)).items } catch (e: any) { err.value = e.message } finally { loading.value = false }
}
watch(st, load)
onMounted(load)
</script>
