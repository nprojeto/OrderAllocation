<template>
  <div class="wrap">
    <div class="card box">
      <NuxtLink to="/" class="small">← Voltar ao login</NuxtLink>
      <h1 style="margin-top:8px">Esqueci minha senha</h1>
      <p class="small muted">Informe seu e-mail. Você receberá um link para criar uma nova senha. Abra o link <b>no mesmo navegador</b>.</p>
      <div v-if="err" class="alert err">{{ err }}</div>
      <div v-if="sent" class="alert ok">Se o e-mail estiver cadastrado, o link chegará em instantes. Confira também o spam.</div>
      <form v-else @submit.prevent="submit">
        <div class="field"><label>E-mail</label><input v-model="email" type="email" required /></div>
        <button class="btn block" :disabled="busy">{{ busy ? 'Enviando…' : 'Enviar link' }}</button>
      </form>
    </div>
  </div>
</template>
<script setup lang="ts">
const route = useRoute()
const { requestReset } = useAuth()
const email = ref(''); const err = ref(String(route.query.erro || '')); const sent = ref(false); const busy = ref(false)
async function submit() {
  busy.value = true; err.value = ''
  try { await requestReset(email.value); sent.value = true } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
</script>
<style scoped>
.wrap { min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; padding: 60px 16px; }
.box { width: min(420px, 100%); }
</style>
