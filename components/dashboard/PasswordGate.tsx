'use client'

import { useState, useEffect } from 'react'
import { verifyLiftPassword } from '@/app/dashboards/gym/actions'
import styles from './PasswordGate.module.css'

type Props = {
  children: React.ReactNode
  storageKey?: string
}

export default function PasswordGate({ children, storageKey = 'gym-gate' }: Props) {
  const [authed, setAuthed] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === '1') {
      setAuthed(true)
    }
  }, [storageKey])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const ok = await verifyLiftPassword(input)
    setLoading(false)
    if (ok) {
      sessionStorage.setItem(storageKey, '1')
      setAuthed(true)
    } else {
      setError('Incorrect password.')
      setInput('')
    }
  }

  if (authed) return <>{children}</>

  return (
    <div className={styles.gate}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <p className={styles.label}>Password required</p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={styles.input}
          placeholder="Enter password"
          autoComplete="current-password"
          disabled={loading}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={loading || !input}>
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
