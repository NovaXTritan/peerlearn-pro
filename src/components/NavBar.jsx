import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../state/store.js'

const tabs = [
  {to:'/', label:'Home'},
  {to:'/pods', label:'Pods'},
  {to:'/matching', label:'Matches'},
  {to:'/journal', label:'Journal'},
  {to:'/events', label:'Events'},
  {to:'/townhall', label:'Townhall'},
  {to:'/analytics', label:'Analytics'},
  {to:'/search', label:'Search'},
  {to:'/profile', label:'Profile'},
    {to:'/settings', label:'Settings'},
]

export function NavBar(){
  const location = useLocation()
  const authed = useStore(s=>s.auth.authed)
  const signOut = useStore(s=>s.signOut)
  return (
    <div style={{position:'sticky', top:0, zIndex:10, background:'#0b0b0c', borderBottom:'1px solid #222'}}>
      <div style={{maxWidth:1100, margin:'0 auto', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div className="row">
          <Link to="/" style={{fontWeight:600}}>NovaXTritan</Link>
          {authed && <span className="muted">The unexamined life is not worth living</span>}
        </div>
        <div className="row" style={{flexWrap:'wrap', gap:8}}>
          {authed && tabs.map(t=>{
            const active = location.pathname===t.to
            return <Link key={t.to} to={t.to} className="pill" style={{background: active?'#1a1b1f':'transparent'}}>{t.label}</Link>
          })}
          {!authed ? <Link to="/auth" className="btn">Sign in</Link> : <button className="btn secondary" onClick={signOut}>Sign out</button>}
        </div>
      </div>
    </div>
  )
}
