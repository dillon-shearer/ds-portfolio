// Single source for the gym BodyPart type, exercise-to-body-part mapping,
// and per-part chart colors. Formerly duplicated across GymDashboard,
// DailyView, MuscleVolumeDonut, CumulativeVolumeChart, BodyDiagram,
// and BodyPartsSheet.

export type BodyPart =
  | 'biceps' | 'chest' | 'shoulders' | 'back' | 'triceps'
  | 'quads' | 'hamstrings' | 'forearms' | 'core'
  | 'glutes' | 'calves' | 'hips'

export const ALL_BODY_PARTS: BodyPart[] = [
  'biceps', 'chest', 'shoulders', 'back', 'triceps',
  'quads', 'hamstrings', 'forearms', 'core',
  'glutes', 'calves', 'hips',
]

// Names mirror values actually logged in gym_lifts, including the misspellings
// 'Pendelum Squat', 'Hamstrick Kickback', 'Rear Delt Xs' (verified against
// SELECT DISTINCT exercise on 2026-08-04). Do not "fix" spellings here.
export const EXERCISES_BY_BODY_PART: Record<BodyPart, string[]> = {
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

// Global /s\b/g variant: strips the trailing s of every word, so singular and
// plural forms of multi-word names collide onto the same key.
export const normalizeExerciseName = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim().replace(/s\b/g, '')

const EX_TO_BP = (() => {
  const m = new Map<string, BodyPart>()
  for (const [bp, exes] of Object.entries(EXERCISES_BY_BODY_PART)) {
    for (const ex of exes) m.set(normalizeExerciseName(ex), bp as BodyPart)
  }
  m.set(normalizeExerciseName('RDL'), 'hamstrings')
  m.set(normalizeExerciseName('Hip Thrusts'), 'glutes')
  m.set(normalizeExerciseName('Pull Up'), 'back')
  m.set(normalizeExerciseName('Pull Over'), 'back')
  return m
})()

export function bodyPartForExercise(ex: string): BodyPart | 'other' {
  return EX_TO_BP.get(normalizeExerciseName(ex)) ?? 'other'
}

// Values mirror tokens.css --chart-bp-* (hardcoded because SVG gradients and
// three.js materials cannot read CSS variables). The retheme ticket owns changes.
export const BODY_PART_HEX: Record<BodyPart, string> = {
  chest:      '#7A2E2E',
  back:       '#4A4239',
  shoulders:  '#B8893B',
  biceps:     '#4A6B3A',
  triceps:    '#5A7A8A',
  quads:      '#5C3A1A',
  hamstrings: '#1A4A3A',
  core:       '#3A1A4A',
  glutes:     '#9A5A3A',
  calves:     '#3A6B5A',
  forearms:   '#6B6B3A',
  hips:       '#5A3A6B',
}

// Chart variant with the 'other' bucket (= tokens.css --chart-muted).
export const BP_COLORS: Record<BodyPart | 'other', string> = {
  ...BODY_PART_HEX,
  other: '#D8CFC2',
}
