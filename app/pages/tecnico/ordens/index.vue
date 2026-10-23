<template>
  <div>
    <div class="page-head"><div><h1>Minhas OS</h1></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <StatsPanel v-if="s" :s="s" mode="tecnico" style="margin-bottom:18px" />
    <OsTable :items="items" :loading="loading" link-base="/tecnico/ordens/" :show="{ company: true, value: true }" value-field="tech_total" value-label="Você recebe" />
  </div>
</template>
<script setup lang="ts">
const api = useApi()
const items = ref<any[]>([]); const loading = ref(true); const err = ref(''); const s = ref<any>(null)
onMounted(async () => {
  try { items.value = (await api.get('/tech/os')).items; s.value = await api.get('/tech/stats') }
  catch (e: any) { err.value = e.message } finally { loading.value = false }
})
</script>
