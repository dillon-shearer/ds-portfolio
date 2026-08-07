# Gym chat exercise disambiguation and context-retention eval

Run date: 2026-08-07  
Runtime: `http://localhost:3000/api/gym-chat`  
Model configuration at inspection: `resolveModel()` defaults to `gpt-4o`; chat temperature is `0.2`.

This is a findings-only baseline. It does not change the prompt, catalog, SQL policy, or conversation state code.

## What this measures

The suite targets exercise-name ambiguity and the failure mode where the assistant asks for (or receives) a variant clarification but loses the original metric or time window. An overall pass requires both:

1. The assistant distinguishes an ambiguous exercise (for example, “incline press”) or resolves a supplied canonical/alias name without inventing an unrelated exercise.
2. In a follow-up, it keeps the original intent (best set, progression, set count, or volume) and time window while applying the clarified exercise.

A no-data answer can pass when the named exercise is handled correctly and the answer remains scoped. A query error, silent aggregation of ambiguous variants, unrelated suggestion, or dropped metric/window is a failure.

## Rerun procedure

Use the live app supplied by the owner; do not start a dev server in the owner checkout. Send non-streaming requests so the JSON response includes `assistantMessage`, `queries`, and `conversationState`.

```powershell
$body = @{
  messages = @(@{ role = 'user'; content = 'How has my incline press progressed over the last 90 days?' })
  client = @{ timezone = 'America/New_York' }
} | ConvertTo-Json -Depth 12 -Compress

$response = Invoke-RestMethod `
  -Uri 'http://localhost:3000/api/gym-chat' `
  -Method Post `
  -ContentType 'application/json' `
  -Headers @{ Accept = 'application/json' } `
  -Body $body

