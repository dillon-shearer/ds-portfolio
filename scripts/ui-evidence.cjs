#!/usr/bin/env node
/*
 * Scenario-driven UI evidence runner.
 *
 * This is the checked-in extension of the established capture-ui driver. It
 * deliberately keeps Playwright outside package.json: install playwright-core
 * into .ui-evidence/support once, then this runner resolves it from there.
 */
const fs = require('fs')
const http = require('http')
const net = require('net')
const path = require('path')
const { spawn } = require('child_process')

const ROOT = process.cwd()
const SCENARIO_DIR = path.join(ROOT, 'scripts', 'ui-scenarios')
const SUPPORT_DIR = path.join(ROOT, '.ui-evidence', 'support')

function usage(message) {
  if (message) console.error(`ERROR: ${message}`)
  console.error(
    'Usage: npm run ui:evidence -- --scenario <name|all> --task-ref <ref> [--url <url> | --isolated] [--port <port>]',
  )
  process.exit(2)
}

function parseArgs(argv) {
  const out = { scenario: '', taskRef: '', url: '', isolated: false, port: 0 }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--isolated') out.isolated = true
    else if (arg === '--scenario') out.scenario = argv[++index] || ''
    else if (arg === '--task-ref') out.taskRef = argv[++index] || ''
    else if (arg === '--url') out.url = argv[++index] || ''
    else if (arg === '--port') out.port = Number(argv[++index]) || 0
    else if (arg === '--help' || arg === '-h') usage()
    else usage(`Unknown argument ${arg}`)
  }
  if (!out.scenario) usage('A scenario name is required.')
  if (!out.taskRef) usage('A task reference is required for namespaced artifacts.')
  if (out.url && out.isolated) usage('Choose either --url or --isolated, not both.')
  if (!out.url && !out.isolated)
    usage('Provide --url or request an isolated server with --isolated.')
  return out
}

function listScenarioNames() {
  if (!fs.existsSync(SCENARIO_DIR)) return []
  return fs
    .readdirSync(SCENARIO_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.slice(0, -5))
    .sort()
}

function loadScenarios(name) {
  const names = name === 'all' ? listScenarioNames() : name.split(',').map((item) => item.trim())
  if (!names.length) usage('No scenario files were found.')
  return names.map((scenarioName) => {
    const file = path.join(SCENARIO_DIR, `${scenarioName}.json`)
    if (!fs.existsSync(file))
      usage(`Scenario ${scenarioName} was not found in scripts/ui-scenarios.`)
    try {
      const value = JSON.parse(fs.readFileSync(file, 'utf8'))
      validateScenario(value, scenarioName)
      return value
    } catch (error) {
      usage(`Scenario ${scenarioName} is invalid: ${error.message}`)
    }
  })
}

function validateScenario(scenario, requestedName) {
  if (!scenario || typeof scenario !== 'object') throw new Error('expected a JSON object')
  if (scenario.name !== requestedName) throw new Error('name must match its filename')
  if (typeof scenario.route !== 'string' || !scenario.route.startsWith('/')) {
    throw new Error('route must start with /')
  }
  if (!Array.isArray(scenario.viewports) || scenario.viewports.length === 0) {
    throw new Error('viewports must be a non-empty array')
  }
  for (const viewport of scenario.viewports) {
    if (!Number.isInteger(viewport.width) || !Number.isInteger(viewport.height)) {
      throw new Error('every viewport needs integer width and height')
    }
  }
  if (!Array.isArray(scenario.states) || scenario.states.length === 0) {
    throw new Error('states must be a non-empty array')
  }
  for (const state of scenario.states) {
    if (!state.name || !state.ready) throw new Error('every state needs name and ready')
  }
}

function resolveChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const base = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'ms-playwright')
    : null
  if (base && fs.existsSync(base)) {
    const dirs = fs.readdirSync(base).sort().reverse()
    const shell = dirs.find((dir) => dir.startsWith('chromium_headless_shell-'))
    if (shell) {
      const executable = path.join(base, shell, 'chrome-win', 'headless_shell.exe')
      if (fs.existsSync(executable)) return executable
    }
    const chromium = dirs.find((dir) => /^chromium-\d/.test(dir))
    if (chromium) {
      const executable = path.join(base, chromium, 'chrome-win', 'chrome.exe')
      if (fs.existsSync(executable)) return executable
    }
  }
  const desktop = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ]
  return desktop.find((candidate) => fs.existsSync(candidate)) || desktop[0]
}

