export const STATUS: Record<string, string> = {
  aberta: 'Aberta',
  aguardando_cliente: 'Aguardando cliente',
  aguardando_tecnico: 'Aguardando técnico',
  agendada: 'Agendada',
  em_execucao: 'Em execução',
  em_validacao: 'Em validação',
  retrabalho: 'Retrabalho',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  bloqueado: 'Bloqueado',
  aprovada: 'Aprovada',
  reprovada: 'Reprovada',
}
export const STATUS_ORDER = [
  'aberta', 'aguardando_cliente', 'aguardando_tecnico', 'agendada',
  'em_execucao', 'em_validacao', 'retrabalho', 'finalizada', 'cancelada',
]
export const ROLE: Record<string, string> = {
  admin: 'Admin', empresa: 'Empresa', tecnico: 'Técnico', qualidade: 'Qualidade', cliente: 'Cliente', sistema: 'Sistema',
}

export const brl = (v: any) =>
  v === null || v === undefined || v === '' ? '—'
    : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const dt = (v: any) =>
  v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export const dOnly = (v: any) => (v ? new Date(v).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '—')
export const tOnly = (v: any) => (v ? new Date(v).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')

export const hours = (v: any) => {
  if (v === null || v === undefined) return '—'
  const n = Number(v)
  if (n < 1) return `${Math.round(n * 60)} min`
  if (n < 48) return `${n.toFixed(1)} h`
  return `${(n / 24).toFixed(1)} dias`
}

// "2026-10-24T09:00" (input datetime-local) -> ISO
export const localToIso = (v: string) => (v ? new Date(v).toISOString() : '')

export const mapsUrl = (lat: any, lng: any) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

export const minDateTimeLocal = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setMinutes(0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
