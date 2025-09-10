// src/state/store.js
import { create } from 'zustand'

/* -------------------------- persistence helpers --------------------------- */
const read  = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v } catch { return v } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid   = () => Math.random().toString(36).slice(2)
const nowISO = () => new Date().toISOString()
const todayStr = () => new Date().toDateString()

/* ------------------------------- the store -------------------------------- */
export const useStore = create((set, get) => ({
  /* ----------------------------- auth/profile ----------------------------- */
  auth:    read('auth',    { authed:false, userId:null }),
  profile: read('profile', { name:'', bio:'', tags:['react','finance'], theme:'dark', email:'', privacy:'pods' }),

  // OTP flow used by your Auth.jsx
  otp: read('otp', { email:'', code:'', expiresAt:0, attemptsLeft:5, resendAt:0 }),
  requestOTP: (email) => {
    const code = '000000';                       // dev code; swap with real mailer later
    const expiresAt = Date.now() + 5*60*1000;    // 5 minutes
    const resendAt  = Date.now() + 30*1000;
    const otp = { email, code, expiresAt, attemptsLeft:5, resendAt }
    write('otp', otp)
    const profile = { ...get().profile, email }
    write('profile', profile)
    set({ otp, profile })
  },
  verifyOTP: (inputCode) => {
    const { otp } = get()
    if (!otp || !otp.email) return false
    if (Date.now() > (otp.expiresAt || 0)) return false
    if ((inputCode || '').trim() !== otp.code) {
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
  signOut: () => set(() => { const a={authed:false,userId:null}; write('auth',a); return { auth:a } }),

  /* --------------------------------- me() --------------------------------- */
  me() { const {auth, profile} = get(); return auth.authed ? { id:auth.userId, name:profile.name || 'You' } : null },

  /* ------------------------------- analytics ------------------------------ */
  // Matches your Home.jsx: analytics.streak; markActive(); toggleFreeze(); maybe freezeArmed
  analytics: read('analytics', { streak:0, lastDay:todayStr(), frozen:false, freezeArmed:false }),
  markActive: () => set(s => {
    if (s.analytics.frozen) return {}
    const d = todayStr()
    let nextStreak = s.analytics.streak
    if (s.analytics.lastDay !== d) {
      // new day: continue streak if yesterday, else reset to 1
      const y = new Date(s.analytics.lastDay)
      const t = new Date(d)
      const continued = (y.getTime() + 86400000) === t.getTime()
      nextStreak = continued ? nextStreak + 1 : 1
    }
    const analytics = { ...s.analytics, lastDay:d, streak:nextStreak }
    write('analytics', analytics)
    return { analytics }
  }),
  toggleFreeze: () => set(s => {
    const analytics = { ...s.analytics, frozen: !s.analytics.frozen, freezeArmed: !s.analytics.frozen }
    write('analytics', analytics)
    return { analytics }
  }),

  /* ---------------------------------- pods -------------------------------- */
  // Shape expected by PodsDirectory/PodHome: pods.all[], pods.joined[]
  pods: read('pods', {
    all: [
      { id:'p1', name:'Starter Pod', about:'Default pod', rules:['Be kind'], members:[], feed:[] }
    ],
    joined: [] // array of pod ids the current user is in
  }),
  createPod: (name, about='') => set(s => {
    if (!name?.trim()) return {}
    const pod = { id: uid(), name: name.trim(), about: (about||'').trim(), rules:[], members:[get().me()?.id].filter(Boolean), feed:[] }
    const pods = { ...s.pods, all:[...s.pods.all, pod], joined:[...new Set([...s.pods.joined, pod.id])] }
    write('pods', pods)
    return { pods }
  }),
  joinPod: (podId) => set(s => {
    const meId = get().me()?.id; if (!meId) return {}
    const all = s.pods.all.map(p => p.id===podId ? { ...p, members:[...new Set([...(p.members||[]), meId])] } : p)
    const joined = [...new Set([...s.pods.joined, podId])]
    const pods = { all, joined }
    write('pods', pods)
    return { pods }
  }),
  postToPod: (podId, msg) => set(s => {
    if (!msg?.trim()) return {}
    const post = { id: uid(), user: get().me()?.name || 'Anon', msg: msg.trim(), at: nowISO() }
    const all = s.pods.all.map(p => p.id===podId ? { ...p, feed:[post, ...(p.feed||[])] } : p)
    const pods = { ...s.pods, all }
    write('pods', pods)
    return { pods }
  }),

  /* --------------------------------- events ------------------------------- */
  // Expected by Events.jsx: { id, title, ts, host, pod }
  events: read('events', [
    { id:'e1', title:'Welcome Session', ts: new Date(Date.now()+86400000).toISOString(), host:'System', pod:'p1' }
  ]),
  createEvent: (title, whenISO, podId=null) => set(s => {
    if (!title?.trim() || !whenISO) return {}
    const podName = (s.pods.all.find(p => p.id===podId)?.name) || null
    const e = { id: uid(), title: title.trim(), ts: new Date(whenISO).toISOString(), host: get().me()?.name || 'You', pod: podId || podName || null }
    const events = [e, ...s.events]; write('events', events); return { events }
  }),
  rsvp: (eventId, yes=true) => set(s => {
    // If your Events.jsx needs RSVP counts, keep a light tally on the object
    const me = get().me()?.id
    const events = s.events.map(e => {
      if (e.id !== eventId) return e
      const going = new Set(e.going || [])
      yes ? going.add(me) : going.delete(me)
      return { ...e, going: [...going] }
    })
    write('events', events); return { events }
  }),

  /* -------------------------------- journal ------------------------------- */
  // Expected by Journal.jsx
  journal: read('journal', []), // items: { id, date, mood, note, insight, sharedSummary }
  addJournal: (date, mood, note, insight, sharedSummary=false) => set(s => {
    const entry = {
      id: uid(),
      date: date || nowISO(),
      mood: (mood||'').trim(),
      note: (note||'').trim(),
      insight: (insight||'').trim(),
      sharedSummary: Boolean(sharedSummary)
    }
    const journal = [entry, ...s.journal]
    write('journal', journal)
    return { journal }
  }),
  deleteJournal: (id) => set(s => {
    const journal = s.journal.filter(j => j.id !== id)
    write('journal', journal)
    return { journal }
  }),

  /* ------------------------------- townhall ------------------------------- */
  townhall: read('townhall', [ { id:uid(), user:'System', msg:'Welcome to PeerLearn!', at: nowISO() } ]),
  shout: (msg) => set(s => {
    if (!msg?.trim()) return {}
    const m = { id: uid(), user: get().me()?.name || 'Anon', msg: msg.trim(), at: nowISO() }
    const townhall = [m, ...s.townhall]
    write('townhall', townhall)
    return { townhall }
  }),

  /* -------------------------------- matches ------------------------------- */
  // Expected by Matching.jsx
  matches: read('matches', { suggested:[], crews:[] }),
  computeMatches: () => set(s => {
    const meId = get().me()?.id
    // naive: suggest pods user hasn't joined yet + “peers” from pod memberships
    const notJoinedPods = s.pods.all.filter(p => !s.pods.joined.includes(p.id))
    const suggested = notJoinedPods.map((p,i) => ({
      id: 'sug-'+p.id,
      title: `Join "${p.name}"`,
      score: 0.6 - i*0.05,
      type: 'pod',
      podId: p.id
    }))

    // crews: group of 3 from first joined pod (demo)
    const firstJoined = s.pods.all.find(p => s.pods.joined.includes(p.id))
    const crew = firstJoined ? (firstJoined.members||[]).slice(0,3).map((id, i)=>({
      id:'crew-'+i, name:`Peer ${String(id).slice(-4)}`, tags:['react','notes'], score:0.5-i*0.1
    })) : []

    const matches = { suggested, crews: crew }
    write('matches', matches)
    return { matches }
  }),

  /* ----------------------------- settings ops ----------------------------- */
  exportAll: () => {
    const keys = [
      'auth','profile','otp',
      'analytics',
      'pods',
      'events',
      'journal',
      'townhall',
      'matches'
    ]
    const obj = Object.fromEntries(keys.map(k => [k, get()[k]]))
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'peerlearn-backup.json'; a.click()
    URL.revokeObjectURL(url)
  },
  importAll: async (file) => {
    const text = await file.text(); let obj
    try { obj = JSON.parse(text) } catch { alert('Invalid JSON'); return }
    const allowed = ['auth','profile','otp','analytics','pods','events','journal','townhall','matches']
    allowed.forEach(k => obj[k] !== undefined && write(k, obj[k]))
    set(Object.fromEntries(allowed.map(k => [k, obj[k] ?? get()[k]])))
  },
  deleteAll: () => set(() => {
    if (!confirm('Delete ALL local data?')) return {}
    ;['auth','profile','otp','analytics','pods','events','journal','townhall','matches'].forEach(k => localStorage.removeItem(k))
    return {
      auth:{authed:false,userId:null},
      profile:{name:'',bio:'',tags:[],theme:'dark',email:'',privacy:'pods'},
      otp:{ email:'', code:'', expiresAt:0, attemptsLeft:0, re
