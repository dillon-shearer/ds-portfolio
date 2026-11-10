'use server'

import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false
  const allowed = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://datawithdillon.com',
    'https://www.datawithdillon.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[]
  return allowed.some((base) => origin.startsWith(base))
}

function getClientIp(headerList: Headers): string {
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headerList.get('x-real-ip') ?? 'unknown'
}

export type FormResult =
  | { success: true }
  | { error: 'missing' | 'invalid-email' | 'rate-limit' | 'spam' | 'forbidden' | 'send' }

export async function submitContactForm(formData: FormData): Promise<FormResult> {
  const headerList = await headers()
  const origin = headerList.get('origin')
  const referer = headerList.get('referer')

  // Honeypot: bots fill this hidden field
  const honeypot = formData.get('company') as string | null
  if (honeypot && honeypot.trim().length > 0) {
    return { error: 'spam' }
  }

  if (!isAllowedOrigin(origin) && !isAllowedOrigin(referer)) {
    return { error: 'forbidden' }
  }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const message = (formData.get('message') as string | null)?.trim() ?? ''

  if (!name || !email || !message) {
    return { error: 'missing' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'invalid-email' }
  }

  const ip = getClientIp(headerList)
  const rateLimit = await checkRateLimit('contact', ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
  if (!rateLimit.allowed) {
    return { error: 'rate-limit' }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY missing')
    return { error: 'send' }
  }

  const escapedName = escapeHtml(name)
  const escapedEmail = escapeHtml(email)
  const escapedMessage = escapeHtml(message)
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${escapedName}</p>
    <p><strong>Email:</strong> ${escapedEmail}</p>
    <p><strong>Message:</strong></p>
    <div style="padding:15px;margin:10px 0;border-left:3px solid lightgrey;">
      ${escapedMessage.replace(/\n/g, '<br>')}
    </div>
    <hr>
    <p><small>Sent from datawithdillon.com contact form</small></p>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'contact@datawithdillon.com',
        to: 'dillon@datawithdillon.com',
        subject: `New message from ${name.replace(/[\r\n]/g, ' ')}`,
        html,
        reply_to: email,
      }),
    })

    if (response.ok) return { success: true }

    const errorData = await response.text()
    console.error('Resend API error:', response.status, errorData)
    return { error: 'send' }
  } catch (err) {
    console.error('Email sending failed:', err)
    return { error: 'send' }
  }
}
