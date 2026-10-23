<template>
  <div>
    <div class="page-head">
      <div><h1>Importar OS em lote</h1><div class="muted small">Envie uma planilha Excel (.xlsx) ou CSV com várias ordens de uma vez</div></div>
    </div>
    <PendingBanner />
    <div v-if="err" class="alert err">{{ err }}</div>

    <!-- passo 1 -->
    <div class="card" style="margin-bottom:14px">
      <h2>1. Baixe o modelo e preencha</h2>
      <p class="small muted" style="margin-top:0">Uma OS por linha. Não altere os nomes das colunas. Latitude/longitude são opcionais: se ficarem em branco, o sistema busca pelo endereço.</p>
      <div class="row">
        <button class="btn secondary" @click="downloadTemplate">⇩ Baixar modelo (planilha)</button>
        <details class="small"><summary>Ver colunas</summary>
          <table class="t" style="margin-top:8px">
            <tr v-for="c in COLS" :key="c.key"><td class="mono">{{ c.key }}</td><td>{{ c.label }}</td><td class="muted">{{ c.req ? 'obrigatório' : 'opcional' }}</td></tr>
          </table>
        </details>
      </div>
    </div>

    <!-- passo 2 -->
    <div class="card" style="margin-bottom:14px">
      <h2>2. Escolha os critérios e envie o arquivo</h2>
      <div class="grid g2">
        <div class="field"><label>Critérios de validação (para todas as OS do lote)</label>
          <select v-model="templateId">
            <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <div v-if="loaded && !templates.length" class="hint">Nenhum critério aprovado. <NuxtLink to="/empresa/criterios">Cadastre aqui</NuxtLink>.</div>
        </div>
        <div class="field"><label>Arquivo (.xlsx ou .csv)</label>
          <input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" @change="onFile" />
        </div>
      </div>
    </div>

    <!-- passo 3 -->
    <div v-if="rows.length" class="card">
      <div class="row between" style="margin-bottom:10px">
        <h2 style="margin:0">3. Confira e lance</h2>
        <div class="row">
          <span class="small"><b>{{ okCount }}</b> prontas · <b :style="{ color: badCount ? 'var(--bad)' : '' }">{{ badCount }}</b> com problema · {{ doneCount }} lançadas</span>
          <button v-if="missingGeo" class="btn secondary sm" :disabled="busy" @click="geocodeAll">📍 Buscar coordenadas ({{ missingGeo }})</button>
          <button class="btn" :disabled="busy || !okCount || !templateId" @click="submit">{{ busy ? progress : `Lançar ${okCount} OS` }}</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="t">
          <thead><tr><th>#</th><th>Título</th><th>Cliente</th><th>Endereço</th><th>Lat / Lng</th><th>Valor</th><th>Situação</th></tr></thead>
          <tr v-for="(r, i) in rows" :key="i" :class="{ bad: r._errors.length && !r._done, ok: r._done }">
            <td class="mono small">{{ i + 2 }}</td>
            <td>{{ r.title }}</td>
            <td class="small">{{ r.client_name }}<div class="muted">{{ r.client_phone }} {{ r.client_email }}</div></td>
            <td class="small">{{ r.address }}</td>
            <td class="small mono">{{ r.lat }}<br />{{ r.lng }}</td>
            <td class="money">{{ brl(r.base_value) }}</td>
            <td class="small">
              <span v-if="r._done" class="badge b-finalizada">OS #{{ r._done }}</span>
              <span v-else-if="r._errors.length" style="color:var(--bad)">{{ r._errors.join(' · ') }}</span>
              <span v-else class="badge b-aberta">pronta</span>
            </td>
          </tr>
        </table>
      </div>
      <div v-if="doneCount" class="row" style="margin-top:12px">
        <NuxtLink to="/empresa/ordens" class="btn secondary">Ver ordens lançadas</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { readSheet } from 'read-excel-file/browser'
import { brl } from '~/composables/useFormat'
import { maskPhone, validPhone } from '~/composables/useMask'