$response | ConvertTo-Json -Depth 12
```

For a multi-turn case, send the next user turn with the previous response's `conversationState`:

```powershell
$body = @{
  messages = @(@{ role = 'user'; content = 'I mean incline dumbbell press.' })
  client = @{ timezone = 'America/New_York' }
  conversationState = $response.conversationState
} | ConvertTo-Json -Depth 20 -Compress
```

Record the full JSON response for auditability. The excerpts below are intentionally short; `queries[].sql`, `params`, `rowCount`, `error`, and `exerciseSuggestions` are the main diagnostic fields.

## Baseline run

The following 12 cases were run against the live chat in one sweep: five single-turn controls and seven multi-turn flows. The model is nondeterministic, so reruns should retain the timestamp and treat this table as a regression baseline, not a permanent expected string.

| Case | Turns | Focus | Result |
| --- | ---: | --- | --- |
| S1 | 1 | Ambiguous incline-press progression | **FAIL** — broad term was queried without disambiguation |
| S2 | 1 | Incline bench alias lookup | **FAIL** — zero result suggested only “Bench Press” |
| S3 | 1 | Incline dumbbell canonical lookup | **PASS** — scoped answer; no-data claim was direct |
| S4 | 1 | Flat bench control | **FAIL** — one run returned HTTP 500 |
| S5 | 1 | General training control | **PASS** — relevant non-exercise-specific advice, no alias dependency |
| M1 | 2 | Clarify incline press, preserve progression | **FAIL** — clarified variant was not associated with the original progression request |
| M2 | 2 | Clarify incline press, preserve best set | **FAIL** — “barbell incline bench press” fell back to “Bench Press” |
| M3 | 2 | Clarify incline press, preserve set count | **FAIL** — variant correction produced a no-data answer rather than a reliable association |
| M4 | 2 | Alias correction after no result | **FAIL** — suggestions included unrelated “Cable Crunch” and did not resolve the machine variant |
| M5 | 2 | “That exercise” follow-up | **PASS** — retained the named exercise and 90-day scope across the follow-up |
| M6 | 2 | Variant comparison, then progression | **FAIL** — no-data comparison left the follow-up unable to assess progression |
| M7 | 2 | Clarify incline press, preserve last-month volume | **FAIL** — time window/metric wording was not enough to make the variant query reliable |

Baseline: **2/12 pass**, **10/12 fail**. One failure was a transient server error observed in the sweep; rerun it before treating the error as deterministic.

## Transcript excerpts

### Single-turn cases

**S1 — FAIL.** User: “How has my incline press progressed over the last 90 days?” The assistant answered: “your incline press has shown some variability in estimated 1RM,” citing 22 rows. This silently treats the broad phrase as a queryable exercise rather than asking which incline variation the user means.

**S2 — FAIL.** User: “What was my best incline bench press set in the last 90 days?” The assistant answered: “It seems there are no logged sets for the ‘incline bench press’...” The response’s query had `rowCount: 0` and `exerciseSuggestions: ["Bench Press"]`; that suggestion does not preserve “incline.”

**S3 — PASS.** User: “How many sets of incline dumbbell press did I log in the last 90 days?” The assistant answered: “You haven't logged any sets of incline dumbbell press in the last 90 days [q1].” The result stayed scoped to the named exercise and requested window.

**S4 — FAIL.** User: “What was my best flat bench press in the last 90 days?” The sweep received HTTP 500. A subsequent isolated rerun returned a scoped no-data answer and suggested “bench press,” so this case should be rerun when comparing future baselines.

**S5 — PASS.** User: “What should I change if my weekly chest volume has stalled?” The assistant gave direct training advice and issued no exercise-name query. This control confirms the failure cluster is specific to exercise association/disambiguation rather than all gym-chat requests.

### Multi-turn cases

**M1 — FAIL.** Turn 1 asked for incline-press progression and returned a 22-row trend. Turn 2: “I mean incline dumbbell press.” The assistant answered: “It seems there are no recorded sessions for the ‘Incline Dumbbell Press’...” with a suggestion for the same name. The original progression intent was not answered with a resolved variant; the conversation became a new no-data lookup.

**M2 — FAIL.** Turn 1: “What was my best incline press?” → “Your best incline press was 250 lbs for 7 reps...” Turn 2: “The barbell incline bench press.” → “It seems there are no logged sets specifically for the ‘Barbell Incline Bench Press.’ However, I found a suggestion for ‘Bench Press.’” The best-set intent was not preserved through the clarification, and the alias lost the incline/barbell qualifiers.

**M3 — FAIL.** Turn 1: “How many sets did I do on incline press?” → “You've completed a total of 55 sets on the incline press.” Turn 2: “Incline dumbbell press, not barbell.” → “It appears you haven't logged any sets for the incline dumbbell press.” The set-count question remained implicit, but the variant association did not produce a trustworthy canonical result.

**M4 — FAIL.** Turn 1: “Show my incline bench progression.” → no sessions, with suggestions “Bench Press,” “Incline Dumbbell Press,” and “Cable Crunch.” Turn 2: “Use incline chest press machine.” → no sessions, with suggestions “Bench Press,” “Incline Dumbbell Press,” and “Chest Fly.” The static suggestions include unrelated exercises and do not resolve the supplied machine variant.

**M5 — PASS.** Turn 1 asked for the best incline dumbbell press set in the last 90 days and received a scoped no-data answer. Turn 2: “How many total sets did that exercise have?” → “There were no recorded sets for the ‘Incline Dumbbell Press’ in the last 90 days.” The assistant retained both the exercise and the original 90-day scope.

**M6 — FAIL.** Turn 1 asked to compare incline bench press and incline dumbbell press volume and received no recorded volume for either. Turn 2: “Which one progressed more?” → “I can't assess which one has progressed more.” The comparison subjects were remembered, but the initial alias failure meant the follow-up had no usable exercise-specific evidence.

**M7 — FAIL.** Turn 1: “What was my incline press volume last month?” → “Your incline press volume for last month was 28,115 lb-reps [q1].” Turn 2: “I mean incline dumbbell press.” → “It seems there was no recorded volume for the incline dumbbell press last month.” The month and volume metric were repeated, but the clarification did not reliably map to the intended exercise association.

## Findings and root causes

### System prompt

`buildSystemPrompt()` says to use the full conversation history and ask one short question only when ambiguity remains, but it does not define an explicit exercise-resolution step before querying. It also tells the model to recover canonical names only after `rowCount = 0`. That ordering permits `canonical_name ILIKE '%incline press%'` to return mixed/partial matches and produce a confident aggregate, as in S1 and M1, instead of clarifying first.

The prompt does not carry a structured “original intent + time window + resolved exercise” contract across a clarification. As a result, the second turn can become a fresh exact-name search: M1, M2, M3, and M7 retain fragments of the request but do not reliably complete the original metric against the selected variant.

### Catalog aliasing

`gym_lifts_v` is described as pre-joined through `exercises` and `exercise_aliases`, exposing `canonical_name` and `body_part_key`. The chat does not expose a first-class catalog lookup for a user phrase; the model must infer the mapping from schema text and query results. Exact user phrases such as “incline bench press” and “barbell incline bench press” therefore miss the canonical “Bench Press” record even when the user likely means it.

On zero rows, `route.ts` calls `suggestExerciseNames()`. That helper uses a static workout library and fuzzy/muscle fallback, not the live `exercise_aliases` table. The M4 transcript demonstrates the consequence: “Cable Crunch” appears among suggestions for “incline bench,” and the supplied machine variant still is not resolved. This is catalog-association drift, not a SQL date/CTE issue.

### Conversation-history handling

The route extracts only the latest user message from `payload.messages`, then reconstructs prior context from `conversationState.messages`. The mechanism does preserve prior assistant/tool messages, but it stores the model’s tool-call turns and final answer rather than an explicit resolved exercise/intent state. The LLM must re-derive that state from prose on every turn.

That design is sufficient for M5’s simple “that exercise” reference, but fragile when the second turn is a variant correction. M2 and M7 show the history still contains the original question, yet the new canonical phrase dominates the generated SQL and the original best-set/volume intent is not reliably bound to it. The failure is therefore not simply “history omitted”; it is loss of structured association during re-interpretation.

## Follow-up tickets suggested by this evidence

These are intentionally not implemented here:

- Add a pre-query exercise disambiguation/canonical-resolution instruction and preserve the original metric/window when the user supplies the variant.
- Make live `exercise_aliases` resolution authoritative for suggestions and avoid static muscle/fuzzy fallbacks that return unrelated exercises.
- Consider storing a compact structured exercise-intent object alongside conversation messages, or otherwise test that the second turn reuses the original metric/window after resolving the variant.

## Source anchors inspected

- `app/api/gym-chat/route.ts`: `buildSystemPrompt()`, `extractLatestUserQuestion()`, `buildConversationMessages()`, `normalizeConversationState()`, and zero-row suggestion wiring.
- `lib/gym-chat/catalog.ts`: `gym_lifts_v`, `exercises`, and `exercise_aliases` catalog descriptions and cache loading.
- `lib/gym-chat/response-utils.ts`: `suggestExerciseNames()` static exact/partial/fuzzy/muscle fallback.
- `lib/gym-chat/llm.ts`: `resolveModel()` and the tool-call conversation loop.
