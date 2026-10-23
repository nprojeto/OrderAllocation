<template>
  <div>
    <div class="page-head"><div><h1>Configurações</h1><div class="muted small">Valores aplicados às novas OS</div></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div v-if="msg" class="alert ok">{{ msg }}</div>
    <div class="card" style="max-width:520px">
      <div class="field"><label>Taxa da plataforma (% sobre o valor pago ao técnico)</label><input v-model="f.platform_fee_pct" type="number" step="0.01" /></div>
      <div class="field"><label>Valor por validação (R$)</label><input v-model="f.validation_fee" type="number" step="0.01" /></div>
      <div class="field"><label>Nº de técnicos mais próximos notificados por OS</label><input v-model="f.notify_limit" type="number" min="1" /></div>
      <button class="btn" :disabled="busy" @click="save">Salvar</button>
      <div class="hint" style="margin-top:8px">OS já lançadas mantêm os valores do momento em que foram criadas.</div>
    </div>
  </div>
</template>
<script setup lang="ts">
const api = useApi()
const f = reactive<any>({ platform_fee_pct: '', validation_fee: '', notify_limit: '' })
const err = ref(''); const msg = ref(''); const busy = ref(false)
onMounted(async () => { try { Object.assign(f, await api.get('/admin/settings')) } catch (e: any) { err.value = e.message } })
async function save() {
  busy.value = true; err.value = ''; msg.value = ''
  try { await api.put('/admin/settings', { platform_fee_pct: f.platform_fee_pct, validation_fee: f.validation_fee, notify_limit: f.notify_limit }); msg.value = 'Salvo.' }
  catch (e: any) { err.value = e.message } finally { busy.value = false }
}
</script>
