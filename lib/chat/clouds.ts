import type { ChatAdapter } from './adapter.ts'
import { fakeAdapter } from './fake.ts'
import { CLOUD_IDS, type CloudId } from './types.ts'

type Env = Record<string, string | undefined>

export const CLOUD_ENV: Record<Exclude<CloudId, 'fake'>, string[]> = {
  aws: ['CHAT_AWS_REGION', 'CHAT_AWS_MODEL_ID', 'CHAT_AWS_KB_ID'],
  azure: ['CHAT_AZURE_OPENAI_ENDPOINT', 'CHAT_AZURE_OPENAI_KEY', 'CHAT_AZURE_SEARCH_ENDPOINT', 'CHAT_AZURE_SEARCH_KEY'],
}

const ADAPTERS: Partial<Record<CloudId, ChatAdapter>> = {
  fake: fakeAdapter,
}

export function isCloudId(value: unknown): value is CloudId {
  return typeof value === 'string' && (CLOUD_IDS as readonly string[]).includes(value)
}

export function isCloudAvailable(cloud: CloudId, env: Env = process.env): boolean {
  if (!ADAPTERS[cloud]) return false
  if (cloud === 'fake') return env.CHAT_FAKE === '1' && env.NODE_ENV !== 'production'
  return CLOUD_ENV[cloud].every((name) => Boolean(env[name]))
}

export function availableClouds(env: Env = process.env): CloudId[] {
  return CLOUD_IDS.filter((cloud) => isCloudAvailable(cloud, env))
}

export function getAdapter(cloud: CloudId, env: Env = process.env): ChatAdapter | null {
  return isCloudAvailable(cloud, env) ? (ADAPTERS[cloud] ?? null) : null
}
