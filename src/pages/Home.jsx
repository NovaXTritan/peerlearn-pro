// src/components/BlackHoleBG.jsx
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Ultra-minimal: big centered ring. No mouse, no anchor. If you don't see this,
// the canvas is not sized or something is covering it.
export default function BlackHoleBG({ quality = 'ultra' }) {
  const ref = useRef(null)
  const raf = useRef(0)

  useEffect(() => {
    const holder = ref.current
    const canvas = document.createElement('canvas')
    holder.appendChild(canvas)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias:false, alpha:true, powerPreference:'high-performance' })
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1)
    const quad = new THREE.PlaneGeometry(2,2)

    const v = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position,1.0); }`
    const f = /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform vec2  uRes;
      uniform float uTime;

      // very visible centered ring + warm disk
      void main(){
        float asp = uRes.x / uRes.y;
        vec2 uv = vUv * 2.0 - 1.0;
        uv.x *= asp;

        float r = length(uv);
        // bright thin ring at ~0.30
        float ring = smoothstep(0.305, 0.300, r) * (1.0 - smoothstep(0.300, 0.295, r));

        // warm accretion glow inside ring
        float disk = smoothstep(0.30, 0.00, r);
        vec3 diskCol = mix(vec3(0.98,0.84,0.52), vec3(0.84,0.38,0.96), 0.5 + 0.4*sin(uTime*0.1 + r*5.0));
        vec3 col = vec3(0.04,0.05,0.08);   // deep space background
        col = mix(col, diskCol, disk * 0.35);
        col += ring * vec3(1.0, 0.96, 0.90) * 1.5;

        // soft vignette
        float vig = smoothstep(1.45, 0.30, length(uv));
        col *= vig;

        gl_FragColor = vec4(col, 1.0);
      }
    `
    const uni = {
      uRes:  { value: new THREE.Vector2(1,1) },
      uTime: { value: 0 }
    }
    const mat = new THREE.ShaderMaterial({ vertexShader:v, fragmentShader:f, uniforms:uni, depthTest:false, depthWrite:false })
    scene.add(new THREE.Mesh(quad, mat))

    const setSize = () => {
      const w = holder.clientWidth || window.innerWidth
      const h = holder.clientHeight || window.innerHeight
      const cap = (quality==='ultra'?2.0:quality==='high'?1.8:quality==='mid'?1.4:1.1)
      const dpr = Math.min(window.devicePixelRatio || 1, cap)
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false)
      uni.uRes.value.set(w, h)
      // debug: uncomment to confirm canvas is full-screen
      // console.log('canvas size', w, h, 'dpr', dpr)
    }
    setSize()
    const onResize = () => setSize()
    window.addEventListener('resize', onResize)

    let t0 = performance.now()
    const loop = () => {
      const now = performance.now(); uni.uTime.value += (now - t0)/1000; t0 = now
      renderer.render(scene, camera)
      raf.current = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf.current)
      renderer.dispose()
      holder.removeChild(canvas)
    }
  }, [quality])

  return (
    <div
      ref={ref}
      style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', background:'transparent' }}
      aria-hidden
    />
  )
}
