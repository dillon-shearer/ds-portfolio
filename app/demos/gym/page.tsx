import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import { GYM_DASHBOARD_PAGE } from '@/content/dashboards'
import GymDashboard from './GymDashboard'
import UiFixtureError from './UiFixtureError'
import { gymFixtureLifts, gymUiState } from './ui-fixtures'

export const metadata: Metadata = GYM_DASHBOARD_PAGE.metadata

export const dynamic = 'force-dynamic'

export default async function GymTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ __uiState?: string | string[] }>
}) {
  const uiState = gymUiState(await searchParams)

  if (uiState === 'loading') {
    await new Promise<never>(() => {})
  }

  if (uiState === 'error') {
    return <UiFixtureError />
  }

  const lifts =
    uiState === 'loaded'
      ? gymFixtureLifts()
      : uiState === 'empty'
        ? []
        : await (await import('./actions')).getGymLifts()

  return (
    <div
      className="page-wrapper--wide"
      data-ui-ready="gym-dashboard"
      data-ui-state={uiState ?? 'live'}
      style={{ paddingBottom: '32px' }}
    >
      <PageHeader
        eyebrow="Demos"
        title="Gym Tracker"
        lead="Personal training log, volume analytics, and AI coaching."
        rule={false}
      />
      <GymDashboard lifts={lifts} />
    </div>
  )
}
