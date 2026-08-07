import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { buildPendingGymChatIntent } from './semantics.ts'

test('preserves metric and time window when a clarification selects an exercise variant', () => {
  const firstTurn = buildPendingGymChatIntent(
    undefined,
    'How has my incline press progressed over the last 90 days?',
  )
  assert.deepEqual(firstTurn, {
    exercises: [{ requested: 'incline press' }],
    metric: 'progression',
    progression: 'How has my incline press progressed over the last 90 days',
    timeWindow: '90 days',
  })

  const clarification = buildPendingGymChatIntent(firstTurn, 'I mean incline dumbbell press.')
  assert.deepEqual(clarification, {
    exercises: [{ requested: 'incline press', selected: 'incline dumbbell press' }],
    metric: 'progression',
    progression: 'How has my incline press progressed over the last 90 days',
    timeWindow: '90 days',
  })

  const metricFollowUp = buildPendingGymChatIntent(clarification, 'How many sets did it have?')
  assert.deepEqual(metricFollowUp, {
    exercises: [{ requested: 'incline press', selected: 'incline dumbbell press' }],
    metric: 'set_count',
    timeWindow: '90 days',
  })
})

test('retains both comparison exercises when a follow-up changes only the progression metric', () => {
  const firstTurn = buildPendingGymChatIntent(
    undefined,
    'Compare incline bench press and incline dumbbell press volume over the last 3 months.',
  )
  assert.deepEqual(firstTurn, {
    exercises: [
      { requested: 'incline bench press' },
      { requested: 'incline dumbbell press', selected: 'incline dumbbell press' },
    ],
    metric: 'volume',
    comparison:
      'Compare incline bench press and incline dumbbell press volume over the last 3 months',
    timeWindow: '3 months',
  })

  const followUp = buildPendingGymChatIntent(firstTurn, 'Which one progressed more?')
  assert.deepEqual(followUp, {
    exercises: [
      { requested: 'incline bench press' },
      { requested: 'incline dumbbell press', selected: 'incline dumbbell press' },
    ],
    metric: 'progression',
    comparison:
      'Compare incline bench press and incline dumbbell press volume over the last 3 months',
    progression: 'Which one progressed more',
    timeWindow: '3 months',
  })
})
