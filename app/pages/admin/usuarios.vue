<template>
  <div>
    <div class="page-head"><div><h1>Usuários internos</h1><div class="muted small">Equipe de qualidade e administradores</div></div></div>
    <div v-if="err" class="alert err">{{ err }}</div>
    <div v-if="msg" class="alert ok">{{ msg }}</div>
    <div class="grid layout">
      <div class="card">
        <table class="t">
          <thead><tr><th>Nome</th><th>Perfil</th><th>Status</th><th></th></tr></thead>
          <tr v-for="u in items" :key="u.id">
            <td><b>{{ u.name }}</b><div class="small muted">{{ u.email }}</div></td>
            <td>{{ ROLE[u.role] }}</td>
            <td><StatusBadge :status="u.status" /></td>
            <td>
              <template v-if="u.id !== me?.id">
                <button v-if="u.status === 'aprovado'" class="btn danger sm" :disabled="busy" @click="set(u, 'bloqueado')">Bloquear</button>
                <button v-else class="btn ok sm" :disabled="busy" @click="set(u, 'aprovado')">Liberar</button>
              </template>
            </td>
          </tr>
        </table>
      </div>
      <div class="card">
        <h2>Novo usuário</h2>
        <div class="field"><label>Perfil</label>
          <select v-model="f.role"><option value="qualidade">Qualidade</option><option value="admin">Admin</option></select></div>
        <div class="field"><label>Nome</label><input v-model="f.name" /></div>
        <div class="field"><label>E-mail</label><input v-model="f.email" type="email" /></div>
        <div class="field"><label>Telefone</label><input v-model="f.phone" /></div>
        <div class="field"><label>Senha inicial</label><input v-model="f.password" type="text" /><div class="hint">Mínimo 8 caracteres. Envie para a pessoa.</div></div>
        <button class="btn block" :disabled="busy" @click="create">Criar usuário</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ROLE } from '~/composables/useFormat'
const api = useApi()
const { profile: me } = useAuth()
const items = ref<any[]>([]); const err = ref(''); const msg = ref(''); const busy = ref(false)
const f = reactive({ role: 'qualidade', name: '', email: '', phone: '', password: '' })
async function load() { try { items.value = (await api.get('/admin/users?role=admin,qualidade')).items } catch (e: any) { err.value = e.message } }
async function create() {
  busy.value = true; err.value = ''; msg.value = ''
  try { await api.post('/admin/users', f); msg.value = `Usuário ${f.email} criado.`; Object.assign(f, { name: '', email: '', phone: '', password: '' }); await load() }
  catch (e: any) { err.value = e.message } finally { busy.value = false }
}
async function set(u: any, status: string) {
  busy.value = true; err.value = ''
  try { await api.post(`/admin/users/${u.id}/status`, { status }); await load() } catch (e: any) { err.value = e.message } finally { busy.value = false }
}
onMounted(load)
</script>
<style scoped>
.layout { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); align-items: start; }
@media (max-width: 960px) { .layout { grid-template-columns: 1fr; } }
</style>
