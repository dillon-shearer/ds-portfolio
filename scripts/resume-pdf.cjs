#!/usr/bin/env node
/*
 * Prints /resume to public/resumes/Dillon_Shearer_Resume.pdf.
 *
 * There is no PDF generator dependency in this repo and there should not be:
 * the resume PDF is just the resume page printed, so this reuses the browser
 * and isolated-server helpers already checked in for the UI evidence runner.
 *
 * Usage: node scripts/resume-pdf.cjs [--out <path>] [--url <base-url>]
 */
const fs = require('fs')
const path = require('path')
const {
  findOpenPort,
  resolveChrome,
  resolvePlaywright,
  startIsolatedServer,
  stopIsolatedServer,
} = require('./ui-evidence.cjs')

const ROOT = process.cwd()
const DEFAULT_OUT = path.join(ROOT, 'public', 'resumes', 'Dillon_Shearer_Resume.pdf')

// Single source of truth for the canonical origin lives in content/site.ts.
function siteUrl() {
  const source = fs.readFileSync(path.join(ROOT, 'content', 'site.ts'), 'utf8')
  const match = /url:\s*'([^']+)'/.exec(source)
  if (!match) throw new Error('Could not read SITE.url from content/site.ts.')
  return match[1].replace(/\/$/, '')
}

function parseArgs(argv) {
  const out = { out: DEFAULT_OUT, url: '' }
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out') out.out = path.resolve(argv[++index] || '')
    else if (argv[index] === '--url') out.url = argv[++index] || ''
    else {
      console.error(`Unknown argument ${argv[index]}`)
      process.exit(2)
    }
  }
  return out
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const origin = siteUrl()
  const chrome = resolveChrome()
  if (!fs.existsSync(chrome))
    throw new Error(
      `Chrome was not found at ${chrome}. Set CHROME_PATH to a Chrome or Chromium executable.`,
    )
  let server
  let browser
  try {
    server = options.url
      ? null
      : await startIsolatedServer(
          await findOpenPort(),
          path.join(ROOT, '.ui-evidence', 'resume-pdf', 'server.log'),
        )
    const baseUrl = options.url || server.url
    const { chromium } = resolvePlaywright()
    browser = await chromium.launch({ executablePath: chrome, headless: true })
    const page = await browser.newPage()
    await page.goto(`${baseUrl}/resume`, { waitUntil: 'networkidle' })
    await page.waitForSelector('h2#projects-heading')
    // Relative hrefs would resolve to the throwaway localhost server inside the
    // PDF, so rewrite them to the canonical origin before printing.
    await page.evaluate(`(() => {
      for (const anchor of document.querySelectorAll('a[href^="/"]')) {
        anchor.setAttribute('href', ${JSON.stringify(origin)} + anchor.getAttribute('href'))
      }
    })()`)
    await page.emulateMedia({ media: 'print' })
    fs.mkdirSync(path.dirname(options.out), { recursive: true })
    await page.pdf({
      path: options.out,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    })
    const { size } = fs.statSync(options.out)
    if (!size) throw new Error(`PDF was empty: ${options.out}`)
    console.log(`WROTE ${options.out} (${size} bytes)`)
  } finally {
    if (browser) await browser.close()
    await stopIsolatedServer(server)
  }
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(2)
})
