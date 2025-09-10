import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../state/store.js'
import { toast } from '../components/Toast.jsx'

export default function Onboarding(){
  const nav = useNavigate()
  const complete = useStore(s=>s.completeOnboarding)
  const [name,setName] = React.useState('')
  const [college,setCollege] = React.useState('')
  const [gradYear,setGradYear] = React.useState('2027')
  const [goals,setGoals] = React.useState(['Product Management'])
  const [skills,setSkills] = React.useState(['SQL','Excel'])
  const [availability,setAvailability] = React.useState('Tue 7–8pm IST')

  const finish = ()=>{
    complete({ name, college, gradYear, goals, skills, availability })
    toast('Welcome!'); nav('/')
  }

  return (
    <div className="grid" style={{maxWidth:720, margin:'20px auto'}}>
      <div className="card">
        <h2>Quick setup (60 seconds)</h2>
        <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
          <div className="col">
            <label>Name<input className="field" value={name} onChange={e=>setName(e.target.value)}/></label>
            <label>College<input className="field" value={college} onChange={e=>setCollege(e.target.value)}/></label>
            <label>Grad Year<input className="field" value={gradYear} onChange={e=>setGradYear(e.target.value)}/></label>
          </div>
          <div className="col">
            <label>Primary goal<input className="field" value={goals[0]} onChange={e=>setGoals([e.target.value])}/></label>
            <label>Skills (comma separated)<input className="field" value={skills.join(', ')} onChange={e=>setSkills(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}/></label>
            <label>Availability<input className="field" value={availability} onChange={e=>setAvailability(e.target.value)}/></label>
          </div>
        </div>
        <div className="row" style={{justifyContent:'space-between'}}>
          <div className="muted">What you get next: Pod suggestions · 2 intros · 1 event</div>
          <button className="btn" onClick={finish}>Finish setup</button>
        </div>
      </div>
    </div>
  )
}