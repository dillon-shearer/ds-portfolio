---
title: Gym Tracker case study
source: /work/gym-tracker
summary: How the Gym Tracker AI chat queries Postgres safely through a read-only SQL policy.
---

# Gym Tracker case study

The case study at /work/gym-tracker explains the engineering behind the Gym Tracker AI chat. Its title is "A chat boundary around a training database". The main idea: the model never gets a raw database connection. Every query it writes is inspected, constrained and enriched before it reaches PostgreSQL.

## SQL policy

The model's SQL passes through a validator that parses it with pgsql-ast-parser. It rejects forbidden syntax, checks tables and columns against an allowlist, turns string literals into parameters, validates CTE scope, and applies a row limit and time window. Only a single SELECT (or WITH ... SELECT) is accepted, so a prompt cannot turn a coaching question into a write. The validator is about 958 lines.

## Prompt context

The chat builds its system prompt from a live catalog of allowed tables and columns read from information_schema, plus metric definitions, query hints and the exact body part values in the database. This stops the model from inventing filter values that do not exist.

## Data model

A database view, gym_lifts_v, joins logged exercise names to canonical exercises and aliases, so an entry such as "RDL" resolves to the right exercise and body part. The data keeps planned training (the body parts planned for a day) separate from logged work (the sets actually done).

## Failure path

When a query fails, the chat gets back the rewritten SQL, parameters, row count, preview rows and the error, so the model can explain the problem and try a narrower query instead of failing with a generic error.

## Visual layer

Recharts draws the trends and body part comparisons. React Three Fiber renders the 3D body diagram.

The source code is public in the ds-portfolio repository on GitHub (github.com/dillon-shearer/ds-portfolio).
