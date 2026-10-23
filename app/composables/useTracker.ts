// Envia o GPS do técnico para o servidor enquanto o app estiver aberto.
// Envia no máximo a cada 60 s, ou antes se ele andar mais de 150 m.
const state = reactive({ on: false, error: '', last: null as null | { lat: number; lng: number; at: number; acc: number } })
let watchId: number | null = null
let lastSent = { lat: 0, lng: 0, at: 0 }
const reasons = new Set<string>()

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (x: number) => (x * Math.PI) / 180
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export const useTracker = () => {
  const api = useApi()

  async function send(pos: GeolocationPosition, force = false) {
    const cur = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    state.last = { ...cur, at: Date.now(), acc: pos.coords.accuracy }
    const moved = lastSent.at ? km(lastSent, cur) * 1000 : Infinity
    if (!force && Date.now() - lastSent.at < 60000 && moved < 150) return
    lastSent = { ...cur, at: Date.now() }
    try { await api.post('/tech/location', { ...cur, accuracy: Math.round(pos.coords.accuracy) }); state.error = '' }
    catch (e: any) { state.error = e.message }
  }

  function start(reason = 'default') {
    reasons.add(reason)
    if (watchId !== null || !process.client) return
    if (!navigator.geolocation) { state.error = 'Este navegador não permite localização.'; return }
    watchId = navigator.geolocation.watchPosition(
      (p) => { state.on = true; send(p) },
      (e) => { state.on = false; state.error = e.code === 1 ? 'Permita o acesso à localização no navegador.' : 'Não foi possível obter o GPS.' },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 30000 },
    )
  }

  function stop(reason = 'default') {
    reasons.delete(reason)
    if (reasons.size || watchId === null) return
    navigator.geolocation.clearWatch(watchId)
    watchId = null; state.on = false
  }

  function sendNow() {
    return new Promise<void>((resolve) => {
      if (!navigator.geolocation) return resolve()
      navigator.geolocation.getCurrentPosition(async (p) => { await send(p, true); resolve() }, () => resolve(),
        { enableHighAccuracy: true, timeout: 15000 })
    })
  }

  return { state, start, stop, sendNow }
}

export const distanceKm = km
