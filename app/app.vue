<template>
  <div v-if="!configured" style="padding:40px;max-width:560px;margin:auto">
    <h1>Configuração pendente</h1>
    <p>Defina a URL e a chave do Supabase em <code>nuxt.config.ts</code>.</p>
  </div>
  <NuxtLayout v-else>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const configured = !!useNuxtApp().$supabase
</script>
