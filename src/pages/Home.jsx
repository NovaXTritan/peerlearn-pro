import React from "react";
import BlackHoleCanvas from "../components/BlackHoleCanvas";

const Pill = ({ children }) => (
  <span className="rounded-full px-3 py-1 text-sm/6 bg-white/5 border border-white/10">
    {children}
  </span>
);

const GlassCard = ({ title, children, highlight = false }) => (
  <section
    className={[
      "rounded-xl p-5 md:p-6 backdrop-blur",
      "bg-white/5 border border-white/10",
      highlight ? "shadow-glow" : "",
    ].join(" ")}
    aria-label={title}
  >
    <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{title}</h3>
    <div className="text-slate-300 text-sm leading-6">{children}</div>
  </section>
);

export default function Home() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-space text-white">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(70%_70%_at_22%_28%,rgba(18,28,55,0.55),rgba(8,14,26,0.98))]" />
      <BlackHoleCanvas className="-z-10" center={[0.62, 0.35]} />

      {/* Keep ONLY ONE nav in the app. If you already have a global header, remove this block. */}
      <nav className="max-w-7xl mx-auto px-6 md:px-8 pt-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-md">
          <span className="text-xl">🚀</span>
          <span className="font-semibold tracking-tight">PeerLearn</span>
        </a>
        <ul className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          <li><a href="#" className="hover:text-white">Home</a></li>
          <li><a href="#" className="hover:text-white">Pods</a></li>
          <li><a href="#" className="hover:text-white">Matches</a></li>
          <li><a href="#" className="hover:text-white">Journal</a></li>
          <li><a href="#" className="hover:text-white">Events</a></li>
          <li><a href="#" className="hover:text-white">Analytics</a></li>
          <li><a href="#" className="hover:text-white">Profile</a></li>
          <li><a href="#" className="hover:text-white">Settings</a></li>
          <li><button className="rounded-lg bg-white/10 hover:bg-white/15 px-3.5 py-2 border border-white/10 focus-visible:ring-2 focus-visible:ring-white/60">Sign out</button></li>
        </ul>
      </nav>

      <section className="relative max-w-7xl mx-auto px-6 md:px-8 pt-14 md:pt-16 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
              Turn intent into progress —<br className="hidden md:block" />
              join pods, ship tiny proofs,<br className="hidden md:block" />
              grow together.
            </h1>
            <p className="mt-6 text-slate-300 max-w-xl">
              PeerLearn makes self-learning social and credible. Pick a pod—do 2
              minute daily actions, and share proof of work to earn feedback and
              momentum.
            </p>
            <div className="mt-7 flex items-center gap-4">
              <button className="rounded-xl px-5 py-3 bg-[#2a60ff] hover:bg-[#2a60ff]/90 font-semibold border border-white/10 focus-visible:ring-2 focus-visible:ring-white/60">
                Explore Pods
              </button>
              <button className="rounded-xl px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/10 focus-visible:ring-2 focus-visible:ring-white/60">
                Find Peers
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <GlassCard title="Guided Next Steps" highlight>Join 2 Pods based on your goal</GlassCard>
              <GlassCard title="Gicced Next Steps">Join 2 Pods based on your goal<br/>Send 1 warm intro<br/>RSVP to 1 event</GlassCard>

              <GlassCard title="Retrieval Check (1 min)">
                Spacing effect primarily improves…
                <div className="mt-3 space-y-2">
                  <Pill>Short-term cramming</Pill>
                  <Pill>Long-term retention</Pill>
                  <Pill>Note neatness</Pill>
                  <Pill>Reading speed</Pill>
                </div>
              </GlassCard>

              <GlassCard title="If-Then Habit">
                Two tiny cue–linked actions to stay consistent.
                <div className="mt-3 flex gap-3">
                  <button className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 border border-white/10 focus-visible:ring-2 focus-visible:ring-white/60">Start 2 min</button>
                  <button className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 border border-white/10 focus-visible:ring-2 focus-visible:ring-white/60">Freeze</button>
                </div>
              </GlassCard>

              <GlassCard title="Proof & Feedback">Earn likes, warm-intros, critiques.</GlassCard>

              <GlassCard title="Mood Label">
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill>Calm</Pill><Pill>Focused</Pill><Pill>Stressed</Pill>
                  <Pill>Anxious</Pill><Pill>Happy</Pill><Pill>Tired</Pill>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
