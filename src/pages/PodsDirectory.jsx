import React from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../state/store.js'

export default function PodsDirectory(){
  const pods = useStore(s=>s.pods.all)
  const joined = useStore(s=>s.pods.joined)
  const joinPod = useStore(s=>s.joinPod)
  return (
    <div className="grid" style={{gridTemplateColumns:'1fr'}}>
      <div className="card">
        <h2>Pods Directory</h2>
        <p className="muted">Join 2 to get started. Activity shows posts/week.</p>
        <table className="table">
          <thead><tr><th>Pod</th><th>Activity</th><th>Events</th><th>Mentors</th><th>Join</th></tr></thead>
          <tbody>
            {pods.map(p=>(
              <tr key={p.id}>
                <td><Link to={`/pod/${p.id}`}>{p.name}</Link></td>
                <td>{p.activity}</td>
                <td>{p.events}</td>
                <td>{p.mentors.join(', ')}</td>
                <td>{joined.includes(p.id) ? <span className="pill">Joined</span> : <button className="btn" onClick={()=>joinPod(p.id)}>Join</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}