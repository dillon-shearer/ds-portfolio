import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { gymFixtureLifts } from '../../app/dashboards/gym/ui-fixtures.ts'
import { bodyPartForExercise, type BodyPart } from './body-parts.ts'

// These are the canonical body_part_key values returned by gym_lifts_v for the
// same exercise names. Keep this parity fixture beside the dashboard fixture so
// a newly logged name cannot silently disappear from dashboard muscle metrics.
const EXPECTED_FIXTURE_BODY_PART_KEYS: Record<string, BodyPart> = {
  'Bench Press': 'chest',
  'Cable Row': 'back',
  'Back Squat': 'quads',
}

test('classifies every dashboard fixture exercise with its Gym Chat body_part_key', () => {
  for (const lift of gymFixtureLifts()) {
    const expected = EXPECTED_FIXTURE_BODY_PART_KEYS[lift.exercise]
    assert.ok(expected, `fixture exercise needs a body_part_key expectation: ${lift.exercise}`)
    assert.equal(bodyPartForExercise(lift.exercise), expected)
  }
})

test('normalizes plural aliases without classifying unknown names', () => {
  assert.equal(bodyPartForExercise('Cable Rows'), 'back')
  assert.equal(bodyPartForExercise('Back Squats'), 'quads')

  // Custom or newly managed exercises are intentionally unmapped until their
  // catalog body_part_key is added to the shared static fallback map.
  assert.equal(bodyPartForExercise('Uncatalogued Exercise'), 'other')
})
