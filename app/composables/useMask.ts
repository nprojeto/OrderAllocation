export const digits = (v: any) => String(v ?? '').replace(/\D/g, '')

export function maskPhone(v: any) {
  const d = digits(v).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
export function maskCpf(v: any) {
  const d = digits(v).slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}
export function maskCnpj(v: any) {
  const d = digits(v).slice(0, 14)
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}
export const maskDoc = (v: any) => (digits(v).length <= 11 ? maskCpf(v) : maskCnpj(v))

export const MASKS: Record<string, (v: any) => string> = { phone: maskPhone, cpf: maskCpf, cnpj: maskCnpj, doc: maskDoc }

export function validCpf(v: any) {
  const d = digits(v)
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const calc = (n: number) => {
    let s = 0
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i)
    const r = (s * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}
export function validCnpj(v: any) {
  const d = digits(v)
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const calc = (n: number) => {
    const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const s = w.reduce((a, x, i) => a + x * Number(d[i]), 0)
    const r = s % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13])
}
export const validDoc = (v: any) => (digits(v).length <= 11 ? validCpf(v) : validCnpj(v))
export const validPhone = (v: any) => [10, 11].includes(digits(v).length)
