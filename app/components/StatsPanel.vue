<template>
  <div v-if="s" class="stack">
    <div class="grid g4">
      <div class="card kpi"><span class="l">Total de OS</span><span class="v">{{ s.total }}</span></div>
      <div class="card kpi"><span class="l">Abertas</span><span class="v">{{ s.by_status.aberta || 0 }}</span></div>
      <div class="card kpi"><span class="l">Em andamento</span><span class="v">{{ inProgress }}</span></div>
      <div class="card kpi"><span class="l">Finalizadas</span><span class="v">{{ s.by_status.finalizada || 0 }}</span></div>
    </div>

    <div class="grid g2">
      <div class="card">
        <h2>SLA médio</h2>
        <dl class="kv">
          <dt>Lançamento → aceite</dt><dd>{{ hours(s.sla.accept_h) }}</dd>
          <dt>Lançamento → agendamento confirmado</dt><dd>{{ hours(s.sla.confirm_h) }}</dd>
          <dt>Lançamento → conclusão</dt><dd>{{ hours(s.sla.complete_h) }}</dd>
          <dt>Conclusão → validação</dt><dd>{{ hours(s.sla.validate_h) }}</dd>
          <dt>Agendadas em até 2 dias</dt><dd>{{ s.sla.bonus_2d }}</dd>
          <dt>Agendadas em até 3 dias</dt><dd>{{ s.sla.bonus_3d }}</dd>
          <dt>Aprovadas de primeira</dt><dd>{{ s.sla.first_pass }}</dd>
          <dt>Com retrabalho</dt><dd>{{ s.sla.rework }}</dd>
        </dl>
      </div>
      <div class="card">
        <h2>{{ moneyTitle }}</h2>
        <dl class="kv">
          <template v-if="mode === 'tecnico'">
            <dt>Recebido (finalizadas)</dt><dd class="money">{{ brl(s.money.tech_finalized) }}</dd>
            <dt>A receber (em andamento)</dt><dd class="money">{{ brl(s.money.tech_in_progress) }}</dd>
          </template>
          <template v-else-if="mode === 'empresa'">
            <dt>Pago a técnicos (finalizadas)</dt><dd class="money">{{ brl(s.money.tech_finalized) }}</dd>
            <dt>Taxa da plataforma</dt><dd class="money">{{ brl(s.money.platform_fee_finalized) }}</dd>
            <dt>Validações ({{ s.money.validations }})</dt><dd class="money">{{ brl(s.money.validation_fees) }}</dd>
            <dt><b>Total finalizado</b></dt><dd class="money"><b>{{ brl(Number(s.money.tech_finalized) + Number(s.money.platform_fee_finalized) + Number(s.money.validation_fees)) }}</b></dd>
            <dt>Comprometido (em andamento)</dt><dd class="money">{{ brl(Number(s.money.tech_in_progress) + Number(s.money.platform_fee_in_progress)) }}</dd>
          </template>
          <template v-else>
            <dt>Taxa plataforma (finalizadas)</dt><dd class="money">{{ brl(s.money.platform_fee_finalized) }}</dd>
            <dt>Taxas de validação ({{ s.money.validations }})</dt><dd class="money">{{ brl(s.money.validation_fees) }}</dd>
            <dt><b>Receita realizada</b></dt><dd class="money"><b>{{ brl(Number(s.money.platform_fee_finalized) + Number(s.money.validation_fees)) }}</b></dd>
            <dt>Receita prevista (em andamento)</dt><dd class="money">{{ brl(s.money.platform_fee_in_progress) }}</dd>
            <dt>Volume pago a técnicos</dt><dd class="money">{{ brl(s.money.tech_finalized) }}</dd>
          </template>
        </dl>
      </div>
    </div>

    <div class="card">
      <h2>OS por status</h2>
      <div class="bars">
        <div v-for="st in STATUS_ORDER" :key="st" class="bar">
          <span class="lb"><StatusBadge :status="st" /></span>
          <span class="track"><span class="fill" :style="{ width: pct(s.by_status[st]) }" /></span>
          <span class="n">{{ s.by_status[st] || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { STATUS_ORDER, brl, hours } from '~/composables/useFormat'
const props = defineProps<{ s: any; mode: 'empresa' | 'admin' | 'tecnico' }>()
const inProgress = computed(() => ['aguardando_cliente', 'aguardando_tecnico', 'agendada', 'em_execucao', 'em_validacao', 'retrabalho']
  .reduce((a, k) => a + (props.s?.by_status?.[k] || 0), 0))
const max = computed(() => Math.max(1, ...Object.values(props.s?.by_status || {}).map(Number)))
const pct = (n: any) => `${((Number(n) || 0) / max.value) * 100}%`
const moneyTitle = computed(() => ({ empresa: 'Financeiro', admin: 'Receita da plataforma', tecnico: 'Seus ganhos' } as any)[props.mode])
</script>

<style scoped>
.bars { display: flex; flex-direction: column; gap: 8px; }
.bar { display: grid; grid-template-columns: 160px 1fr 40px; gap: 10px; align-items: center; }
.track { height: 10px; background: #f0f1f4; border-radius: 99px; overflow: hidden; }
.fill { display: block; height: 100%; background: var(--ink); border-radius: 99px; }
.n { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
</style>
