import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function BlackHoleBG({
  enabled = true,
  quality = 'ultra',          // 'ultra'|'high'|'mid'|'low'
  anchor = [0.70, 0.56],      // screen coords (X,Y), 0..1 — right side
  influence = 0.35,           // mouse pull amount toward anchor
  tiltMax = 0.35,
  ringRadius = 0.22,
  ringThickness = 0.012
}) {
  const holder = useRef(null)
  const rafRef = useRef(0)
  const rendererRef = useRef(null)

  const uni = useRef({
    uTime:{ value:0 },
    uRes:{ value:new THREE.Vector2(1,1) },
    uBH:{ value:new THREE.Vector2(anchor[0], anchor[1]) },
    uTilt:{ value:new THREE.Vector2(0,0) },
    uSpin:{ value:0.7 },
    uPulse:{ value:0.0 },
    uNoise:{ value:Math.random()*1000 },
    uRingR:{ value:ringRadius },
    uRingT:{ value:ringThickness },
    uChromAb:{ value:0.0020 },
    uAnch:{ value:new THREE.Vector2(anchor[0], anchor[1]) },
    uInfl:{ value:influence }
  })

  useEffect(()=>{
    if (!enabled) return
    const wrap = holder.current
    const canvas = document.createElement('canvas')
    wrap.appendChild(canvas)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias:false, alpha:true, powerPreference:'high-performance' })
    rendererRef.current = renderer
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1)
    const quad = new THREE.PlaneGeometry(2,2)

    const v = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`
    const f = /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform vec2  uRes, uBH, uTilt, uAnch;
      uniform float uInfl, uTime, uSpin, uPulse, uNoise, uRingR, uRingT, uChromAb;

      float H(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float N(vec2 p){ vec2 i=floor(p), f=fract(p);
        float a=H(i), b=H(i+vec2(1.,0.)), c=H(i+vec2(0.,1.)), d=H(i+vec2(1.,1.));
        vec2 u=f*f*(3.-2.*f);
        return mix(a,b,u.x)+ (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
      }
      float stars(vec2 p){
        float s=0.0;
        s += step(0.986, N(p*8.0)) * 0.85;
        s += step(0.995, N(p*16.0)) * 1.2;
        s += step(0.998, N(p*32.0)) * 2.0;
        return s;
      }
      vec3 tone(vec3 x){ return x/(x+1.0); }

      void main(){
        float asp = uRes.x/uRes.y;
        vec2 uv = vUv*2.0-1.0; uv.x *= asp;

        vec2 bh = mix(uAnch*2.0-1.0, uBH*2.0-1.0, uInfl);
        bh.x *= asp;

        vec2 d = uv - bh;
        float r = length(d);
        float a = atan(d.y,d.x);

        float tiltX = uTilt.x, tiltY = uTilt.y;
        float plane = d.y * cos(tiltX) + d.x * sin(tiltY);

        float swirl = a*2.0 + (uTime*0.25 + uPulse*0.2) * uSpin;
        float pulse = smoothstep(0.0,1.0,uPulse);
        float ripple = max(0.0, 1.0 - abs(r - (uRingR + pulse*0.5)) / 0.02) * exp(-pulse*3.0);

        float ring    = smoothstep(uRingR + uRingT, uRingR, r);
        float horizon = 1.0 - smoothstep(uRingR, uRingR+0.008, r);

        float band = smoothstep(-0.055, 0.055, plane);
        band *= (1.0 - smoothstep(uRingR+0.02, uRingR+0.42, r));

        float diskN = N(vec2(r*9.0 - uTime*0.28, swirl*0.55 + uNoise));
        float disk  = band * (0.52 + 0.48*diskN);
        float approach = cos(a - (uTime*0.35 + uNoise));
        float beaming = pow(0.55 + 0.45*max(0.0, approach), 1.8);
        disk *= beaming;

        vec2 sUV = (vUv*vec2(asp,1.0))*2.0 + uNoise;
        float s = stars(sUV);
        vec3 bg = vec3(0.05,0.06,0.10) + vec3(s)*0.9;

        // soft nebula plume near BH (right side)
        float ang = atan(uv.y, uv.x);
        float swirlMask = smoothstep(0.3, 1.4, abs(ang - 0.0));
        float pl = smoothstep(0.2, 0.9, length(uv - vec2(0.55*asp, -0.05)));
        vec3 neb = vec3(0.14,0.35,0.95) * (1.0-pl) * swirlMask * 0.35;

        float lens = smoothstep(uRingR, uRingR+0.22, r);
        float darken = 0.12 + 0.32*(1.0 - lens);
        vec3 col = (bg + neb) * (1.0 - horizon) * (1.0 - darken);

        vec3 gold = vec3(0.98,0.84,0.52);
        vec3 mag  = vec3(0.84,0.38,0.96);
        vec3 diskCol = mix(gold, mag, 0.44 + 0.40*sin(uTime*0.12 + r*5.0));
        col = mix(col, diskCol, disk);

        vec3 ringCol = vec3(1.0,0.96,0.90);
        col += ring * ringCol * 1.18;
        col += ripple * vec3(0.9,0.7,1.0);

        float ca = uChromAb * smoothstep(uRingR-0.02, uRingR+0.12, r);
        vec3 caCol = vec3(
          mix(col.r, ringCol.r, ca),
          mix(col.g, ringCol.g, ca*0.6),
          mix(col.b, ringCol.b, ca*0.9)
        );
        col = mix(col, caCol, 0.35);

        float vig = smoothstep(1.45, 0.25, length(uv));
        col *= vig;

        gl_FragColor = vec4(tone(col), 1.0);
      }
    `

    const mat = new THREE.ShaderMaterial({ vertexShader:v, fragmentShader:f, uniforms:uni.current, depthTest:false, depthWrite:false })
    scene.add(new THREE.Mesh(quad, mat))

    const setSize = () => {
      const w = wrap.clientWidth || window.innerWidth
      const h = wrap.clientHeight || window.innerHeight
      const cap = (quality==='ultra'?2.0:quality==='high'?1.8:quality==='mid'?1.4:1.1)
      const dpr = Math.min(window.devicePixelRatio || 1, cap)
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false)
      uni.current.uRes.value.set(w, h)
    }

    // pointer → inertia + spin
    const target = { x: anchor[0], y: anchor[1] }
    const current= { x: anchor[0], y: anchor[1] }
    let last = performance.now(), vx=0, vy=0

    const update = (nx, ny) => {
      target.x = nx; target.y = ny
      const t = performance.now()
      const dt = Math.max(1, t - last)
      vx = (target.x - current.x)/dt; vy = (target.y - current.y)/dt
      last = t
    }
    const onMove = (e) => {
      const r = wrap.getBoundingClientRect()
      update((e.clientX - r.left)/r.width, (e.clientY - r.top)/r.height)
    }
    const onTouch = (e) => {
      const t = e.touches[0]; if (!t) return
      const r = wrap.getBoundingClientRect()
      update((t.clientX - r.left)/r.width, (t.clientY - r.top)/r.height)
    }
    const onClick = () => { uni.current.uPulse.value = 0.0001 }

    let t0 = performance.now()
    const loop = () => {
      const now = performance.now(), dt = (now - t0)/1000; t0 = now

      current.x += (target.x - current.x) * 0.10
      current.y += (target.y - current.y) * 0.10

      const mx = (1.0 - influence) * anchor[0] + influence * current.x
      const my = (1.0 - influence) * anchor[1] + influence * (1.0 - current.y)
      uni.current.uBH.value.set(mx, my)

      uni.current.uTilt.value.set(
        THREE.MathUtils.clamp((current.y - 0.5)*2.0, -tiltMax, tiltMax),
        THREE.MathUtils.clamp((current.x - 0.5)*2.0, -tiltMax, tiltMax)
      )

      const v = Math.min(1.5, Math.sqrt(vx*vx + vy*vy)*600.0)
      uni.current.uSpin.value = 0.7 + v

      if (uni.current.uPulse.value > 0.0) {
        uni.current.uPulse.value = Math.min(1.0, uni.current.uPulse.value + dt*0.8)
        if (uni.current.uPulse.value >= 1.0) uni.current.uPulse.value = 0.0
      }

      uni.current.uTime.value += dt
      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(loop)
    }

    setSize(); loop()
    window.addEventListener('resize', setSize)
    window.addEventListener('mousemove', onMove, { passive:true })
    window.addEventListener('touchstart', onTouch, { passive:true })
    window.addEventListener('touchmove', onTouch,  { passive:true })
    window.addEventListener('click', onClick, { passive:true })

    const vis = () => { if (document.hidden) cancelAnimationFrame(rafRef.current); else { t0=performance.now(); loop() } }
    document.addEventListener('visibilitychange', vis)

    return () => {
      document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('resize', setSize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('click', onClick)
      cancelAnimationFrame(rafRef.current)
      renderer.dispose()
      wrap.removeChild(canvas)
    }
  }, [enabled, quality, anchor, influence, tiltMax, ringRadius, ringThickness])

  return (
    <div ref={holder} aria-hidden
      style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', background:'transparent' }}
    />
  )
}
