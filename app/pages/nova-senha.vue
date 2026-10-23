<template>
  <div>
    <div class="page-head"><div><h1>Criar nova senha</h1></div></div>
    <div class="card" style="max-width:440px">
      <div v-if="err" class="alert err">{{ err }}</div>
      <div v-if="ok" class="alert ok">Senha alterada com sucesso.</div>
      <div class="field"><label>Nova senha</label><input v-model="p1" type="password" minlength="8" /></div>
      <div class="field"><label>Repita a nova senha</label><input v-model="p2" type="password" minlength="8" /></div>
      <div class="row">
        <button class="btn" :disabled="busy" @click="save">Salvar nova senha</button>
        <NuxtLink v-if="ok" :to="HOME[profile?.role] || '/'" class="btn secondary">Continuar</NuxtLink>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { HOME } from '~/composables/useAuth'
const { profile, updatePassword } = useAuth()
const p1 = ref(''); const p2 = ref(''); const err = ref(''); const ok = ref(false); const busy = ref(false)
async function save() {
  err.value = ''; ok.value = false
  if (p1.value !== p2.value) { err.value = 'As senhas não conferem.'; return }
  busy.value = true
  try { await updatePassword(p1.value); ok.value = true; p1.value = ''; p2.value = '' } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
</script>
