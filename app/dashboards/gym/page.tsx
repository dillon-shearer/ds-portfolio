import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import { getGymLifts } from './actions'
import GymDashboard from './GymDashboard'

export const metadata: Metadata = {
  title: 'Gym Tracker',
  description: 'Personal training log, volume analytics, and AI coaching.',
}

export const dynamic = 'force-dynamic'

export default async function GymTrackerPage() {
  const lifts = await getGymLifts()

  return (
    <div className="page-wrapper--wide">
      <PageHeader
        eyebrow="Dashboards"
        title="Gym Tracker"
        lead="Personal training log, volume analytics, and AI coaching."
        rule={false}
      />
      <GymDashboard lifts={lifts} />
    </div>
  )
}
