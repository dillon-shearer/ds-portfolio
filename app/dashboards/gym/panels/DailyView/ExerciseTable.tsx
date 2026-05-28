import { useMemo } from 'react'
import type { GymLift } from '../../actions'
import styles from './ExerciseTable.module.css'

type Props = {
  dayLifts: GymLift[]
  allLifts: GymLift[]
}

export default function ExerciseTable({ dayLifts, allLifts }: Props) {
  const groups = useMemo(() => {
    const seq = [...dayLifts].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime() || 0
      const tb = new Date(b.timestamp).getTime() || 0
      if (ta !== tb) return ta - tb
      if (a.exercise !== b.exercise) return a.exercise.localeCompare(b.exercise)
      return a.setNumber - b.setNumber
    })

    const result: { exercise: string; sets: GymLift[] }[] = []
    for (const l of seq) {
      const last = result[result.length - 1]
      if (last && last.exercise === l.exercise) {
        last.sets.push(l)
      } else {
        result.push({ exercise: l.exercise, sets: [l] })
      }
    }
    return result
  }, [dayLifts])

  const lifetimePR = useMemo(() => {
    const pr: Record<string, number> = {}
    for (const l of allLifts) {
      const est = Math.round(l.weight * (1 + l.reps / 30))
      if (!pr[l.exercise] || est > pr[l.exercise]) pr[l.exercise] = est
    }
    return pr
  }, [allLifts])

  if (groups.length === 0) {
    return (
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--color-ink-3)' }}>
        No sets logged for this day
      </p>
    )
  }

  return (
    <div className={styles.container}>
      {groups.map(({ exercise, sets }) => (
        <div key={exercise} className={styles.group}>
          <p className={styles.exerciseName}>{exercise}</p>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Set</th>
                  <th className={styles.th}>Weight</th>
                  <th className={styles.th}>Reps</th>
                  <th className={styles.th}>Est 1RM</th>
                  <th className={styles.th}>% PR</th>
                </tr>
              </thead>
              <tbody>
                {sets.map((s, i) => {
                  const est1rm = Math.round(s.weight * (1 + s.reps / 30))
                  const pr = lifetimePR[s.exercise] || 0
                  const pctPR = pr > 0 ? Math.round((est1rm / pr) * 100) : null
                  const isNearMax = pctPR !== null && pctPR >= 90
                  return (
                    <tr key={s.id} className={i < sets.length - 1 ? styles.row : styles.rowLast}>
                      <td className={[styles.td, styles.num].join(' ')}>{s.setNumber}</td>
                      <td className={[styles.td, styles.num].join(' ')}>{s.weight} lbs</td>
                      <td className={[styles.td, styles.num].join(' ')}>{s.reps}</td>
                      <td className={[styles.td, styles.num].join(' ')}>{est1rm} lbs</td>
                      <td className={[styles.td, styles.num, isNearMax ? styles.nearMax : styles.muted].join(' ')}>
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
