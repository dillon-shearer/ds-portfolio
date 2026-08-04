#!/usr/bin/env node
// Fails (exit 1) if any tracked source/content file contains a non-ASCII byte.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const EXTENSIONS = ['.ts', '.tsx', '.css', '.md', '.mjs', '.sql']
const EXCLUDED_PREFIXES = ['.claude/', 'brain/', 'public/']

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => EXTENSIONS.some((ext) => f.endsWith(ext)))
  .filter((f) => f !== 'package-lock.json')
  .filter((f) => !EXCLUDED_PREFIXES.some((p) => f.startsWith(p)))

let violations = 0
for (const file of files) {
  const bytes = readFileSync(file)
  let line = 1
  let col = 1
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    if (b > 0x7f) {
      // Decode the full UTF-8 codepoint at this byte for a readable report,
      // then skip its continuation bytes so one glyph reports once.
      let len = 1
      if (b >= 0xf0) len = 4
      else if (b >= 0xe0) len = 3
      else if (b >= 0xc0) len = 2
      const char = bytes.slice(i, i + len).toString('utf8')
      const cp = char.codePointAt(0)
      console.error(
        `${file}:${line}:${col} non-ASCII U+${cp.toString(16).toUpperCase().padStart(4, '0')} ${JSON.stringify(char)}`
      )
      violations++
      i += len - 1
      col++
    } else if (b === 0x0a) {
      line++
      col = 1
    } else {
      col++
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} non-ASCII character(s) found.`)
  process.exit(1)
}
console.log(`OK: ${files.length} files are ASCII-only.`)
