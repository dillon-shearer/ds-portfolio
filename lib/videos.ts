export interface ChannelVideo {
  id: string
  title: string
  published: string
  duration?: string
  description: string
}

type FetchLike = (input: string, init?: RequestInit & { next?: { revalidate?: number } }) => Promise<Response>

interface FeedEntry extends ChannelVideo {
  link: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const VIDEO_REVALIDATE_SECONDS = 3600

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .trim()
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`))
  return match ? decodeXml(match[1]) : ''
}

export function parseFeed(xml: string): FeedEntry[] {
  const entries: FeedEntry[] = []
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const block = match[1]
    const id = tag(block, 'yt:videoId')
    const title = tag(block, 'title')
    const published = tag(block, 'published').slice(0, 10)
    if (!id || !title || !/^\d{4}-\d{2}-\d{2}$/.test(published)) continue
    const link = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1] ?? ''
    entries.push({ id, title, published, description: tag(block, 'media:description'), link: decodeXml(link) })
  }
  return entries
}

export function sortNewestFirst(videos: ChannelVideo[]) {
  return [...videos].sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : 0))
}

export async function classifyShort(id: string, fetchImpl: FetchLike): Promise<boolean | null> {
  try {
    const res = await fetchImpl(`https://www.youtube.com/shorts/${encodeURIComponent(id)}`, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
      next: { revalidate: VIDEO_REVALIDATE_SECONDS },
    })
    if (res.status === 200) return true
    if (res.status >= 300 && res.status < 400) return false
    return null
  } catch {
    return null
  }
}

export async function loadVideos({
  feedUrl,
  fallback,
  fetchImpl = fetch,
}: {
  feedUrl: string
  fallback: ChannelVideo[]
  fetchImpl?: FetchLike
}): Promise<ChannelVideo[]> {
  const known = new Map(fallback.map((video) => [video.id, video]))
  let entries: FeedEntry[] = []

  try {
    const res = await fetchImpl(feedUrl, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: VIDEO_REVALIDATE_SECONDS },
    })
    if (res.ok) entries = parseFeed(await res.text())
  } catch {
    entries = []
  }

  const fromFeed = await Promise.all(
    entries.map(async (entry): Promise<ChannelVideo | null> => {
      const base = known.get(entry.id)
      if (!base) {
        if (entry.link.includes('/shorts/')) return null
        if ((await classifyShort(entry.id, fetchImpl)) !== false) return null
      }
      return {
        id: entry.id,
        title: entry.title,
        published: entry.published,
        duration: base?.duration,
        description: entry.description || base?.description || '',
      }
    }),
  )

  const merged = new Map<string, ChannelVideo>()
  for (const video of fallback) merged.set(video.id, video)
  for (const video of fromFeed) if (video) merged.set(video.id, video)

  return sortNewestFirst([...merged.values()])
}

export function formatVideoDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

export function thumbnailUrl(id: string, size: 'maxresdefault' | 'hqdefault') {
  return `https://i.ytimg.com/vi/${id}/${size}.jpg`
}

export function watchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`
}

export function embedUrl(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
}
