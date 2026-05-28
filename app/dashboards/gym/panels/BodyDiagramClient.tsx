'use client'

import dynamic from 'next/dynamic'
import type { BodyPart } from './BodyDiagram'

const BodyDiagramInner = dynamic(() => import('./BodyDiagram'), { ssr: false })

type Props = {
  stats: Record<BodyPart, { volume: number; sets: number }>
  splitCounts: { Push: number; Pull: number; Legs: number }
  className?: string
}

export default function BodyDiagramClient(props: Props) {
  return <BodyDiagramInner {...props} />
}
