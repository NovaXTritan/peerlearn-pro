import React from 'react'
import { useStore } from '../state/store.js'

export function ThemeToggle(){
  const theme = useStore(s=>s.profile.theme)
  const setTheme = (t)=> useStore.setState(s=>({profile:{...s.profile, theme:t}})) // shallow
  const cycle = ()=>{
    const seq = ['dark','light','gradient','cosmos']
    setTheme(seq[(seq.indexOf(theme)+1)%seq.length])
  }
  React.useEffect(()=>{
    // minimal visual differences
    document.body.style.background = theme==='light' ? '#f6f6f7' : '#0b0b0c'
  },[theme])
  return <button className="btn" onClick={cycle} title="Theme">{theme} ⟳</button>
}