function resolvePlaywright() {
  const paths = [process.env.UI_EVIDENCE_NODE_PATH, path.join(SUPPORT_DIR, 'node_modules')].filter(
    Boolean,
  )
  for (const searchPath of paths) {
    try {
      return require(require.resolve('playwright-core', { paths: [searchPath] }))
    } catch {
      // Try the next documented support location.
    }
  }
  throw new Error(
    'playwright-core is unavailable. Run npm install --prefix .ui-evidence/support playwright-core once, outside package.json.',
  )
}

function focusSnapshot(page) {
  return page.evaluate(`(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { tag: 'body', label: '', visibleFocusRing: false };
    const style = getComputedStyle(el);
    const opaque = (color) => !/^transparent$|,\\s*0\\s*\\)/.test(String(color).trim());
    const outlined = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 && opaque(style.outlineColor);
    const shadowed = style.boxShadow !== 'none' && style.boxShadow !== '' && opaque(style.boxShadow);
    const label = String(el.getAttribute('aria-label') || el.innerText || el.value || el.placeholder || '')
      .trim().replace(/\\s+/g, ' ').slice(0, 80);
    return { tag: el.tagName.toLowerCase(), label, visibleFocusRing: outlined || shadowed };
  })()`)
}

function makeUrl(baseUrl, route) {
  return new URL(route, baseUrl).toString()
}

function artifactPath(root, taskRef, scenario, width, state, suffix = '') {
  const name = `${taskRef}-${scenario}-${width}-${state}${suffix ? `-${suffix}` : ''}.png`
  return path.join(root, name)
}

async function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      server.close((error) => (error ? reject(error) : resolve(port)))
    })
  })
}

async function waitsForHttp(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs
  let lastError = 'no response'
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.status < 500) return
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error.message
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`isolated server did not become reachable: ${lastError}`)
}

async function startIsolatedServer(port, logFile) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true })
  const output = fs.openSync(logFile, 'w')
  const nextCli = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next')
  if (!fs.existsSync(nextCli)) {
    fs.closeSync(output)
    throw new Error(
      'Next.js is unavailable in this worktree. Install project dependencies before requesting --isolated.',
    )
  }
  const child = spawn(process.execPath, [nextCli, 'dev', '--turbopack', '--port', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', output, output],
    windowsHide: true,
  })
  try {
    await waitsForHttp(`http://127.0.0.1:${port}/`)
  } catch (error) {
    child.kill()
    fs.closeSync(output)
    throw error
  }
  return { child, output, url: `http://127.0.0.1:${port}` }
}

async function stopIsolatedServer(server) {
  if (!server) return
  server.child.kill('SIGTERM')
  await new Promise((resolve) => server.child.once('exit', resolve))
  fs.closeSync(server.output)
}

async function installNetworkMocks(page, mocks) {
  const installed = []
  for (const mock of mocks || []) {
    const handler = async (route) => {
      if (mock.delayMs) await new Promise((resolve) => setTimeout(resolve, mock.delayMs))
      if (mock.abort) return route.abort(mock.abort)
      return route.fulfill({
        status: mock.status || 200,
        contentType: mock.contentType || 'application/json',
        body: typeof mock.body === 'string' ? mock.body : JSON.stringify(mock.body || {}),
      })
    }
    await page.route(mock.url, handler)
    installed.push({ url: mock.url, handler })
  }
  return installed
}

async function removeNetworkMocks(page, installed) {
  for (const mock of installed) await page.unroute(mock.url, mock.handler)
}

