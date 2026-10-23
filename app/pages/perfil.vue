<template>
  <div>
    <div class="page-head"><div><h1>Meu perfil</h1><div class="muted small">{{ p?.email }}</div></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div v-if="msg" class="alert ok">{{ msg }}</div>
    <div class="card" style="max-width:720px">
      <div class="grid g2">
        <div class="field"><label>Nome</label><input v-model="f.name" /></div>
        <div class="field"><label>Telefone / WhatsApp</label><input v-model="f.phone" v-mask="'phone'" /></div>
      </div>
      <div v-if="p?.role === 'empresa'" class="grid g2">
        <div class="field"><label>Razão social</label><input v-model="f.legal_name" /></div>
        <div class="field"><label>CNPJ</label><input v-model="f.document" v-mask="'cnpj'" /></div>
      </div>
      <template v-if="p?.role === 'tecnico'">
        <div class="grid g2">
          <div class="field"><label>CPF/CNPJ</label><input v-model="f.document" v-mask="'doc'" /></div>
          <div class="field"><label>Especialidades</label><input v-model="f.skills" /></div>
        </div>
        <TechLocation v-model="f" />
      </template>
      <button class="btn" :disabled="busy" @click="save">Salvar</button>
    </div>
    <div class="card" style="max-width:720px;margin-top:14px">
      <h2>Alterar senha</h2>
      <div v-if="pwErr" class="alert err">{{ pwErr }}</div>
      <div v-if="pwOk" class="alert ok">Senha alterada.</div>
      <div class="grid g2">
        <div class="field"><label>Nova senha</label><input v-model="pw1" type="password" minlength="8" /></div>
        <div class="field"><label>Repita a nova senha</label><input v-model="pw2" type="password" minlength="8" /></div>
      </div>
      <button class="btn secondary" :disabled="busy || !pw1" @click="changePw">Alterar senha</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { profile: p, load, updatePassword } = useAuth()
const pw1 = ref(''); const pw2 = ref(''); const pwErr = ref(''); const pwOk = ref(false)
async function changePw() {
  pwErr.value = ''; pwOk.value = false
  if (pw1.value !== pw2.value) { pwErr.value = 'As senhas não conferem.'; return }
  try { await updatePassword(pw1.value); pwOk.value = true; pw1.value = ''; pw2.value = '' } catch (e: any) { pwErr.value = e.message }
}
const api = useApi()
const f = reactive<any>({})
const err = ref(''); const msg = ref(''); const busy = ref(false)
watchEffect(() => {
  if (!p.value) return
  for (const k of ['name', 'phone', 'legal_name', 'document', 'skills', 'base_address', 'base_lat', 'base_lng', 'radius_km'])
    if (f[k] === undefined) f[k] = p.value[k] ?? ''
})
async function save() {
  busy.value = true; err.value = ''; msg.value = ''
  try { await api.put('/me', { ...f }); await load(); msg.value = 'Perfil salvo.' }
  catch (e: any) { err.value = e.message } finally { busy.value = false }
}
</script>
