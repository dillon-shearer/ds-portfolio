import type { Metadata } from 'next'
import { Button, PageHeader } from '@/components/ui'
import { VideoCard } from '@/components/videos/VideoCard'
import { CHANNEL, FALLBACK_VIDEOS, VIDEOS_PAGE } from '@/content/videos'
import { loadVideos } from '@/lib/videos'
import styles from './page.module.css'

export const metadata: Metadata = VIDEOS_PAGE.metadata

export const revalidate = 3600

export default async function VideosPage() {
  const videos = await loadVideos({ feedUrl: CHANNEL.feedUrl, fallback: FALLBACK_VIDEOS })

  return (
    <div className="page-wrapper--wide">
      <PageHeader
        title={VIDEOS_PAGE.title}
        lead={VIDEOS_PAGE.lead}
        action={
          <Button href={CHANNEL.subscribeUrl} variant="primary" size="md" external>
            {VIDEOS_PAGE.subscribeLabel}
          </Button>
        }
      />
      {videos.length === 0 ? (
        <p className={styles.empty}>{VIDEOS_PAGE.empty}</p>
      ) : (
        <div className={styles.grid} data-video-grid>
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  )
}
