import assert from 'node:assert/strict'
import test from 'node:test'
import { groupExerciseSets } from '../lib/gym/day-view.ts'

function lift(id, exercise, hour, setNumber, reps) {
  return {
    id,
    date: '2026-08-07',
    exercise,
    weight: 185,
    reps,
    setNumber,
    timestamp: `2026-08-07T${String(hour).padStart(2, '0')}:00:00.000Z`,
  }
}

test('groups interleaved exercises once while preserving chronological set order', () => {
  const groups = groupExerciseSets([
    lift('bench-1', 'Bench Press', 9, 1, 8),
    lift('row-1', 'Cable Row', 10, 1, 10),
    lift('bench-2', 'Bench Press', 11, 2, 7),
  ])

  assert.deepEqual(
    groups.map((group) => group.exercise),
    ['Bench Press', 'Cable Row'],
  )
  assert.deepEqual(
    groups.map((group) => group.sets.map((set) => set.id)),
    [['bench-1', 'bench-2'], ['row-1']],
  )
})

test('groups case and whitespace variants under one normalized exercise name', () => {
  const groups = groupExerciseSets([
    lift('bench-1', 'Bench Press', 9, 1, 8),
    lift('bench-2', ' bench   press ', 10, 2, 7),
  ])

  assert.equal(groups.length, 1)
  assert.equal(groups[0].normalizedExercise, 'bench press')
  assert.deepEqual(
    groups[0].sets.map((set) => set.id),
    ['bench-1', 'bench-2'],
  )
})
