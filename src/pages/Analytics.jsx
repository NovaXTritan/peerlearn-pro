import React from 'react'
import { useStore } from '../state/store.js'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'

export default function Analytics(){
  const a = useStore(s=>s.analytics)
  const pods = useStore(s=>s.pods)

  const retrievalData = [...Array(14)].map((_,i)=>{
    const day = new Date(Date.now()- (13-i)*86400000).toISOString().slice(5,10)
    return { day, acc: Math.floor(Math.random()*40+40) }
  })
  const habitData = pods.all.slice(0,5).map(p=>({ name: p.name.split(' ')[0], strength: Math.floor(Math.random()*50+30) }))

  return (
    <div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="col">
        <div className="card">
          <h3>Retrieval accuracy (last 14 days)</h3>
          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retrievalData} margin={{top:10,right:10,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" /><YAxis domain={[0,100]} /><Tooltip />
                <Line type="monotone" dataKey="acc" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3>Habit strength (estimate)</h3>
          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" /><YAxis domain={[0,100]} /><Tooltip />
                <Bar dataKey="strength" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card">
          <h3>Consistency</h3>
          <div style={{fontSize:28, fontWeight:700}}>{a.streak} days</div>
          <div className="muted">Freeze {a.freezeArmed ? 'armed' : (a.freezeUsedThisWeek ? 'used' : 'available')}</div>
        </div>
      </div>
    </div>
  )
}