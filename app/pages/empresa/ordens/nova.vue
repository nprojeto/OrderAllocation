<template>
  <div>
    <div class="page-head"><div><h1>Nova ordem de serviço</h1><div class="muted small">Será enviada aos técnicos ativos mais próximos</div></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div v-if="!templates.length && loaded" class="alert warn">
      Você ainda não tem critérios de validação aprovados. <NuxtLink to="/empresa/criterios">Cadastre aqui</NuxtLink>.
    </div>
    <form class="grid layout" @submit.prevent="submit">
      <div class="stack">
        <div class="card">
          <h2>Serviço</h2>
          <div class="field"><label>Título</label><input v-model="f.title" required placeholder="Ex.: Instalação de roteador" /></div>
          <div class="field"><label>Descrição</label><textarea v-model="f.description" /></div>
          <div class="grid g2">
            <div class="field"><label>Critérios de validação</label>
              <select v-model="f.template_id" required>
                <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div class="field"><label>Duração estimada (min)</label><input v-model="f.duration_min" type="number" min="15" max="1440" required /></div>
          </div>
        </div>
        <div class="card">
          <h2>Cliente</h2>
          <div class="field"><label>Nome do cliente</label><input v-model="f.client_name" required /></div>
          <div class="grid g2">
            <div class="field"><label>WhatsApp do cliente</label><input v-model="f.client_phone" placeholder="(12) 99999-9999" /></div>
            <div class="field"><label>E-mail do cliente</label><input v-model="f.client_email" type="email" /></div>
          </div>
          <div class="hint">Informe ao menos um contato. O cliente recebe o link para confirmar a data.</div>
        </div>
        <div class="card">
          <h2>Local</h2>
          <div class="field"><label>Endereço completo</label>
            <div class="row">
              <input v-model="f.address" required style="flex:1;min-width:220px" placeholder="Rua, nº, bairro, cidade - UF" />
              <button type="button" class="btn secondary sm" :disabled="geo || !f.address" @click="geocode">Buscar lat/long</button>
            </div>
            <div v-if="geoNote" class="hint">{{ geoNote }}</div>
          </div>
          <div class="grid g2">
            <div class="field"><label>Latitude</label><input v-model="f.lat" required inputmode="decimal" placeholder="-23.1896" /></div>
            <div class="field"><label>Longitude</label><input v-model="f.lng" required inputmode="decimal" placeholder="-45.8841" /></div>
          </div>
          <a v-if="f.lat && f.lng" class="small" :href="mapsUrl(f.lat, f.lng)" target="_blank">Conferir no mapa ↗</a>
        </div>
      </div>
      <div class="stack">
        <div class="card">
          <h2>Pagamento ao técnico</h2>
          <div class="field"><label>Valor da OS (R$)</label><input v-model="f.base_value" type="number" step="0.01" min="0" required /></div>
          <div class="field"><label>Bônus se agendar em até 2 dias (R$)</label><input v-model="f.bonus_2d" type="number" step="0.01" min="0" /></div>
          <div class="field"><label>Bônus se agendar em até 3 dias (R$)</label><input v-model="f.bonus_3d" type="number" step="0.01" min="0" /></div>
          <div class="grid g2">
            <div class="field"><label>Taxa fixa km (R$)</label><input v-model="f.km_fixed_fee" type="number" step="0.01" min="0" /></div>
            <div class="field"><label>Valor por km (R$)</label><input v-model="f.km_rate" type="number" step="0.01" min="0" /></div>
          </div>
          <div class="hint">O bônus vale pelo momento em que o técnico aceita e agenda (contado do lançamento). Até 2 dias recebe o bônus de 2 dias; entre 2 e 3 dias, o de 3 dias.</div>
        </div>
        <div v-if="settings" class="card">
          <h2>Simulação</h2>
          <div class="field"><label>Distância exemplo (km)</label><input v-model="simKm" type="number" min="0" /></div>
          <dl class="kv">
            <dt>Ao técnico (máx.)</dt><dd class="money">{{ brl(simTech) }}</dd>
            <dt>Taxa plataforma ({{ settings.platform_fee_pct }}%)</dt><dd class="money">{{ brl(simTech * settings.platform_fee_pct / 100) }}</dd>
            <dt>Validação</dt><dd class="money">{{ brl(settings.validation_fee) }}</dd>
            <dt><b>Total estimado</b></dt><dd class="money"><b>{{ brl(simTech * (1 + settings.platform_fee_pct / 100) + Number(settings.validation_fee)) }}</b></dd>
          </dl>
        </div>
        <button class="btn block" :disabled="busy || !templates.length">{{ busy ? 'Lançando…' : 'Lançar OS' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { brl, mapsUrl } from '~/composables/useFormat'
const api = useApi()
const templates = ref<any[]>([]); const loaded = ref(false)
const err = ref(''); const busy = ref(false); const geo = ref(false); const geoNote = ref('')
const settings = ref<any>({ platform_fee_pct: 2, validation_fee: 15 })
const simKm = ref(10)
const f = reactive<any>({ title: '', description: '', template_id: '', duration_min: 120, client_name: '', client_phone: '', client_email: '',
  address: '', lat: '', lng: '', base_value: '', bonus_2d: '', bonus_3d: '', km_fixed_fee: '', km_rate: '' })
const simTech = computed(() => Number(f.base_value || 0) + Math.max(Number(f.bonus_2d || 0), Number(f.bonus_3d || 0)) +
  Number(f.km_fixed_fee || 0) + Number(f.km_rate || 0) * Number(simKm.value || 0))

onMounted(async () => {
  try {
    api.get('/settings').then((r) => (settings.value = r)).catch(() => {})
    templates.value = (await api.get('/company/criteria')).items.filter((t: any) => t.status === 'aprovado')
    if (templates.value.length) f.template_id = templates.value[0].id
  } catch (e: any) { err.value = e.message } finally { loaded.value = true }
})
async function geocode() {
  geo.value = true; geoNote.value = ''
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(f.address)}`)
    const j = await r.json()
    if (!j.length) geoNote.value = 'Não encontrado. Confira o endereço ou preencha manualmente.'
    else { f.lat = Number(j[0].lat).toFixed(6); f.lng = Number(j[0].lon).toFixed(6); geoNote.value = 'Encontrado: ' + j[0].display_name }
  } catch { geoNote.value = 'Falha na busca. Preencha manualmente.' } finally { geo.value = false }
}
async function submit() {
  busy.value = true; err.value = ''
  try {
    const r = await api.post('/company/os', { ...f, lat: String(f.lat).replace(',', '.'), lng: String(f.lng).replace(',', '.') })
    await navigateTo('/empresa/ordens/' + r.id)
  } catch (e: any) { err.value = e.message; window.scrollTo(0, 0) } finally { busy.value = false }
}
</script>
<style scoped>
.layout { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); align-items: start; }
@media (max-width: 960px) { .layout { grid-template-columns: 1fr; } }
</style>
