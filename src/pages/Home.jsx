import React from 'react'
import BlackHoleBG from '../components/BlackHoleBG.jsx'
import { useStore } from '../state/store.js'
import { toast } from '../components/Toast.jsx'

export default function Home(){
  const analytics  = useStore(s=>s.analytics)
  const markActive = useStore(s=>s.markActive)

  return (
    <>
      <BlackHoleBG enabled={true} quality="ultra" anchor={[0.70,0.56]} influence={0.35} />

      {/* HERO OVERLAY */}
      <main style={{
        position:'relative', zIndex:1, minHeight:'100svh',
        display:'grid', alignContent:'center'
      }}>
        <section style={{maxWidth:1200, margin:'0 auto', padding:'24px'}}>
          <div style={{
            display:'grid',
            gridTemplateColumns:'minmax(0, 560px) 1fr',
            gap:24,
          }}>
            {/* Left: headline + CTAs */}
            <div className="card" style={{
              background:'rgba(12,12,20,.58)',
              border:'1px solid rgba(255,255,255,.10)',
              backdropFilter:'saturate(140%) blur(10px)',
              padding:'28px', borderRadius:24
            }}>
              <h1 style={{margin:'0 0 10px', fontSize:'clamp(30px,3.2vw + 10px,54px)', lineHeight:1.1}}>
                Turn intent into progress — join pods, ship tiny proofs, grow together.
              </h1>
              <p className="muted" style={{margin:'6px 0 16px', fontSize:16}}>
                PeerLearn makes self-learning social and credible. Start with a 2-minute action, share proof, earn feedback.
              </p>
              <div className="row" style={{gap:10, flexWrap:'wrap'}}>
                <a className="btn" href="#/pods">Explore Pods</a>
                <a className="btn secondary" href="#/matches">Find Peers</a>
                <a className="btn secondary" href="#/events">Upcoming events</a>
                <span className="pill">Streak: <b>{analytics?.streak ?? 0}</b></span>
              </div>
            </div>

            {/* Right side left intentionally empty so BH shows fully */}
            <div />
          </div>
        </section>

        {/* OPTIONAL: keep your functional cards below the hero */}
        <section style={{maxWidth:1100, margin:'0 auto 56px', padding:'0 24px'}}>
          {/* move your Retrieval / Habit / Mood / Next steps grid here if desired */}
        </section>
      </main>
    </>
  )
}
