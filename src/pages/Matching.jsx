import React from 'react'
import { useStore } from '../state/store.js'
import { toast } from '../components/Toast.jsx'

export default function Matching(){
  const compute = useStore(s=>s.computeMatches)
  const suggested = useStore(s=>s.matches.suggested)
  const crews = useStore(s=>s.matches.crews)

  React.useEffect(()=>{ compute() },[])

  const warmIntro = (name)=> toast(`Intro template sent to ${name}`)

  return (
    <div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="col">
        <div className="card">
          <h2>Gravity Match</h2>
          <p className="muted">1:1 peers and small crews based on shared goals/skills/availability.</p>
          <h3>People for you</h3>
          {suggested.length===0 && <div className="muted">No suggestions yet.</div>}
          {suggested.map(p=>(
            <div key={p.name} className="row" style={{justifyContent:'space-between', borderBottom:'1px solid #222', padding:'8px 0'}}>
              <div><b>{p.name}</b> <span className="muted">· score {p.score}</span></div>
              <div className="row">
                <button className="btn" onClick={()=>warmIntro(p.name)}>Warm intro</button>
                <button className="btn secondary">DM in app</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="col">
        <div className="card">
          <h3>Crews</h3>
          {crews.map((c,i)=>(<div key={i} className="pill">{c.join(' · ')}</div>))}
        </div>
        <div className="card">
          <h3>Why this match?</h3>
          <p className="muted">Shared skills & goals, plus overlapping availability.</p>
        </div>
      </div>
    </div>
  )
}