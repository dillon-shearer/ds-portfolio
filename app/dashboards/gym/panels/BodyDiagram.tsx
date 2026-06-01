// app/dashboards/gym/panels/BodyDiagram.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'
import styles from './BodyDiagram.module.css'

export type BodyPart =
  | 'biceps' | 'chest' | 'shoulders' | 'back' | 'triceps'
  | 'quads' | 'hamstrings' | 'forearms' | 'core'
  | 'glutes' | 'calves' | 'hips'

type Stats = Partial<Record<BodyPart, { volume: number; sets: number }>>
type SplitKey = 'Push' | 'Pull' | 'Legs'

const NA_COLOR = '#F2EDE5'

const PART_COLOR: Record<BodyPart, string> = {
  biceps:     '#4A6B3A',
  chest:      '#7A2E2E',
  shoulders:  '#B8893B',
  back:       '#4A4239',
  triceps:    '#5A7A8A',
  quads:      '#5C3A1A',
  hamstrings: '#1A4A3A',
  forearms:   '#6B6B3A',
  core:       '#3A1A4A',
  glutes:     '#9A5A3A',
  calves:     '#3A6B5A',
  hips:       '#5A3A6B',
}

function lerpHex(a: string, b: string, t: number): string {
  const p = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff] }
  const [ar, ag, ab] = p(a); const [br, bg, bb] = p(b)
  return '#' + [ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')
}

