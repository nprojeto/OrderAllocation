<template>
  <div>
    <div class="page-head">
      <div><h1>OS próximas</h1><div class="muted small">Ordens abertas dentro do seu raio de atendimento</div></div>
      <button v-if="approvedTech" class="btn secondary sm" @click="load">↻ Atualizar</button>
    </div>
    <div v-if="err" class="alert err">{{ err }}</div>

    <div v-if="p?.status === 'pendente'" class="alert warn">
      Seu cadastro está <b>em análise</b> pelo administrador. Enquanto isso, complete sua localização base abaixo.
    </div>
    <div v-if="p?.status === 'reprovado'" class="alert err">Cadastro reprovado. {{ p.status_note }}</div>

    <div class="card avail" :class="{ on: p?.available }">
      <div>
        <h2 style="margin:0">{{ p?.available ? 'Você está DISPONÍVEL' : 'Você está indisponível' }}</h2>
        <div class="small muted">
          {{ p?.available ? 'Você recebe notificações de novas OS próximas.' : 'Ative para receber notificações de OS próximas.' }}
          <span v-if="p?.base_lat">Raio: {{ p.radius_km }} km · {{ p.base_address || `${p.base_lat}, ${p.base_lng}` }}</span>
        </div>
      </div>
      <div class="row">
        <button class="btn secondary sm" @click="editLoc = !editLoc">Localização</button>
        <button :class="['btn', p?.available ? 'danger' : 'ok']" :disabled="busy || !approvedTech" @click="toggle">
          {{ p?.available ? 'Ficar indisponível' : 'Ficar disponível' }}
        </button>
      </div>
    </div>

    <div v-if="editLoc || !p?.base_lat" class="card" style="margin-top:14px">
      <TechLocation v-model="loc" />
      <button class="btn" :disabled="busy" @click="saveLoc">Salvar localização</button>
    </div>

    <div v-if="approvedTech" class="stack" style="margin-top:18px">
      <div v-if="loading" class="empty">Carregando…</div>
      <div v-else-if="!items.length" class="card empty">Nenhuma OS aberta no seu raio agora.</div>
      <div v-for="o in items" :key="o.id" class="card osc">
        <div class="osc-main">
          <div class="row small muted"><span class="mono">#{{ o.number }}</span> · {{ o.company_name }} · {{ dt(o.published_at) }}</div>
          <h2 style="margin:4px 0">{{ o.title }}</h2>
          <div class="small">{{ o.address }} · <b>{{ o.distance_km }} km</b> · {{ o.duration_min }} min</div>
          <div class="row small" style="margin-top:8px">
            <span v-if="Number(o.bonus_now) > 0" class="badge b-finalizada">Bônus agora: {{ brl(o.bonus_now) }}</span>
            <span v-if="deadline(o)" class="badge b-pendente">{{ deadline(o) }}</span>
          </div>
        </div>
        <div class="osc-side">
          <div class="small muted">Você recebe</div>
          <div class="price">{{ brl(o.estimated_total) }}</div>
          <div class="small muted">base {{ brl(o.base_value) }} + km {{ brl(o.km_value) }}</div>
          <NuxtLink :to="`/tecnico/ordens/${o.id}`" class="btn block" style="margin-top:10px">Ver e aceitar</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { brl, dt } from '~/composables/useFormat'
const { profile: p, load: reloadMe } = useAuth()
const api = useApi()
const items = ref<any[]>([]); const loading = ref(false); const err = ref(''); const busy = ref(false)
const editLoc = ref(false)
const loc = reactive<any>({ base_address: '', base_lat: '', base_lng: '', radius_km: 50 })
const approvedTech = computed(() => p.value?.status === 'aprovado')
let timer: any

watchEffect(() => {
  if (p.value && !loc._init) {
    Object.assign(loc, { base_address: p.value.base_address || '', base_lat: p.value.base_lat ?? '', base_lng: p.value.base_lng ?? '', radius_km: p.value.radius_km ?? 50, _init: true })
  }
})

function deadline(o: any) {
  const h = (Date.now() - new Date(o.published_at).getTime()) / 3600000
  if (h <= 48 && Number(o.bonus_2d) > 0) return `Bônus 2 dias expira em ${Math.ceil(48 - h)} h`
  if (h <= 72 && Number(o.bonus_3d) > 0) return `Bônus 3 dias expira em ${Math.ceil(72 - h)} h`
  return ''
}
async function load() {
  if (!approvedTech.value) return
  loading.value = !items.value.length
  try { items.value = (await api.get('/tech/open')).items } catch (e: any) { err.value = e.message } finally { loading.value = false }
}
async function toggle() {
  busy.value = true; err.value = ''
  try { await api.put('/me', { available: !p.value.available }); await reloadMe() } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
async function saveLoc() {
  busy.value = true; err.value = ''
  try {
    const { _init, ...data } = loc
    await api.put('/me', data); await reloadMe(); editLoc.value = false; await load()
  } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
onMounted(() => { load(); timer = setInterval(load, 60000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.avail { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; border-left: 5px solid #c3c9d3; }
.avail.on { border-left-color: var(--ok); background: #f6fcf9; }
.osc { display: grid; grid-template-columns: 1fr 200px; gap: 18px; }
.osc-side { border-left: 1px solid var(--line); padding-left: 18px; }
.price { font-size: 24px; font-weight: 700; color: var(--ok); }
@media (max-width: 700px) { .osc { grid-template-columns: 1fr; } .osc-side { border-left: 0; padding-left: 0; border-top: 1px solid var(--line); padding-top: 12px; } }
</style>