async function performAction(page, action, report) {
  const timeout = action.timeout || 15000
  if (action.action === 'click') return page.click(action.selector, { timeout })
  if (action.action === 'fill') return page.fill(action.selector, action.value, { timeout })
  if (action.action === 'press') return page.keyboard.press(action.key)
  if (action.action === 'wait') {
    if (action.selector)
      return page.waitForSelector(action.selector, { state: action.state || 'visible', timeout })
    throw new Error('wait requires selector, use a state readiness marker instead of elapsed time')
  }
  if (action.action === 'focus') {
    await page.focus(action.selector, { timeout })
    const focus = await focusSnapshot(page)
    report.keyboard.push({ kind: 'focus', ...focus })
    if (!focus.visibleFocusRing)
      throw new Error(`focus is not visibly indicated on ${focus.tag} ${focus.label}`)
    return
  }
  if (action.action === 'tabs') {
    const seen = []
    for (let index = 0; index < action.count; index += 1) {
      await page.keyboard.press('Tab')
      const focus = await focusSnapshot(page)
      seen.push(focus)
      if (!focus.visibleFocusRing)
        throw new Error(`Tab ${index + 1} has no visible focus on ${focus.tag} ${focus.label}`)
    }
    report.keyboard.push({ kind: 'tabs', stops: seen })
    return
  }
  if (action.action === 'fetch') {
    const href = await page.locator(action.selector).getAttribute('href', { timeout })
    if (!href) throw new Error(`${action.selector} has no href`)
    const result = await page.evaluate(async (url) => {
      const response = await fetch(url)
      return {
        status: response.status,
        contentType: response.headers.get('content-type') || '',
        body: await response.text(),
      }
    }, href)
    if (result.status !== (action.status || 200))
      throw new Error(`${href} returned ${result.status}, expected ${action.status || 200}`)
    const expectedIncludes = Array.isArray(action.includes)
      ? action.includes
      : [action.includes].filter(Boolean)
    for (const expected of expectedIncludes) {
      if (!result.body.includes(expected)) throw new Error(`${href} did not include ${expected}`)
    }
    report.assertions.push({
      kind: 'fetch',
      selector: action.selector,
      href,
      ...result,
      passed: true,
    })
    return
  }
  if (action.action === 'assert') return assertCondition(page, action, report)
  throw new Error(`unknown action ${JSON.stringify(action.action)}`)
}

async function assertCondition(page, assertion, report) {
  const timeout = assertion.timeout || 15000
  if (assertion.kind === 'visible') {
    await page.waitForSelector(assertion.selector, { state: 'visible', timeout })
    report.assertions.push({ ...assertion, passed: true })
    return
  }
  if (assertion.kind === 'count') {
    const count = await page.locator(assertion.selector).count()
    if (count !== assertion.equals)
      throw new Error(`${assertion.selector} count was ${count}, expected ${assertion.equals}`)
    report.assertions.push({ ...assertion, actual: count, passed: true })
    return
  }
  if (assertion.kind === 'text') {
    const text = await page.locator(assertion.selector).innerText({ timeout })
    if (!text.includes(assertion.includes))
      throw new Error(`${assertion.selector} did not include ${assertion.includes}`)
    report.assertions.push({ ...assertion, actual: text, passed: true })
    return
  }
  if (assertion.kind === 'eval') {
    const value = await page.evaluate(assertion.expression)
    if (value !== assertion.equals)
      throw new Error(
        `eval ${assertion.expression} was ${JSON.stringify(value)}, expected ${JSON.stringify(assertion.equals)}`,
      )
    report.assertions.push({ ...assertion, actual: value, passed: true })
    return
  }
  throw new Error(`unknown assertion kind ${JSON.stringify(assertion.kind)}`)
}

async function runScenario(browser, scenario, baseUrl, taskRef, runRoot, report) {
  const scenarioRoot = path.join(runRoot, scenario.name)
  fs.mkdirSync(scenarioRoot, { recursive: true })
  for (const viewport of scenario.viewports) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: scenario.reducedMotion ? 'reduce' : 'no-preference',
    })
    const page = await context.newPage()
    const consoleErrors = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => consoleErrors.push(String(error)))
    for (const state of scenario.states) {
      const stateReport = {
        scenario: scenario.name,
        state: state.name,
        viewport,
        assertions: [],
        keyboard: [],
        captures: [],
        consoleErrors,
      }
      report.runs.push(stateReport)
      const mocks = await installNetworkMocks(page, state.network)
      try {
        await page.goto(makeUrl(baseUrl, state.route || scenario.route), {
          waitUntil: state.waitUntil || 'load',
          timeout: state.timeout || 30000,
        })
        const actualWidth = await page.evaluate('window.innerWidth')
        if (actualWidth !== viewport.width)
          throw new Error(`viewport asked for ${viewport.width}, browser reported ${actualWidth}`)
        stateReport.viewportVerified = actualWidth
        await page.waitForSelector(state.ready, {
          state: 'visible',
          timeout: state.timeout || 15000,
        })
        for (const assertion of state.assertions || [])
          await assertCondition(page, assertion, stateReport)
        const initialPath = artifactPath(
          scenarioRoot,
          taskRef,
          scenario.name,
          viewport.width,
          state.name,
        )
        await page.screenshot({ path: initialPath, fullPage: state.fullPage !== false })
        if (!fs.statSync(initialPath).size) throw new Error(`capture was empty: ${initialPath}`)
        stateReport.captures.push(initialPath)
        for (const action of state.actions || []) await performAction(page, action, stateReport)
        if ((state.actions || []).length) {
          const focusPath = artifactPath(
            scenarioRoot,
            taskRef,
            scenario.name,
            viewport.width,
            state.name,
            'focus',
          )
          await page.screenshot({ path: focusPath, fullPage: state.fullPage !== false })
          if (!fs.statSync(focusPath).size) throw new Error(`capture was empty: ${focusPath}`)
          stateReport.captures.push(focusPath)
        }
        stateReport.status = 'passed'
      } catch (error) {
        stateReport.status = 'failed'
        stateReport.error = error.message
        report.failures.push(`${scenario.name}/${state.name}/${viewport.width}: ${error.message}`)
      } finally {
        await removeNetworkMocks(page, mocks)
      }
    }
    await context.close()
  }
}

