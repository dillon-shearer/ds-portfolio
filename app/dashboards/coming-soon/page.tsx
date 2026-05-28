import type { Metadata } from 'next'
import { Button } from '@/components/ui'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Dashboard Coming Soon',
}

export default function DashboardComingSoonPage() {
  return (
    <div className="page-wrapper">
      <div className={styles.content}>
        <p className={styles.eyebrow}>Dashboards</p>
        <h1 className={styles.title}>Coming soon</h1>
        <p className={styles.body}>This dashboard is not yet published. Check back later.</p>
        <Button href="/dashboards" variant="outline">Back to Dashboards</Button>
      </div>
    </div>
  )
}
