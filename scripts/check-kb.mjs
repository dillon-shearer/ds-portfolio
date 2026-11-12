#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'

const KB_DIR = 'kb'
const APP_DIR = 'app'
const MAX_WORDS = 600
const WORD_LIMIT_EXEMPT = new Set(['questions.md'])
const REQUIRED_FIELDS = ['title', 'source', 'summary']

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

function siteRoutes() {
  const routes = new Set()
  for (const file of walk(APP_DIR)) {
    if (!/^page\.(tsx|ts|jsx|js|mdx)$/.test(basename(file))) continue
    const segments = relative(APP_DIR, file).split(sep).slice(0, -1)
    if (segments.some((s) => s.startsWith('[') || s.startsWith('@') || s.startsWith('_'))) continue
    const visible = segments.filter((s) => !(s.startsWith('(') && s.endsWith(')')))
    routes.add('/' + visible.join('/'))
  }
  return routes
}

function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return null
  const fields = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (kv) fields[kv[1]] = kv[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return { fields, body: text.slice(match[0].length) }
}

const routes = siteRoutes()
const files = walk(KB_DIR).filter((f) => f.endsWith('.md'))
const errors = []

if (files.length === 0) errors.push(`${KB_DIR}/ holds no markdown files`)

for (const file of files) {
  const name = relative(KB_DIR, file).split(sep).join('/')
  const parsed = parseFrontMatter(readFileSync(file, 'utf8'))
  if (!parsed) {
    errors.push(`${name}: missing front matter`)
    continue
  }
  for (const field of REQUIRED_FIELDS) {
    if (!parsed.fields[field]) errors.push(`${name}: front matter lacks "${field}"`)
  }
  const source = parsed.fields.source
  if (source && !routes.has(source.split('#')[0].replace(/(.)\/$/, '$1'))) {
    errors.push(`${name}: source "${source}" is not a site route`)
  }
  const words = parsed.body.split(/\s+/).filter(Boolean).length
  if (!WORD_LIMIT_EXEMPT.has(name) && words > MAX_WORDS) {
    errors.push(`${name}: ${words} words, over the ${MAX_WORDS} word limit`)
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error)
  console.error(`\n${errors.length} knowledge base problem(s) found.`)
  process.exit(1)
}
console.log(`OK: ${files.length} knowledge base files pass. Routes: ${[...routes].sort().join(', ')}`)
