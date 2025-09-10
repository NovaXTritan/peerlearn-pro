import React from 'react'
import { useStore } from '../state/store.js'
import { makeICS } from '../utils/ics.js'

export default function Events(){
  const events = useStore(s=>s.events)
  const rsvp = useStore(s=>s.rsvp)
  return (
    <div className="card">
      <h2>Events</h2>
      <table className="table">
        <thead><tr><th>Title</th><th>When</th><th>Host</th><th>Pod</th><th>RSVP</th><th>Calendar</th></tr></thead>
        <tbody>
          {events.map(e=>(
            <tr key={e.id}>
              <td>{e.title}</td>
              <td>{new Date(e.ts).toLocaleString()}</td>
              <td>{e.host}</td>
              <td>{e.pod}</td>
              <td><button className="btn" onClick={()=>rsvp(e.id)}>RSVP ({e.rsvps||0})</button></td>
              <td><button className="btn secondary" onClick={()=>makeICS({title:e.title, startTs:e.ts, description:`${e.host} · ${e.pod}`})}>.ics</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}