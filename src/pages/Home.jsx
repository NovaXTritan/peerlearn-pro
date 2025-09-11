// src/components/BlackHoleBG.jsx
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/**
 * Interstellar-style black hole with:
 * - photon ring + accretion disk (relativistic beaming)
 * - starfield with gravitational lensing
 * - cinematic bloom (UnrealBloomPass)
 * - mouse interactivity (magnet around an anchor)
 */
export default function BlackHoleBG({
  enabled = true,
  quality = 'ultra',          // 'ultra'|'high'|'mid'|'low'
  anchor = [0.72, 0.58],      // where it sits (0..1)
  influence = 0.32,           // mouse pull toward anchor
  tiltMax = 0.35,
  ringRadius = 0.23,
  ringThickness = 0.010,
  diskWidth = 0.42,
  beaming = 1.85,
  warp = 0.090,
  bloom = 1.18,               // in-shader ring boost (kept subtle)
  speed = 1.0,

  // NEW: cinematic bloom pass controls
  bloomStrength = 1.35,       // 1.1–1.8 looks great
  bloomThreshold = 0.72,      // lower = more pixels bloom
  bloomRadiusPass = 0.48      // spread of bloom
}) {
  const holder = useRef(null)
  const rafRef = useRef(0)

  // uniforms
  const uni = useRef({
    uTime:{ value:0 },
    uRes:{ value:new THREE.Vector2(1,1) },
    uBH:{ value:new THREE.Vector2(anchor[0], anchor[1]) },
    uTilt:{ value:new THREE.Vector2(0,0) },
    uSpin:{ value:0.8 },
    uPulse:{ value:0.0 },
    uNoise:{ value:Math.random()*1000 },
    uRingR:{ value:ringRadius },
    uRingT:{ value:ringThickness },
    uDiskW:{ value:diskWidth },
    uBeaming:{ value:beaming },
    uWarp:{ value:warp },
    uBloom:{ value:bloom },
    uAnch:{ value:new THREE.Vector2(anchor[0], anchor[1]) },
    uInfl:{ value:influence },
    uSpeed:{ value:speed }
  })

  useEffect(()=>{
    if (!enabled) return

    const wrap = holder.current
    const canvas = document.createElement('canvas')
    wrap.appendChild(canvas)

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias:false, alpha:true, powerPreference:'high-performance'
    })

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1)
    const quad = new THREE.PlaneGeometry(2,2)

    const v = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`

    const f = /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform vec2  uRes, uBH, uTilt, uAnch;
      uniform float uInfl, uTime, uSpin, uPulse, uNoise;
      uniform float uRingR, uRingT, uDiskW, uBeaming, uWarp, uBloom, uSpeed;

      float H(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float N(vec2 p){ vec2 i=floor(p), f=fract(p);
        float a=H(i), b=H(i+vec2(1.,0.)), c=H(i+vec2(0.,1.)), d=H(i+vec2(1.,1.));
        vec2 u=f*f*(3.-2.*f);
        return mix(a,b,u.x)+ (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
      }
      float stars(vec2 p){
        float s=0.0;
        s += step(0.988, N(p*8.0)) * 0.65;
        s += step(0.995, N(p*16.0)) * 1.10;
        s += step(0.998, N(p*32.0)) * 1.75;
        return s;
      }
      vec3 tone(vec3 x){ return x/(x+1.0); }

      float doppler(float ang){
        float a = cos(ang);
        float D = 0.55 + 0.45*max(0.0, a);
        return pow(D, 3.0);
      }
      vec2 lens(vec2 uv, vec2 center, float asp, float k){
        vec2 d = uv - center;
        float r = length(d);
        float f = k / max(1e-3, r*r + 0.01);
        return uv + normalize(d) * f;
      }

      void main(){
        float asp = uRes.x/uRes.y;
        vec2 uv = vUv*2.0-1.0; uv.x *= asp;

        vec2 anch = uAnch*2.0-1.0; anch.x *= asp;
        vec2 bh   = uBH*2.0-1.0;   bh.x   *= asp;
        vec2 C    = mix(anch, bh, uInfl);

        vec2 d = uv - C;
        float r = length(d);
        float theta = atan(d.y, d.x);

        float tiltX = uTilt.x, tiltY = uTilt.y;
        float plane = d.y * cos(tiltX) + d.x * sin(tiltY);

        // lensed background
        vec2 suv = (vUv*vec2(asp,1.0))*2.2 + uNoise;
        vec2 lensed = lens(suv, (C/2.0+0.5)*2.2, asp, uWarp);
        float s = stars(lensed);
        vec3 bg = vec3(0.055,0.06,0.10) + vec3(s)*0.9;

        // accretion disk
        float inner = uRingR + 0.018;
        float outer = uRingR + uDiskW;
        float band  = smoothstep(-0.07, 0.07, plane);
        float radial= (1.0 - smoothstep(inner, outer, r));
        float disk  = band * radial;

        float swirl = theta*2.0 + (uTime*0.25*uSpeed) * uSpin;
        float diskN = N(vec2(r*9.5 - uTime*0.30*uSpeed, swirl*0.55 + uNoise));
        disk *= (0.54 + 0.46*diskN);

        float beam = pow(doppler(theta), uBeaming);

        vec3 gold = vec3(1.00,0.86,0.54);
        vec3 warm = vec3(1.00,0.95,0.88);
        vec3 mag  = vec3(0.86,0.38,0.98);
        vec3 diskCol = mix(gold, mag, 0.42 + 0.36*sin(uTime*0.10*uSpeed + r*4.0));
        vec3 diskShaded = diskCol * (0.35 + 1.65*beam) * disk;

        float ring = smoothstep(uRingR + uRingT, uRingR, r) * (1.0 - smoothstep(uRingR, uRingR - uRingT, r));
        float ring2= smoothstep(uRingR - 0.018, uRingR - 0.022, r) * (1.0 - smoothstep(uRingR - 0.022, uRingR - 0.026, r));
        vec3 ringCol = mix(warm, vec3(1.0,0.97,0.92), 0.6);

        vec3 col  = bg;
        col = mix(col, diskShaded, 1.0);
        col += ring  * ringCol * uBloom * 1.18;
        col += ring2 * ringCol * 0.45;

        float ca = 0.0022 * smoothstep(uRingR-0.02, uRingR+0.12, r);
        col = vec3(
          mix(col.r, ringCol.r, ca),
          mix(col.g, ringCol.g, ca*0.6),
          mix(col.b, ringCol.b, ca*0.9)
        );

        float vig = smoothstep(1.45, 0.28, length(uv));
        col *= vig;

        gl_FragColor = vec4(tone(col), 1.0);
      }
    `

    const material = new THREE.ShaderMaterial({
      vertexShader: v, fragmentShader: f, uniforms: uni.current,
      depthTest:false, depthWrite:false, transparent:true
    })
    scene.add(new THREE.Mesh(quad, material))

    // postprocessing
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    const bloomPass  = new UnrealBloomPass(new THREE.Vector2(1,1), bloomStrength, bloomRadiusPass, bloomThreshold)
    composer.addPass(renderPass)
    composer.addPass(bloomPass)

    const setSize = () => {
      const w = wrap.clientWidth || window.innerWidth
      const h = wrap.clientHeight || window.innerHeight

      // dynamic DPR cap for perf
      const cap =
        quality==='ultra' ? 2.0 :
        quality==='high'  ? 1.8 :
        quality==='mid'   ? 1.4 : 1.1
      const dpr = Math.min(window.devicePixelRatio || 1, cap)

      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false)
      composer.setPixelRatio(dpr)
      composer.setSize(w, h)

      uni.current.uRes.value.set(w, h)
      bloomPass.setSize(w, h)
    }

    // pointer → inertia + spin
    const target = { x: anchor[0], y: anchor[1] }
    const current= { x: anchor[0], y: anchor[1] }
    let last = performance.now(), vx=0, vy=0

    const update = (nx, ny) => {
      target.x = nx; target.y = ny
      const t = performance.now(); const dt = Math.max(1, t - last)
      vx = (target.x - current.x)/dt; vy = (target.y - current.y)/dt; last = t
    }
    const onMove = (e) => {
      const r = holder.current.getBoundingClientRect()
      update((e.clientX - r.left)/r.width, (e.clientY - r.top)/r.height)
    }
    const onTouch = (e) => {
      const t = e.touches[0]; if (!t) return
      const r = holder.current.getBoundingClientRect()
      update((t.clientX - r.left)/r.width, (t.clientY - r.top)/r.height)
    }
    const onClick = () => { uni.current.uPulse.value = 0.0001 }

    // loop
    setSize()
    window.addEventListener('resize', setSize)
    window.addEventListener('mousemove', onMove, { passive:true })
    window.addEventListener('touchstart', onTouch, { passive:true })
    window.addEventListener('touchmove', onTouch,  { passive:true })
    window.addEventListener('click', onClick, { passive:true })

    const vis = () => { if (document.hidden) cancelAnimationFrame(rafRef.current); else tick(performance.now()) }
    document.addEventListener('visibilitychange', vis)

    let tPrev = performance.now()
    const tick = (tNow) => {
      const dt = (tNow - tPrev)/1000; tPrev = tNow

      current.x += (target.x - current.x) * 0.10
      current.y += (target.y - current.y) * 0.10

      const mx = (1.0 - influence) * anchor[0] + influence * current.x
      const my = (1.0 - influence) * anchor[1] + influence * (1.0 - current.y)
      uni.current.uBH.value.set(mx, my)

      uni.current.uTilt.value.set(
        THREE.MathUtils.clamp((current.y - 0.5)*2.0, -tiltMax, tiltMax),
        THREE.MathUtils.clamp((current.x - 0.5)*2.0, -tiltMax, tiltMax)
      )

      const v = Math.min(1.6, Math.sqrt(vx*vx + vy*vy)*650.0)
      uni.current.uSpin.value = 0.8 + v

      if (uni.current.uPulse.value > 0.0) {
        uni.current.uPulse.value = Math.min(1.0, uni.current.uPulse.value + dt*0.8)
        if (uni.current.uPulse.value >= 1.0) uni.current.uPulse.value = 0.0
      }

      uni.current.uTime.value += dt
      composer.render()
      rafRef.current = requestAnimationFrame(tick)
    }
    tick(performance.now())

    return () => {
      document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('resize', setSize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('click', onClick)
      cancelAnimationFrame(rafRef.current)
      composer.dispose()
      renderer.dispose()
      wrap.removeChild(canvas)
    }
  }, [
    enabled, quality, anchor, influence, tiltMax,
    ringRadius, ringThickness, diskWidth, beaming, warp, bloom, speed,
    bloomStrength, bloomThreshold, bloomRadiusPass
  ])

  return (
    <div
      ref={holder}
      aria-hidden
      style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', background:'transparent' }}
    />
  )
}
