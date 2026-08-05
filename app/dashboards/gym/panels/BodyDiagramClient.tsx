'use client'

import { useEffect, useRef, useState } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setIsVisible(true)
        observer.disconnect()
      },
      { rootMargin: '160px 0px' },
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  if (!isVisible) {
    return <div ref={containerRef} className={styles.container} aria-busy="true" />
  }

  return <BodyDiagramInner {...props} />
}
