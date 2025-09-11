import BlackHoleBG from '../components/BlackHoleBG.jsx'
import React from 'react'
import { useStore } from '../state/store.js'
import { toast } from '../components/Toast.jsx'

const QUESTIONS = [
  {q:'Spacing effect primarily improves…', options:['Short-term cramming','Long-term retention','Note neatness','Reading speed'], a:1},
  {q:'Interleaving is…', options:['Blocking one topic','Mixing related problem types','Random guessing','Highlighting notes'], a:1},
]

export default function Home(){
  const analytics = useStore(s=>s.analytics)
  const markActive = useStore(s=>s.markActive)
  const toggleFreeze = useStore(s=>s.toggleFreeze)

  const [qIdx,setQIdx] = React.useState(0)
  const q = QUESTIONS[qIdx % QUESTIONS.length]
  const [sel, setSel] = React.useState(null)
  const [answered, setAnswered] = React.useState(false)

  const answer = (i)=>{
    if (answered) return
    setSel(i); setAnswered(true); markActive()
    toast(i===q.a ? 'Nice recall!' : 'Good try — effortful recall works.')
  }

  return (
    <div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="col">
        <div className="card">
          <h3>Retrieval Check (1 min)</h3>
          <div style={{margin:'8px 0'}}>{q.q}</div>
          {q.options.map((o,i)=>(
            <button key={i} className="btn secondary" style={{display:'block', width:'100%', textAlign:'left', marginTop:6, borderColor: answered ? (i===q.a?'#17a34a': (i===sel ? '#dc2626':'#333')) : '#333'}} onClick={()=>answer(i)}>{o}</button>
          ))}
          {answered && <button className="btn" style={{marginTop:10}} onClick={()=>{ setAnswered(false); setSel(null); setQIdx(qIdx+1)}}>Next</button>}
        </div>

        <div className="card">
          <h3>If‑Then Habit</h3>
          <p className="muted">Two tiny, cue‑linked actions to stay consistent.</p>
          <div className="row">
            <button className="btn" onClick={()=>{ markActive(); toast('2‑min starter complete')}}>Start 2‑min</button>
            <button className="btn secondary" onClick={toggleFreeze}>{analytics.freezeArmed ? 'Freeze armed' : 'Arm Freeze'}</button>
            <div className="pill">Streak: <b>{analytics.streak}</b></div>
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card">
          <h3>Guided Next Steps</h3>
          <ul className="muted">
            <li>Join 2 Pods based on your goal</li>
            <li>Send 1 warm intro</li>
            <li>RSVP to 1 event</li>
          </ul>
        </div>
        <div className="card">
          <h3>Mood Label</h3>
          <MoodQuick/>
        </div>
      </div>
    </div>
  )
}

function MoodQuick(){
  const [label,setLabel] = React.useState('')
  const [note,setNote] = React.useState('')
  const markActive = useStore(s=>s.markActive)
  return (
    <div className="col">
      <div className="row">
        {['Calm','Focused','Stressed','Anxious','Happy','Tired'].map(m=>(
          <button key={m} className="chip" onClick={()=>setLabel(m)}>{m}</button>
        ))}
      </div>
      <input className="field" placeholder="One-line note (optional)" value={note} onChange={e=>setNote(e.target.value)} />
      <button className="btn" onClick={()=>{ if(!label) return; markActive(); }}>{label ? 'Save' : 'Pick a mood'}</button>
    </div>
  )
}
<>
  <BlackHoleBG enabled={true} quality="ultra" />
  {/* Your existing content */}
  <main style={{ position:'relative', zIndex:1, minHeight:'100svh', display:'grid', placeItems:'center', padding:'24px' }}>
    {/* glass card / hero / buttons etc. */}
  </main>
</>
