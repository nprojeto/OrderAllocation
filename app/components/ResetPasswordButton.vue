<template>
  <button class="btn secondary sm" :disabled="busy" title="Redefinir senha" @click="reset">🔑 Senha</button>
</template>
<script setup lang="ts">
const props = defineProps<{ user: { id: string; name: string; email: string } }>()
const api = useApi()
const busy = ref(false)
function gen() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const a = new Uint32Array(10); crypto.getRandomValues(a)
  return Array.from(a, (x) => c[x % c.length]).join('')
}
async function reset() {
  const pw = prompt(`Nova senha para ${props.user.name} (${props.user.email}).\nMínimo 8 caracteres:`, gen())
  if (pw === null) return
  busy.value = true
  try {
    await api.post(`/admin/users/${props.user.id}/password`, { password: pw })
    try { await navigator.clipboard.writeText(pw) } catch { /* */ }
    alert(`Senha redefinida!\n\nE-mail: ${props.user.email}\nNova senha: ${pw}\n\n(copiada para a área de transferência — envie ao usuário)`)
  } catch (e: any) { alert(e.message) } finally { busy.value = false }
}
</script>
