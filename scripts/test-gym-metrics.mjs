import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  enrich,
  estimated1RM,
  maxEstimated1RM,
  parseWeightInput,
  roundedEpleySql,
  setVolume,
} from '../lib/gym/metrics.ts'
import { gymFixtureLifts } from '../app/demos/gym/ui-fixtures.ts'

const lift = (overrides = {}) => ({
  id: 'test-lift',
  date: '2026-08-07',
  exercise: 'Bench Press',
  weight: 100,
  reps: 5,
  setNumber: 1,
  timestamp: '2026-08-07T12:00:00.000Z',
  dayTag: 'Push Day',
  isUnilateral: false,
  equipment: 'Barbell',
  ...overrides,
})

test('EditSetModal preserves fractional weights', () => {
  assert.equal(parseWeightInput('102.5'), 102.5)
  assert.equal(parseWeightInput(''), 0)
})

test('estimated 1RM selects the strongest Epley estimate, not the heaviest set', () => {
  const competingSets = [lift({ weight: 100, reps: 5 }), lift({ weight: 90, reps: 10 })]
  assert.equal(estimated1RM(100, 5), 117)
  assert.equal(estimated1RM(90, 10), 120)
  assert.equal(maxEstimated1RM(competingSets), 120)
})

test('dashboard/download metric parity and unilateral row semantics stay aligned', async () => {
  const row = lift({ weight: 102.5, reps: 8, isUnilateral: true })
  const enriched = enrich([row])[0]
  assert.equal(enriched.oneRM_est, maxEstimated1RM([row]))
  assert.equal(enriched.volume, setVolume(102.5, 8))
  assert.equal(enriched.volume, 820)

  const fixture = gymFixtureLifts()
  const unilateral = fixture.filter((candidate) => candidate.isUnilateral === true)
  assert.equal(fixture.length, 6)
  assert.equal(unilateral.length, 1)
  assert.equal(unilateral[0].exercise, 'Split Squat')
  assert.equal(unilateral[0].weight * unilateral[0].reps, 640)
  assert.equal(
    fixture.reduce((total, candidate) => total + setVolume(candidate.weight, candidate.reps), 0),
    7340,
  )

  const fixtureExport = enrich(fixture)
  assert.equal(fixtureExport.filter((candidate) => candidate.isUnilateral).length, 1)
  assert.equal(fixtureExport.find((candidate) => candidate.isUnilateral)?.volume, 640)

  const [form, modal, jsonRoute, csvRoute, chatBuilder] = await Promise.all([
    readFile(new URL('../app/demos/gym/form/WorkoutForm.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/demos/gym/form/EditSetModal.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/gym-data/route.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/gym-data.csv/route.ts', import.meta.url), 'utf8'),
    readFile(new URL('../lib/gym-chat/sql-builders.ts', import.meta.url), 'utf8'),
  ])
  assert.match(form, /isUnilateral: formData\.isUnilateral/)
  assert.match(form, /checked=\{formData\.isUnilateral\}/)
  assert.match(form, /isUnilateral: editingLift\.isUnilateral \?\? null/)
  assert.match(modal, /checked=\{!!lift\.isUnilateral\}/)
  assert.match(
    modal,
    /onChange=\{\(e\) => onChange\(\{ \.\.\.lift, isUnilateral: e\.target\.checked \}\)\}/,
  )
  assert.match(jsonRoute, /isUnilateral/)
  assert.match(csvRoute, /isUnilateral/)
  assert.match(chatBuilder, /is_unilateral/)
})

test('Gym Chat SQL uses the rounded Epley definition documented by capabilities', async () => {
  assert.equal(roundedEpleySql('gl.weight', 'gl.reps'), 'ROUND(gl.weight * (1 + gl.reps / 30.0))')

  const [builder, capabilities, semantics, modal, dashboard, jsonRoute, csvRoute] =
    await Promise.all([
      readFile(new URL('../lib/gym-chat/sql-builders.ts', import.meta.url), 'utf8'),
      readFile(new URL('../lib/gym-chat/capabilities.ts', import.meta.url), 'utf8'),
      readFile(new URL('../lib/gym-chat/semantics.ts', import.meta.url), 'utf8'),
      readFile(new URL('../app/demos/gym/form/EditSetModal.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/demos/gym/GymDashboard.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/gym-data/route.ts', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/gym-data.csv/route.ts', import.meta.url), 'utf8'),
    ])

  assert.match(builder, /roundedEpleySql\('gl\.weight', 'gl\.reps'\)/)
  assert.match(capabilities, /estimated 1RM: ROUND\(weight \* \(1 \+ reps \/ 30\.0\)\)/)
  assert.match(semantics, /MAX\(ROUND\(weight \* \(1 \+ reps \/ 30\.0\)\)\)/)
  assert.match(modal, /parseWeightInput\(e\.target\.value\)/)
  assert.doesNotMatch(modal, /weight: parseInt\(/)
  assert.match(dashboard, /maxEstimated1RM\(sets\)/)
  assert.match(jsonRoute, /import \{ enrich, type OutRow \}/)
  assert.match(csvRoute, /import \{ enrich \}/)
})
