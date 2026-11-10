'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { ChannelVideo } from '@/lib/videos'
import { embedUrl, formatVideoDate, thumbnailUrl, watchUrl } from '@/lib/videos'
import styles from './VideoCard.module.css'

interface VideoCardProps {
  video: ChannelVideo
  layout?: 'grid' | 'strip'
  headingLevel?: 'h2' | 'h3'
}

export function VideoCard({ video, layout = 'grid', headingLevel = 'h2' }: VideoCardProps) {
  const [playing, setPlaying] = useState(false)
  const [src, setSrc] = useState(thumbnailUrl(video.id, 'maxresdefault'))
  const Heading = headingLevel

  function play(event?: React.MouseEvent) {
    event?.preventDefault()
    setPlaying(true)
  }

  return (
    <article className={`${styles.card} ${layout === 'strip' ? styles.strip : ''}`} data-video-card={video.id}>
      {playing ? (
        <div className={styles.thumb}>
          <iframe
            src={embedUrl(video.id)}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <button
          type="button"
          className={styles.thumb}
          onClick={() => play()}
          aria-label={`Play ${video.title}`}
          data-video-play
        >
          <Image
            src={src}
            alt=""
            width={1280}
            height={720}
            unoptimized
            sizes="(min-width: 1080px) 33vw, (min-width: 720px) 50vw, 100vw"
            onError={() => setSrc(thumbnailUrl(video.id, 'hqdefault'))}
          />
          <span className={styles.playIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          {video.duration && <span className={styles.duration}>{video.duration}</span>}
        </button>
      )}
      <div className={styles.body}>
        <Heading className={styles.title}>
          <a href={watchUrl(video.id)} target="_blank" rel="noopener noreferrer" onClick={play}>
            {video.title}
          </a>
        </Heading>
        <p className={styles.meta}>
          <time dateTime={video.published}>{formatVideoDate(video.published)}</time>
        </p>
      </div>
    </article>
  )
}
