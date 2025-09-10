// src/state/store.js
import { create } from 'zustand'

/* ----------------------- helpers & persistence ----------------------- */
const read  = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v } catch { return v } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid   = () => Math.random().toString(36).slice(2)
const nowISO = () => new Date().toISOString()
const today  = () => new Date().toDateString()

export const useStore = create((set, get) => ({
  /* ---------------------- auth & profile state ---------------------- */
  auth:    read('auth',    { authed:false, userId:null }),
  profile: read('profile', { name:'', bio:'', tags:['react','finance'], theme:'dark', email:'', privacy:'pods' }),
  otp: read('otp', { email:'', code:'', expiresAt:0, attemptsLeft:5, resendAt:0 }),

  // OTP requests/verify—supports your Auth.jsx
  requestOTP: (email) => {
    const code = '000000'          // dev code; swap with real mailer
    const expiresAt = Date.now() + 5*60*1000
    const resendAt  = Date.now() + 30*1000
    const otp = { email, code, expiresAt, attemptsLeft:5, resendAt }
    write('otp', otp)
    const profile = { ...get().profile, email }
    write('profile', profile)
    set({ otp, profile })
  },
  verifyOTP: (input) => {
    const { otp } = get()
    if (!otp || !otp.email) return false
    if (Date.now() > (otp.expiresAt || 0)) return false
    if ((input || '').trim() !== otp.code) {
      const attemptsLeft = Math.max(0, (otp.attemptsLeft || 0) - 1)
      const next = { ...otp, attemptsLeft }
      write('otp', next); set({ otp: next })
      return false
    }
    const auth = { authed:true, userId: get().auth.userId || uid() }
    write('auth', auth)
    const cleared = { email:'', code:'', expiresAt:0, attemptsLeft:0, resendAt:0 }
    write('otp', cleared)
    set({ auth, otp: cleared })
    return true
  },
  signOut: () => set(() => { const a={authed:false, userId:null}; write('auth',a); return { auth:a } }),

  /* ------------------------ analytics & habits ----------------------- */
  analytics: read('analytics', { streak:0, lastDay:today(), frozen:false, freezeArmed:false }),
  markActive: () => set((state) => {
    const d   = today()
    let next = state.analytics.streak
    if (state.analytics.lastDay !== d) {
      const last  = new Date(state.analytics.lastDay).getTime()
      const now   = new Date(d).getTime()
      const cont  = last + 86400000 === now
      next = cont ? next + 1 : 1
    }
    const analytics = { ...state.analytics, lastDay:d, streak:next }
    write('analytics', analytics)
    return { analytics }
  }),
  toggleFreeze: () => set((state) => {
    const analytics = { ...state.analytics, frozen: !state.analytics.frozen, freezeArmed: !state.analytics.frozen }
    write('analytics', analytics)
    return { analytics }
  }),

  /* ------------------------------ pods ------------------------------- */
  // Using pods.all[], pods.joined[] to match PodsDirectory/PodHome
  pods: read('pods', {
    all: [
      { id:'p1', name:'Starter Pod', about:'Default pod', rules:['Be kind'], members:[], feed:[] }
    ],
    joined: []
  }),
  createPod: (name, about='') => set((s) => {
    if (!name?.trim()) return {}
    const pod = {
      id: uid(),
      name: name.trim(),
      about: (about || '').trim(),
      rules: [],
      members: [get().me()?.id].filter(Boolean),
      feed: []
    }
    const all = [...s.pods.all, pod]
    const joined = [...new Set([...s.pods.joined, pod.id])]
    const pods = { all, joined }
    write('pods', pods)
    return { pods }
  }),
  joinPod: (podId) => set((s) => {
    const meId = get().me()?.id; if (!meId) return {}
    const all = s.pods.all.map(p => p.id === podId ? { ...p, members:[...new Set([...(p.members || []), meId])] } : p)
    const joined = [...new Set([...s.pods.joined, podId])]
    const pods = { all, joined }
    write('pods', pods)
    return { pods }
  }),
  postToPod: (podId, msg) => set((s) => {
    if (!msg?.trim()) return {}
    const post = { id: uid(), user:get().me()?.name || 'Anon', msg: msg.trim(), at: nowISO() }
    const all  = s.pods.all.map(p => p.id === podId ? { ...p, feed:[post, ...(p.feed || [])] } : p)
    const pods = { ...s.pods, all }
    write('pods', pods)
    return { pods }
  }),

  /* ------------------------------ events ------------------------------ */
  events: read('events', [
    { id:'e1', title:'Welcome Session', ts:new Date(Date.now()+86400000).toISOString(), host:'System', pod:'p1' }
  ]),
  createEvent: (title, whenISO, podId=null) => set((s) => {
    if (!title?.trim() || !whenISO) return {}
    const podName = s.pods.all.find(p => p.id === podId)?.name || null
    const e = {
      id: uid(),
      title: title.trim(),
      ts: new Date(whenISO).toISOString(),
      host: get().me()?.name || 'You',
      pod: podId || podName || null
    }
    const events = [e, ...s.events]
    write('events', events)
    return { events }
  }),
  rsvp: (eventId, yes=true) => set((s) => {
    const meId = get().me()?.id
    const events = s.events.map(e => {
      if (e.id !== eventId) return e
      const going = new Set(e.going || [])
      yes ? going.add(meId) : going.delete(meId)
      return { ...e, going:[...going] }
    })
    write('events', events)
    return { events }
  }),

  /* ---------------------------- journal ---------------------------- */
  journal: read('journal', []),
  addJournal: (date, mood, note, insight, sharedSummary=false) => set((s) => {
    const entry = {
      id: uid(),
      date: date || nowISO(),
      mood:(mood || '').trim(),
      note:(note || '').trim(),
      insight:(insight || '').trim(),
      sharedSummary: Boolean(sharedSummary)
    }
    const journal = [entry, ...s.journal]
    write('journal', journal)
    return { journal }
  }),
  deleteJournal: (id) => set((s) => {
    const journal = s.journal.filter(j => j.id !== id)
    write('journal', journal)
    return { journal }
  }),

  /* --------------------------- townhall --------------------------- */
  townhall: read('townhall', [ { id:uid(), user:'System', msg:'Welcome to PeerLearn!', at: nowISO() } ]),
  shout: (msg) => set((s) => {
    if (!msg?.trim()) return {}
    const m = { id: uid(), user:get().me()?.name || 'Anon', msg: msg.trim(), at: nowISO() }
    const townhall = [m, ...s.townhall]
    write('townhall', townhall)
    return { townhall }
  }),

  /* ---------------------------- matches ---------------------------- */
  matches: read('matches', { suggested:[], crews:[] }),
  computeMatches: () => set((s) => {
    const meId = get().me()?.id
    // Suggest pods you’re not in:
    const notJoined = s.pods.all.filter(p => !s.pods.joined.includes(p.id))
    const suggested = notJoined.map((p,i) => ({
      id:'sug-'+p.id,
      title:`Join "${p.name}"`,
      score: 0.6 - i*0.05,
      type:'pod',
      podId:p.id
    }))
    // For crews: pick up to 3 members from the first joined pod:
    const first = s.pods.all.find(p => s.pods.joined.includes(p.id))
    const crew = first ? (first.members || []).slice(0,3).map((id, i) => ({
      id:'crew-'+i, name:`Peer ${String(id).slice(-4)}`, tags:['react','notes'], score:0.5-i*0.1
    })) : []
    const matches = { suggested, crews:crew }
    write('matches', matches)
    return { matches }
  }),

  /* ------------------------- helper for me() ------------------------ */
  me() {
    const { auth, profile } = get()
    return auth.authed ? { id: auth.userId, name: profile.name || 'You' } : null
  },

  /* ------------------------- export/import/reset ------------------------ */
  exportAll: () => {
    const keys = ['auth','profile','otp','analytics','pods','events','journal','townhall','matches']
    const obj  = Object.fromEntries(keys.map(k => [k, get()[k]]))
    const blob = new Blob([JSON.stringify(obj, null, 2)],{ type:'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'peerlearn-backup.json'; a.click(); URL.revokeObjectURL(url)
  },
  importAll: async (file) => {
    const text = await file.text(); let obj
    try { obj = JSON.parse(text) } catch { alert('Invalid JSON'); return }
    const allowed = ['auth','profile','otp','analytics','pods','events','journal','townhall','matches']
    allowed.forEach(k => obj[k] !== undefined && write(k,obj[k]))
    set(Object.fromEntries(allowed.map(k => [k, obj[k] ?? get()[k]])))
  },
  deleteAll: () => set(() => {
    if (!confirm('Delete ALL local data?')) return {}
    const cleared = {
      auth:{ authed:false, userId:null },
      profile:{ name:'', bio:'', tags:[], theme:'dark', email:'', privacy:'pods' },
      otp:{ email:'', code:'', expiresAt:0, attemptsLeft:0, resendAt:0 },
      analytics:{ streak:0, lastDay:today(), frozen:false, freezeArmed:false },
      pods:{ all:[{ id:'p1', name:'Starter Pod', about:'Default pod', rules:['Be kind'], members:[], feed:[] }], joined:[] },
      events:[{ id:'e1', title:'Welcome Session', ts:new Date(Date.now()+86400000).toISOString(), host:'System', pod:'p1' }],
      journal:[],
      townhall:[{ id:uid(), user:'System', msg:'Reset complete', at: nowISO() }],
      matches:{ suggested:[], crews:[] }
    }
    Object.keys(cleared).forEach(k => localStorage.removeItem(k))
    return cleared
  })
}))
