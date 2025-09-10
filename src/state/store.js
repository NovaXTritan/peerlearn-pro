import { create } from 'zustand'

const read = (k, v)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? v } catch{ return v } }
const write = (k,v)=> localStorage.setItem(k, JSON.stringify(v))

const uid = () => Math.random().toString(36).slice(2)
const now = () => new Date().toISOString()
const todayStr = () => new Date().toDateString()

export const useStore = create((set, get)=>({
  // --- profile/auth ---
  auth: read('auth', { authed:false, userId:null }),
  profile: read('profile', { onboarded:false, name:'', bio:'', tags:['react','finance'], theme:'dark' }),

  // --- data ---
  pods: read('pods', [{ id:'p1', name:'Starter Pod', about:'Default pod', members:[], posts:[] }]),
  membership: read('membership', { podIds: [] }),
  journal: read('journal', []),
  events: read('events', [ { id:'e1', title:'Welcome Session', when: new Date(Date.now()+864e5).toISOString(), podId:null, rsvps:[] } ]),
  townhall: read('townhall', [ { id: uid(), user:'System', msg:'Welcome to PeerLearn!', at: now() } ]),
  matches: read('matches', []),
  activity: read('activity', { streak:0, lastDay: todayStr(), reviews:[], goalsDone:[] }),

  // helpers
  me(){ const {auth, profile} = get(); return auth.authed ? { id: auth.userId, name: profile.name || 'You' } : null },

  // --- Auth / Onboarding
  signIn:(name='Guest')=> set(s=>{
    const auth = { authed:true, userId: s.auth.userId || uid() }
    const profile = { ...s.profile, name }
    write('auth', auth); write('profile', profile)
    return { auth, profile }
  }),
  signOut: ()=> set(()=>{ const a={authed:false, userId:null}; write('auth',a); return {auth:a} }),
  completeOnboarding:(bio, tags)=> set(s=>{
    const profile = { ...s.profile, onboarded:true, bio, tags }
    write('profile', profile); return { profile }
  }),
  setTheme:(t)=> set(s=>{ const profile={...s.profile, theme:t}; write('profile',profile); return {profile} }),

  // --- Pods
  createPod:(name, about='')=> set(s=>{
    if(!name?.trim()) return {}
    const pod = { id: uid(), name: name.trim(), about: (about||'').trim(), members:[get().me()?.id], posts:[] }
    const pods = [...s.pods, pod]
    const membership = { podIds:[...new Set([...s.membership.podIds, pod.id])] }
    write('pods', pods); write('membership', membership)
    return { pods, membership }
  }),
  joinPod:(podId)=> set(s=>{
    const me = get().me()?.id; if(!me) return {}
    const pods = s.pods.map(p => p.id===podId ? {...p, members:[...new Set([...(p.members||[]), me])]} : p)
    const membership = { podIds:[...new Set([...s.membership.podIds, podId])] }
    write('pods', pods); write('membership', membership)
    return { pods, membership }
  }),
  postInPod:(podId, msg)=> set(s=>{
    if(!msg?.trim()) return {}
    const post = { id: uid(), user:get().me()?.name||'Anon', msg:msg.trim(), at: now() }
    const pods = s.pods.map(p => p.id===podId ? {...p, posts:[post, ...(p.posts||[])]} : p)
    write('pods', pods); return { pods }
  }),

  // --- Journal
  addJournal:(text, tags=[])=> set(s=>{
    if(!text?.trim()) return {}
    const entry = { id: uid(), createdAt: now(), text: text.trim(), tags }
    const journal = [entry, ...s.journal]; write('journal', journal)
    return { journal, activity: bumpDaily(s.activity, { reviews:0, goal:0, journal:1 }) }
  }),
  deleteJournal:(id)=> set(s=>{ const journal=s.journal.filter(j=>j.id!==id); write('journal',journal); return {journal} }),

  // --- Events
  createEvent:(title, whenISO, podId=null)=> set(s=>{
    if(!title?.trim() || !whenISO) return {}
    const e = { id: uid(), title:title.trim(), when: new Date(whenISO).toISOString(), podId, rsvps: [get().me()?.id].filter(Boolean) }
    const events = [e, ...s.events]; write('events', events); return { events }
  }),
  rsvp:(eventId, yes=true)=> set(s=>{
    const me = get().me()?.id; if(!me) return {}
    const events = s.events.map(e => e.id!==eventId ? e : ({...e, rsvps: yes ? [...new Set([...(e.rsvps||[]), me])] : (e.rsvps||[]).filter(x=>x!==me)}))
    write('events', events); return { events }
  }),

  // --- Townhall
  shout:(msg)=> set(s=>{
    if(!msg?.trim()) return {}
    const m = { id: uid(), user:get().me()?.name||'Anon', msg:msg.trim(), at: now() }
    const townhall = [m, ...s.townhall]; write('townhall', townhall); return { townhall }
  }),

  // --- Matching (tags + journal bag-of-words simple score)
  runMatching:()=> set(s=>{
    const me = get().me()?.id; if(!me) return { matches: [] }
    const myBag = buildBag(s.profile.tags, s.journal.map(j=>j.text))
    const peers = new Map()
    // derive peers by scanning pod members
    s.pods.forEach(p => (p.members||[]).forEach(id => { if(id && id!==me) peers.set(id, { id, name:'Peer '+id.slice(-4), tags:[], texts:[] }) }))
    // (if you later persist other users, fill their tags/texts similarly)
    const matches = [...peers.values()].map(u=>{
      const score = cosine(myBag, buildBag(u.tags, u.texts))
      return {...u, score}
    }).sort((a,b)=>b.score-a.score)
    write('matches', matches); return { matches }
  }),

  // --- Analytics
  incrementStreak:()=> set(s => ({ activity: bumpDaily(s.activity, { streakBump:1 }) })),
  recordReview:(n=1)=> set(s => ({ activity: bumpDaily(s.activity, { reviews:n }) })),
  recordGoalDone:()=> set(s => ({ activity: bumpDaily(s.activity, { goal:1 }) })),

  // --- Settings
  exportAll:()=>{
    const keys=['auth','profile','pods','membership','journal','events','townhall','matches','activity']
    const obj=Object.fromEntries(keys.map(k=>[k,get()[k]]))
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob); const a=document.createElement('a')
    a.href=url; a.download='peerlearn-backup.json'; a.click(); URL.revokeObjectURL(url)
  },
  importAll: async (file)=>{
    const text = await file.text()
    let obj; try{ obj=JSON.parse(text) } catch{ alert('Invalid JSON'); return }
    const allowed=['auth','profile','pods','membership','journal','events','townhall','matches','activity']
    Object.keys(obj).forEach(k=> allowed.includes(k) && write(k, obj[k]))
    set(Object.fromEntries(allowed.map(k=>[k, obj[k] ?? get()[k]])))
  },
  deleteAll:()=> set(()=>{
    if(!confirm('Delete ALL local data? This cannot be undone.')) return {}
    ['auth','profile','pods','membership','journal','events','townhall','matches','activity'].forEach(k=>localStorage.removeItem(k))
    return {
      auth:{authed:false,userId:null},
      profile:{onboarded:false,name:'',bio:'',tags:[],theme:'dark'},
      pods:[{ id:'p1', name:'Starter Pod', about:'Default pod', members:[], posts:[] }],
      membership:{podIds:[]}, journal:[], events:[], townhall:[{id:uid(),user:'System',msg:'Reset',at:now()}],
      matches:[], activity:{streak:0,lastDay:todayStr(),reviews:[],goalsDone:[]}
    }
  }),
}))

// --- helpers
function bumpDaily(activity, { streakBump=0, reviews=0, goal=0, journal=0 }){
  const today = todayStr()
  const consecutive = activity.lastDay===today ? activity.streak
    : (new Date(activity.lastDay).getTime()+86400000 === new Date(today).getTime()) ? activity.streak+1 : 1
  const rec = { day: today, reviews, journal, goal }
  return { ...activity, lastDay: today, streak: consecutive + streakBump, reviews:[...activity.reviews, rec], goalsDone:[...activity.goalsDone, { day: today, n: goal }] }
}
function buildBag(tags=[], texts=[]){
  const bag=new Map()
  const add=(t,w=1)=> bag.set(t, (bag.get(t)||0)+w)
  tags.forEach(t=> add(t.toLowerCase(), 2))
  texts.join(' ').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>2).forEach(t=>add(t,1))
  return bag
}
function cosine(a,b){
  const keys=new Set([...a.keys(),...b.keys()])
  let dot=0,na=0,nb=0
  keys.forEach(k=>{ const x=a.get(k)||0, y=b.get(k)||0; dot+=x*y; na+=x*x; nb+=y*y })
  return na&&nb ? dot/(Math.sqrt(na)*Math.sqrt(nb)) : 0
}
