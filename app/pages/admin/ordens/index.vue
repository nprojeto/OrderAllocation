<template>
  <div>
    <div class="page-head"><div><h1>Todas as ordens de serviço</h1></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <OsTable :items="items" :loading="loading" link-base="/admin/ordens/" :show="{ company: true, tech: true, value: true }" value-label="Total empresa" />
  </div>
</template>
<script setup lang="ts">
const api = useApi()
const items = ref<any[]>([]); const loading = ref(true); const err = ref('')
onMounted(async () => { try { items.value = (await api.get('/admin/os')).items } catch (e: any) { err.value = e.message } finally { loading.value = false } })
</script>
