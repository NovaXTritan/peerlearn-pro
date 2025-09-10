import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/theme.css'
import { useStore } from './state/store.js'
import { applyTheme } from './utils/theme.js'

function Root(){
  // apply theme at startup and whenever it changes
  const theme = useStore(s=>s.profile.theme)
  React.useEffect(()=>applyTheme(theme), [theme])
  return <HashRouter><App/></HashRouter>
}

createRoot(document.getElementById('root')).render(<Root/>)
