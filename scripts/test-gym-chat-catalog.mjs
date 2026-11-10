import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getGymExerciseCatalogContext,
  resolveGymExercise,
  suggestGymExerciseNames,
} from '../lib/gym-chat/catalog.ts'

const catalog = [
  {
    id: 'barbell-incline',
    name: 'Incline Barbell Bench Press',
    bodyPartKey: 'chest',
    aliases: ['incline bench press', 'barbell incline press'],
  },
  {
    id: 'dumbbell-incline',
    name: 'Incline Dumbbell Bench Press',
    bodyPartKey: 'chest',
    aliases: ['incline db press'],
  },
  {
    id: 'rdl',
    name: 'Romanian Deadlift',
    bodyPartKey: 'hamstrings',
    aliases: ['RDL'],
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    bodyPartKey: 'core',
    aliases: [],
  },
]

test('resolves an exact alias to its canonical exercise', () => {
  assert.equal(resolveGymExercise('RDL', catalog)?.entry.name, 'Romanian Deadlift')
  assert.equal(resolveGymExercise(' barbell incline press ', catalog)?.entry.id, 'barbell-incline')
})

test('suggestions retain qualifying variant terms and stay catalog-bound', () => {
  assert.deepEqual(suggestGymExerciseNames('incline press', catalog), [
    'Incline Barbell Bench Press',
    'Incline Dumbbell Bench Press',
  ])
  assert.deepEqual(suggestGymExerciseNames('barbell incline press', catalog), [
    'Incline Barbell Bench Press',
  ])
  assert.deepEqual(suggestGymExerciseNames('incline bench press', catalog), [
    'Incline Barbell Bench Press',
  ])
  assert.equal(suggestGymExerciseNames('incline press', catalog).includes('Cable Crunch'), false)
})

test('unknown phrases do not fall back to unrelated static exercises', () => {
  assert.deepEqual(suggestGymExerciseNames('machine decline fly', catalog), [])
})

test('catalog prompt context contains canonical names and live aliases', () => {
  const context = getGymExerciseCatalogContext(catalog)
  assert.match(context, /Incline Barbell Bench Press/)
  assert.match(context, /barbell incline press/)
  assert.doesNotMatch(context, /Cable Crunch.*incline/)
})
