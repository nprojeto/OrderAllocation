import { MASKS } from '~/composables/useMask'

// uso: <input v-model="x" v-mask="'phone'" />  (phone | cpf | cnpj | doc)
export default defineNuxtPlugin((nuxt) => {
  const apply = (el: HTMLInputElement, type: string) => {
    const fn = MASKS[type]
    if (!fn) return
    const out = fn(el.value)
    if (out !== el.value) {
      el.value = out
      el.dispatchEvent(new Event('input'))
    }
  }
  nuxt.vueApp.directive('mask', {
    mounted(el: HTMLInputElement, b) {
      el.setAttribute('inputmode', 'numeric')
      el.addEventListener('input', () => apply(el, b.value))
      apply(el, b.value)
    },
    updated(el: HTMLInputElement, b) { apply(el, b.value) },
  })
})
