<template>
  <div>
    <div class="page-head"><div><h1>Minhas validações</h1></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div class="card">
      <div v-if="!items.length" class="empty">Nenhuma validação ainda.</div>
      <table v-else class="t">
        <thead><tr><th>Data</th><th>OS</th><th>Resultado</th><th>Parecer</th></tr></thead>
        <tr v-for="v in items" :key="v.id" class="click" @click="navigateTo('/qualidade/' + v.os_id)">
          <td class="small">{{ dt(v.created_at) }}</td>
          <td><span class="mono">#{{ v.os?.number }}</span> {{ v.os?.title }}</td>
          <td><StatusBadge :status="v.result" /></td>
          <td class="small">{{ v.notes }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { dt } from '~/composables/useFormat'
const api = useApi()
const items = ref<any[]>([]); const err = ref('')
onMounted(async () => { try { items.value = (await api.get('/quality/history')).items } catch (e: any) { err.value = e.message } })
</script>