function evidence(report) {
  const artifacts = report.runs.flatMap((run) => run.captures)
  const scenarios = [...new Set(report.runs.map((run) => `${run.scenario}:${run.state}`))].join(
    ', ',
  )
  const viewports = [...new Set(report.runs.map((run) => run.viewport.width))]
    .sort((a, b) => a - b)
    .join(', ')
  const keyboard = report.runs.some((run) => run.keyboard.length)
    ? 'visible focus verified through the declared Tab sequence'
    : 'not requested by these scenarios'
  const consoleErrors = [...new Set(report.runs.flatMap((run) => run.consoleErrors))]
  return [
    'VISUAL EVIDENCE',
    `Routes/scenarios: ${scenarios}`,
    `Viewports:        ${viewports} CSS px`,
    `States:           ${[...new Set(report.runs.map((run) => run.state))].join(', ')}`,
    `Keyboard:         ${keyboard}`,
    `Artifacts:        ${artifacts.join(', ') || 'none'}`,
    `Console errors:   ${consoleErrors.length ? JSON.stringify(consoleErrors) : 'none'}`,
    'Rubric (v1):      N/A, evidence harness, score the UI ticket that consumes this report',
    `Critical defects: ${report.failures.length ? report.failures.join(' | ') : 'none'}`,
    `Result:           ${report.toolUnavailable || report.failures.length ? 'FAIL, incomplete capture' : 'PASS, all declared evidence completed'}`,
    'Largest defect fixed: none, initial harness capture',
    `Limitations:      ${report.limitations.length ? report.limitations.join(' | ') : 'none'}`,
  ].join('\n')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const scenarios = loadScenarios(options.scenario)
  const runRoot = path.join(ROOT, '.ui-evidence', options.taskRef)
  fs.mkdirSync(runRoot, { recursive: true })
  const report = {
    taskRef: options.taskRef,
    startedAt: new Date().toISOString(),
    runs: [],
    failures: [],
    limitations: [],
    scenarios: scenarios.map((scenario) => scenario.name),
  }
  let server
  let browser
  try {
    const port = options.port || (options.isolated ? await findOpenPort() : 0)
    server = options.isolated
      ? await startIsolatedServer(port, path.join(runRoot, 'server.log'))
      : null
    const baseUrl = options.url || server.url
    const chrome = resolveChrome()
    if (!fs.existsSync(chrome))
      throw new Error(
        `Chrome was not found at ${chrome}. Set CHROME_PATH to a Chrome or Chromium executable.`,
      )
    const { chromium } = resolvePlaywright()
    browser = await chromium.launch({ executablePath: chrome, headless: true })
    for (const scenario of scenarios)
      await runScenario(browser, scenario, baseUrl, options.taskRef, runRoot, report)
  } catch (error) {
    report.limitations.push(error.message)
    report.toolUnavailable = true
  } finally {
    if (browser) await browser.close()
    await stopIsolatedServer(server)
    report.finishedAt = new Date().toISOString()
    const reportPath = path.join(runRoot, `${options.taskRef}-report.json`)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`REPORT ${reportPath}`)
    console.log(evidence(report))
  }
  process.exit(report.toolUnavailable ? 2 : report.failures.length ? 1 : 0)
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(2)
})
