'use client'

import { useState } from 'react'
import { Input, Button } from '@/components/ui'
import { submitContactForm, type FormResult } from './actions'
import styles from './page.module.css'

type Status = 'idle' | 'sending' | FormResult

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const formData = new FormData(e.currentTarget)
    const result = await submitContactForm(formData)
    setStatus(result)
    if ('success' in result && result.success) {
      (e.target as HTMLFormElement).reset()
    }
  }

  const messages: Record<string, string> = {
    'missing': 'Please fill in all required fields.',
    'invalid-email': 'Please enter a valid email address.',
    'rate-limit': 'You\u2019ve reached the hourly limit. Try again later or email me directly.',
    'spam': 'Something felt off about that submission. Please try again.',
    'forbidden': 'Please submit the form from datawithdillon.com.',
    'send': 'Something went wrong. Please try again or email me directly at dillon@datawithdillon.com.',
  }

  const isSuccess = typeof status === 'object' && 'success' in status
  const errorKey = typeof status === 'object' && 'error' in status ? status.error : null

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {/* Honeypot */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: 'none' }}
        autoComplete="off"
      />

      {isSuccess && (
        <p className={styles.successMsg} role="status">
          Thanks for your message. I'll get back to you soon.
        </p>
      )}

      {errorKey && (
        <p className={styles.errorMsg} role="alert">
          {messages[errorKey]}
        </p>
      )}

      <div className={styles.fields}>
        <Input label="Name" name="name" required />
        <Input label="Email" name="email" type="email" required />
        <Input label="Message" name="message" as="textarea" required />
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Sending\u2026' : 'Send message'}
      </Button>
    </form>
  )
}
