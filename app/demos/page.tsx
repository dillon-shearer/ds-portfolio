import type { Metadata } from 'next'
import { PageHeader, DashboardCard } from '@/components/ui'
import { DASHBOARDS } from '@/content/dashboards'
import { sql } from '@/lib/gym-db'
import styles from './page.module.css'
import { dashboardUiState, GYM_STATS_FIXTURE } from './ui-fixtures'

export const metadata: Metadata = {
  title: 'Demos',
  description:
    "Projects by Dillon Shearer: a gym tracker, a variant report tool, and a Reddit video pipeline.",
}

export const revalidate = 3600

type GymStatsRow = {
  sessions: string | number | null
  sets: string | number | null
  last_logged: string | Date | null
}

function formatLastLogged(value: GymStatsRow['last_logged']) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }

  return null
}

async function getGymStats() {
  try {
    const { rows } = await sql /* sql */ `
      SELECT
        COUNT(DISTINCT date::date) AS sessions,
        COUNT(*) AS sets,
        MAX(date::date) AS last_logged
      FROM gym_lifts
    `
    const row = rows[0] as GymStatsRow | undefined
    const sessions = Number(row?.sessions)
    const sets = Number(row?.sets)
    const lastLogged = formatLastLogged(row?.last_logged ?? null)

    if (!Number.isFinite(sessions) || !Number.isFinite(sets) || !lastLogged) return undefined

    const numberFormat = new Intl.NumberFormat('en-US')
    return `${numberFormat.format(sessions)} SESSIONS / ${numberFormat.format(sets)} SETS / LAST LOGGED ${lastLogged}`
  } catch {
    return undefined
  }
}

export default async function DashboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ __uiState?: string | string[] }>
}) {
  const uiState = dashboardUiState(await searchParams)
  const stats =
    uiState === 'loaded'
      ? GYM_STATS_FIXTURE
      : uiState === 'fallback'
        ? undefined
        : await getGymStats()

  return (
    <div className="page-wrapper--wide">
      <PageHeader
        eyebrow="Demos"
        title="Demos"
        lead="Projects you can open or read about."
        rule={false}
      />
      <ul className={styles.list} data-dashboard-index>
        {DASHBOARDS.map((d) => (
          <DashboardCard
            key={`${d.tool}-${d.title}`}
            tool={d.tool}
            title={d.title}
            description={d.description}
            href={d.href}
            tech={d.tech}
            stats={d.title === 'Gym Tracker' ? stats : undefined}
            caseStudy={d.caseStudy}
          />
        ))}
      </ul>
    </div>
  )
}
