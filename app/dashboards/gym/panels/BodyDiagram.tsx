// app/dashboards/gym/panels/BodyDiagram.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Environment } from '@react-three/drei'
import styles from './BodyDiagram.module.css'

export type BodyPart =
  | 'biceps' | 'chest' | 'shoulders' | 'back' | 'triceps'
  | 'quads' | 'hamstrings' | 'forearms' | 'core'
  | 'glutes' | 'calves' | 'hips'

type Stats = Partial<Record<BodyPart, { volume: number; sets: number }>>
type SplitKey = 'Push' | 'Pull' | 'Legs'

const BP_TOKEN: Record<BodyPart, string> = {
  chest:      '--chart-bp-chest',
  back:       '--chart-bp-back',
  shoulders:  '--chart-bp-shoulders',
  biceps:     '--chart-bp-biceps',
  triceps:    '--chart-bp-triceps',
  quads:      '--chart-bp-quads',
  hamstrings: '--chart-bp-hamstrings',
  core:       '--chart-bp-core',
  glutes:     '--chart-bp-glutes',
  calves:     '--chart-bp-calves',
  forearms:   '--chart-bp-forearms',
  hips:       '--chart-bp-hips',
}

function getToken(varName: string): string {
  if (typeof document === 'undefined') return '#D8CFC2'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

export default function BodyDiagram({
  stats,
  className = '',
  greenAt = 5,
  yellowAt = 3,
  splitFactor = 1,
  splitCounts,
}: {
  stats: Stats
  className?: string
  greenAt?: number
  yellowAt?: number
  splitFactor?: number
  splitCounts?: Partial<Record<SplitKey, number>>
}) {
  const [webglOK, setWebglOK] = useState(true)
  const [colors, setColors] = useState<Record<BodyPart, string>>({} as Record<BodyPart, string>)

  useEffect(() => {
    try {
      const c = document.createElement('canvas')
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl')
      setWebglOK(!!gl)
    } catch {
      setWebglOK(false)
    }
    // Resolve CSS token colors on client
    const resolved = {} as Record<BodyPart, string>
    for (const [bp, token] of Object.entries(BP_TOKEN)) {
      resolved[bp as BodyPart] = getToken(token)
    }
    setColors(resolved)
  }, [])

  const splitBucketFor = (p: BodyPart): SplitKey => {
    if (p === 'chest' || p === 'biceps' || p === 'shoulders') return 'Push'
    if (p === 'back' || p === 'triceps' || p === 'core' || p === 'forearms') return 'Pull'
    return 'Legs'
  }

  const splitsForPart = (p: BodyPart) => {
    const bucket = splitBucketFor(p)
    const base = Math.max(1, Number(splitCounts?.[bucket] ?? 1))
    const sf = Number.isFinite(splitFactor) && splitFactor > 0 ? splitFactor : 1
    return base * sf
  }

  const rawSets = (p: BodyPart) => (stats?.[p]?.sets ?? 0)

  const NA_COLOR = '#EBE3D5'
  const MUTED_COLOR = '#D8CFC2'

  const colorFor = (p: BodyPart) => {
    const s = rawSets(p)
    if (s <= 0) return NA_COLOR
    const k = splitsForPart(p)
    const targetGreen = greenAt * k
    const targetYellow = yellowAt * k
    if (s > targetGreen) return colors[p] || '#4A4239'
    if (s >= targetYellow) return MUTED_COLOR
    return NA_COLOR
  }

  const BASE_COLOR = '#F7F3EC'
  const baseMat = <meshStandardMaterial color={BASE_COLOR} roughness={0.85} metalness={0.03} />
  const badgeMatFor = (p: BodyPart) => <meshStandardMaterial color={colorFor(p)} roughness={0.55} metalness={0.05} />

  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      {webglOK ? (
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 1.4, 7], fov: 39 }}
          resize={{ scroll: false, debounce: { scroll: 50, resize: 50 } }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 7, 6]} intensity={0.8} />
          <directionalLight position={[-6, 3, -6]} intensity={0.3} color="#c8b89f" />
          <Environment preset="apartment" environmentIntensity={0.2} />

          <AutoSpin>
            <FigureSolidEmbedded badge={badgeMatFor} base={baseMat} />
          </AutoSpin>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI * 0.18}
            maxPolarAngle={Math.PI * 0.82}
            autoRotate
            autoRotateSpeed={0.5}
            target={[0, 0.15, 0]}
          />
        </Canvas>
      ) : (
        <SvgFallback />
      )}
    </div>
  )
}

function AutoSpin({ children }: { children: React.ReactNode }) {
  const ref = useRef<any>(null)
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 0.22 })
  return <group ref={ref}>{children}</group>
}

