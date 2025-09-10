import React from 'react'
import { useStore } from '../state/store.js'
import { toast } from '../components/Toast.jsx'

export default function Townhall(){
  const posts = useStore(s=>s.townhall)
  const [text,setText] = React.useState('')
  const addPost = ()=>{
    if (!text.trim()) return
    useStore.setState(s=>({ townhall:[...s.townhall, {id:'t'+Date.now(), type:'announcement', author:'You', text:text.trim(), ts: Date.now()}] }))
    setText(''); toast('Posted to Townhall')
  }
  return (
    <div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="card">
        <h2>Townhall</h2>
        <div className="row">
          <input className="field" placeholder="Announcement / Opportunity / Win" value={text} onChange={e=>setText(e.target.value)} />
          <button className="btn" onClick={addPost}>Post</button>
        </div>
        <div className="col" style={{marginTop:12}}>
          {posts.slice().reverse().map(p=>(
            <div key={p.id} style={{borderBottom:'1px solid #222', padding:'8px 0'}}>
              <div><b>{p.author}</b> <span className="pill">{p.type}</span></div>
              <div>{p.text}</div>
              <div className="muted">{new Date(p.ts).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Moderator tools</h3>
        <ul className="muted">
          <li>Pin, archive, report (MVP: placeholders)</li>
          <li>Weekly recap digest</li>
        </ul>
      </div>
    </div>
  )
}