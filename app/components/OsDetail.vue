<template>
  <div>
    <div class="page-head">
      <div>
        <a href="#" class="small" @click.prevent="$router.back()">← Voltar</a>
        <h1 v-if="os">OS <span class="mono">#{{ os.number }}</span> · {{ os.title }}</h1>
        <div v-if="os" class="row small muted">
          <StatusBadge :status="os.status" />
          <span>{{ os.company_name }}</span>
          <span>· lançada {{ dt(os.published_at) }}</span>
        </div>
      </div>
      <button class="btn secondary sm" @click="load">↻ Atualizar</button>
    </div>

    <div v-if="err" class="alert err">{{ err }}</div>
    <div v-if="msg" class="alert ok">{{ msg }}</div>
    <div v-if="!d && !err" class="empty">Carregando…</div>

    <div v-if="d" class="grid layout">
      <!-- COLUNA PRINCIPAL -->
      <div class="stack">
        <!-- Técnico: aceitar OS aberta -->
        <div v-if="role === 'tecnico' && os.status === 'aberta'" class="card hl">
          <h2>Aceitar e agendar</h2>
          <p class="small muted">Ao aceitar, escolha a data. O cliente receberá um link para confirmar ou sugerir outra.</p>
          <div class="grid g2">
            <div class="field"><label>Data e hora</label><input v-model="f.start" type="datetime-local" :min="minDt" /></div>
            <div class="field"><label>Observação (opcional)</label><input v-model="f.note" /></div>
          </div>
          <button class="btn" :disabled="busy || !f.start" @click="acceptOs">Aceitar OS</button>
        </div>

        <!-- Agenda -->
        <div v-if="os.tech_id || d.proposals.length" class="card">
          <div class="row between"><h2>Agendamento</h2>
            <span v-if="os.scheduled_start" class="badge b-agendada">{{ dt(os.scheduled_start) }} → {{ tOnly(os.scheduled_end) }}</span>
          </div>

          <div v-if="pending" class="alert warn">
            <b>{{ pending.proposed_by === 'tecnico' ? 'Técnico' : 'Cliente' }} propôs {{ dt(pending.start_at) }}</b>
            <span v-if="pending.note"> — "{{ pending.note }}"</span>
            <div v-if="pending.proposed_by === 'tecnico'" class="small">Aguardando confirmação do cliente.</div>
            <div v-else class="small">Aguardando resposta do técnico.</div>
          </div>

          <!-- ações do técnico -->
          <template v-if="isOwner">
            <div v-if="os.status === 'aguardando_tecnico' && pending" class="row" style="margin-bottom:12px">
              <button class="btn ok" :disabled="busy" @click="acceptProposal(pending.id)">Aceitar data do cliente</button>
            </div>

            <div v-if="['aguardando_cliente','aguardando_tecnico','agendada'].includes(os.status)" class="sub">
              <h3>{{ os.status === 'agendada' ? 'Reagendar' : os.status === 'aguardando_tecnico' ? 'Sugerir outra data' : 'Alterar proposta' }}</h3>
              <div class="grid g2">
                <div class="field"><label>Nova data e hora</label><input v-model="f.start" type="datetime-local" :min="minDt" /></div>
                <div class="field"><label>Observação</label><input v-model="f.note" /></div>
              </div>
              <button class="btn secondary" :disabled="busy || !f.start" @click="propose">Enviar proposta</button>
            </div>

            <div v-if="os.status === 'agendada'" class="row" style="margin-top:14px">
              <button class="btn" :disabled="busy" @click="start">▶ Iniciar atendimento</button>
            </div>
          </template>

          <!-- link do cliente -->
          <div v-if="d.client && ['aguardando_cliente','aguardando_tecnico','agendada'].includes(os.status)" class="sub">
            <h3>Link do cliente</h3>
            <div class="row">
              <input :value="d.client.link" readonly style="flex:1;min-width:200px" @focus="($event.target as any).select()" />
              <button class="btn secondary sm" @click="copy(d.client.link)">Copiar</button>
              <a v-if="d.client.whatsapp_url && isOwner" class="btn wa sm" :href="d.client.whatsapp_url" target="_blank" @click="api.post(`/os/${id}/whatsapp-log`)">WhatsApp</a>
              <button v-if="isOwner && os.client_email" class="btn secondary sm" :disabled="busy" @click="resend">Reenviar e-mail</button>
            </div>
          </div>

          <div v-if="d.proposals.length" class="sub">
            <h3>Histórico de propostas</h3>
            <table class="t">
              <tr v-for="p in [...d.proposals].reverse()" :key="p.id">
                <td>{{ p.proposed_by === 'tecnico' ? 'Técnico' : 'Cliente' }}</td>
                <td>{{ dt(p.start_at) }}</td>
                <td class="small muted">{{ p.note }}</td>
                <td><span :class="['badge', 'b-' + pStatus(p.status)]">{{ p.status }}</span></td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Execução -->
        <div v-if="isOwner && ['em_execucao','retrabalho'].includes(os.status)" class="card hl">
          <h2>{{ os.status === 'retrabalho' ? 'Retrabalho' : 'Concluir atendimento' }}</h2>
          <div v-if="lastRejected" class="alert err">Reprovada pela qualidade: {{ lastRejected.notes }}</div>
          <div class="field"><label>Relatório do serviço realizado</label>
            <textarea v-model="f.report" placeholder="Descreva o que foi feito, materiais, observações…" />
          </div>
          <div class="small muted" style="margin-bottom:10px">Critérios que serão verificados:
            <span v-for="(c, i) in d.criteria" :key="c.id">{{ i ? ' · ' : '' }}{{ c.description }}</span>
          </div>
          <button class="btn" :disabled="busy || !f.report.trim()" @click="complete">Enviar para validação</button>
        </div>

        <div v-if="os.completion_report" class="card">
          <h2>Relatório do técnico</h2>
          <div style="white-space:pre-wrap">{{ os.completion_report }}</div>
          <div class="small muted" style="margin-top:6px">Enviado em {{ dt(os.completed_at) }}</div>
        </div>

        <!-- Validação (qualidade) -->
        <div v-if="role === 'qualidade' && os.status === 'em_validacao'" class="card hl">
          <h2>Validação</h2>
          <table class="t">
            <thead><tr><th>Critério</th><th>Resultado</th><th>Observação</th></tr></thead>
            <tr v-for="c in d.criteria" :key="c.id">
              <td>{{ c.description }} <span v-if="c.required" class="badge b-pendente">obrigatório</span></td>
              <td style="white-space:nowrap">
                <label class="inl"><input v-model="checks[c.id].passed" type="radio" :value="true" /> OK</label>
                <label class="inl"><input v-model="checks[c.id].passed" type="radio" :value="false" /> Falhou</label>
              </td>
              <td><input v-model="checks[c.id].note" /></td>
            </tr>
          </table>
          <div class="field" style="margin-top:12px"><label>Parecer geral (obrigatório para reprovar)</label><textarea v-model="f.vnotes" /></div>
          <div class="row">
            <button class="btn ok" :disabled="busy || !allChecked || requiredFailed" @click="validate('aprovada')">Aprovar e finalizar</button>
            <button class="btn danger" :disabled="busy || !allChecked || !f.vnotes.trim()" @click="validate('reprovada')">Reprovar (retrabalho)</button>
          </div>
          <div v-if="requiredFailed" class="hint">Há critério obrigatório marcado como "Falhou": só é possível reprovar.</div>
        </div>

        <!-- Critérios + validações -->
        <div class="card">
          <h2>Critérios de validação <span class="muted small">({{ os.template_name }})</span></h2>
          <ul class="crit">
            <li v-for="c in d.criteria" :key="c.id">
              <span>{{ c.description }}</span>
              <span v-if="c.required" class="badge b-pendente">obrigatório</span>
              <span v-if="lastResult[c.id] !== undefined" :class="['badge', lastResult[c.id] ? 'b-aprovada' : 'b-reprovada']">
                {{ lastResult[c.id] ? 'OK' : 'Falhou' }}
              </span>
            </li>
          </ul>
          <template v-if="d.validations.length">
            <hr class="sep" />
            <h3>Validações</h3>
            <div v-for="v in [...d.validations].reverse()" :key="v.id" class="small" style="margin-bottom:6px">
              <StatusBadge :status="v.result" /> {{ dt(v.created_at) }}
              <span v-if="v.notes"> — {{ v.notes }}</span>
            </div>
          </template>
        </div>

        <!-- Histórico -->
        <div class="card">
          <h2>Histórico completo</h2>
          <div v-if="canComment" class="row" style="margin-bottom:14px;align-items:flex-start">
            <textarea v-model="f.comment" placeholder="Adicionar comentário…" style="flex:1;min-height:44px" />
            <button class="btn secondary" :disabled="busy || !f.comment.trim()" @click="comment">Comentar</button>
          </div>
          <div class="tl">
            <div v-for="e in [...d.events].reverse()" :key="e.id" :class="['ev', 'ev-' + e.type]">
              <div class="dot" />
              <div>
                <div class="small"><b>{{ e.actor_name || ROLE[e.actor_role] }}</b>
                  <span class="muted"> · {{ ROLE[e.actor_role] || e.actor_role }} · {{ dt(e.created_at) }}</span></div>
                <div :class="{ cm: e.type === 'comentario' }">{{ e.message }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUNA LATERAL -->
      <div class="stack">
        <div class="card">
          <h2>Valores</h2>
          <dl class="kv">
            <dt>Valor da OS</dt><dd class="money">{{ brl(os.base_value) }}</dd>
            <dt>Bônus até 2 dias</dt><dd class="money">{{ brl(os.bonus_2d) }}</dd>
            <dt>Bônus até 3 dias</dt><dd class="money">{{ brl(os.bonus_3d) }}</dd>
            <dt>Taxa de deslocamento</dt><dd class="money">{{ brl(os.km_fixed_fee) }} + {{ brl(os.km_rate) }}/km</dd>
          </dl>
          <template v-if="os.tech_total !== null && os.tech_total !== undefined">
            <hr class="sep" />
            <dl class="kv">
              <dt>Distância</dt><dd>{{ os.distance_km }} km</dd>
              <dt>Bônus aplicado</dt><dd class="money">{{ brl(os.bonus_applied) }} <span class="muted small">{{ os.bonus_rule ? '(' + os.bonus_rule + ')' : '' }}</span></dd>
              <dt>Deslocamento</dt><dd class="money">{{ brl(os.km_value) }}</dd>
              <dt><b>Total ao técnico</b></dt><dd class="money"><b>{{ brl(os.tech_total) }}</b></dd>
            </dl>
          </template>
          <template v-else-if="role === 'tecnico' && os.status === 'aberta' && nearby">
            <hr class="sep" />
            <dl class="kv">
              <dt>Sua distância</dt><dd>{{ nearby.distance_km }} km</dd>
              <dt>Bônus se aceitar agora</dt><dd class="money">{{ brl(nearby.bonus_now) }}</dd>
              <dt><b>Estimado</b></dt><dd class="money"><b>{{ brl(nearby.estimated_total) }}</b></dd>
            </dl>
          </template>
          <template v-if="role === 'empresa' || role === 'admin'">
            <hr class="sep" />
            <dl class="kv">
              <dt>Taxa plataforma ({{ os.platform_fee_pct }}%)</dt><dd class="money">{{ brl(os.platform_fee) }}</dd>
              <dt>Validações ({{ os.validations_count }} × {{ brl(os.validation_fee) }})</dt>
              <dd class="money">{{ brl(os.validation_fee * os.validations_count) }}</dd>
              <dt><b>Total empresa</b></dt><dd class="money"><b>{{ brl(os.company_total) }}</b></dd>
            </dl>
          </template>
        </div>

        <div class="card">
          <h2>Cliente e local</h2>
          <dl class="kv">
            <dt>Cliente</dt><dd>{{ os.client_name }}</dd>
            <template v-if="os.client_phone"><dt>WhatsApp</dt><dd>{{ maskPhone(os.client_phone) }}</dd></template>
            <template v-if="os.client_email"><dt>E-mail</dt><dd>{{ os.client_email }}</dd></template>
            <dt>Endereço</dt><dd>{{ os.address }}</dd>
            <dt>Coordenadas</dt><dd class="small mono">{{ os.lat }}, {{ os.lng }}</dd>
            <dt>Duração</dt><dd>{{ os.duration_min }} min</dd>
          </dl>
          <a class="btn secondary sm" style="margin-top:10px" :href="mapsUrl(os.lat, os.lng)" target="_blank">Ver no mapa</a>
          <p v-if="os.description" style="white-space:pre-wrap;margin-bottom:0" class="small">{{ os.description }}</p>
        </div>

        <div v-if="showLive" class="card">
          <h2>Técnico agora</h2>
          <template v-if="os.tech_location_at">
            <div class="live"><b>{{ liveKm }} km</b> do local</div>
            <div class="small muted">GPS atualizado {{ ago(os.tech_location_at) }}<span v-if="os.tech_location_accuracy"> · precisão ±{{ Math.round(os.tech_location_accuracy) }} m</span></div>
            <div v-if="stale" class="alert warn small" style="margin:8px 0 0">Localização desatualizada — o app do técnico pode estar fechado.</div>
            <a class="btn secondary sm" style="margin-top:10px" :href="`https://www.google.com/maps/dir/?api=1&origin=${os.tech_cur_lat},${os.tech_cur_lng}&destination=${os.lat},${os.lng}`" target="_blank">Ver no mapa</a>
          </template>
          <div v-else class="small muted">O técnico ainda não compartilhou a localização.</div>
          <div v-if="os.start_distance_km !== null && os.start_distance_km !== undefined" class="small" style="margin-top:8px">Iniciou o atendimento a <b>{{ os.start_distance_km }} km</b> do local.</div>
        </div>

        <div v-if="os.tech_name" class="card">
          <h2>Técnico</h2>
          <dl class="kv">
            <dt>Nome</dt><dd>{{ os.tech_name }}</dd>
            <template v-if="os.tech_phone && role !== 'tecnico'"><dt>Telefone</dt><dd>{{ maskPhone(os.tech_phone) }}</dd></template>
          </dl>
        </div>

        <div class="card">
          <h2>Marcos (SLA)</h2>
          <dl class="kv small">
            <dt>Lançada</dt><dd>{{ dt(os.published_at) }}</dd>
            <dt>Aceita</dt><dd>{{ dt(os.accepted_at) }} <span class="muted">{{ since(os.published_at, os.accepted_at) }}</span></dd>
            <dt>Confirmada</dt><dd>{{ dt(os.confirmed_at) }} <span class="muted">{{ since(os.published_at, os.confirmed_at) }}</span></dd>
            <dt>Iniciada</dt><dd>{{ dt(os.started_at) }}</dd>
            <dt>Concluída</dt><dd>{{ dt(os.completed_at) }}</dd>
            <dt>Validada</dt><dd>{{ dt(os.validated_at) }} <span class="muted">{{ since(os.completed_at, os.validated_at) }}</span></dd>
            <template v-if="os.cancelled_at"><dt>Cancelada</dt><dd>{{ dt(os.cancelled_at) }}</dd></template>
          </dl>
          <div v-if="os.cancel_reason" class="small" style="margin-top:6px">Motivo: {{ os.cancel_reason }}</div>
        </div>

        <!-- desistir / cancelar -->
        <div v-if="isOwner && ['aguardando_cliente','aguardando_tecnico','agendada'].includes(os.status)" class="card">
          <h3>Desistir desta OS</h3>
          <input v-model="f.reason" placeholder="Motivo" />
          <button class="btn danger sm" style="margin-top:8px" :disabled="busy || !f.reason.trim()" @click="release">Desistir</button>
        </div>
        <div v-if="(role === 'empresa' || role === 'admin') && ['aberta','aguardando_cliente','aguardando_tecnico','agendada'].includes(os.status)" class="card">
          <h3>Cancelar OS</h3>
          <input v-model="f.reason" placeholder="Motivo do cancelamento" />
          <button class="btn danger sm" style="margin-top:8px" :disabled="busy || !f.reason.trim()" @click="cancel">Cancelar OS</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { maskPhone } from '~/composables/useMask'
import { distanceKm } from '~/composables/useTracker'
import { ROLE, brl, dt, tOnly, mapsUrl, localToIso, minDateTimeLocal, hours } from '~/composables/useFormat'

const props = defineProps<{ id: string }>()
const api = useApi()
const d = ref<any>(null)
const err = ref('')
const msg = ref('')
const busy = ref(false)
const nearby = ref<any>(null)
const minDt = minDateTimeLocal()
const f = reactive({ start: '', note: '', report: '', comment: '', reason: '', vnotes: '' })
const checks = reactive<Record<string, { passed: boolean | null; note: string }>>({})

const os = computed(() => d.value?.os)
const role = computed(() => d.value?.viewer?.role)
const isOwner = computed(() => !!d.value?.viewer?.is_owner_tech)
const tracker = useTracker()
const showLive = computed(() => role.value !== 'tecnico' && os.value?.tech_id &&
  ['agendada', 'em_execucao', 'aguardando_cliente', 'aguardando_tecnico'].includes(os.value.status))
const liveKm = computed(() => os.value?.tech_cur_lat == null ? '—'
  : distanceKm({ lat: os.value.tech_cur_lat, lng: os.value.tech_cur_lng }, { lat: os.value.lat, lng: os.value.lng }).toFixed(1))
const stale = computed(() => os.value?.tech_location_at && Date.now() - new Date(os.value.tech_location_at).getTime() > 30 * 60000)
const ago = (v: any) => {
  const m = Math.round((Date.now() - new Date(v).getTime()) / 60000)
  return m < 1 ? 'agora' : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : dt(v)
}
watch(() => isOwner.value && ['agendada', 'em_execucao'].includes(os.value?.status),
  (v) => (v ? tracker.start('os-' + props.id) : tracker.stop('os-' + props.id)))
onBeforeUnmount(() => tracker.stop('os-' + props.id))
let liveTimer: any
onMounted(() => { liveTimer = setInterval(() => { if (showLive.value) load() }, 60000) })
onBeforeUnmount(() => clearInterval(liveTimer))
const pending = computed(() => d.value?.proposals?.find((p: any) => p.status === 'pendente'))
const canComment = computed(() => role.value !== 'tecnico' || isOwner.value)
const lastRejected = computed(() => [...(d.value?.validations || [])].reverse().find((v: any) => v.result === 'reprovada'))
const lastResult = computed(() => {
  const v = d.value?.validations?.[d.value.validations.length - 1]
  const r: Record<string, boolean> = {}
  for (const i of v?.items || []) r[i.criteria_id] = i.passed
  return r
})
const allChecked = computed(() => (d.value?.criteria || []).every((c: any) => checks[c.id]?.passed !== null && checks[c.id]?.passed !== undefined))
const requiredFailed = computed(() => (d.value?.criteria || []).some((c: any) => c.required && checks[c.id]?.passed === false))

const pStatus = (s: string) => ({ pendente: 'pendente', aceita: 'aprovada', recusada: 'reprovada', substituida: 'cancelada' } as any)[s]
const since = (a: any, b: any) => (a && b ? '(' + hours((new Date(b).getTime() - new Date(a).getTime()) / 3600000) + ')' : '')

async function load() {
  err.value = ''
  try {
    d.value = await api.get(`/os/${props.id}`)
    for (const c of d.value.criteria) if (!checks[c.id]) checks[c.id] = { passed: null, note: '' }
    if (role.value === 'tecnico' && os.value.status === 'aberta') {
      const r = await api.get('/tech/open').catch(() => ({ items: [] }))
      nearby.value = r.items.find((x: any) => x.id === props.id) || null
    }
  } catch (e: any) { err.value = e.message }
}

async function act(fn: () => Promise<any>, ok: string) {
  busy.value = true; err.value = ''; msg.value = ''
  try {
    const r = await fn()
    msg.value = ok + (r?.email_sent ? ' E-mail enviado ao cliente.' : '')
    f.start = ''; f.note = ''; f.comment = ''; f.reason = ''; f.report = ''; f.vnotes = ''
    await load()
    return r
  } catch (e: any) { err.value = e.message } finally { busy.value = false }
}

const acceptOs = () => act(() => api.post(`/tech/os/${props.id}/accept`, { start: localToIso(f.start), note: f.note }),
  'OS aceita! Envie o link ao cliente pelo WhatsApp.')
const propose = () => act(() => api.post(`/os/${props.id}/propose`, { start: localToIso(f.start), note: f.note }),
  'Proposta enviada. Envie o link ao cliente.')
const acceptProposal = (pid: string) => act(() => api.post(`/os/${props.id}/accept-proposal`, { proposal_id: pid }), 'Agendamento confirmado e reservado na sua agenda.')
const start = () => act(async () => { await tracker.sendNow(); return api.post(`/os/${props.id}/start`) }, 'Atendimento iniciado.')
const complete = () => act(() => api.post(`/os/${props.id}/complete`, { report: f.report }), 'Enviado para a fila de validação.')
const resend = () => act(() => api.post(`/os/${props.id}/resend`), 'Link reenviado.')
const comment = () => act(() => api.post(`/os/${props.id}/comment`, { text: f.comment }), 'Comentário registrado.')
const release = () => { if (confirm('Desistir desta OS? Ela voltará a ficar aberta para outros técnicos.')) act(() => api.post(`/os/${props.id}/release`, { reason: f.reason }), 'Você desistiu da OS.') }
const cancel = () => { if (confirm('Cancelar esta OS?')) act(() => api.post(`/os/${props.id}/cancel`, { reason: f.reason }), 'OS cancelada.') }
const validate = (result: string) => act(() => api.post(`/os/${props.id}/validate`, {
  result, notes: f.vnotes,
  items: d.value.criteria.map((c: any) => ({ id: c.id, passed: checks[c.id].passed, note: checks[c.id].note })),
}), result === 'aprovada' ? 'OS aprovada e finalizada.' : 'OS devolvida para retrabalho.')

async function copy(t: string) {
  try { await navigator.clipboard.writeText(t); msg.value = 'Link copiado.' } catch { /* */ }
}

onMounted(load)
</script>

<style scoped>
.layout { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); align-items: start; }
@media (max-width: 960px) { .layout { grid-template-columns: 1fr; } }
.hl { border-color: #f6b48a; box-shadow: 0 0 0 3px #f26b1d14; }
.sub { margin-top: 16px; padding-top: 14px; border-top: 1px dashed var(--line); }
.crit { list-style: none; padding: 0; margin: 0; }
.crit li { display: flex; gap: 8px; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
.crit li span:first-child { flex: 1; }
.inl { display: inline-flex; gap: 4px; align-items: center; margin-right: 10px; font-weight: 400; }
.tl { position: relative; padding-left: 4px; }
.ev { display: grid; grid-template-columns: 16px 1fr; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f0f1f3; }
.ev .dot { width: 9px; height: 9px; border-radius: 50%; background: #c3c9d3; margin-top: 6px; }
.ev-comentario .dot { background: var(--info); }
.ev-validacao .dot, .ev-agendada .dot { background: var(--ok); }
.ev-cancelada .dot, .ev-desistencia .dot { background: var(--bad); }
.ev-aceite .dot, .ev-concluida .dot { background: var(--accent); }
.live { font-size: 22px; }
.cm { background: #f4f7fd; border-radius: 6px; padding: 6px 10px; margin-top: 3px; white-space: pre-wrap; }
</style>
