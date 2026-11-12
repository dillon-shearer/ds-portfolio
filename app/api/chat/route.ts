import { NextResponse } from 'next/server'
import { z } from 'zod'
import { availableClouds, getAdapter, isCloudId } from '@/lib/chat/clouds'
import { buildSystemPrompt } from '@/lib/chat/prompt'
import { toolRegistry } from '@/lib/chat/registry'
import { runChat } from '@/lib/chat/run'
import type { StreamEvent } from '@/lib/chat/types'
import { isAllowedOrigin } from '@/lib/origin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

const bodySchema = z.object({
  cloud: z.string(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
      }),
    )
    .min(1)
    .max(MAX_MESSAGES)
    .refine((messages) => messages[messages.length - 1]?.role === 'user', 'The last message must be from the user'),
})

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

export function GET() {
  return NextResponse.json(availableClouds(), { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request.headers.get('origin')) && !isAllowedOrigin(request.headers.get('referer'))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return badRequest('invalid-json')
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) return badRequest('invalid-body')

  const { cloud, messages } = parsed.data
  if (!isCloudId(cloud)) return badRequest('unknown-cloud')
  const adapter = getAdapter(cloud)
  if (!adapter) return badRequest('cloud-unavailable')

  const encoder = new TextEncoder()
  const events = runChat({
    cloud,
    adapter,
    messages,
    system: buildSystemPrompt(),
    registry: toolRegistry,
    signal: request.signal,
  })

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const next = await events.next()
      if (next.done) {
        controller.close()
        return
      }
      const event: StreamEvent = next.value
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    },
    async cancel() {
      await events.return(undefined)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
