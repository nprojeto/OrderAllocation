<template>
  <div class="auth">
    <div class="hero">
      <div class="brand"><span>◆</span> CampoOS</div>
      <h1>Ordens de serviço de campo, do lançamento à validação.</h1>
      <ul>
        <li>Distribuição para o técnico ativo mais próximo</li>
        <li>Agendamento confirmado pelo cliente</li>
        <li>Agenda sem conflitos e histórico completo</li>
        <li>Validação pela equipe de qualidade</li>
      </ul>
    </div>
    <div class="box card">
      <h2>Entrar</h2>
      <div v-if="err" class="alert err">{{ err }}</div>
      <form @submit.prevent="submit">
        <div class="field"><label>E-mail</label><input v-model="email" type="email" required autocomplete="email" /></div>
        <div class="field"><label>Senha</label><input v-model="password" type="password" required autocomplete="current-password" /></div>
        <button class="btn block" :disabled="busy">{{ busy ? 'Entrando…' : 'Entrar' }}</button>
      </form>
      <hr class="sep" />
      <p class="small muted" style="margin:0">Ainda não tem conta? <NuxtLink to="/cadastro">Cadastre sua empresa ou seja técnico</NuxtLink></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HOME } from '~/composables/useAuth'
const { login } = useAuth()
const email = ref('')
const password = ref('')
const err = ref('')
const busy = ref(false)
async function submit() {
  busy.value = true; err.value = ''
  try {
    const p = await login(email.value, password.value)
    await navigateTo(HOME[p?.role] || '/')
  } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
</script>

<style scoped>
.auth { min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; }
.hero { background: var(--ink); color: #dfe5f2; padding: 56px; display: flex; flex-direction: column; justify-content: center; }
.hero .brand { color: #fff; font-weight: 700; font-size: 20px; margin-bottom: 32px; }
.hero .brand span { color: var(--accent); }
.hero h1 { color: #fff; font-size: 34px; line-height: 1.15; max-width: 480px; margin-bottom: 24px; }
.hero ul { padding: 0; list-style: none; margin: 0; }
.hero li { padding: 7px 0 7px 22px; position: relative; }
.hero li::before { content: ''; position: absolute; left: 0; top: 15px; width: 10px; height: 2px; background: var(--accent); }
.box { align-self: center; justify-self: center; width: min(400px, 92vw); margin: 32px 0; }
@media (max-width: 860px) { .auth { grid-template-columns: 1fr; } .hero { padding: 32px 24px; } .hero h1 { font-size: 24px; } }
</style>
