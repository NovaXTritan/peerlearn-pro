import React from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './state/store.js'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import Onboarding from './pages/Onboarding.jsx'
import PodsDirectory from './pages/PodsDirectory.jsx'
import PodHome from './pages/PodHome.jsx'
import Journal from './pages/Journal.jsx'
import Matching from './pages/Matching.jsx'
import Townhall from './pages/Townhall.jsx'
import Events from './pages/Events.jsx'
import Analytics from './pages/Analytics.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Search from './pages/Search.jsx'
import { NavBar } from './components/NavBar.jsx'
import { ToastHost } from './components/Toast.jsx'
import { ThemeToggle } from './components/ThemeToggle.jsx'

export default function App(){
  const location = useLocation()
  const authed = useStore(s=>s.auth.authed)
  const needsOnboarding = useStore(s=>s.auth.authed && !s.profile.onboarded)

  return (
    <div>
      <NavBar />
      <div style={{maxWidth: 1100, margin: '20px auto', padding: '0 16px'}}>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}}>
            <Routes location={location}>
              <Route path="/" element={authed ? <Home/> : <Navigate to="/auth" replace/>} />
              <Route path="/auth" element={<Auth/>} />
              <Route path="/onboarding" element={authed ? <Onboarding/> : <Navigate to="/auth" replace/>} />
              <Route path="/pods" element={authed ? <PodsDirectory/> : <Navigate to="/auth" replace/>} />
              <Route path="/pod/:id" element={authed ? <PodHome/> : <Navigate to="/auth" replace/>} />
              <Route path="/journal" element={authed ? <Journal/> : <Navigate to="/auth" replace/>} />
              <Route path="/matching" element={authed ? <Matching/> : <Navigate to="/auth" replace/>} />
              <Route path="/townhall" element={authed ? <Townhall/> : <Navigate to="/auth" replace/>} />
              <Route path="/events" element={authed ? <Events/> : <Navigate to="/auth" replace/>} />
              <Route path="/analytics" element={authed ? <Analytics/> : <Navigate to="/auth" replace/>} />
              <Route path="/profile" element={authed ? <Profile/> : <Navigate to="/auth" replace/>} />
              <Route path="/search" element={authed ? <Search/> : <Navigate to="/auth" replace/>} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{position:'fixed', right: 14, bottom: 14}}><ThemeToggle/></div>
      <ToastHost/>
    </div>
  )
}