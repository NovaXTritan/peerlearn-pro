// src/components/BlackHoleCanvas.jsx
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  shaderMaterial,
  Points,
  PointMaterial,
  useDetectGPU,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { easing } from "maath";
import { inSphere } from "maath/random";

/* ------------------------------ utils ------------------------------ */

function usePrefersReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    ref.current = !!m.matches;
    const onChange = () => (ref.current = !!m.matches);
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, []);
  return ref;
}

// Throttled window pointer listener → normalized -1..1 coords
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

/* --------------------------- shader materials --------------------------- */

// Accretion disk (planar) — warm orange/amber with relativistic bright arc
const AccretionDiskMaterial = shaderMaterial(
  {
    uTime: 0,
    uInner: 0.38, // inner (hole) radius in UV space
    uRing: 0.62, // ring radius
    uThick: 0.18, // ring thickness (gaussian)
    uCore: new THREE.Color("#fff2c7").toArray(), // hot inner
    uWarm: new THREE.Color("#f4a86e").toArray(), // warm outer
    uExposure: 1.25,
  },
  /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv * 2.0 - 1.0; // center at (0,0) in [-1,1]
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }`,
  /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uInner;
  uniform float uRing;
  uniform float uThick;
  uniform vec3  uCore;
  uniform vec3  uWarm;
  uniform float uExposure;

  vec2 rot(vec2 p, float a){
    float s = sin(a), c = cos(a);
    return mat2(c,-s,s,c)*p;
  }

  void main() {
    // mild swirl
    vec2 uv = rot(vUv, 0.12 * sin(uTime*0.25));

    float r = length(uv);
    float inner = smoothstep(uInner, uInner*0.96, r); // shadow inside inner radius

    // gaussian ring
    float band = exp(-pow((r - uRing)/uThick, 2.0)*2.2);

    // relativistic beaming: brighten the forward-moving arc
    float ang = atan(uv.y, uv.x);
    float beaming = 0.6 + 0.4 * cos(ang - uTime*0.45);
    band *= beaming;

    // color blend
    vec3 col = mix(uWarm, uCore, clamp(band*1.15, 0.0, 1.0));
    col *= band;

    // subtle outer glow falloff
    float glow = smoothstep(0.0, 1.0, band) * 0.45;
    col += uWarm * glow * 0.35;

    // hide the interior (dark hole)
    col *= inner;

    // tone map
    col = 1.0 - exp(-col * uExposure);
    gl_FragColor = vec4(col, band); // premult alpha-like
  }`
);
THREE.ShaderLib; // keep tree-shaking happy

// Additive halo ring
const RingGlowMaterial = shaderMaterial(
  {
    uTime: 0,
    uRadius: 1.05,
    uSoft: 0.5,
    uColor: new THREE.Color("#f4a86e").toArray(),
  },
  /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv*2.0-1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }`,
  /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uRadius;
  uniform float uSoft;
  uniform vec3  uColor;

  float sdCircle(vec2 p, float r){ return length(p)-r; }

  void main(){
    float d = abs(sdCircle(vUv, uRadius));
    float a = exp(-d/uSoft);
    gl_FragColor = vec4(uColor, a*0.25);
  }`
);

/* --------------------------- scene primitives --------------------------- */

function StarField({ count = 1000, radius = 40 }) {
  const pts = useMemo(() => {
    const arr = new Float32Array(count * 3);
    inSphere(arr, { radius }); // uniform sphere
    return arr;
  }, [count, radius]);
  return (
    <group rotation={[0, 0, 0]}>
      <Points positions={pts} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          size={0.015}
          sizeAttenuation
          depthWrite={false}
          color={"#cbd5e1"}
        />
      </Points>
    </group>
  );
}

function EventHorizon({ radius = 0.75 }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshPhysicalMaterial
        color="#02040a"
        roughness={0.6}
        metalness={0.9}
        transmission={0}
      />
    </mesh>
  );
}

