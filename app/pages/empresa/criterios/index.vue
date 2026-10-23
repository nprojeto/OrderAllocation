<template>
  <div>
    <div class="page-head"><div><h1>Critérios de validação</h1><div class="muted small">Definem o que a equipe de qualidade verifica. Precisam de aprovação do admin.</div></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div v-if="msg" class="alert ok">{{ msg }}</div>
    <div class="grid layout">
      <div class="stack">
        <div v-if="!items.length" class="card empty">Nenhum conjunto cadastrado.</div>
        <div v-for="t in items" :key="t.id" class="card">
          <div class="row between"><h2 style="margin:0">{{ t.name }}</h2><StatusBadge :status="t.status" /></div>
          <p v-if="t.description" class="small muted">{{ t.description }}</p>
          <ol class="small">
            <li v-for="i in sorted(t.items)" :key="i.id">{{ i.description }} <span v-if="i.required" class="muted">(obrigatório)</span></li>
          </ol>
          <div v-if="t.admin_note" class="alert" :class="t.status === 'reprovado' ? 'err' : 'info'">Admin: {{ t.admin_note }}</div>
        </div>
      </div>
      <div class="card">
        <h2>Novo conjunto</h2>
        <div class="field"><label>Nome</label><input v-model="f.name" placeholder="Ex.: Instalação padrão" /></div>
        <div class="field"><label>Descrição</label><input v-model="f.description" /></div>
        <label>Critérios</label>
        <div v-for="(it, i) in f.items" :key="i" class="row" style="margin-bottom:6px;flex-wrap:nowrap">
          <input v-model="it.description" :placeholder="`Critério ${i + 1}`" />
          <label class="small" style="display:flex;gap:4px;align-items:center;margin:0;white-space:nowrap"><input v-model="it.required" type="checkbox" /> obrig.</label>
          <button class="btn secondary sm" @click="f.items.splice(i, 1)">✕</button>
        </div>
        <button class="btn secondary sm" @click="f.items.push({ description: '', required: true })">+ Critério</button>
        <hr class="sep" />
        <button class="btn block" :disabled="busy" @click="save">Enviar para aprovação</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const api = useApi()
const items = ref<any[]>([]); const err = ref(''); const msg = ref(''); const busy = ref(false)
const blank = () => ({ name: '', description: '', items: [{ description: 'Foto do serviço concluído', required: true }, { description: 'Assinatura/aceite do cliente', required: true }] })
const f = reactive<any>(blank())
const sorted = (a: any[]) => [...(a || [])].sort((x, y) => x.position - y.position)
async function load() { try { items.value = (await api.get('/company/criteria')).items } catch (e: any) { err.value = e.message } }
async function save() {
  busy.value = true; err.value = ''; msg.value = ''
  try { await api.post('/company/criteria', f); Object.assign(f, blank()); msg.value = 'Enviado para aprovação do admin.'; await load() }
  catch (e: any) { err.value = e.message } finally { busy.value = false }
}
onMounted(load)
</script>
<style scoped>
.layout { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: start; }
@media (max-width: 960px) { .layout { grid-template-columns: 1fr; } }
</style>
