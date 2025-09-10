import React from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../state/store.js'
import { toast } from '../components/Toast.jsx'

export default function PodHome(){
  const { id } = useParams()
  const pods = useStore(s=>s.pods.all)
  const postToPod = useStore(s=>s.postToPod)
  const pod = pods.find(p=>p.id===id) || pods[0]

  const [text,setText] = React.useState('')
  const add = (type)=>{ 
    if (!text.trim()) return;
    postToPod(pod.id, { type, by:'You', text: text.trim(), ts: Date.now() }); setText(''); toast(type==='pledge'?'Pledge posted':'Proof posted')
  }

  if (!pod) return <div className="card">Pod not found.</div>

  return (
    <div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="col">
        <div className="card">
          <h2>{pod.name}</h2>
          <p className="muted">Rules: {pod.rules}</p>
          <div className="row">
            <input className="field" placeholder="Write a pledge/proof…" value={text} onChange={e=>setText(e.target.value)}/>
            <button className="btn" onClick={()=>add('pledge')}>Pledge</button>
            <button className="btn" onClick={()=>add('proof')}>Proof</button>
          </div>
        </div>
        <div className="card">
          <h3>Pledges & Proofs</h3>
          <div className="col">
            {pod.feed.slice().reverse().map(f=>(
              <div key={f.id} className="row" style={{justifyContent:'space-between', borderBottom:'1px solid #222', padding:'6px 0'}}>
                <div><b>{f.by}</b> · <span className="pill">{f.type}</span><div>{f.text}</div></div>
                <div className="muted">{new Date(f.ts).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card">
          <h3>Members</h3>
          <div className="muted">Member list and roles (Driver, Buddy, Scribe) rotate weekly.</div>
        </div>
        <div className="card">
          <h3>Study Circles</h3>
          <div className="muted">Sign-up for small accountability crews (3–5).</div>
        </div>
      </div>
    </div>
  )
}