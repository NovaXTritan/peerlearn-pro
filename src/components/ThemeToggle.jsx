import React from 'react'
import { useStore } from '../state/store.js'
import { THEMES, applyTheme } from '../utils/theme.js'

export function ThemeToggle(){
  const theme = useStore(s=>s.profile.theme)
  const setTheme = (t)=> useStore.setState(s=>({ profile:{...s.profile, theme:t} }))
  const cycle = ()=> setTheme(THEMES[(THEMES.indexOf(theme)+1)%THEMES.length])
  React.useEffect(()=>applyTheme(theme), [theme])
  return <button className="btn" onClick={cycle} title="Theme">{theme} ⟳</button>
}