const COLS = [
  { key: 'titulo', label: 'Título da OS', req: true, f: 'title' },
  { key: 'descricao', label: 'Descrição', f: 'description' },
  { key: 'cliente_nome', label: 'Nome do cliente', req: true, f: 'client_name' },
  { key: 'cliente_whatsapp', label: 'WhatsApp do cliente (com DDD)', f: 'client_phone' },
  { key: 'cliente_email', label: 'E-mail do cliente', f: 'client_email' },
  { key: 'endereco', label: 'Endereço completo', req: true, f: 'address' },
  { key: 'latitude', label: 'Latitude (ex.: -23.1896)', f: 'lat' },
  { key: 'longitude', label: 'Longitude (ex.: -45.8841)', f: 'lng' },
  { key: 'duracao_min', label: 'Duração em minutos (padrão 120)', f: 'duration_min' },
  { key: 'valor', label: 'Valor da OS (R$)', req: true, f: 'base_value' },
  { key: 'bonus_2d', label: 'Bônus se agendar em até 2 dias (R$)', f: 'bonus_2d' },
  { key: 'bonus_3d', label: 'Bônus se agendar em até 3 dias (R$)', f: 'bonus_3d' },
  { key: 'taxa_km_fixa', label: 'Taxa fixa de deslocamento (R$)', f: 'km_fixed_fee' },
  { key: 'valor_por_km', label: 'Valor por km (R$)', f: 'km_rate' },
]
const NUM = ['lat', 'lng', 'duration_min', 'base_value', 'bonus_2d', 'bonus_3d', 'km_fixed_fee', 'km_rate']
const MAX = 300

const api = useApi()
const templates = ref<any[]>([]); const templateId = ref(''); const loaded = ref(false)
const rows = ref<any[]>([])
const err = ref(''); const busy = ref(false); const progress = ref('')

const okCount = computed(() => rows.value.filter((r) => !r._done && !r._errors.length).length)
const badCount = computed(() => rows.value.filter((r) => !r._done && r._errors.length).length)
const doneCount = computed(() => rows.value.filter((r) => r._done).length)
const missingGeo = computed(() => rows.value.filter((r) => !r._done && r.address && (r.lat === '' || r.lng === '')).length)

onMounted(async () => {
  try {
    templates.value = (await api.get('/company/criteria')).items.filter((t: any) => t.status === 'aprovado')
    if (templates.value.length) templateId.value = templates.value[0].id
  } catch (e: any) { err.value = e.message } finally { loaded.value = true }
})

const norm = (s: any) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
function num(v: any) {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'number') return String(v)
  let s = String(v).trim().replace(/[R$\s]/g, '')
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  return s
}

function validate(r: any) {
  const e: string[] = []
  if (!r.title) e.push('sem título')
  if (!r.client_name) e.push('sem cliente')
  if (!r.client_phone && !r.client_email) e.push('sem WhatsApp/e-mail')
  if (r.client_phone && !validPhone(r.client_phone)) e.push('WhatsApp inválido')
  if (!r.address) e.push('sem endereço')
  if (r.lat === '' || r.lng === '') e.push('sem lat/long')
  else if (isNaN(Number(r.lat)) || isNaN(Number(r.lng)) || Math.abs(Number(r.lat)) > 90 || Math.abs(Number(r.lng)) > 180) e.push('lat/long inválida')
  if (r.base_value === '' || isNaN(Number(r.base_value))) e.push('valor inválido')
  for (const k of ['bonus_2d', 'bonus_3d', 'km_fixed_fee', 'km_rate', 'duration_min'])
    if (r[k] !== '' && isNaN(Number(r[k]))) e.push(`${k} inválido`)
  r._errors = e
  return r
}

function parseCsv(text: string): any[][] {
  const first = text.split(/\r?\n/)[0] || ''
  const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ','
  const out: any[][] = []; let row: string[] = []; let cell = ''; let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === sep) { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); out.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell || row.length) { row.push(cell); out.push(row) }
  return out
}

