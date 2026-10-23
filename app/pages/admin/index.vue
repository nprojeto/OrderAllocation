<template>
  <div>
    <div class="page-head"><div><h1>Painel da plataforma</h1></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div v-if="s" class="grid g4" style="margin-bottom:14px">
      <NuxtLink to="/admin/tecnicos" class="card kpi lnk"><span class="l">Técnicos p/ aprovar</span><span class="v" :class="{ hot: s.pending.technicians }">{{ s.pending.technicians }}</span></NuxtLink>
      <NuxtLink to="/admin/criterios" class="card kpi lnk"><span class="l">Critérios p/ aprovar</span><span class="v" :class="{ hot: s.pending.criteria }">{{ s.pending.criteria }}</span></NuxtLink>
      <div class="card kpi"><span class="l">Fila da qualidade</span><span class="v">{{ s.pending.quality_queue }}</span></div>
      <div class="card kpi"><span class="l">Técnicos ativos / aprovados</span><span class="v">{{ s.users.tecnicos_ativos }} / {{ s.users.tecnicos }}</span></div>
    </div>
    <StatsPanel v-if="s" :s="s" mode="admin" />
  </div>
</template>
<script setup lang="ts">
const api = useApi()
const s = ref<any>(null); const err = ref('')
onMounted(async () => { try { s.value = await api.get('/admin/stats') } catch (e: any) { err.value = e.message } })
</script>
<style scoped>
.lnk { color: inherit; text-decoration: none !important; }
.lnk:hover { border-color: var(--accent); }
.hot { color: var(--accent); }
</style>
