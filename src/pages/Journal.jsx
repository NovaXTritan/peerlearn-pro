import React from 'react'
import { useStore } from '../state/store.js'
import { toast } from '../components/Toast.jsx'

function redactNames(text){ return (text||'').replace(/\b([A-Z][a-zA-Z]{1,})\b/g, m => m.length>1? m[0]+'.' : m) }

export default function Journal(){
  const add = useStore(s=>s.addJournal)
  const list = useStore(s=>s.journal)
  const privacy = useStore(s=>s.profile.privacy)
  const [label,setLabel] = React.useState('Calm')
  const [note,setNote] = React.useState('')
  const [insight,setInsight] = React.useState('')
  const [share,setShare] = React.useState(false)

  const save = ()=>{
    add({ date: new Date().toISOString().slice(0,10), mood: label, note, insight, sharedSummary: share })
    setNote(''); setInsight(''); toast('Journal saved'); 
  }

  return (
    <div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="col">
        <div className="card">
          <h2>Journal</h2>
          <div className="row" style={{flexWrap:'wrap'}}>
            {['Calm','Focused','Stressed','Anxious','Happy','Tired'].map(m=>(<button key={m} className="chip" onClick={()=>setLabel(m)}>{m}</button>))}
          </div>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
            <textarea className="field" rows="6" placeholder="One‑paragraph note (optional)" value={note} onChange={e=>setNote(e.target.value)} />
            <textarea className="field" rows="6" placeholder="One‑sentence truth for tomorrow (insight)" value={insight} onChange={e=>setInsight(e.target.value)} />
          </div>
          <div className="row" style={{justifyContent:'space-between'}}>
            <label className="row"><input type="checkbox" checked={share} onChange={e=>setShare(e.target.checked)} /> Share summary (names redacted)</label>
            <button className="btn" onClick={save}>Save entry</button>
          </div>
        </div>
        <div className="card">
          <h3>Your entries</h3>
          {list.map(j=>(
            <div key={j.id} style={{borderBottom:'1px solid #222', padding:'6px 0'}}>
              <div className="muted">{j.date} · {j.mood} {j.sharedSummary && <span className="pill">Shared</span>}</div>
              <div>{j.note}</div>
              <div><b>Insight:</b> {j.insight}</div>
              {j.sharedSummary && <div className="muted">Shared summary: {redactNames((j.note||'').slice(0,140))}{j.note&&j.note.length>140?'…':''}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="col">
        <div className="card">
          <h3>Privacy</h3>
          <ul className="muted">
            <li>Private by default</li>
            <li>Summary sharing only with consent</li>
            <li>Names auto‑redacted</li>
          </ul>
        </div>
      </div>
    </div>
  )
}