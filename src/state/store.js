import { create } from 'zustand'

const LS_KEY = 'peerlearn-pro-state'
const load = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || null } catch { return null }
}
const persist = (state) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch {}
}

const DEFAULT_PODS = [
  'Consulting','Finance','Data Science','Marketing','Product Management','Operations','Strategy','HR','Analytics','Social Impact','EdTech','Banking','Investment','Entrepreneurship'
].map((name, i)=>({
  id: 'pod-'+(i+1), name, members: [], rules: 'Be kind. Specific pledges. Weekly proof.',
  activity: Math.floor(Math.random()*8)+2, // posts/week
  events: Math.random()>.5?1:0,
  mentors: Math.random()>.5?['Stellar Mentor']:[],
  feed: [
    {id:'f1', type:'pledge', by:'Maya', text:'Finish 20 problems tonight', ts: Date.now()-36e5*6},
    {id:'f2', type:'proof',  by:'Arjun', text:'Posted project summary', ts: Date.now()-36e5*2}
  ]
}))

const defaultState = {
  auth: { authed: false, email:'', verified:false },
  profile: {
    onboarded:false,
    name:'', college:'', gradYear:'', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    headline:'', goals:['Product Management'], skills:['SQL','Excel'], availability:'Tue 7-8pm', linkedin:{ url:'', headline:'', skills:[], visible:{profile:true, pods:true, posts:false}},
    privacy:{ journalsPrivate:true, allowAnon:true },
    theme:'dark'
  },
  pods: { all: DEFAULT_PODS, joined: [] },
  matches: { suggested: [], crews: [] },
  journal: [],
  events: [{id:'e1', title:'PM Resume Clinic', ts: Date.now()+86400000, host:'Stellar Mentor', pod:'Product Management', rsvps:0}],
  townhall: [{id:'t1', type:'announcement', author:'Admin', text:'Welcome to PeerLearn!', ts: Date.now()-86400000}],
  analytics: { streak:0, freezeArmed:false, freezeUsedThisWeek:false, retrieval:[] },
  dms: { byThread: {} }
}

export const useStore = create((set, get)=>({
  ... (load() || defaultState),

  _persist: ()=>persist(get()),

  // Auth
  requestOTP: (email)=>{
    set(s=>({auth:{...s.auth, email}})); get()._persist(); return '000000'; // static code for MVP
  },
  verifyOTP: (code)=>{
    const ok = code==='000000'
    set(s=>({auth:{...s.auth, authed: ok, verified: ok}})); get()._persist(); return ok
  },
  signOut: ()=>{ set(()=>defaultState); get()._persist(); },

  completeOnboarding: (patch)=>{
    set(s=>({profile:{...s.profile, ...patch, onboarded:true}})); get()._persist();
  },

  // Pods
  joinPod: (podId)=>{
    set(s=>{
      const pod = s.pods.all.find(p=>p.id===podId)
      if (!pod) return {}
      const joined = [...new Set([...s.pods.joined, podId])]
      return { pods: {...s.pods, joined } }
    }); get()._persist();
  },
  leavePod: (podId)=>{
    set(s=>({ pods: {...s.pods, joined: s.pods.joined.filter(id=>id!==podId)} })); get()._persist();
  },
  postToPod: (podId, entry)=>{
    set(s=>{
      const all = s.pods.all.map(p=> p.id===podId ? {...p, feed:[...p.feed, {...entry, id:'f'+Date.now()}]} : p)
      return { pods:{...s.pods, all} }
    }); get()._persist();
  },

  // Journal
  addJournal: (entry)=>{
    set(s=>({ journal:[{...entry, id:'j'+Date.now()}, ...s.journal] })); get()._persist();
  },

  // Matching
  computeMatches: ()=>{
    const userSkills = (get().profile.skills||[]).map(s=>s.toLowerCase())
    const candidates = get().pods.all.flatMap(p=> p.members.length? p.members : [{id:'u1', name:'Maya', skills:['excel','sql']},{id:'u2', name:'Arjun', skills:['python','stats']}])
    const scored = candidates.map(c=>({
      ...c, score: c.skills.filter(s=>userSkills.includes(s.toLowerCase())).length
    })).sort((a,b)=>b.score-a.score)
    set(()=>({ matches:{ suggested: scored.slice(0,3), crews:[['You', 'Maya', 'Arjun']] }}))
    get()._persist()
  },

  // Events
  rsvp: (eventId)=>{
    set(s=>({ events: s.events.map(e=> e.id===eventId? {...e, rsvps:(e.rsvps||0)+1}:e)})); get()._persist();
  },

  // Analytics
  markActive: ()=>{
    const today = new Date().toISOString().slice(0,10)
    const s = get().analytics
    let newStreak = s.streak
    if (s.lastActive === today) { /* no-op */ }
    else if (!s.lastActive) newStreak = 1
    else {
      const diff = Math.round((new Date(today)-new Date(s.lastActive))/86400000)
      if (diff===1) newStreak = s.streak+1
      else if (diff>1 && s.freezeArmed && !s.freezeUsedThisWeek) { newStreak = s.streak+1; s.freezeArmed=false; s.freezeUsedThisWeek=true }
      else newStreak = 1
    }
    set(state=>({ analytics:{...state.analytics, lastActive: today, streak:newStreak }})); get()._persist();
  },
  toggleFreeze: ()=>{ set(s=>({ analytics:{...s.analytics, freezeArmed: !s.analytics.freezeArmed} })); get()._persist(); },

}))
