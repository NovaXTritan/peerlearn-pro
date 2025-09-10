import React from 'react'
import { useStore } from '../state/store.js'

export default function Settings(){
  const state = useStore(s=>s)
  const exportJSON = ()=>{
    const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='peerlearn-state.json'; a.click(); URL.revokeObjectURL(url)
  }
  const clearAll = ()=>{
    if (!confirm('Delete all local data?')) return
    localStorage.removeItem('peerlearn-pro-state'); location.reload()
  }
  return (
    <div className="grid" style={{gridTemplateColumns:'1fr'}}>
      <div className="card">
        <h2>Settings & Data</h2>
        <div className="row">
          <button className="btn" onClick={exportJSON}>Export JSON</button>
          <button className="btn" style={{background:'#ef4444', color:'#fff'}} onClick={clearAll}>Delete all</button>
        </div>
      </div>
    </div>
  )
}