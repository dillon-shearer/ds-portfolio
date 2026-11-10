import { BIO_PARAGRAPHS } from '@/content/about'
import { KEY_PAGES, SITE, SOCIALS } from '@/content/site'

export const dynamic = 'force-static'

function buildLlmsText() {
  const { locality, region, workMode } = SITE.location
  const lines = [
    `# ${SITE.author}`,
    '',
    `> ${SITE.description}`,
    '',
    `${SITE.author} runs ${SITE.title} (${SITE.url}). Titles: ${SITE.jobTitles.join(', ')}.`,
    `Location: ${locality}, ${region}, United States. ${workMode}`,
    `Areas: ${SITE.knowsAbout.join(', ')}.`,
    '',
    '## Background',
    '',
    ...BIO_PARAGRAPHS.map((p) => `- ${p}`),
    '',
    '## Key pages',
    '',
    ...KEY_PAGES.map((page) => `- [${page.title}](${new URL(page.path, SITE.url).toString()}): ${page.summary}`),
    '',
    '## Elsewhere',
    '',
    `- [GitHub](${SOCIALS.github})`,
    `- [LinkedIn](${SOCIALS.linkedin})`,
    `- [YouTube](${SOCIALS.youtube})`,
    '',
  ]
  return lines.join('\n')
}

export function GET() {
  return new Response(buildLlmsText(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
