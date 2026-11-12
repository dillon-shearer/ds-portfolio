import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'
import { runChat, MAX_TOOL_ROUNDS } from '../lib/chat/run.ts'
import { createRegistry } from '../lib/chat/registry.ts'
import { fakeAdapter } from '../lib/chat/fake.ts'
import { availableClouds, getAdapter } from '../lib/chat/clouds.ts'
import { buildSystemPrompt } from '../lib/chat/prompt.ts'

async function collect(options) {
  const events = []
  for await (const event of runChat({ cloud: 'fake', system: 'sys', registry: createRegistry(), ...options })) {
    events.push(event)
  }
  return events
}

function ask(content) {
  return [{ role: 'user', content }]
}

function echoRegistry(calls = []) {
  const registry = createRegistry()
  registry.register({
    name: 'echo',
    description: 'Echo the input',
    input: z.object({ text: z.string() }),
    run: (input) => {
      calls.push(input)
      return { echoed: input.text }
    },
  })
  return registry
}

test('the loop runs a requested tool and feeds the result back to the adapter', async () => {
  const seen = []
  const calls = []
  const adapter = async function* (request) {
    seen.push(request.conversation.map((item) => item.role))
    const toolItem = request.conversation.find((item) => item.role === 'tool')
    if (!toolItem) {
      assert.deepEqual(request.tools.map((tool) => tool.name), ['echo'])
      yield { type: 'tool_call', call: { id: 'c1', name: 'echo', input: { text: 'hi' } } }
      yield { type: 'usage', inputTokens: 10, outputTokens: 2 }
      return
    }
    assert.deepEqual(toolItem.result, { echoed: 'hi' })
    yield { type: 'text', delta: 'Got hi' }
    yield { type: 'usage', inputTokens: 15, outputTokens: 3 }
  }
  const events = await collect({ adapter, messages: ask('echo hi'), registry: echoRegistry(calls) })
  assert.deepEqual(calls, [{ text: 'hi' }])
  assert.deepEqual(seen, [['user'], ['user', 'assistant', 'tool']])
  assert.deepEqual(events.map((event) => event.type), ['tool', 'text', 'done'])
  assert.deepEqual(events[0], { type: 'tool', name: 'echo', result: { echoed: 'hi' } })
  const done = events.at(-1)
  assert.equal(done.cloud, 'fake')
  assert.equal(done.inputTokens, 25)
  assert.equal(done.outputTokens, 5)
  assert.equal(typeof done.responseMs, 'number')
})

test('unknown tools and bad tool input come back as error results, not crashes', async () => {
  const adapter = async function* (request) {
    if (request.conversation.some((item) => item.role === 'tool')) {
      yield { type: 'text', delta: 'ok' }
      return
    }
    yield { type: 'tool_call', call: { id: 'a', name: 'missing', input: {} } }
    yield { type: 'tool_call', call: { id: 'b', name: 'echo', input: { text: 5 } } }
  }
  const events = await collect({ adapter, messages: ask('x'), registry: echoRegistry() })
  const tools = events.filter((event) => event.type === 'tool')
  assert.match(tools[0].result.error, /Unknown tool/)
  assert.equal(tools[1].result.error, 'Invalid tool input')
  assert.equal(events.at(-1).type, 'done')
})

test('the loop stops at the tool round limit', async () => {
  let adapterCalls = 0
  const calls = []
  const adapter = async function* () {
    adapterCalls += 1
    yield { type: 'tool_call', call: { id: `c${adapterCalls}`, name: 'echo', input: { text: 'again' } } }
  }
  const events = await collect({ adapter, messages: ask('loop'), registry: echoRegistry(calls) })
  assert.equal(MAX_TOOL_ROUNDS, 4)
  assert.equal(calls.length, MAX_TOOL_ROUNDS)
  assert.equal(adapterCalls, MAX_TOOL_ROUNDS + 1)
  assert.equal(events.filter((event) => event.type === 'tool').length, MAX_TOOL_ROUNDS)
  assert.equal(events.at(-1).type, 'error')
  assert.ok(!events.some((event) => event.type === 'done'))
})

test('sources pass through to the stream', async () => {
  const sources = [{ title: 'About', path: '/about' }]
  const adapter = async function* () {
    yield { type: 'text', delta: 'Answer' }
    yield { type: 'sources', sources }
  }
  const events = await collect({ adapter, messages: ask('who') })
  assert.deepEqual(events.find((event) => event.type === 'sources'), { type: 'sources', sources })
  assert.equal(events.at(-1).type, 'done')
})

test('an adapter error becomes an error event', async () => {
  const adapter = async function* () {
    yield { type: 'text', delta: 'partial ' }
    throw new Error('boom')
  }
  const original = console.error
  console.error = () => {}
  try {
    const events = await collect({ adapter, messages: ask('x') })
    assert.deepEqual(events.map((event) => event.type), ['text', 'error'])
    assert.ok(!JSON.stringify(events).includes('boom'))
  } finally {
    console.error = original
  }
})

test('the fake adapter scripts an answer with sources, a tool call and an error', async () => {
  const plain = await collect({ adapter: fakeAdapter, messages: ask('Who is Dillon?') })
  assert.ok(plain.some((event) => event.type === 'text'))
  assert.ok(plain.some((event) => event.type === 'sources'))
  const done = plain.at(-1)
  assert.equal(done.type, 'done')
  assert.ok(done.inputTokens > 0 && done.outputTokens > 0)

  const tool = await collect({ adapter: fakeAdapter, messages: ask('Show me the latest video') })
  assert.deepEqual(tool.map((event) => event.type).slice(0, 1), ['tool'])
  assert.equal(tool.at(-1).type, 'done')

  const original = console.error
  console.error = () => {}
  try {
    const failed = await collect({ adapter: fakeAdapter, messages: ask('please error') })
    assert.equal(failed.at(-1).type, 'error')
  } finally {
    console.error = original
  }
})

test('cloud availability follows env vars and hides fake in production', () => {
  assert.deepEqual(availableClouds({}), [])
  assert.deepEqual(availableClouds({ CHAT_FAKE: '1', NODE_ENV: 'development' }), ['fake'])
  assert.deepEqual(availableClouds({ CHAT_FAKE: '1', NODE_ENV: 'production' }), [])
  assert.equal(getAdapter('fake', { CHAT_FAKE: '1', NODE_ENV: 'production' }), null)
  assert.equal(getAdapter('fake', { CHAT_FAKE: '1', NODE_ENV: 'test' }), fakeAdapter)
})

test('the system prompt keeps the voice and decline rules', () => {
  const prompt = buildSystemPrompt({ today: new Date('2026-11-12T00:00:00Z') })
  assert.match(prompt, /2026-11-12/)
  assert.match(prompt, /looking for work/)
  assert.match(prompt, /Pay, salary/)
  assert.match(prompt, /do not know/)
  assert.ok(/^[\x00-\x7F]*$/.test(prompt))
})
