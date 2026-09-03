'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  BANNER_SIZE,
  LOGO_SIZE,
  PROFILE_PLATFORMS,
  STAT_LABELS,
  profileUrl,
  type ChannelStats,
  type PipelineChannel,
} from '@/content/reddit-pipeline'
import styles from './page.module.css'

export function ChannelCarousel({
  channels,
  ariaLabel,
}: {
  channels: PipelineChannel[]
  ariaLabel: string
}) {
  const scrollerRef = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  const syncEnds = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    syncEnds()
    window.addEventListener('resize', syncEnds)
    return () => window.removeEventListener('resize', syncEnds)
  }, [syncEnds])

  function scrollByItem(direction: 1 | -1) {
    const el = scrollerRef.current
    const item = el?.firstElementChild as HTMLElement | undefined
    if (!el || !item) return
    // One item plus the flex gap, so a snap point lands flush with the edge.
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: direction * (item.offsetWidth + gap) })
  }

  return (
    <>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.navArrow}
          aria-label="Previous channel"
          disabled={atStart}
          onClick={() => scrollByItem(-1)}
        >
          &lt;
        </button>
        <button
          type="button"
          className={styles.navArrow}
          aria-label="Next channel"
          disabled={atEnd}
          onClick={() => scrollByItem(1)}
        >
          &gt;
        </button>
      </div>

      <ul
        ref={scrollerRef}
        className={styles.scroller}
        aria-label={ariaLabel}
        onScroll={syncEnds}
      >
        {channels.map((channel) => (
          <li key={channel.key} className={styles.item}>
            <Image
              className={styles.banner}
              src={channel.banner.src}
              alt={channel.banner.alt}
              width={BANNER_SIZE.width}
              height={BANNER_SIZE.height}
              sizes="(min-width: 1080px) 356px, (min-width: 720px) 50vw, 100vw"
            />
            <div className={styles.itemBody}>
              <div className={styles.itemHead}>
                <Image
                  className={styles.logo}
                  src={channel.logo.src}
                  alt={channel.logo.alt}
                  width={LOGO_SIZE.width}
                  height={LOGO_SIZE.height}
                  sizes="48px"
                />
                <h3 className={styles.channelName}>{channel.name}</h3>
              </div>
              <p className={styles.subreddit}>{channel.subreddit}</p>
              {channel.stats ? <ChannelStatsBlock stats={channel.stats} /> : null}
              <ul className={styles.profiles}>
                {PROFILE_PLATFORMS.map((platform) => (
                  <li key={platform}>
                    <a
                      className={styles.profileLink}
                      href={profileUrl(platform, channel.handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {platform}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * Values are preformatted on the server. Nothing here derives a date or an age:
 * the carousel is a client component, and a time computed here would not match
 * what the server rendered.
 */
function ChannelStatsBlock({ stats }: { stats: ChannelStats }) {
  return (
    <div className={styles.stats}>
      <dl className={styles.statList}>
        <dt className={styles.statLabel}>{STAT_LABELS.posted}</dt>
        <dd className={styles.statValue}>{stats.posted}</dd>
        <dt className={styles.statLabel}>{STAT_LABELS.postedLast30Days}</dt>
        <dd className={styles.statValue}>{stats.postedLast30Days}</dd>
        {stats.latestPosted ? (
          <>
            <dt className={styles.statLabel}>{STAT_LABELS.latestPosted}</dt>
            <dd className={styles.statValue}>{stats.latestPosted}</dd>
          </>
        ) : null}
      </dl>
      <p className={styles.statAge}>Updated {stats.captured}</p>
    </div>
  )
}
