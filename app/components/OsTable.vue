<template>
  <div class="card">
    <div class="row between" style="margin-bottom:10px">
      <div class="tabs" style="margin:0">
        <button :class="{ on: !filter }" @click="filter = ''">Todas ({{ items.length }})</button>
        <button v-for="s in present" :key="s" :class="{ on: filter === s }" @click="filter = s">
          {{ STATUS[s] }} ({{ count[s] }})
        </button>
      </div>
      <input v-model="q" placeholder="Buscar nº, título, cliente…" style="max-width:260px" />
    </div>
    <div v-if="loading" class="empty">Carregando…</div>
    <div v-else-if="!rows.length" class="empty">Nenhuma OS encontrada.</div>
    <div v-else class="table-wrap">
      <table class="t">
        <thead>
          <tr>
            <th>OS</th><th>Título / endereço</th>
            <th v-if="show.company">Empresa</th>
            <th v-if="show.tech">Técnico</th>
            <th>Agendamento</th><th>Status</th>
            <th v-if="show.value" style="text-align:right">{{ valueLabel }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in rows" :key="o.id" class="click" @click="navigateTo(linkBase + o.id)">
            <td class="mono">#{{ o.number }}</td>
            <td><div><b>{{ o.title }}</b></div><div class="muted small">{{ o.address }}</div></td>
            <td v-if="show.company">{{ o.company_name }}</td>
            <td v-if="show.tech">{{ o.tech_name || '—' }}</td>
            <td class="small">{{ o.scheduled_start ? dt(o.scheduled_start) : '—' }}</td>
            <td><StatusBadge :status="o.status" /></td>
            <td v-if="show.value" class="money" style="text-align:right">{{ brl(valueOf(o)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { STATUS, STATUS_ORDER, brl, dt } from '~/composables/useFormat'
const props = withDefaults(defineProps<{
  items: any[]; loading?: boolean; linkBase: string
  show?: { company?: boolean; tech?: boolean; value?: boolean }
  valueField?: string; valueLabel?: string
}>(), { show: () => ({ tech: true, value: true }), valueField: 'company_total', valueLabel: 'Valor' })

const filter = ref('')
const q = ref('')
const count = computed(() => props.items.reduce((a: any, o: any) => ((a[o.status] = (a[o.status] || 0) + 1), a), {}))
const present = computed(() => STATUS_ORDER.filter((s) => count.value[s]))
const rows = computed(() => {
  const t = q.value.trim().toLowerCase()
  return props.items.filter((o) => (!filter.value || o.status === filter.value) &&
    (!t || `${o.number} ${o.title} ${o.client_name} ${o.address} ${o.tech_name || ''} ${o.company_name || ''}`.toLowerCase().includes(t)))
})
const valueOf = (o: any) => {
  const v = o[props.valueField]
  if ((v === null || v === undefined || Number(v) === 0) && o.status === 'aberta') return o.base_value
  return v
}
</script>
