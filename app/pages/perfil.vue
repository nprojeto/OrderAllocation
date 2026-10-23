<template>
  <div>
    <div class="page-head"><div><h1>Meu perfil</h1><div class="muted small">{{ p?.email }}</div></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div v-if="msg" class="alert ok">{{ msg }}</div>
    <div class="card" style="max-width:720px">
      <div class="grid g2">
        <div class="field"><label>Nome</label><input v-model="f.name" /></div>
        <div class="field"><label>Telefone / WhatsApp</label><input v-model="f.phone" /></div>
      </div>
      <div v-if="p?.role === 'empresa'" class="grid g2">
        <div class="field"><label>Razão social</label><input v-model="f.legal_name" /></div>
        <div class="field"><label>CNPJ</label><input v-model="f.document" /></div>
      </div>
      <template v-if="p?.role === 'tecnico'">
        <div class="grid g2">
          <div class="field"><label>CPF/CNPJ</label><input v-model="f.document" /></div>
          <div class="field"><label>Especialidades</label><input v-model="f.skills" /></div>
        </div>
        <TechLocation v-model="f" />
      </template>
      <button class="btn" :disabled="busy" @click="save">Salvar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { profile: p, load } = useAuth()
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
