<template>
  <div v-if="p && p.status !== 'aprovado'" :class="['alert', p.status === 'pendente' ? 'warn' : 'err']">
    <template v-if="p.status === 'pendente'">Seu cadastro está <b>em análise</b> pelo administrador. Você já pode cadastrar seus critérios de validação; o lançamento de OS será liberado após a aprovação.</template>
    <template v-else>Cadastro {{ p.status }}. {{ p.status_note }}</template>
  </div>
</template>
<script setup lang="ts">
const { profile: p } = useAuth()
</script>
