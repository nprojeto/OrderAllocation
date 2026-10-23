<template>
  <div class="wrap">
    <div class="card box">
      <NuxtLink to="/" class="small">← Voltar ao login</NuxtLink>
      <h1 style="margin-top:8px">Criar conta</h1>

      <div class="choose">
        <button :class="{ on: role === 'empresa' }" @click="pick('empresa')">
          <b>Sou empresa</b><span>Quero lançar ordens de serviço</span>
        </button>
        <button :class="{ on: role === 'tecnico' }" @click="pick('tecnico')">
          <b>Sou técnico</b><span>Quero receber ordens próximas</span>
        </button>
      </div>

      <div v-if="done" class="alert ok">
        Conta de {{ done === 'empresa' ? 'empresa' : 'técnico' }} criada!
        <span> O cadastro será analisado pelo administrador.</span>
        <span v-if="done === 'tecnico'"> Enquanto isso, você já pode entrar e completar sua localização.</span>
        <span v-else> Enquanto isso, você já pode entrar e cadastrar seus critérios de validação.</span>
        <div class="row" style="margin-top:8px">
          <NuxtLink to="/" class="btn sm">Ir para o login</NuxtLink>
          <button class="btn secondary sm" @click="reset">Criar outra conta</button>
        </div>
      </div>

      <form v-else @submit.prevent="submit">
        <div v-if="err" class="alert err">{{ err }}</div>
        <div class="grid g2">
          <div class="field"><label>{{ role === 'empresa' ? 'Nome fantasia' : 'Nome completo' }}</label><input v-model="f.name" required /></div>
          <div class="field"><label>WhatsApp</label><input v-model="f.phone" v-mask="'phone'" required placeholder="(12) 99999-9999" /></div>
        </div>
        <div v-if="role === 'empresa'" class="grid g2">
          <div class="field"><label>Razão social</label><input v-model="f.legal_name" /></div>
          <div class="field"><label>CNPJ</label><input v-model="f.document" v-mask="'cnpj'" placeholder="00.000.000/0000-00" /></div>
        </div>
        <div v-else class="grid g2">
          <div class="field"><label>CPF/CNPJ</label><input v-model="f.document" v-mask="'doc'" required placeholder="000.000.000-00" /></div>
          <div class="field"><label>Cidade base</label><input v-model="f.base_address" placeholder="Ex.: São José dos Campos - SP" /></div>
          <div class="field" style="grid-column:1/-1"><label>Especialidades</label><input v-model="f.skills" placeholder="Ex.: redes, CFTV, elétrica" /></div>
        </div>
        <div class="grid g2">
          <div class="field"><label>E-mail</label><input v-model="f.email" type="email" required /></div>
          <div class="field"><label>Senha</label><input v-model="f.password" type="password" minlength="8" required /><div class="hint">Mínimo 8 caracteres</div></div>
        </div>
        <button class="btn block" :disabled="busy">{{ busy ? 'Criando…' : 'Criar conta' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { validPhone, validCnpj, validDoc } from '~/composables/useMask'
const { signup } = useAuth()
const role = ref<'empresa' | 'tecnico'>('empresa')
const f = reactive({ name: '', phone: '', legal_name: '', document: '', base_address: '', skills: '', email: '', password: '' })
const err = ref('')
const busy = ref(false)
const done = ref<'' | 'empresa' | 'tecnico'>('')
function reset() {
  done.value = ''; err.value = ''
  Object.assign(f, { name: '', phone: '', legal_name: '', document: '', base_address: '', skills: '', email: '', password: '' })
}
function pick(r: 'empresa' | 'tecnico') {
  if (done.value) reset()
  if (role.value !== r) f.document = ''
  role.value = r
}
async function submit() {
  err.value = ''
  if (!validPhone(f.phone)) { err.value = 'WhatsApp inválido. Use DDD + número.'; return }
  if (role.value === 'empresa' && f.document && !validCnpj(f.document)) { err.value = 'CNPJ inválido.'; return }
  if (role.value === 'tecnico' && !validDoc(f.document)) { err.value = 'CPF/CNPJ inválido.'; return }
  busy.value = true
  try {
    const meta: any = { role: role.value, name: f.name, phone: f.phone, document: f.document }
    if (role.value === 'empresa') meta.legal_name = f.legal_name
    else { meta.skills = f.skills; meta.base_address = f.base_address }
    await signup(f.email, f.password, meta)
    await (useNuxtApp().$supabase as any).auth.signOut()
    done.value = role.value
  } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
</script>

<style scoped>
.wrap { min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; padding: 40px 16px; }
.box { width: min(640px, 100%); }
.choose { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 16px 0 18px; }
.choose button { text-align: left; font: inherit; padding: 14px; border: 1.5px solid var(--line); border-radius: 10px; background: #fff; cursor: pointer; display: flex; flex-direction: column; gap: 2px; }
.choose button span { font-size: 13px; color: var(--muted); }
.choose button.on { border-color: var(--accent); background: #fff6f0; }
</style>
