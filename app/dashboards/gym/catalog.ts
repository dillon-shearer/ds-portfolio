// app/dashboards/gym/catalog.ts
'use server'

import { sql } from '@/lib/gym-db'
import type { BodyPart } from '@/lib/gym/body-parts'

export type BodyPartKey = BodyPart

export interface Exercise {
  id: string
  name: string
  bodyPartKey: BodyPartKey | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const clean = (s: string) => s.normalize('NFKC').trim()
export async function listExercises(): Promise<Exercise[]> {
  const { rows } = await sql /* sql */ `
    SELECT
      id,
      name,
      body_part_key AS "bodyPartKey",
      is_active     AS "isActive",
      created_at    AS "createdAt",
      updated_at    AS "updatedAt"
    FROM exercises
    WHERE is_active = TRUE
    ORDER BY LOWER(name) ASC
  `
  return rows as Exercise[]
}

export async function upsertExercise(input: {
  id?: string
  name: string
  bodyPartKey: BodyPartKey | null
  isActive?: boolean
}): Promise<{ success: true; id: string }> {
  const name = clean(input.name)
  if (!name) throw new Error('Exercise name is required.')

  const bp = input.bodyPartKey ?? null
  const isActive = input.isActive ?? true
  let id = input.id ?? null

  if (id) {
    await sql /* sql */ `
      UPDATE exercises
      SET
        name = ${name},
        body_part_key = ${bp},
        is_active = ${isActive},
        updated_at = NOW()
      WHERE id = ${id}
    `
  } else {
    const { rows } = await sql /* sql */ `
      INSERT INTO exercises (name, body_part_key, is_active)
      VALUES (${name}, ${bp}, ${isActive})
      ON CONFLICT (name) DO UPDATE SET
        body_part_key = EXCLUDED.body_part_key,
        is_active     = EXCLUDED.is_active,
        updated_at    = NOW()
      RETURNING id
    `
    id = rows[0]?.id as string
  }

  return { success: true, id: id! }
}

export async function softDeleteExercise(id: string): Promise<{ success: true }> {
  await sql /* sql */ `
    UPDATE exercises
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = ${id}
  `
  return { success: true }
}
