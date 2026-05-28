'use client'

import { useMemo, useState, useCallback } from 'react'
import type { GymLift } from './actions'
import type { BodyPart } from './panels/BodyDiagram'
import DashboardShell from '@/components/dashboard/DashboardShell'
import DashboardPanel from '@/components/dashboard/DashboardPanel'
import StatWidget from '@/components/dashboard/StatWidget'
import TimeRangeSelector from '@/components/dashboard/TimeRangeSelector'
import PasswordGate from '@/components/dashboard/PasswordGate'
import VolumeChart from './panels/VolumeChart'
import SplitFrequency from './panels/SplitFrequency'
import BodyPartFrequency from './panels/BodyPartFrequency'
import BodyDiagramClient from './panels/BodyDiagramClient'
import ExercisePRsTable from './panels/ExercisePRsTable'
import VolumeHeatmap from './panels/VolumeHeatmapWrapper'
import RecentSessions from './panels/RecentSessions'
import DailyView from './panels/DailyView'
import styles from './GymDashboard.module.css'

type RangeMode = 'day' | 'week' | 'month' | 'year'
type SortKey = 'exercise' | 'bestWeight' | 'best1RM' | 'bestSetDate'

type Props = { lifts: GymLift[] }

const TABS = [
  { label: 'Dashboard', key: 'dashboard' },
  { label: 'Log Workout', key: 'log' },
]

const RANGE_OPTIONS = [
  { label: 'Day', value: 'day' },
  { label: '7d', value: 'week' },
  { label: '30d', value: 'month' },
  { label: 'YTD', value: 'year' },
]

// UTC date helpers
const toKeyDate = (d: Date) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10)
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d))
const addUTCDays = (d: Date, n: number) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n))
const todayUTCKey = () => toKeyDate(new Date())
const clampToToday = (ymd: string) => (ymd > todayUTCKey() ? todayUTCKey() : ymd)
const shiftYMD = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split('-').map(n => parseInt(n, 10))
  return toKeyDate(addUTCDays(new Date(Date.UTC(y, m - 1, d)), days))
}

function groupBy<T, K extends string | number>(arr: T[], key: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>()
  for (const item of arr) {
    const k = key(item)
    const bucket = m.get(k)
    if (bucket) bucket.push(item)
    else m.set(k, [item])
  }
  return m
}

const unique = <T,>(arr: T[]) => Array.from(new Set(arr))

function lastNDatesUTC(n: number, until: Date) {
  const end = utc(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate())
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) out.push(toKeyDate(addUTCDays(end, -i)))
  return out
}

