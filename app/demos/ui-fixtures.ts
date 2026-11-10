export const GYM_STATS_FIXTURE = '412 SESSIONS / 18,240 SETS / LAST LOGGED 2026-08-05'

export type DashboardsUiState = 'loaded' | 'fallback'

export function dashboardUiState(searchParams: {
  __uiState?: string | string[]
}): DashboardsUiState | null {
  if (process.env.NODE_ENV === 'production') return null

  const candidate = searchParams.__uiState
  const value = Array.isArray(candidate) ? candidate[0] : candidate
  return value === 'loaded' || value === 'fallback' ? value : null
}
