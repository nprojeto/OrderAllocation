<template>
  <div class="box">
    <div class="brand"><span>◆</span> CampoOS</div>
    <div class="card">
      <div v-if="err && !d" class="alert err">{{ err }}</div>
      <div v-if="!d && !err" class="empty">Carregando…</div>
      <template v-if="d">
        <div class="small muted">{{ d.os.company_name }} · OS #{{ d.os.number }}</div>
        <h1>{{ d.os.title }}</h1>
        <p class="small" style="margin-top:4px">Olá, <b>{{ d.os.client_name }}</b>. Técnico(a): <b>{{ d.os.tech_name || '—' }}</b></p>
        <dl class="kv small" style="margin:10px 0 16px">
          <dt>Endereço</dt><dd>{{ d.os.address }}</dd>
          <dt>Duração prevista</dt><dd>{{ d.os.duration_min }} min</dd>
        </dl>

        <div v-if="msg" class="alert ok">{{ msg }}</div>
        <div v-if="err" class="alert err">{{ err }}</div>

        <div v-if="d.os.status === 'agendada'" class="big ok">
          <div class="small">Atendimento confirmado</div>
          <div class="when">{{ dt(d.os.scheduled_start) }}</div>
        </div>

        <template v-else-if="d.os.status === 'aguardando_cliente' && d.pending">
          <div class="big">
            <div class="small">Data proposta pelo técnico</div>
            <div class="when">{{ dt(d.pending.start_at) }}</div>
            <div v-if="d.pending.note" class="small">"{{ d.pending.note }}"</div>
          </div>
          <button class="btn ok block" :disabled="busy" @click="accept">Confirmar esta data</button>
          <div class="or">ou</div>
          <div class="field"><label>Sugerir outra data e hora</label><input v-model="start" type="datetime-local" :min="minDt" /></div>
          <div class="field"><label>Observação (opcional)</label><input v-model="note" placeholder="Ex.: só posso à tarde" /></div>
          <button class="btn secondary block" :disabled="busy || !start" @click="suggest">Enviar sugestão</button>
        </template>

        <div v-else-if="d.os.status === 'aguardando_tecnico'" class="big">
          <div class="small">Sua sugestão foi enviada</div>
          <div class="when">{{ dt(d.pending?.start_at) }}</div>
          <div class="small">Aguarde a resposta do técnico. Você receberá um novo contato.</div>
        </div>

        <div v-else class="alert info">Status atual da OS: <b>{{ STATUS[d.os.status] }}</b>.</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { dt, STATUS, localToIso, minDateTimeLocal } from '~/composables/useFormat'
definePageMeta({ layout: 'blank' })
const route = useRoute()
const api = useApi()
const token = computed(() => String(route.query.t || ''))
const d = ref<any>(null)
const err = ref('')
const msg = ref('')
const busy = ref(false)
const start = ref('')
const note = ref('')
const minDt = minDateTimeLocal()

async function load() {
  try { d.value = await api.get(`/public/schedule/${token.value}`) } catch (e: any) { err.value = e.message }
}
async function run(fn: () => Promise<any>, ok: string) {
  busy.value = true; err.value = ''; msg.value = ''
  try { await fn(); msg.value = ok; start.value = ''; note.value = ''; await load() }
  catch (e: any) { err.value = e.message } finally { busy.value = false }
}
const accept = () => run(() => api.post(`/public/schedule/${token.value}/accept`, { proposal_id: d.value.pending.id }), 'Obrigado! Atendimento confirmado.')
const suggest = () => run(() => api.post(`/public/schedule/${token.value}/suggest`, { start: localToIso(start.value), note: note.value }), 'Sugestão enviada ao técnico.')
onMounted(load)
</script>

<style scoped>
.box { width: min(460px, 100%); }
.brand { font-weight: 700; font-size: 18px; margin-bottom: 14px; text-align: center; }
.brand span { color: var(--accent); }
.big { background: #f7f8fa; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 14px; }
.big.ok { background: var(--ok-bg); color: var(--ok); }
.when { font-size: 26px; font-weight: 700; margin: 4px 0; }
.or { text-align: center; color: var(--muted); margin: 14px 0; font-size: 13px; }
</style>
