import assert from 'node:assert/strict'
import test from 'node:test'
import { loadVideos, parseFeed, formatVideoDate } from '../lib/videos.ts'

const FALLBACK = [
  {
    id: 'Lr1pzc2-U8g',
    title: '[Rainy Day Vibe Coding] Building a Brand Skill with AI Agents',
    published: '2026-11-04',
    duration: '1:23:52',
    description: 'Fallback description.',
  },
]

const FEED_URL = 'https://example.test/feed.xml'

function entry(id, title, published, link) {
  return `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title><link rel="alternate" href="${link}"/><published>${published}T12:00:00+00:00</published><media:group><media:description>Desc ${id}</media:description></media:group></entry>`
}

function fakeFetch(feedBody, shortStatus = {}) {
  return async (url) => {
    if (url === FEED_URL) {
      if (feedBody === null) throw new Error('unreachable')
      return new Response(feedBody, { status: typeof feedBody === 'number' ? feedBody : 200 })
    }
    const id = url.split('/shorts/')[1]
    if (id in shortStatus) return new Response(null, { status: shortStatus[id] })
    throw new Error('network')
  }
}

test('feed unreachable returns the fallback list', async () => {
  const videos = await loadVideos({ feedUrl: FEED_URL, fallback: FALLBACK, fetchImpl: fakeFetch(null) })
  assert.deepEqual(videos, FALLBACK)
})

test('feed 404 or empty returns the fallback list', async () => {
  assert.deepEqual(await loadVideos({ feedUrl: FEED_URL, fallback: FALLBACK, fetchImpl: fakeFetch(404) }), FALLBACK)
  assert.deepEqual(await loadVideos({ feedUrl: FEED_URL, fallback: FALLBACK, fetchImpl: fakeFetch('<feed></feed>') }), FALLBACK)
})

test('feed videos merge with the fallback newest first, shorts and unknown entries dropped', async () => {
  const xml = `<feed>${[
    entry('newVideo01', 'New &amp; better', '2026-12-01', 'https://www.youtube.com/watch?v=newVideo01'),
    entry('shortLink1', 'Short by link', '2026-12-02', 'https://www.youtube.com/shorts/shortLink1'),
    entry('shortProbe', 'Short by probe', '2026-12-03', 'https://www.youtube.com/watch?v=shortProbe'),
    entry('unknownOne', 'Cannot tell', '2026-12-04', 'https://www.youtube.com/watch?v=unknownOne'),
    entry('Lr1pzc2-U8g', '[Rainy Day Vibe Coding] Building a Brand Skill with AI Agents', '2026-11-04', 'https://www.youtube.com/watch?v=Lr1pzc2-U8g'),
  ].join('')}</feed>`
  const videos = await loadVideos({
    feedUrl: FEED_URL,
    fallback: FALLBACK,
    fetchImpl: fakeFetch(xml, { newVideo01: 303, shortProbe: 200 }),
  })
  assert.deepEqual(videos.map((v) => v.id), ['newVideo01', 'Lr1pzc2-U8g'])
  assert.equal(videos[0].title, 'New & better')
  assert.equal(videos[1].duration, '1:23:52')
})

test('parseFeed skips entries without an id or date', () => {
  assert.equal(parseFeed('<entry><title>x</title></entry>').length, 0)
})

test('formatVideoDate', () => {
  assert.equal(formatVideoDate('2026-11-04'), 'Nov 4, 2026')
})
