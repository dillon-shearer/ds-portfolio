'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { BodyPart } from '@/lib/gym/body-parts'
import styles from './BodyDiagram.module.css'

const BodyDiagramInner = dynamic(() => import('./BodyDiagram'), { ssr: false })

type Props = {
  stats: Record<BodyPart, { volume: number; sets: number }>
  splitCounts: { Push: number; Pull: number; Legs: number }
  className?: string
}

export default function BodyDiagramClient(props: Props) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div
      className={[styles.container, props.className].filter(Boolean).join(' ')}
      aria-busy={!isVisible}
    >
      {isVisible ? <BodyDiagramInner {...props} /> : null}
    </div>
  )
}
