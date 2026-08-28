import type { GymLift } from '@/app/demos/gym/actions'

export type ExerciseSetGroup = {
  exercise: string
  normalizedExercise: string
  sets: GymLift[]
}

export function normalizeExerciseName(name: string) {
  return name.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase()
}

function displayExerciseName(name: string) {
  return name.normalize('NFKC').replace(/\s+/g, ' ').trim()
}

export function groupExerciseSets(dayLifts: GymLift[]): ExerciseSetGroup[] {
  const chronological = [...dayLifts].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime() || 0
    const tb = new Date(b.timestamp).getTime() || 0
    if (ta !== tb) return ta - tb
    if (a.exercise !== b.exercise) return a.exercise.localeCompare(b.exercise)
    return a.setNumber - b.setNumber
  })

  const groups: ExerciseSetGroup[] = []
  const groupsByExercise = new Map<string, ExerciseSetGroup>()
  for (const lift of chronological) {
    const normalizedExercise = normalizeExerciseName(lift.exercise)
    let group = groupsByExercise.get(normalizedExercise)
    if (!group) {
      group = {
        exercise: displayExerciseName(lift.exercise),
        normalizedExercise,
        sets: [],
      }
      groupsByExercise.set(normalizedExercise, group)
      groups.push(group)
    }
    group.sets.push(lift)
  }

  return groups
}
