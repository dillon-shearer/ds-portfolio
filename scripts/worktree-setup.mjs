import { createHash } from 'node:crypto'
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, renameSync, rmSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

if (!existsSync('package.json')) process.exit(0)

const cacheRoot = join(homedir(), '.kanban95', 'cache', 'portfolio-node_modules')
const hash = createHash('sha256').update(readFileSync('package-lock.json')).digest('hex')
const cacheDir = join(cacheRoot, hash)
const cachedModules = join(cacheDir, 'node_modules')

function log(message) {
  console.log(`[worktree-setup] ${message}`)
}

function robocopy(from, to) {
  const result = spawnSync(
    'robocopy',
    [from, to, '/E', '/MT:32', '/R:1', '/W:1', '/NFL', '/NDL', '/NJH', '/NJS', '/NP'],
    { stdio: 'inherit' },
  )
  if (result.error) throw result.error
  if (result.status === null || result.status >= 8) throw new Error(`robocopy exit ${result.status}`)
}

function installed(dir) {
  return existsSync(join(dir, '.package-lock.json')) && existsSync(join(dir, '.bin'))
}

function npmCi() {
  execSync('npm ci --prefer-offline --no-audit --no-fund', { stdio: 'inherit' })
}

function restore() {
  if (!installed(cachedModules)) return false
  try {
    log(`cache hit ${hash}`)
    robocopy(cachedModules, 'node_modules')
    if (!installed('node_modules')) throw new Error('copied node_modules is incomplete')
    return true
  } catch (error) {
    log(`cache copy failed: ${error.message}`)
    rmSync('node_modules', { recursive: true, force: true })
    return false
  }
}

function save() {
  const temp = join(cacheRoot, `tmp-${hash}-${process.pid}-${Date.now()}`)
  try {
    mkdirSync(temp, { recursive: true })
    robocopy('node_modules', join(temp, 'node_modules'))
    if (!installed(join(temp, 'node_modules'))) throw new Error('cache copy is incomplete')
    if (installed(cachedModules)) {
      rmSync(temp, { recursive: true, force: true })
    } else {
      rmSync(cacheDir, { recursive: true, force: true })
      renameSync(temp, cacheDir)
      log(`cache saved ${hash}`)
    }
  } catch (error) {
    log(`cache save failed: ${error.message}`)
    rmSync(temp, { recursive: true, force: true })
    return
  }
  for (const name of readdirSync(cacheRoot)) {
    if (name === hash || name.startsWith('tmp-')) continue
    try {
      rmSync(join(cacheRoot, name), { recursive: true, force: true })
    } catch (error) {
      log(`could not remove old cache ${name}: ${error.message}`)
    }
  }
}

if (!restore()) {
  log('running npm ci')
  npmCi()
  save()
}
