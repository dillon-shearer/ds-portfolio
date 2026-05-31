// app/koreader-remote/SwipeShell.tsx
'use client'

import { useRef } from 'react'
import styles from './SwipeShell.module.css'
import type { KoreaderActionId } from '@/lib/koreader/client'

const MIN_SWIPE_PX = 40

export function SwipeShell({ children }: { children: React.ReactNode }) {
  const swipeRef = useRef<{ startX: number; width: number } | null>(null)

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!event.touches[0]) return
    swipeRef.current = {
      startX: event.touches[0].clientX,
      width: event.currentTarget.clientWidth,
    }
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const swipe = swipeRef.current
    swipeRef.current = null
    if (!swipe || !event.changedTouches[0]) return
    const deltaX = event.changedTouches[0].clientX - swipe.startX
    if (Math.abs(deltaX) < MIN_SWIPE_PX) return
    const startArea = swipe.startX < swipe.width / 2 ? 'left' : 'right'
    const action: KoreaderActionId | null =
      startArea === 'left' && deltaX > 0
        ? 'prev'
        : startArea === 'right' && deltaX < 0
          ? 'next'
          : null
    if (!action) return
    window.dispatchEvent(
      new CustomEvent('koreader-swipe', { detail: { action } }),
    )
  }

  return (
    <div
      className={styles.shell}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}
