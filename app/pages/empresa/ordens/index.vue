<template>
  <div>
    <div class="page-head">
      <div><h1>Ordens de serviço</h1></div>
      <NuxtLink to="/empresa/ordens/nova" class="btn">+ Nova OS</NuxtLink>
    </div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <OsTable :items="items" :loading="loading" link-base="/empresa/ordens/" :show="{ tech: true, value: true }" value-label="Total" />
  </div>
</template>
<script setup lang="ts">
const api = useApi()
const items = ref<any[]>([]); const loading = ref(true); const err = ref('')
onMounted(async () => {
  try { items.value = (await api.get('/company/os')).items } catch (e: any) { err.value = e.message } finally { loading.value = false }
})
</script>
