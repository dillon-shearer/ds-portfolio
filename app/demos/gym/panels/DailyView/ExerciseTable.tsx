import { useMemo } from 'react'
import type { GymLift } from '../../actions'
import { estimated1RM } from '@/lib/gym/metrics'
import { groupExerciseSets, normalizeExerciseName } from '@/lib/gym/day-view'
import styles from './ExerciseTable.module.css'

type Props = {
  dayLifts: GymLift[]
  allLifts: GymLift[]
}

export default function ExerciseTable({ dayLifts, allLifts }: Props) {
  const groups = useMemo(() => {
    return groupExerciseSets(dayLifts)
  }, [dayLifts])

  const lifetimePR = useMemo(() => {
    const pr: Record<string, number> = {}
    for (const l of allLifts) {
      const est = estimated1RM(l.weight, l.reps)
      const exercise = normalizeExerciseName(l.exercise)
      if (!pr[exercise] || est > pr[exercise]) pr[exercise] = est
    }
    return pr
  }, [allLifts])

  if (groups.length === 0) {
    return (
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-ink-3)',
        }}
      >
        No sets logged for this day
      </p>
    )
  }

  return (
    <div className={styles.container}>
      {groups.map(({ exercise, normalizedExercise, sets }) => (
        <div
          key={normalizedExercise}
          className={styles.group}
          data-exercise-section={normalizedExercise}
        >
          <p className={styles.exerciseName}>{exercise}</p>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Set</th>
                  <th className={styles.th}>Weight</th>
                  <th className={styles.th}>Reps</th>
                  <th className={[styles.th, styles.hideMobile].join(' ')}>Est 1RM</th>
                  <th className={[styles.th, styles.hideMobile].join(' ')}>% PR</th>
                </tr>
              </thead>
              <tbody>
                {sets.map((s, i) => {
                  const est1rm = estimated1RM(s.weight, s.reps)
                  const pr = lifetimePR[normalizeExerciseName(s.exercise)] || 0
                  const pctPR = pr > 0 ? Math.round((est1rm / pr) * 100) : null
                  const isNearMax = pctPR !== null && pctPR >= 90
                  return (
                    <tr key={s.id} className={i < sets.length - 1 ? styles.row : styles.rowLast}>
                      <td className={[styles.td, styles.num].join(' ')}>{s.setNumber}</td>
                      <td className={[styles.td, styles.num].join(' ')}>{s.weight} lbs</td>
                      <td className={[styles.td, styles.num].join(' ')}>{s.reps}</td>
                      <td className={[styles.td, styles.num, styles.hideMobile].join(' ')}>
                        {est1rm} lbs
                      </td>
                      <td
                        className={[
                          styles.td,
                          styles.num,
                          styles.hideMobile,
                          isNearMax ? styles.nearMax : styles.muted,
                        ].join(' ')}
                      >
                        {pctPR !== null ? `${pctPR}%` : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