const LEGEND_ITEMS = [
  { alpha: 0,    label: 'None' },
  { alpha: 0.35, label: 'Some' },
  { alpha: 0.65, label: 'Moderate' },
  { alpha: 1,    label: 'Trained' },
]
const LEGEND_SAMPLE = '#5A7A8A'

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
  const [hoveredPart, setHoveredPart] = useState<BodyPart | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const c = document.createElement('canvas')
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl')
      setWebglOK(!!gl)
    } catch {
      setWebglOK(false)
    }
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

  const colorFor = useCallback((p: BodyPart): string => {
    const s = rawSets(p)
    if (s <= 0) return NA_COLOR
    const k = splitsForPart(p)
    const base = PART_COLOR[p]
    if (s >= greenAt * k) return lerpHex(NA_COLOR, base, 1.0)
    if (s >= yellowAt * k) return lerpHex(NA_COLOR, base, 0.65)
    return lerpHex(NA_COLOR, base, 0.35)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, greenAt, yellowAt, splitFactor, splitCounts])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const BASE_COLOR = '#F0EBE2'
  const baseMat = <meshStandardMaterial color={BASE_COLOR} roughness={0.72} metalness={0.0} />

  const badgeMatFor = (p: BodyPart) => {
    const color = colorFor(p)
    const isColored = color !== NA_COLOR
    return (
      <meshStandardMaterial
        color={color}
        roughness={isColored ? 0.45 : 0.72}
        metalness={0.0}
        emissive={isColored ? color : '#000000'}
        emissiveIntensity={isColored ? 0.12 : 0}
      />
    )
  }

  const partStats = hoveredPart ? stats[hoveredPart] : null

  return (
    <div
      ref={containerRef}
      className={[styles.container, className].filter(Boolean).join(' ')}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredPart(null)}
    >
      {webglOK ? (
        <Canvas
          dpr={[1, 2]}
          frameloop="always"
          camera={{ position: [0, 1.4, 7], fov: 39 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.setClearColor('#F2EDE5', 1)
            gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault() })
          }}
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[5, 8, 6]} intensity={1.0} />
          <directionalLight position={[-5, 3, -5]} intensity={0.4} color="#c8b8a0" />
          <directionalLight position={[0, -1, 5]} intensity={0.15} color="#b8ccd8" />

          <FigureSolidEmbedded badge={badgeMatFor} base={baseMat} onHover={setHoveredPart} />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI * 0.18}
            maxPolarAngle={Math.PI * 0.82}
            autoRotate
            autoRotateSpeed={2.0}
            target={[0, 0.15, 0]}
          />
        </Canvas>
      ) : (
        <SvgFallback />
      )}

      {/* Hover tooltip */}
      {hoveredPart && (
        <div
          className={styles.tooltip}
          style={{ left: mousePos.x + 14, top: mousePos.y - 10 }}
        >
          <span className={styles.tooltipPart}>
            {hoveredPart.charAt(0).toUpperCase() + hoveredPart.slice(1)}
          </span>
          {partStats ? (
            <span className={styles.tooltipStats}>
              {partStats.sets} sets &middot; {Math.round(partStats.volume).toLocaleString()} lbs
            </span>
          ) : (
            <span className={styles.tooltipStats}>No sets logged</span>
          )}
        </div>
      )}

      {/* Color scale legend */}
      <div className={styles.legend}>
        {LEGEND_ITEMS.map(({ alpha, label }) => (
          <div key={label} className={styles.legendItem}>
            <div className={styles.legendSwatch} style={{ background: lerpHex(NA_COLOR, LEGEND_SAMPLE, alpha) }} />
            <span className={styles.legendLabel}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
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
  onHover,
}: {
  badge: (p: BodyPart) => React.ReactElement
  base: React.ReactElement
  onHover: (p: BodyPart | null) => void
}) {
  const Z_TORSO = 0.18
  const footGeom = useFootGeometry()

  const h = (p: BodyPart) => ({
    onPointerOver: (e: any) => { e.stopPropagation(); onHover(p) },
  })

  return (
    <group position={[0, 0, 0]} scale={0.98}>
      {/* Head */}
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

      {/* Neck */}
      <group position={[0, 1.53, 0]}>
        <RoundedBox args={[0.22, 0.18, 0.22]} radius={0.06} castShadow receiveShadow>
          {base}
        </RoundedBox>
      </group>

      {/* Torso */}
      <group position={[0, 1.05, 0]}>
        <RoundedBox args={[1.12, 0.92, 0.54]} radius={0.14} smoothness={7} castShadow receiveShadow>
          {base}
        </RoundedBox>
        <group position={[-0.25, 0.22, Z_TORSO]} {...h('chest')}>
          <RoundedBox args={[0.47, 0.30, 0.30]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('chest')}
          </RoundedBox>
        </group>
        <group position={[0.25, 0.22, Z_TORSO]} {...h('chest')}>
          <RoundedBox args={[0.47, 0.30, 0.30]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('chest')}
          </RoundedBox>
        </group>
        <group position={[0, -0.16, Z_TORSO]} {...h('core')}>
          <RoundedBox args={[0.46, 0.53, 0.30]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('core')}
          </RoundedBox>
        </group>
        <group position={[0, 0.02, -Z_TORSO]} {...h('back')}>
          <RoundedBox args={[0.92, 0.62, 0.30]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('back')}
          </RoundedBox>
        </group>
      </group>

      {/* Shoulder joints */}
      <group position={[-0.70, 1.28, 0]}>
        <RoundedBox args={[0.30, 0.24, 0.40]} radius={0.10} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
      </group>
      <group position={[0.70, 1.28, 0]}>
        <RoundedBox args={[0.30, 0.24, 0.40]} radius={0.10} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
      </group>

      {/* Left arm */}
      <group position={[-0.98, 1.0, 0]}>
        <RoundedBox args={[0.36, 0.82, 0.36]} radius={0.12} smoothness={6} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[-0.185, 0.20, 0]} {...h('shoulders')}>
          <mesh scale={[1, 1, 0.72]} castShadow receiveShadow>
            <capsuleGeometry args={[0.125, 0.125, 25, 22]} />
            {badge('shoulders')}
          </mesh>
        </group>
        <group position={[0, 0.00, 0.16]} {...h('biceps')}>
          <RoundedBox args={[0.26, 0.46, 0.26]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('biceps')}
          </RoundedBox>
        </group>
        <group position={[0, 0.04, -0.16]} {...h('triceps')}>
          <RoundedBox args={[0.26, 0.56, 0.26]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('triceps')}
          </RoundedBox>
        </group>
      </group>

      {/* Right arm */}
      <group position={[0.98, 1.0, 0]}>
        <RoundedBox args={[0.36, 0.82, 0.36]} radius={0.12} smoothness={6} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[0.185, 0.20, 0]} {...h('shoulders')}>
          <mesh scale={[1, 1, 0.72]} castShadow receiveShadow>
            <capsuleGeometry args={[0.125, 0.125, 25, 22]} />
            {badge('shoulders')}
          </mesh>
        </group>
        <group position={[0, 0.00, 0.16]} {...h('biceps')}>
          <RoundedBox args={[0.26, 0.46, 0.26]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('biceps')}
          </RoundedBox>
        </group>
        <group position={[0, 0.04, -0.16]} {...h('triceps')}>
          <RoundedBox args={[0.26, 0.56, 0.26]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('triceps')}
          </RoundedBox>
        </group>
      </group>

      {/* Left lower arm */}
      <group position={[-0.98, 0.42, 0]}>
        <RoundedBox args={[0.32, 0.72, 0.32]} radius={0.12} smoothness={6} castShadow receiveShadow>{base}</RoundedBox>
      </group>
      {/* Right lower arm */}
      <group position={[0.98, 0.42, 0]}>
        <RoundedBox args={[0.32, 0.72, 0.32]} radius={0.12} smoothness={6} castShadow receiveShadow>{base}</RoundedBox>
      </group>
      {/* Left wrist */}
      <group position={[-0.98, -0.02, 0]}>
        <RoundedBox args={[0.34, 0.22, 0.34]} radius={0.10} castShadow receiveShadow>{base}</RoundedBox>
      </group>
      {/* Right wrist */}
      <group position={[0.98, -0.02, 0]}>
        <RoundedBox args={[0.34, 0.22, 0.34]} radius={0.10} castShadow receiveShadow>{base}</RoundedBox>
      </group>

      {/* Hips */}
      <group position={[0, 0.52, 0]}>
        <RoundedBox args={[1.06, 0.30, 0.50]} radius={0.12} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[-0.55, 0.10, 0]} {...h('hips')}>
          <RoundedBox args={[0.26, 0.26, 0.40]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('hips')}
          </RoundedBox>
        </group>
        <group position={[0.55, 0.10, 0]} {...h('hips')}>
          <RoundedBox args={[0.26, 0.26, 0.40]} radius={0.12} smoothness={6} castShadow receiveShadow>
            {badge('hips')}
          </RoundedBox>
        </group>
      </group>

      {/* Left thigh */}
      <group position={[-0.40, 0.02, 0]}>
        <RoundedBox args={[0.46, 1.12, 0.46]} radius={0.14} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[0, -0.06, 0.18]} {...h('quads')}>
          <RoundedBox args={[0.36, 0.96, 0.28]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('quads')}
          </RoundedBox>
        </group>
        <group position={[0, 0.00, -0.18]} {...h('hamstrings')}>
          <RoundedBox args={[0.30, 0.74, 0.28]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('hamstrings')}
          </RoundedBox>
        </group>
      </group>
      {/* Right thigh */}
      <group position={[0.40, 0.02, 0]}>
        <RoundedBox args={[0.46, 1.12, 0.46]} radius={0.14} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[0, -0.06, 0.18]} {...h('quads')}>
          <RoundedBox args={[0.36, 0.96, 0.28]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('quads')}
          </RoundedBox>
        </group>
        <group position={[0, 0.00, -0.18]} {...h('hamstrings')}>
          <RoundedBox args={[0.30, 0.74, 0.28]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('hamstrings')}
          </RoundedBox>
        </group>
      </group>

      {/* Left lower leg */}
      <group position={[-0.40, -0.86, 0]}>
        <RoundedBox args={[0.38, 0.92, 0.38]} radius={0.14} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[0, 0, -0.15]} {...h('calves')}>
          <RoundedBox args={[0.28, 0.70, 0.32]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('calves')}
          </RoundedBox>
        </group>
      </group>
      {/* Right lower leg */}
      <group position={[0.40, -0.86, 0]}>
        <RoundedBox args={[0.38, 0.92, 0.38]} radius={0.14} smoothness={7} castShadow receiveShadow>{base}</RoundedBox>
        <group position={[0, 0, -0.15]} {...h('calves')}>
          <RoundedBox args={[0.28, 0.70, 0.32]} radius={0.14} smoothness={6} castShadow receiveShadow>
            {badge('calves')}
          </RoundedBox>
        </group>
      </group>

      {/* Feet */}
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