async function onFile(ev: Event) {
  err.value = ''; rows.value = []
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    let data: any[][]
    if (/\.csv$/i.test(file.name)) data = parseCsv((await file.text()).replace(/^﻿/, ''))
    else data = await readSheet(file) as any[][]
    data = data.filter((r) => r.some((c) => c !== null && String(c).trim() !== ''))
    if (data.length < 2) { err.value = 'A planilha está vazia.'; return }
    const head = data[0].map(norm)
    const idx: Record<string, number> = {}
    for (const c of COLS) idx[c.f] = head.indexOf(c.key)
    const missing = COLS.filter((c) => c.req && idx[c.f] < 0).map((c) => c.key)
    if (missing.length) { err.value = 'Colunas não encontradas: ' + missing.join(', ') + '. Use o modelo.'; return }
    const body = data.slice(1)
    if (body.length > MAX) { err.value = `Máximo de ${MAX} OS por arquivo. Seu arquivo tem ${body.length}.`; return }
    rows.value = body.map((line) => {
      const r: any = { _done: 0, _errors: [] }
      for (const c of COLS) {
        const v = idx[c.f] >= 0 ? line[idx[c.f]] : ''
        r[c.f] = NUM.includes(c.f) ? num(v) : String(v ?? '').trim()
      }
      if (r.client_phone) r.client_phone = maskPhone(r.client_phone)
      if (r.client_email) r.client_email = r.client_email.toLowerCase()
      return validate(r)
    })
  } catch (e: any) {
    err.value = 'Não foi possível ler o arquivo. Salve como .xlsx ou .csv e tente de novo.'
  } finally {
    (ev.target as HTMLInputElement).value = ''
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function geocodeAll() {
  busy.value = true
  const list = rows.value.filter((r) => !r._done && r.address && (r.lat === '' || r.lng === ''))
  let n = 0
  for (const r of list) {
    n++; progress.value = `Buscando ${n}/${list.length}…`
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(r.address)}`)
      const j = await res.json()
      if (j.length) { r.lat = Number(j[0].lat).toFixed(6); r.lng = Number(j[0].lon).toFixed(6) }
    } catch { /* segue */ }
    validate(r)
    if (!r.lat) r._errors = [...r._errors.filter((x: string) => x !== 'sem lat/long'), 'endereço não encontrado']
    await sleep(1100)
  }
  busy.value = false; progress.value = ''
}

async function submit() {
  busy.value = true; err.value = ''
  const list = rows.value.filter((r) => !r._done && !r._errors.length)
  try {
    for (let i = 0; i < list.length; i += 25) {
      progress.value = `Lançando ${Math.min(i + 25, list.length)}/${list.length}…`
      const chunk = list.slice(i, i + 25)
      const res = await api.post('/company/os/batch', {
        template_id: templateId.value,
        rows: chunk.map(({ _done, _errors, ...r }) => r),
      })
      res.results.forEach((x: any, k: number) => {
        if (x.ok) chunk[k]._done = x.number
        else chunk[k]._errors = [x.error]
      })
    }
  } catch (e: any) { err.value = e.message } finally { busy.value = false; progress.value = '' }
}

function downloadTemplate() {
  const header = COLS.map((c) => c.key).join(';')
  const ex = ['Instalação de roteador', 'Cliente no 2º andar', 'Maria Silva', '(12) 99999-0000', 'maria@email.com',
    'Av. Andrômeda, 100 - Jardim Satélite, São José dos Campos - SP', '', '', '120', '150,00', '30,00', '15,00', '5,00', '1,50']
    .map((v) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(';')
  const blob = new Blob(['﻿' + header + '\n' + ex + '\n'], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = 'modelo-os-lote.csv'; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
</script>

<style scoped>
tr.bad td { background: #fff7f6; }
tr.ok td { background: #f3fbf7; }
details summary { cursor: pointer; color: var(--info); }
</style>
