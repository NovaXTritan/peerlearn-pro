import React from 'react'
import BlackHoleBG from '../components/BlackHoleBG.jsx'

export default function Home() {
  return (
    <>
      <BlackHoleBG enabled={true} quality="ultra" anchor={[0.70,0.56]} influence={0.35} />
      <div style={{position:'relative', zIndex:1, color:'#fff', padding:32, fontSize:20}}>
        If you see a vivid black hole behind this text, the background is working ✅
      </div>
    </>
  )
}
