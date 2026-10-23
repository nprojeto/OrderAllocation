<template>
  <div class="loc">
    <h3>Localização base e raio de atendimento</h3>
    <div class="field"><label>Endereço / cidade base</label>
      <div class="row">
        <input v-model="m.base_address" style="flex:1;min-width:200px" placeholder="Ex.: Av. Andrômeda, São José dos Campos" />
        <button class="btn secondary sm" type="button" :disabled="busy || !m.base_address" @click="geocode">Buscar coordenadas</button>
        <button class="btn secondary sm" type="button" :disabled="busy" @click="gps">📍 Usar minha localização</button>
      </div>
      <div v-if="note" class="hint">{{ note }}</div>
    </div>
    <div class="grid g3">
      <div class="field"><label>Latitude</label><input v-model="m.base_lat" inputmode="decimal" /></div>
      <div class="field"><label>Longitude</label><input v-model="m.base_lng" inputmode="decimal" /></div>
      <div class="field"><label>Raio (km)</label><input v-model="m.radius_km" type="number" min="1" max="1000" /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const m = defineModel<any>({ required: true })
const busy = ref(false)
const note = ref('')
async function geocode() {
  busy.value = true; note.value = ''
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(m.value.base_address)}`)
    const j = await r.json()
    if (!j.length) note.value = 'Endereço não encontrado. Tente incluir cidade e estado.'
    else { m.value.base_lat = Number(j[0].lat).toFixed(6); m.value.base_lng = Number(j[0].lon).toFixed(6); note.value = 'Encontrado: ' + j[0].display_name }
  } catch { note.value = 'Falha ao buscar. Preencha manualmente.' } finally { busy.value = false }
}
function gps() {
  if (!navigator.geolocation) { note.value = 'Seu navegador não permite localização.'; return }
  busy.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => { m.value.base_lat = pos.coords.latitude.toFixed(6); m.value.base_lng = pos.coords.longitude.toFixed(6); note.value = 'Localização capturada.'; busy.value = false },
    () => { note.value = 'Não foi possível obter a localização.'; busy.value = false },
  )
}
</script>

<style scoped>
.loc { background: #fafbfc; border: 1px solid var(--line); border-radius: 10px; padding: 14px; margin-bottom: 14px; }
</style>