function yearDatesYTDUTC(year: number) {
  const today = new Date()
  const end = utc(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const start = utc(year, 0, 1)
  const last = year === today.getUTCFullYear() ? end : utc(year, 11, 31)
  const out: string[] = []
  for (let d = start; d <= last; d = addUTCDays(d, 1)) out.push(toKeyDate(d))
  return out
}

function calcDailyVolume(lifts: GymLift[], dates: string[]) {
  const byDate = groupBy(lifts, (l) => l.date)
  return dates.map(date => {
    const day = byDate.get(date) ?? []
    // Volume = weight x reps per set (unilateral sets record one side; no doubling applied)
    const volume = day.reduce((sum, l) => sum + l.weight * l.reps, 0)
    return { date, volume }
  })
}

function cleanTag(s?: string | null) {
  return (s ?? '')
    .normalize('NFKC')
    .replace(/[​-‍﻿]/g, '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function formatLongDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const EXERCISES_BY_BODY_PART: Record<BodyPart, string[]> = {
  biceps:     ['Preacher Curl', 'Hammer Curl', 'Bayesian Curl', 'Incline Curl'],
  chest:      ['Incline Press', 'Flat Press', 'Decline Press', 'Chest Fly', 'Bench Press'],
  shoulders:  ['Lateral Raise', 'Overhead Press', 'Rear Delt Fly', 'Rear Delt Xs'],
  back:       ['Lat Pulldown', 'High Row', 'Low Row', 'Pull Ups', 'Pull Overs'],
  triceps:    ['Tricep Pushdowns', 'Tricep Extensions', 'Skull Crushers', 'Tricep Kickbacks', 'Dips'],
  quads:      ['Leg Press', 'Hack Squat', 'Pendelum Squat', 'Squat', 'Leg Extensions', 'Split Squat'],
  hamstrings: ['RDLs', 'Seated Leg Curl', 'Lying Leg Curl', 'Hamstrick Kickback'],
  forearms:   ['Wrist Curl', 'Reverse Curl', 'Reverse Wrist Curl'],
  core:       ['Hanging Leg Raise', 'Decline Crunch', 'Flat Crunch', 'Incline Crunch', 'Oblique Twist'],
  glutes:     ['Hip Thrust', 'Glute Kickback'],
  calves:     ['Standing Calf Raise', 'Seated Calf Raise'],
  hips:       ['Abduction Machine', 'Adduction Machine'],
}

const EXERCISE_TO_BODY: Record<string, BodyPart> = Object.entries(EXERCISES_BY_BODY_PART)
  .reduce((acc, [bp, arr]) => { for (const ex of arr) acc[ex] = bp as BodyPart; return acc }, {} as Record<string, BodyPart>)

function normalizeSplitTag(raw?: string | null) {
  const t = (raw || '').trim().toLowerCase()
  if (!t) return ''
  if (t.startsWith('push')) return 'Push'
  if (t.startsWith('pull')) return 'Pull'
  if (t.startsWith('leg')) return 'Legs'
  return ''
}

export default function GymDashboard({ lifts }: Props) {
  const [mode, setMode] = useState<RangeMode>('month')
  const [prevMode, setPrevMode] = useState<RangeMode | null>(null)

  const currentYear = new Date().getUTCFullYear()
  const [year, setYear] = useState<number>(currentYear)

  const [dayDate, setDayDate] = useState<string>(() => {
    if (!lifts.length) return todayUTCKey()
    const latest = lifts.reduce((m, l) => (l.date > m ? l.date : m), lifts[0].date)
    return clampToToday(latest)
  })

  const datasetMinDate = useMemo(
    () => (lifts.length ? lifts.reduce((m, l) => (l.date < m ? l.date : m), lifts[0].date) : ''),
    [lifts]
  )
  const datasetMaxDate = useMemo(
    () => (lifts.length ? lifts.reduce((m, l) => (l.date > m ? l.date : m), lifts[0].date) : ''),
    [lifts]
  )

  const now = new Date()
  const dateWindow = useMemo<string[]>(() => {
    if (mode === 'day')   return [dayDate]
    if (mode === 'week')  return lastNDatesUTC(7, now)
    if (mode === 'month') return lastNDatesUTC(30, now)
    return yearDatesYTDUTC(year)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, year, dayDate])

  const filtered = useMemo<GymLift[]>(() => {
    const setDates = new Set(dateWindow)
    return lifts.filter(l => setDates.has(l.date))
  }, [lifts, dateWindow])

  const daily = useMemo(() => calcDailyVolume(filtered, dateWindow), [filtered, dateWindow])
  const totalVolume = useMemo(() => daily.reduce((s, d) => s + d.volume, 0), [daily])
  const gymDays = useMemo(() => unique(filtered.map(l => l.date)).length, [filtered])
  const exerciseVariety = useMemo(() => unique(filtered.map(l => l.exercise)).length, [filtered])

  const bodyStats = useMemo(() => {
    const base: Record<BodyPart, { volume: number; sets: number }> = {
      biceps:{volume:0,sets:0}, chest:{volume:0,sets:0}, shoulders:{volume:0,sets:0}, back:{volume:0,sets:0},
      triceps:{volume:0,sets:0}, quads:{volume:0,sets:0}, hamstrings:{volume:0,sets:0}, forearms:{volume:0,sets:0},
      core:{volume:0,sets:0}, glutes:{volume:0,sets:0}, calves:{volume:0,sets:0}, hips:{volume:0,sets:0},
    }
    for (const s of filtered) {
      const bp = EXERCISE_TO_BODY[s.exercise]
      if (!bp) continue
      // Volume = weight x reps per set (unilateral sets record one side; no doubling applied)
      base[bp].volume += s.weight * s.reps
      base[bp].sets += 1
    }
    return base
  }, [filtered])

  const splitCountsPPL = useMemo(() => {
    const byDate = groupBy(filtered, (l) => l.date)
    const counts = { Push: 0, Pull: 0, Legs: 0 } as Record<'Push'|'Pull'|'Legs', number>
    for (const [, sets] of byDate.entries()) {
      const tags = sets.map(s => cleanTag(s.dayTag)).filter(Boolean)
      if (!tags.length) continue
      const tally = new Map<string, number>()
      for (const t of tags) tally.set(t, (tally.get(t) || 0) + 1)
      const winner = Array.from(tally.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
      const key = normalizeSplitTag(winner) as 'Push'|'Pull'|'Legs'|''
      if (key) counts[key] += 1
    }
    return counts
  }, [filtered])

  const bodyPartsList = useMemo(() => {
    return (Object.keys(bodyStats) as BodyPart[])
      .map((bp) => ({ bp, sets: bodyStats[bp].sets, volume: bodyStats[bp].volume }))
      .filter(x => x.sets > 0 || x.volume > 0)
      .sort((a, b) => (b.sets - a.sets) || (b.volume - a.volume))
  }, [bodyStats])

  const [bpPage, setBpPage] = useState(1)
  const bpPageSize = 6
  const bodyPartsPaged = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(bodyPartsList.length / bpPageSize))
    const page = Math.max(1, Math.min(bpPage, totalPages))
    const start = (page - 1) * bpPageSize
    return { rows: bodyPartsList.slice(start, start + bpPageSize), totalPages, page, total: bodyPartsList.length }
  }, [bodyPartsList, bpPage])

  const prsAll = useMemo(() => {
    const byEx = groupBy(filtered, (l) => l.exercise)
    return Array.from(byEx.entries()).map(([exercise, sets]) => {
      let bestWeight = 0
      let best1RM = 0
      let bestSet: GymLift | undefined
      for (const s of sets) {
        const oneRM = Math.round(s.weight * (1 + s.reps / 30))
        if (!bestSet) { bestSet = s; bestWeight = s.weight; best1RM = oneRM; continue }
        const better =
          s.weight > bestSet.weight ||
          (s.weight === bestSet.weight && s.reps > bestSet.reps) ||
          (s.weight === bestSet.weight && s.reps === bestSet.reps && s.date > bestSet.date)
        if (better) { bestSet = s; bestWeight = s.weight; best1RM = oneRM }
      }
      return {
        exercise,
        bestWeight,
        best1RM,
        bestSetDate: bestSet?.date ?? '',
        bestSet: bestSet ? { weight: bestSet.weight, reps: bestSet.reps } : null,
      }
    })
  }, [filtered])

  const [sortKey, setSortKey] = useState<SortKey>('best1RM')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [prsPage, setPrsPage] = useState(1)
  const prsPageSize = 5
  const prsSortedPaged = useMemo(() => {
    const sorted = [...prsAll].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'exercise') return dir * a.exercise.localeCompare(b.exercise)
      if (sortKey === 'bestWeight') return dir * (a.bestWeight - b.bestWeight)
      if (sortKey === 'best1RM') return dir * (a.best1RM - b.best1RM)
      return dir * a.bestSetDate.localeCompare(b.bestSetDate)
    })
    const totalPages = Math.max(1, Math.ceil(sorted.length / prsPageSize))
    const page = Math.max(1, Math.min(prsPage, totalPages))
    const start = (page - 1) * prsPageSize
    return { rows: sorted.slice(start, start + prsPageSize), totalPages, page }
  }, [prsAll, sortKey, sortDir, prsPage])

  const toggleSort = useCallback((k: SortKey) => {
    if (k === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir('desc') }
    setPrsPage(1)
  }, [sortKey])

  const recentSessionsAll = useMemo(() => {
    const byDate = groupBy(filtered, (l) => l.date)
    const recentDates = Array.from(byDate.keys()).sort((a, b) => (a < b ? 1 : -1))
    return recentDates.map(date => {
      const day = byDate.get(date) || []
      // Volume = weight x reps per set (unilateral sets record one side; no doubling applied)
      const volume = day.reduce((s, l) => s + l.weight * l.reps, 0)
      const exercises = unique(day.map(l => l.exercise))
      const sets = day.length
      const tags = day.map(l => cleanTag(l.dayTag)).filter(Boolean)
      let dayTag: string | null = null
      if (tags.length) {
        const counts = new Map<string, number>()
        for (const t of tags) counts.set(t, (counts.get(t) || 0) + 1)
        dayTag = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      }
      return { date, volume, exercises, sets, dayTag }
    })
  }, [filtered])

  const [sessPage, setSessPage] = useState(1)
  const sessPageSize = 3
  const recentSessions = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(recentSessionsAll.length / sessPageSize))
    const page = Math.max(1, Math.min(sessPage, totalPages))
    const start = (page - 1) * sessPageSize
    return { rows: recentSessionsAll.slice(start, start + sessPageSize), totalPages, page }
  }, [recentSessionsAll, sessPage])

  // Download modal
  const [showDownload, setShowDownload] = useState(false)
  const [dlRange, setDlRange] = useState<'current' | 'all'>('current')
  const [dlFormat, setDlFormat] = useState<'json' | 'csv'>('csv')

  const buildDownloadUrl = () => {
    const base = dlFormat === 'json' ? '/api/gym-data' : '/api/gym-data.csv'
    let from = '', to = ''
    if (dlRange === 'current') { from = dateWindow[0]; to = dateWindow[dateWindow.length - 1] }
    else { from = datasetMinDate; to = datasetMaxDate }
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    qs.set('exclude', 'day_of_week,iso_week,month,year')
    return qs.toString() ? `${base}?${qs.toString()}` : base
  }

  const jumpToDay = (d: string) => {
    if (mode !== 'day') setPrevMode(mode)
    setDayDate(clampToToday(d))
    setMode('day')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleModeChange = (newMode: string) => {
    setMode(newMode as RangeMode)
    if (newMode !== 'day') setPrevMode(null)
  }

  return (
    <DashboardShell tabs={TABS} defaultTab="dashboard">
      {(active) => (
        <div className={styles.root}>
          {active === 'dashboard' && (
            <>
              {/* Controls row */}
              <div className={styles.controls}>
                <TimeRangeSelector
                  options={RANGE_OPTIONS}
                  value={mode}
                  onChange={handleModeChange}
                />
                {(mode === 'day' || mode === 'year') && (
                  <div className={styles.dateNav}>
                    {mode === 'day' && prevMode && (
                      <button
                        type="button"
                        className={styles.navBtn}
                        onClick={() => {
                          setMode(prevMode)
                          setPrevMode(null)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.navArrow}
                      onClick={mode === 'day' ? () => setDayDate(d => shiftYMD(d, -1)) : () => setYear(y => Math.max(1970, y - 1))}
                      disabled={mode === 'day' && !!datasetMinDate && dayDate <= datasetMinDate}
                      aria-label={mode === 'day' ? 'Previous day' : 'Previous year'}
                    >
                      &larr;
                    </button>
                    <span className={styles.dateLabel}>
                      {mode === 'day' ? formatLongDate(dayDate) : year}
                    </span>
                    <button
                      type="button"
                      className={styles.navArrow}
                      onClick={mode === 'day' ? () => setDayDate(d => clampToToday(shiftYMD(d, 1))) : () => setYear(y => Math.min(currentYear, y + 1))}
                      disabled={mode === 'day' ? dayDate >= todayUTCKey() : year >= currentYear}
                      aria-label={mode === 'day' ? 'Next day' : 'Next year'}
                    >
                      &rarr;
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className={styles.downloadBtn}
                  onClick={() => setShowDownload(true)}
                >
                  Download
                </button>
              </div>

              {mode === 'day' ? (
                <DailyView lifts={lifts} date={dayDate} onChangeDate={(d) => { setDayDate(d); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
              ) : (
                <>
                  {/* KPI row */}
                  <div className={styles.kpiRow}>
                    <StatWidget label="Total Volume" value={totalVolume} sub="lbs" />
                    <StatWidget label="Gym Days" value={`${gymDays} / ${dateWindow.length}`} />
                    <StatWidget label="Exercise Variety" value={exerciseVariety} />
                  </div>

                  {/* Main grid: charts + body diagram */}
                  <div className={styles.mainGrid}>
                    <div className={styles.leftCol}>
                      <DashboardPanel eyebrow="Daily Volume">
                        <VolumeChart data={daily} height={200} />
                      </DashboardPanel>
                      <div className={styles.splitRow}>
                        <DashboardPanel eyebrow="Split Frequency">
                          <SplitFrequency
                            push={splitCountsPPL.Push}
                            pull={splitCountsPPL.Pull}
                            legs={splitCountsPPL.Legs}
                          />
                        </DashboardPanel>
                        <DashboardPanel eyebrow="Body Part Frequency">
                          <BodyPartFrequency
                            rows={bodyPartsPaged.rows}
                            page={bodyPartsPaged.page}
                            totalPages={bodyPartsPaged.totalPages}
                            total={bodyPartsPaged.total}
                            onPrev={() => setBpPage(p => Math.max(1, p - 1))}
                            onNext={() => setBpPage(p => Math.min(bodyPartsPaged.totalPages, p + 1))}
                          />
                        </DashboardPanel>
                      </div>
                    </div>
                    <div className={styles.sidebar}>
                      <DashboardPanel eyebrow="Muscles Trained">
                        <BodyDiagramClient stats={bodyStats} splitCounts={splitCountsPPL} />
                      </DashboardPanel>
                    </div>
                  </div>

                  {/* PRs + Heatmap */}
                  <div className={styles.twoCol}>
                    <DashboardPanel eyebrow="Exercise PRs">
                      <ExercisePRsTable
                        rows={prsSortedPaged.rows}
                        page={prsSortedPaged.page}
                        totalPages={prsSortedPaged.totalPages}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={toggleSort}
                        onPrev={() => setPrsPage(p => Math.max(1, p - 1))}
                        onNext={() => setPrsPage(p => Math.min(prsSortedPaged.totalPages, p + 1))}
                      />
                    </DashboardPanel>
                    <DashboardPanel eyebrow="Volume Heatmap">
                      <VolumeHeatmap mode={mode as 'week' | 'month' | 'year'} data={daily} />
                    </DashboardPanel>
                  </div>

                  {/* Recent sessions */}
                  <DashboardPanel eyebrow="Recent Sessions">
                    <RecentSessions
                      rows={recentSessions.rows}
                      page={recentSessions.page}
                      totalPages={recentSessions.totalPages}
                      onPrev={() => setSessPage(p => Math.max(1, p - 1))}
                      onNext={() => setSessPage(p => Math.min(recentSessions.totalPages, p + 1))}
                      onJumpToDay={jumpToDay}
                    />
                  </DashboardPanel>
                </>
              )}
            </>
          )}

          {active === 'log' && (
            <PasswordGate>
              <p style={{ color: 'var(--color-ink-3)', fontSize: 'var(--text-sm)' }}>
                WorkoutForm coming in Task 20
              </p>
            </PasswordGate>
          )}

          {/* Download modal */}
          {showDownload && (
            <div className={styles.modalBackdrop} onClick={() => setShowDownload(false)}>
              <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <p className={styles.modalTitle}>Download Dataset</p>
                  <button
                    type="button"
                    className={styles.modalClose}
                    onClick={() => setShowDownload(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <p className={styles.modalLabel}>Range</p>
                  <div className={styles.modalRow}>
                    <button
                      type="button"
                      className={[styles.modalOpt, dlRange === 'current' ? styles.modalOptActive : ''].join(' ')}
                      onClick={() => setDlRange('current')}
                    >
                      Current filter
                    </button>
                    <button
                      type="button"
                      className={[styles.modalOpt, dlRange === 'all' ? styles.modalOptActive : ''].join(' ')}
                      onClick={() => setDlRange('all')}
                    >
                      All time
                    </button>
                  </div>
                  <p className={styles.modalLabel}>Format</p>
                  <div className={styles.modalRow}>
                    <button
                      type="button"
                      className={[styles.modalOpt, dlFormat === 'csv' ? styles.modalOptActive : ''].join(' ')}
                      onClick={() => setDlFormat('csv')}
                    >
                      CSV
                    </button>
                    <button
                      type="button"
                      className={[styles.modalOpt, dlFormat === 'json' ? styles.modalOptActive : ''].join(' ')}
                      onClick={() => setDlFormat('json')}
                    >
                      JSON
                    </button>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.modalCancel} onClick={() => setShowDownload(false)}>
                    Cancel
                  </button>
                  <a
                    href={buildDownloadUrl()}
                    onClick={() => setShowDownload(false)}
                    className={styles.modalDownload}
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