function AccretionDisk({ scale = [4, 4, 1], tilt = -0.28 }) {
  const ref = useRef();
  useFrame((state, dt) => {
    if (ref.current) ref.current.uTime += dt;
  });
  return (
    <mesh rotation={[tilt, 0, 0]} position={[0, 0, -0.02]} scale={scale}>
      <planeGeometry args={[2, 2, 1, 1]} />
      {/* @ts-ignore */}
      <accretionDiskMaterial
        ref={ref}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function RingGlow({ scale = [4.2, 4.2, 1], tilt = -0.28 }) {
  const ref = useRef();
  useFrame((_, dt) => (ref.current.uTime += dt));
  return (
    <mesh rotation={[tilt, 0, 0]} scale={scale}>
      <planeGeometry args={[2.2, 2.2, 1, 1]} />
      {/* @ts-ignore */}
      <ringGlowMaterial
        ref={ref}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------ main scene ------------------------------ */

function Scene({ centerPct = [0.62, 0.35] }) {
  const { viewport, camera, size } = useThree();
  const gpu = useDetectGPU();
  const reducedRef = usePrefersReducedMotion();
  const pointer = usePointer(gpu.tier <= 2 ? 24 : 12);

  // Quality gates
  const isWeak = (gpu?.tier || 1) <= 2;
  const dprMax = isWeak ? 1.5 : 2.0;
  const starCount = isWeak ? 650 : 1400;

  // Center in world units at z=0 using viewport width/height
  const worldCenter = useMemo(() => {
    const x = (centerPct[0] - 0.5) * viewport.width;
    const y = (0.5 - centerPct[1]) * viewport.height;
    return new THREE.Vector3(x, y, 0);
  }, [viewport.width, viewport.height, centerPct]);

  // Root group for BH system
  const group = useRef();
  const stars = useRef();

  // Spin state
  const speed = useRef(0.18); // base rad/sec
  const boost = useRef(0);

  // Compute cursor proximity to disk center in screen space for boost
  useFrame(() => {
    const px = (centerPct[0] * 2 - 1);
    const py = -(centerPct[1] * 2 - 1);
    const d = new THREE.Vector2(px, py).distanceTo(pointer.current);
    const near = 0.25; // boost radius (NDC)
    const t = THREE.MathUtils.clamp(1 - d / near, 0, 1);
    boost.current = t * (isWeak ? 0.25 : 0.45); // weaker on low GPUs
  });

  // Animate camera sway & group parallax
  useFrame((state, dt) => {
    const p = pointer.current;
    // Camera gentle sway
    easing.damp3(
      camera.position,
      new THREE.Vector3(p.x * 0.18, p.y * 0.1, camera.position.z),
      0.8,
      dt
    );
    camera.lookAt(0, 0, 0);

    // Group parallax (does not change world alignment)
    if (group.current) {
      easing.damp3(
        group.current.position,
        new THREE.Vector3(
          worldCenter.x + p.x * 0.05,
          worldCenter.y + p.y * 0.03,
          0
        ),
        0.8,
        dt
      );
      const s = speed.current + boost.current * 0.8;
      group.current.rotation.z += s * dt;
    }

    // Very slow star drift
    if (stars.current) stars.current.rotation.y += 0.005 * dt;
  });

  // Static poster if reduced motion
  if (reducedRef.current) {
    return (
      <>
        {/* Subtle nebula gradient (no motion) */}
        <mesh position={[0, 0, -2]}>
          <planeGeometry args={[viewport.width * 1.2, viewport.height * 1.2]} />
          <meshBasicMaterial
            color={new THREE.Color("#0a1022")}
            opacity={1}
            transparent={false}
          />
        </mesh>
      </>
    );
  }

  return (
    <>
      <group ref={stars}>
        <StarField count={starCount} radius={45} />
      </group>

      <group ref={group} position={worldCenter.toArray()}>
        <AccretionDisk scale={[4.8, 4.8, 1]} tilt={-0.22} />
        <RingGlow scale={[5.2, 5.2, 1]} tilt={-0.22} />
        <EventHorizon radius={0.86} />
      </group>

      <EffectComposer multisampling={isWeak ? 0 : 2}>
        <Bloom
          intensity={isWeak ? 0.45 : 0.7}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.55}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.34} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export default function BlackHoleCanvas({
  className = "",
  center = [0.62, 0.35],
}) {
  const gpu = useDetectGPU();
  const isWeak = (gpu?.tier || 1) <= 2;
  const dprMax = isWeak ? 1.5 : 2;

  // Register custom materials
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMemo(() => {
    // @ts-ignore
    THREE.extend({ AccretionDiskMaterial, RingGlowMaterial });
  }, []);

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none", // never block UI
      }}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, dprMax]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        frameloop="always"
      >
        <color attach="background" args={["#080E1A"]} />
        <Scene centerPct={center} />
      </Canvas>
    </div>
  );
}
