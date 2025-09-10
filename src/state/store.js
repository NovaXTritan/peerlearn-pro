// src/state/store.js
import { create } from 'zustand'

const read  = (k, v)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? v } catch{ return v } }
const write = (k,v)=> localStorage.setItem(k, JSON.stringify(v))

const uid     = () => Math.random().toString(36).slice(2)
const nowISO  = () => new Date().toISOString()
const today   = () => new Date().toDateString()

export const useStore = create((set, get)=>({
  // ---------- Auth / Profile ----------
  auth:    read('auth',    { authed:false, userId:null }),
  profile: read('profile', { onboarded:false, name:'', bio:'', tags:['react','finance'], theme:'dark', email:'' }),

  // OTP state for your Auth.jsx flow
  otp: read('otp', { email:'', code:'', expiresAt:0, attemptsLeft:5, resendAt:0 }),

  // required by App.jsx
  me(){ const { auth, profile } = get(); return auth.authed ? { id:auth.userId, name:profile.name||'You' } : null },

  // MVP OTP sender — generates a code and stores expiry; UI says “use 000000”
  requestOTP: (email)=>{
    const code = '000000';                       // <-- dev code; replace with random + mailer later
    const expiresAt = Date.now() + 5*60*1000;    // 5 min
    const resendAt  = Date.now() + 30*1000;      // 30s cooldown (optional)
    const otp = { email, code, expiresAt, attemptsLeft:5, resendAt }
    write('otp', otp)
    // also cache email in profile (nice for onboarding)
    const profile = { ...get().profile, email }
    write('profile', profile)
    set({ otp, profile })
  },

  verifyOTP: (inputCode)=>{
    const { otp } = get()
    // no OTP requested yet
    if (!otp.email) return false
    // expired?
    if (Date.now() > otp.expiresAt) return false
    // check code
    if ((inputCode||'').trim() !== otp.code) {
      const attemptsLeft = Math.max(0, (otp.attemptsLeft||0) - 1)
      const next = { ...otp, attemptsLeft }
      write('otp', next); set({ otp: next })
      return false
    }
    // success → sign user in
    const auth = { authed:true, userId: get().auth.userId || uid() }
    write('auth', auth)
    // clear OTP
    const cleared = { email:'', code:'', expiresAt:0, attemptsLeft:0, resendAt:0 }
    write('otp', cleared)
    set({ auth, otp: cleared })
    return true
  },

  signOut: ()=> set(()=>{
    const a = { authed:false, userId:null }; write('auth', a); return { auth:a }
  }),
  completeOnboarding:(bio, tags)=> set(s=>{
    const profile = { ...s.profile, onboarded:true, bio, tags }
    write('profile', profile); return { profile }
  }),
  setTheme:(t)=> set(s=>{ const profile={...s.profile, theme:t}; write('profile',profile); return {profile} }),

  // ---------- Core Data (pods, journal, events, townhall, matches, analytics) ----------
  pods:       read('pods',       [{ id:'p1', name:'Starter Pod', about:'Default pod', members:[], posts:[] }]),
  membership: read('membership', { podIds: [] }),
  journal:    read('journal',    []),
  events:     read('events',     [{ id:'e1', title:'Welcome Session', when: new Date(Date.now()+864e5).toISOString(), podId:null, rsvps:[] }]),
  townhall:   read('townhall',   [{ id:uid(), user:'System', msg:'Welcome to PeerLearn!', at: nowISO() }]),
  matches:    read('matches',    []),
  activity:   read('activity',   { streak:0, lastDay:today(), reviews:[], goalsDone:[] }),

  createPod:(name, about='')=> set(s=>{
    if(!name?.trim()) return {}
    const pod = { id:uid(), name:name.trim(), about:(about||'').trim(), members:[get().me()?.id], posts:[] }
    const pods=[...s.pods, pod]
    const membership={ podIds:[...new Set([...s.membership.podIds, pod.id])] }
    write('pods',pods); write('membership',membership); return { pods, membership }
  }),
  joinPod:(podId)=> set(s=>{
    const me = get().me()?.id; if(!me) return {}
    const pods = s.pods.map(p=> p.id===podId ? {...p, members:[...new Set([...(p.members||[]), me])]} : p)
    const membership={ podIds:[...new Set([...s.membership.podIds, podId])] }
    write('pods',pods); write('membership',membership); return { pods, membership }
  }),
  postInPod:(podId,msg)=> set(s=>{
    if(!msg?.trim()) return {}
    const post={ id:uid(), user:get().me()?.name||'Anon', msg:msg.trim(), at: nowISO() }
    const pods=s.pods.map(p=> p.id===podId ? {...p, posts:[post, ...(p.posts||[])]} : p)
    write('pods',pods); return { pods }
  }),

  addJournal:(text, tags=[])=> set(s=>{
    if(!text?.trim()) return {}
    const entry={ id:uid(), createdAt:nowISO(), text:text.trim(), tags }
    const journal=[entry, ...s.journal]; write('journal',journal)
    return { journal, activity:bumpDaily(s.activity, { journal:1 }) }
  }),
  deleteJournal:(id)=> set(s=>{ const journal=s.journal.filter(j=>j.id!==id); write('journal',journal); return {journal} }),

  createEvent:(title, whenISO, podId=null)=> set(s=>{
    if(!title?.trim() || !whenISO) return {}
    const e={ id:uid(), title:title.trim(), when:new Date(whenISO).toISOString(), podId, rsvps:[get().me()?.id].filter(Boolean) }
    const events=[e, ...s.events]; write('events',events); return { events }
  }),
  rsvp:(eventId, yes=true)=> set(s=>{
    const me = get().me()?.id; if(!me) return {}
    const events=s.events.map(e=> e.id!==eventId ? e : {...e, rsvps: yes ? [...new Set([...(e.rsvps||[]), me])] : (e.rsvps||[]).filter(x=>x!==me)})
    write('events',events); return { events }
  }),

  shout:(msg)=> set(s=>{
    if(!msg?.trim()) return {}
    const m={ id:uid(), user:get().me()?.name||'Anon', msg:msg.trim(), at:nowISO() }
    const townhall=[m, ...s.townhall]; write('townhall',townhall); return { townhall }
  }),

  runMatching:()=> set(s=>{
    const meId = get().me()?.id; if(!meId) return { matches:[] }
    const myBag = buildBag(s.profile.tags, s.journal.map(j=>j.text))
    const peers = new Map()
    s.pods.forEach(p => (p.members||[]).forEach(id => { if(id && id!==meId) peers.set(id, { id, name:'Peer '+id.slice(-4), tags:[], texts:[] }) }))
    const matches = [...peers.values()].map(u => ({ ...u, score: cosine(myBag, buildBag(u.tags, u.texts)) }))
                      .sort((a,b)=>b.score-a.score)
    write('matches',matches); return { matches }
  }),

  incrementStreak:()=> set(s=> ({ activity: bumpDaily(s.activity, { streakBump:1 }) })),
  recordReview:(n=1)=> set(s=> ({ activity: bumpDaily(s.activity, { reviews:n }) })),
  recordGoalDone:()=> set(s=> ({ activity: bumpDaily(s.activity, { goal:1 }) })),

  exportAll:()=>{
    const keys=['auth','profile','pods','membership','journal','events','townhall','matches','activity']
    const obj=Object.fromEntries(keys.map(k=>[k,get()[k]]))
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob); const a=document.createElement('a')
    a.href=url; a.download='peerlearn-backup.json'; a.click(); URL.revokeObjectURL(url)
  },
  importAll: async (file)=>{
    const text = await file.text(); let obj; try{ obj = JSON.parse(text) }catch{ alert('Invalid JSON'); return }
    const allowed=['auth','profile','pods','membership','journal','events','townhall','matches','activity']
    Object.keys(obj).forEach(k=> allowed.includes(k) && write(k, obj[k]))
    set(Object.fromEntries(allowed.map(k=>[k, obj[k] ?? get()[k]])))
  },
  deleteAll:()=> set(()=>{
    if(!confirm('Delete ALL local data?')) return {}
    ;['auth','profile','pods','membership','journal','events','townhall','matches','activity','otp'].forEach(k=>localStorage.removeItem(k))
    return {
      auth:{authed:false,userId:null},
      profile:{onboarded:false,name:'',bio:'',tags:[],theme:'dark',email:''},
      pods:[{ id:'p1', name:'Starter Pod', about:'Default pod', members:[], posts:[] }],
      membership:{podIds:[]}, journal:[], events:[],
      townhall:[{ id:uid(), user:'System', msg:'Reset', at: nowISO() }],
      matches:[], activity:{ streak:0, lastDay:today(), reviews:[], goalsDone:[] },
      otp:{ email:'', code:'', expiresAt:0, attemptsLeft:0, resendAt:0 }
    }
  }),
}))

// ---------- helpers ----------
function bumpDaily(activity, { streakBump=0, reviews=0, goal=0, journal=0 }){
  const d = today()
  const consecutive = activity.lastDay===d
    ? activity.streak
    : (new Date(activity.lastDay).getTime()+86400000 === new Date(d).getTime()) ? activity.streak+1 : 1
  const rec = { day:d, reviews, journal, goal }
  return { ...activity, lastDay:d, streak:consecutive + streakBump, reviews:[...activity.reviews, rec], goalsDone:[...activity.goalsDone, { day:d, n:goal }] }
}
function buildBag(tags=[], texts=[]){
  const bag=new Map(), add=(t,w=1)=> bag.set(t,(bag.get(t)||0)+w)
  tags.forEach(t=> add(t.toLowerCase(),2))
  texts.join(' ').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>2).forEach(t=>add(t,1))
  return bag
}
function cosine(a,b){
  const keys=new Set([...a.keys(),...b.keys()]); let dot=0,na=0,nb=0
  keys.forEach(k=>{ const x=a.get(k)||0, y=b.get(k)||0; dot+=x*y; na+=x*x; nb+=y*y })
  return na&&nb ? dot/(Math.sqrt(na)*Math.sqrt(nb)) : 0
}
