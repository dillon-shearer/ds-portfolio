'use client'

import type { GymLift } from './actions'
import DashboardShell from '@/components/dashboard/DashboardShell'
import styles from './GymDashboard.module.css'

type Props = { lifts: GymLift[] }

const TABS = [
  { label: 'Dashboard', key: 'dashboard' },
  { label: 'Log Workout', key: 'log' },
]

export default function GymDashboard({ lifts }: Props) {
  return (
    <DashboardShell tabs={TABS} defaultTab="dashboard">
      {(active) => (
        <div className={styles.root}>
          {active === 'dashboard' && (
            <p style={{ color: 'var(--color-ink-3)', fontSize: 'var(--text-sm)' }}>
              Dashboard -- {lifts.length} lifts loaded
            </p>
          )}
          {active === 'log' && (
            <p style={{ color: 'var(--color-ink-3)', fontSize: 'var(--text-sm)' }}>
              Log Workout -- coming soon
            </p>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
