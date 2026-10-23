<template>
  <div>
    <div class="page-head">
      <div><h1>Painel</h1><div class="muted small">Acompanhe suas ordens e SLAs</div></div>
      <NuxtLink to="/empresa/ordens/nova" class="btn">+ Nova OS</NuxtLink>
    </div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div v-if="noCriteria" class="alert warn">Para lançar OS você precisa de um conjunto de <NuxtLink to="/empresa/criterios">critérios de validação</NuxtLink> aprovado pelo admin.</div>
    <StatsPanel v-if="s" :s="s" mode="empresa" />
    <div v-else-if="!err" class="empty">Carregando…</div>
  </div>
</template>
<script setup lang="ts">
const api = useApi()
const s = ref<any>(null); const err = ref(''); const noCriteria = ref(false)
onMounted(async () => {
  try {
    s.value = await api.get('/company/stats')
    const c = await api.get('/company/criteria')
    noCriteria.value = !c.items.some((x: any) => x.status === 'aprovado')
  } catch (e: any) { err.value = e.message }
})
</script>