function makeRoundedRectShape(w: number, h: number, r: number) {
  const shape = new THREE.Shape()
  const rr = Math.min(r, w / 2, h / 2)
  const x = -w / 2
  const y = -h / 2
  shape.moveTo(x + rr, y)
  shape.lineTo(x + w - rr, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + rr)
  shape.lineTo(x + w, y + h - rr)
  shape.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  shape.lineTo(x + rr, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - rr)
  shape.lineTo(x, y + rr)
  shape.quadraticCurveTo(x, y, x + rr, y)
  return shape
}

function useFootGeometry() {
  const w = 0.3, l = 0.55, t = 0.18, r = 0.14
  return useMemo(() => {
    const shape = makeRoundedRectShape(w, l, r)
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: t,
      bevelEnabled: true,
      bevelThickness: Math.min(0.06, t * 0.35),
      bevelSize: 0.06,
      bevelSegments: 4,
      curveSegments: 24,
    })
    geom.rotateX(Math.PI / 2)
    geom.center()
    return geom
  }, [])
}

function FigureSolidEmbedded({
  badge,
  base,
}: {
  badge: (p: BodyPart) => React.ReactElement
  base: React.ReactElement
}) {
  const Z_TORSO = 0.18
  const footGeom = useFootGeometry()

  return (
    <group position={[0, 0, 0]} scale={0.98}>
      <group position={[0, 1.78, 0]}>
        <RoundedBox args={[0.44, 0.44, 0.44]} radius={0.1} smoothness={6} castShadow receiveShadow>
          {base}
        </RoundedBox>
        <group position={[0, -0.02, 0.26]}>
          <RoundedBox args={[0.16, 0.10, 0.02]} radius={0.05} position={[-0.12, 0, 0]}>
            <meshStandardMaterial color="#1B1814" roughness={0.15} metalness={0.1} opacity={0.95} transparent />
          </RoundedBox>
          <RoundedBox args={[0.16, 0.10, 0.02]} radius={0.05} position={[0.12, 0, 0]}>
            <meshStandardMaterial color="#1B1814" roughness={0.15} metalness={0.1} opacity={0.95} transparent />
          </RoundedBox>
          <RoundedBox args={[0.06, 0.02, 0.02]} radius={0.01}>
            <meshStandardMaterial color="#1B1814" />
          </RoundedBox>
          <RoundedBox args={[0.02, 0.02, 0.08]} radius={0.01} position={[-0.20, 0, -0.01]}>
            <meshStandardMaterial color="#1B1814" />
          </RoundedBox>
          <RoundedBox args={[0.02, 0.02, 0.08]} radius={0.01} position={[0.20, 0, -0.01]}>
            <meshStandardMaterial color="#1B1814" />
          </RoundedBox>
        </group>
      </group>

      <group position={[0, 1.53, 0]}>
        <RoundedBox args={[0.22, 0.18, 0.22]} radius={0.06} castShadow receiveShadow>
          {base}
        </RoundedBox>
      </group>

      <group position={[0, 1.05, 0]}>
        <RoundedBox args={[1.12, 0.92, 0.54]} radius={0.14} smoothness={7} castShadow receiveShadow>
          {base}
        </RoundedBox>
        <group position={[-0.25, 0.22, Z_TORSO]}>
          <RoundedBox args={[0.47, 0.30, 0.30]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('chest')}
          </RoundedBox>
        </group>
        <group position={[0.25, 0.22, Z_TORSO]}>
          <RoundedBox args={[0.47, 0.30, 0.30]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('chest')}
          </RoundedBox>
        </group>
        <group position={[0, -0.16, Z_TORSO]}>
          <RoundedBox args={[0.46, 0.53, 0.30]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('core')}
          </RoundedBox>
        </group>
        <group position={[0, 0.02, -Z_TORSO]}>
          <RoundedBox args={[0.92, 0.62, 0.30]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('back')}
          </RoundedBox>
        </group>
      </group>

      <group position={[-0.70, 1.28, 0]}>
        <RoundedBox args={[0.30, 0.24, 0.40]} radius={0.10} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
      </group>
      <group position={[0.70, 1.28, 0]}>
        <RoundedBox args={[0.30, 0.24, 0.40]} radius={0.10} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
      </group>

      <group position={[-0.98, 1.0, 0]}>
        <RoundedBox args={[0.36, 0.82, 0.36]} radius={0.12} smoothness={6} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[-0.185, 0.20, 0]}>
          <mesh scale={[1, 1, 0.72]} castShadow receiveShadow>
            <capsuleGeometry args={[0.125, 0.125, 25, 22]} />
            {badge('shoulders')}
          </mesh>
        </group>
        <group position={[0, 0.00, 0.16]}>
          <RoundedBox args={[0.26, 0.46, 0.26]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('biceps')}
          </RoundedBox>
        </group>
        <group position={[0, 0.04, -0.16]}>
          <RoundedBox args={[0.26, 0.56, 0.26]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('triceps')}
          </RoundedBox>
        </group>
      </group>
      <group position={[0.98, 1.0, 0]}>
        <RoundedBox args={[0.36, 0.82, 0.36]} radius={0.12} smoothness={6} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[0.185, 0.20, 0]}>
          <mesh scale={[1, 1, 0.72]} castShadow receiveShadow>
            <capsuleGeometry args={[0.125, 0.125, 25, 22]} />
            {badge('shoulders')}
          </mesh>
        </group>
        <group position={[0, 0.00, 0.16]}>
          <RoundedBox args={[0.26, 0.46, 0.26]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('biceps')}
          </RoundedBox>
        </group>
        <group position={[0, 0.04, -0.16]}>
          <RoundedBox args={[0.26, 0.56, 0.26]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('triceps')}
          </RoundedBox>
        </group>
      </group>

      <group position={[-0.98, 0.42, 0]}>
        <RoundedBox args={[0.32, 0.72, 0.32]} radius={0.12} smoothness={6} castShadow receiveShadow>{base}</RoundedBox>
      </group>
      <group position={[0.98, 0.42, 0]}>
        <RoundedBox args={[0.32, 0.72, 0.32]} radius={0.12} smoothness={6} castShadow receiveShadow>{base}</RoundedBox>
      </group>
      <group position={[-0.98, -0.02, 0]}>
        <RoundedBox args={[0.34, 0.22, 0.34]} radius={0.10} castShadow receiveShadow>{base}</RoundedBox>
      </group>
      <group position={[0.98, -0.02, 0]}>
        <RoundedBox args={[0.34, 0.22, 0.34]} radius={0.10} castShadow receiveShadow>{base}</RoundedBox>
      </group>

      <group position={[0, 0.52, 0]}>
        <RoundedBox args={[1.06, 0.30, 0.50]} radius={0.12} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[-0.55, 0.10, 0]}>
          <RoundedBox args={[0.26, 0.26, 0.40]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('hips')}
          </RoundedBox>
        </group>
        <group position={[0.55, 0.10, 0]}>
          <RoundedBox args={[0.26, 0.26, 0.40]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('hips')}
          </RoundedBox>
        </group>
      </group>

      <group position={[-0.40, 0.02, 0]}>
        <RoundedBox args={[0.46, 1.12, 0.46]} radius={0.14} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[0, -0.06, 0.18]}>
          <RoundedBox args={[0.36, 0.96, 0.28]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('quads')}
          </RoundedBox>
        </group>
        <group position={[0, 0.00, -0.18]}>
          <RoundedBox args={[0.30, 0.74, 0.28]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('hamstrings')}
          </RoundedBox>
        </group>
      </group>
      <group position={[0.40, 0.02, 0]}>
        <RoundedBox args={[0.46, 1.12, 0.46]} radius={0.14} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[0, -0.06, 0.18]}>
          <RoundedBox args={[0.36, 0.96, 0.28]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('quads')}
          </RoundedBox>
        </group>
        <group position={[0, 0.00, -0.18]}>
          <RoundedBox args={[0.30, 0.74, 0.28]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('hamstrings')}
          </RoundedBox>
        </group>
      </group>

      <group position={[-0.40, -0.86, 0]}>
        <RoundedBox args={[0.38, 0.92, 0.38]} radius={0.14} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[0, 0, -0.15]}>
          <RoundedBox args={[0.28, 0.70, 0.32]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('calves')}
          </RoundedBox>
        </group>
      </group>
      <group position={[0.40, -0.86, 0]}>
        <RoundedBox args={[0.38, 0.92, 0.38]} radius={0.14} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[0, 0, -0.15]}>
          <RoundedBox args={[0.28, 0.70, 0.32]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('calves')}
          </RoundedBox>
        </group>
      </group>

      <group position={[-0.42, -1.46, 0.08]}>
        <mesh geometry={footGeom} castShadow receiveShadow>
          {base}
        </mesh>
      </group>
      <group position={[0.42, -1.46, 0.08]}>
        <mesh geometry={footGeom} castShadow receiveShadow>
          {base}
        </mesh>
      </group>
    </group>
  )
}

function SvgFallback() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 200 320" style={{ width: '62%' }}>
        <rect x="0" y="0" width="200" height="320" fill="var(--color-paper-2)" rx="0" />
        <rect x="78" y="26" width="44" height="44" rx="2" fill="var(--color-rule)" />
        <rect x="50" y="78" width="100" height="84" rx="2" fill="var(--color-rule-soft)" />
        <text x="100" y="300" textAnchor="middle" fontSize="10" fill="var(--color-ink-3)">WebGL unavailable</text>
      </svg>
    </div>
  )
}
