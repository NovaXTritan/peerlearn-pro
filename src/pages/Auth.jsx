import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../state/store.js'
import { toast } from '../components/Toast.jsx'

export default function Auth(){
  const nav = useNavigate()
  const requestOTP = useStore(s=>s.requestOTP)
  const verifyOTP = useStore(s=>s.verifyOTP)
  const [email, setEmail] = React.useState('')
  const [sent, setSent] = React.useState(false)
  const [code, setCode] = React.useState('')

  const send = ()=>{
    if (!email.includes('@')) return toast('Enter a valid email')
    requestOTP(email); setSent(true); toast('OTP sent (use 000000)')
  }
  const verify = ()=>{
    if (verifyOTP(code)) { toast('Signed in'); nav('/onboarding') }
    else toast('Invalid code')
  }

  return (
    <div className="grid" style={{maxWidth:420, margin:'40px auto'}}>
      <div className="card col">
        <h2>Sign in</h2>
        <p className="muted">Use your college email if possible for quick verification.</p>
        <input className="field" placeholder="you@college.edu" value={email} onChange={e=>setEmail(e.target.value)} />
        {!sent ? <button className="btn" onClick={send}>Send OTP</button> :
          <>
            <input className="field" placeholder="Enter 000000" value={code} onChange={e=>setCode(e.target.value)} />
            <button className="btn" onClick={verify}>Verify</button>
          </>
        }
      </div>
      <div className="card">
        <b>Privacy</b>
        <p className="muted">We store your state locally in your browser for this MVP. You can export/delete anytime in Settings.</p>
      </div>
    </div>
  )
}