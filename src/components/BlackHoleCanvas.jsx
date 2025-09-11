// src/components/BlackHoleCanvas.jsx
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { shaderMaterial, Points, PointMaterial, useDetectGPU } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { easing } from "maath";
import { inSphere } from "maath/random";

function usePointer(throttleMs = 16) {
  const p = useRef(new THREE.Vector2());
  const last = useRef(0);
  useEffect(() => {
    const onMove = (e) => {
      const now = performance.now();
      if (now - last.current < throttleMs) return;
      last.current = now;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      p.current.set(x, -y);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [throttleMs]);
  return p;
}

const AccretionDiskMaterial = shaderMaterial(
  { uTime: 0, uInner: 0.38, uRing: 0.62, uThick: 0.18,
    uCore: new THREE.Color("#fff2c7").toArray(),
    uWarm: new THREE.Color("#f4a86e").toArray(), uExposure: 1.25 },
  `varying vec2 vUv; void main(){ vUv=uv*2.0-1.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  `
  precision highp float; varying vec2 vUv;
  uniform float uTime,uInner,uRing,uThick,uExposure; uniform vec3 uCore,uWarm;
  vec2 rot(vec2 p,float a){ float s=sin(a),c=cos(a); return mat2(c,-s,s,c)*p; }
  void main(){
    vec2 uv = rot(vUv, 0.12 * sin(uTime*0.25));
    float r = length(uv);
    float inner = smoothstep(uInner, uInner*0.96, r);
    float band = exp(-pow((r-uRing)/uThick, 2.0)*2.2);
    float ang = atan(uv.y, uv.x);
    float beaming = 0.6 + 0.4 * cos(ang - uTime*0.45);
    band *= beaming;
    vec3 col = mix(uWarm, uCore, clamp(band*1.15, 0.0, 1.0));
    col *= band; float glow = smoothstep(0.0, 1.0, band)*0.45;
    col += uWarm*glow*0.35; col *= inner; col = 1.0 - exp(-col*uExposure);
    gl_FragColor = vec4(col, band);
  }`
);

const RingGlowMaterial = shaderMaterial(
  { uTime: 0, uRadius: 1.05, uSoft: 0.5, uColor: new THREE.Color("#f4a86e").toArray() },
  `varying vec2 vUv; void main(){ vUv=uv*2.0-1.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  `precision highp float; varying vec2 vUv; uniform float uRadius,uSoft; uniform vec3 uColor;
   float sdCircle(vec2 p,float r){ return length(p)-r; }
   void main(){ float d=abs(sdCircle(vUv,uRadius)); float a=exp(-d/uSoft); gl_FragColor=vec4(uColor,a*0.25); }`
);

// ✅ Correct registration for JSX tags
extend({ AccretionDiskMaterial, RingGlowMaterial });

function StarField({ count = 1000, radius = 40 }) {
  const pts = useMemo(() => { const arr = new Float32Array(count*3); inSphere(arr,{radius}); return arr; }, [count, radius]);
  return (
    <Points positions={pts} stride={3} frustumCulled={false}>
      <PointMaterial transparent size={0.015} sizeAttenuation depthWrite={false} color={"#cbd5e1"} />
    </Points>
  );
}

function EventHorizon({ radius = 0.86 }) {
  return <mesh><sphereGeometry args={[radius,64,64]} /><meshPhysicalMaterial color="#02040a" roughness={0.6} metalness={0.9} /></mesh>;
}

function AccretionDisk({ scale=[4.8,4.8,1], tilt=-0.22 }) {
  const ref = useRef(); useFrame((_,dt)=>{ if(ref.current) ref.current.uTime += dt; });
  return (
    <mesh rotation={[tilt,0,0]} position={[0,0,-0.02]} scale={scale}>
      <planeGeometry args={[2,2,1,1]} />
      <accretionDiskMaterial ref={ref} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function RingGlow({ scale=[5.2,5.2,1], tilt=-0.22 }) {
  const ref = useRef(); useFrame((_,dt)=>{ if(ref.current) ref.current.uTime += dt; });
  return (
    <mesh rotation={[tilt,0,0]} scale={scale}>
      <planeGeometry args={[2.2,2.2,1,1]} />
      <ringGlowMaterial ref={ref} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function Effects() {
  const { gl } = useThree();
  if (!gl?.capabilities?.isWebGL2) return null; // ✅ guard WebGL1
  return (
    <EffectComposer multisampling={2}>
      <Bloom intensity={0.7} luminanceThreshold={0.15} luminanceSmoothing={0.55} mipmapBlur />
      <Vignette eskil={false} offset={0.34} darkness={0.85} />
    </EffectComposer>
  );
}

function Scene({ centerPct=[0.62,0.35] }) {
  const { viewport, camera } = useThree();
  const gpu = useDetectGPU();
  const pointer = usePointer((gpu?.tier||1) <= 2 ? 24 : 12);
  const isWeak = (gpu?.tier||1) <= 2;

  const worldCenter = useMemo(()=>{
    const x = (centerPct[0]-0.5)*viewport.width;
    const y = (0.5-centerPct[1])*viewport.height;
    return new THREE.Vector3(x,y,0);
  }, [viewport.width, viewport.height, centerPct]);

  const group = useRef(); const stars = useRef(); const speed=useRef(0.18); const boost=useRef(0);

  // Cursor proximity → spin boost
  useFrame(()=>{
    const px = centerPct[0]*2-1, py = -(centerPct[1]*2-1);
    const d = new THREE.Vector2(px,py).distanceTo(pointer.current);
    const t = THREE.MathUtils.clamp(1 - d/0.25, 0, 1);
    boost.current = t * (isWeak ? 0.25 : 0.45);
  });

  useFrame((_,dt)=>{
    const p = pointer.current;
    // camera sway
    easing.damp3(camera.position, new THREE.Vector3(p.x*0.18, p.y*0.1, camera.position.z), 0.8, dt);
    camera.lookAt(0,0,0);
    // group parallax + spin
    if (group.current) {
      easing.damp3(group.current.position, new THREE.Vector3(worldCenter.x+p.x*0.05, worldCenter.y+p.y*0.03, 0), 0.8, dt);
      group.current.rotation.z += (speed.current + boost.current*0.8) * dt;
    }
    if (stars.current) stars.current.rotation.y += 0.005 * dt;
  });

  return (
    <>
      <group ref={stars}><StarField count={isWeak ? 650 : 1400} radius={45} /></group>
      <group ref={group} position={worldCenter.toArray()}>
        <AccretionDisk />
        <RingGlow />
        <EventHorizon />
      </group>
      <Effects />
    </>
  );
}

export default function BlackHoleCanvas({ className="", center=[0.62,0.35] }) {
  const gpu = useDetectGPU();
  const dprMax = (gpu?.tier||1) <= 2 ? 1.5 : 2;
  return (
    <div className={className} style={{ position:"absolute", inset:0, pointerEvents:"none" }} aria-hidden="true">
      <Canvas dpr={[1, dprMax]} gl={{ antialias:true, powerPreference:"high-performance" }} camera={{ position:[0,0,6], fov:45 }}>
        <color attach="background" args={["#080E1A"]} />
        <Scene centerPct={center} />
      </Canvas>
    </div>
  );
}

