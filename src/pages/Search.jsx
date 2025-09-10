import React from 'react'
import { useStore } from '../state/store.js'

export default function Search(){
  const state = useStore(s=>s)
  const [q,setQ] = React.useState('')
  const pods = state.pods.all.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()))
  const posts = [...state.townhall, ...state.pods.all.flatMap(p=>p.feed.map(f=>({...f, pod:p.name})))].filter(x=>(x.text||'').toLowerCase().includes(q.toLowerCase()))
  const people = [{name: state.profile.name, headline: state.profile.headline}].filter(p=> (p.name||'').toLowerCase().includes(q.toLowerCase()) || (p.headline||'').toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="card">
      <h2>Search</h2>
      <input className="field" placeholder="People, pods, posts…" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
        <div>
          <h3>Pods</h3>
          {pods.map(p=>(<div key={p.id} className="pill">{p.name}</div>))}
        </div>
        <div>
          <h3>Posts</h3>
          {posts.map((p,i)=>(<div key={i}><span className="pill">{p.pod || 'Townhall'}</span> {p.text}</div>))}
        </div>
        <div>
          <h3>People</h3>
          {people.map((p,i)=>(<div key={i}><b>{p.name}</b> <span className="muted">· {p.headline}</span></div>))}
        </div>
      </div>
    </div>
  )
}