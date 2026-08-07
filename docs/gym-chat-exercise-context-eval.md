# Gym chat exercise disambiguation and context-retention eval

Task: P5-T48

Run date: 2026-08-07

Surface: live local app, `POST http://localhost:3000/api/gym-chat`

Model configuration: `resolveModel()` default `gpt-4o`, temperature `0.2`

## Purpose

This suite measures whether gym chat can associate user language with the correct exercise and retain the original analytical intent after a clarification. It is intentionally weighted toward incline-press variants because broad labels such as "incline press" can refer to barbell, dumbbell, or machine movements.

This records the P5-T48 findings baseline and the P5-T57 prompt-level regression contract. The baseline remains unchanged so before/after behavior can be compared.

## Pass criteria

A case passes only when all applicable conditions hold:

1. An ambiguous exercise phrase is resolved from context or prompts one short, relevant clarification before querying data.
2. A known canonical exercise or alias is associated with the intended catalog exercise; zero-row results do not produce unrelated suggestions.
3. After a clarification, the assistant retains the original metric, time window, comparison, and requested response shape.
4. The answer accurately distinguishes an aggregate result row from a non-zero set count and does not invent data.
5. The request completes without an API error.

## How to rerun

Run against the same live chat endpoint used by the widget. For a first turn:

```powershell
$body = @{
  messages = @(@{
    role = 'user'
    content = 'How has my incline press progressed over the last 90 days?'
  })
  client = @{ timezone = 'America/New_York' }
} | ConvertTo-Json -Depth 12 -Compress

$response = Invoke-RestMethod `
  -Uri 'http://localhost:3000/api/gym-chat' `
  -Method Post `
  -ContentType 'application/json' `
  -Headers @{ Accept = 'application/json' } `
  -Body $body `
  -TimeoutSec 90
```

For each follow-up, send only the newest user message in `messages` and copy the previous response's `conversationState` into the next request:

```powershell
$body = @{
  messages = @(@{ role = 'user'; content = 'I mean incline dumbbell press.' })
  client = @{ timezone = 'America/New_York' }
  conversationState = $response.conversationState
} | ConvertTo-Json -Depth 12 -Compress
```

Start each numbered case with an empty conversation state. Record the assistant text, query parameters, row counts, errors, and exercise suggestions. Because the model runs at temperature `0.2` and the database is live, preserve the run date and compare behavior, not exact prose.

## Baseline result

Strict result: **3/12 passed (25%)**. Eight failed behaviorally and one failed because the captured request returned HTTP 500. A retry of the HTTP-500 control later returned 200, so the error is recorded as intermittent rather than an exercise-resolution root cause.

| ID | Turns | Focus | Result | Primary failure |
| --- | ---: | --- | --- | --- |
| S1 | 1 | Ambiguous incline-press progression | Fail | Broad term was queried without clarification |
| S2 | 1 | "Incline bench press" alias | Fail | Zero rows and wrong fallback association |
| S3 | 1 | Exact incline dumbbell canonical name | Pass | Direct answer; no conversational context required |
| S4 | 1 | Flat-bench control | Fail | Captured request returned HTTP 500 |
| S5 | 1 | General coaching control | Pass | Direct, relevant answer without an unnecessary query |
| M1 | 2 | Clarify variant, retain progression/window | Fail | Variant association failed after correction |
| M2 | 2 | Clarify variant, retain best-set intent | Fail | Exact barbell phrase mapped to no data/Bench Press suggestion |
| M3 | 2 | Clarify variant, retain set-count intent | Fail | Broad aggregate and exact variant disagreed |
| M4 | 2 | Correct alias after zero result | Fail | Static suggestions drifted to unrelated exercises |
| M5 | 2 | Resolve "that exercise" | Pass | Exercise, new metric, and original 90-day window were retained |
| M6 | 2 | Compare variants, then compare progression | Fail | Neither variant was resolved, so follow-up could not execute |
| M7 | 2 | Clarify variant, retain "last month" | Fail | Window survived, but variant association failed |

## Cases and transcript excerpts

### S1 - ambiguous incline-press progression - Fail

Prompt: "How has my incline press progressed over the last 90 days?"

Expected: Ask which incline-press variant is intended before combining data, unless conversation context identifies one.

Observed:

> Assistant: "Over the last 90 days, your incline press has shown some variability in estimated 1RM ... Your highest estimated 1RM was approximately 308.3 lbs ..."

The query used a broad `canonical_name ILIKE` filter and returned 22 rows. The assistant silently treated all matching data as one exercise instead of disambiguating it.

### S2 - incline-bench alias lookup - Fail

Prompt: "What was my best incline bench press set in the last 90 days?"

Expected: Resolve the phrase through canonical exercises/aliases or ask a targeted barbell-versus-dumbbell question.

Observed:

> Assistant: "It seems there are no logged sets for the 'incline bench press' ... If you meant a different variation or another exercise, please let me know."

The query returned zero rows and `exerciseSuggestions: ["Bench Press"]`, dropping the incline distinction.

### S3 - exact incline dumbbell name - Pass

Prompt: "How many sets of incline dumbbell press did I log in the last 90 days?"

Expected: Query the requested canonical exercise and answer the count directly.

Observed:

> Assistant: "You haven't logged any sets of incline dumbbell press in the last 90 days."

The assistant kept the exercise and time window intact. The query returned one aggregate row; the response interpreted its count as zero rather than confusing row count with set count.

### S4 - flat-bench control - Fail

Prompt: "What was my best flat bench press in the last 90 days?"

Expected: Resolve to the appropriate bench-press entry or ask one relevant clarification.

Observed:

> API: `500 Internal Server Error`

The same prompt returned 200 on a later retry with a no-data response, so this is an intermittent reliability failure in the captured baseline.

### S5 - general coaching control - Pass

Prompt: "What should I change if my weekly chest volume has stalled?"

Expected: Give general programming guidance without querying private workout data unless the user asks for personal analysis.

Observed:

> Assistant: "Increase volume gradually ... Vary intensity and load ..."

No SQL query was issued and the answer stayed on the requested coaching topic.

### M1 - clarify variant, retain progression and window - Fail

Turn 1: "How has my incline press progressed over the last 90 days?"

Turn 2: "I mean incline dumbbell press."

Expected: Resolve the selected variant and answer the original 90-day progression question.

Observed:

> Turn 1 assistant: "Your incline press has shown some fluctuations in estimated 1RM ..."
>
> Turn 2 assistant: "It seems there are no recorded sessions for the 'Incline Dumbbell Press' in the last 90 days."

The time window and progression topic remained visible, but the correction could not associate the exact variant with logged data. The first turn also skipped the required disambiguation.

### M2 - clarify variant, retain best-set intent - Fail

Turn 1: "What was my best incline press?"

Turn 2: "The barbell incline bench press."

Expected: Use the second turn as the exercise selector while preserving "best set."

Observed:

> Turn 1 assistant: "Your best incline press was 250 lbs for 7 reps ..."
>
> Turn 2 assistant: "There are no logged sets specifically for the 'Barbell Incline Bench Press.' However, I found a suggestion for 'Bench Press.'"

The metric survived, but the supplied variant did not map to an incline canonical/alias.

### M3 - clarify variant, retain set-count intent - Fail

Turn 1: "How many sets did I do on incline press?"

Turn 2: "Incline dumbbell press, not barbell."

Expected: Recompute the original set count for the selected variant.

Observed:

> Turn 1 assistant: "You've completed a total of 55 sets on the incline press."
>
> Turn 2 assistant: "It appears you haven't logged any sets for the incline dumbbell press."

The count intent survived, but the broad and exact forms produced incompatible exercise associations.

### M4 - alias correction after a zero result - Fail

Turn 1: "Show my incline bench progression."

Turn 2: "Use incline chest press machine."

Expected: Use the correction as the exercise selector and preserve progression as the requested analysis.

Observed:

> Turn 1 assistant: "There are exercises like 'Bench Press,' 'Incline Dumbbell Press,' and 'Cable Crunch' that might be related."
>
> Turn 2 assistant: "Exercises like 'Bench Press,' 'Incline Dumbbell Press,' and 'Chest Fly' are related."

The fallback suggestions were broad muscle-neighbor guesses rather than database-backed aliases, and the progression request never ran.

### M5 - contextual "that exercise" follow-up - Pass

Turn 1: "What was my best incline dumbbell press set in the last 90 days?"

Turn 2: "How many total sets did that exercise have?"

Expected: Resolve "that exercise" to incline dumbbell press and answer the new set-count metric over the retained 90-day window.

Observed:

> Turn 1 assistant: "There are no recorded sets for the 'Incline Dumbbell Press' in the last 90 days."
>
> Turn 2 assistant: "There were no recorded sets for the 'Incline Dumbbell Press' in the last 90 days."

Conversation history successfully resolved "that exercise," switched from best-set to set-count intent, and retained the original 90-day window. A no-data answer is acceptable here because both turns stayed scoped to the exact canonical exercise.

### M6 - compare variants, then compare progression - Fail

Turn 1: "Compare incline bench press and incline dumbbell press volume."

Turn 2: "Which one progressed more?"

Expected: Keep both exercise identities and switch the comparison metric from volume to progression.

Observed:

> Turn 1 assistant: "There is no recorded volume for either ... If you've been performing these exercises under different names or aliases, please let me know."
>
> Turn 2 assistant: "I can't assess which one has progressed more."

The follow-up retained the two-exercise comparison concept, but no alias resolution occurred and no progression query could run.

### M7 - clarify variant, retain "last month" - Fail

Turn 1: "What was my incline press volume last month?"

Turn 2: "I mean incline dumbbell press."

Expected: Recompute last month's volume for the selected variant.

Observed:

> Turn 1 assistant: "Your incline press volume for last month was 28,115 lb-reps."
>
> Turn 2 assistant: "There was no recorded volume for the incline dumbbell press last month."

The time window and volume metric survived, but broad versus exact naming produced incompatible results.

## Findings by root-cause area

### System prompt

The prompt says to discover canonical names only after an exercise-filtered query returns zero rows. It does not require catalog resolution before a data query and does not define ambiguity as "more than one canonical exercise matches." Consequently, broad `%incline press%` queries can return mixed variants and bypass clarification entirely (S1, M1, M3, M7).

The conversation instruction says to use full history and resolve references, but it does not explicitly bind a clarification answer to the pending metric, window, and comparison operands. History retention worked for "that exercise," "last month," and several metric follow-ups, but it could not repair an unresolved exercise identity (M1-M7).

### Catalog aliasing

`loadGymCatalog()` injects table and column schema, not the live rows from `exercises` or `exercise_aliases`. The model knows that alias tables exist but is not given an authoritative list of canonical names or aliases before forming its first data query.

`gym_lifts_v.canonical_name` resolves aliases already present in logged rows, but filtering that field with the user's raw phrase is not itself alias lookup. Exact user phrases such as "incline bench press" and "barbell incline bench press" therefore returned zero rows even while broader "incline press" returned data (S2, M2).

The server's zero-row `suggestExerciseNames()` fallback reads a static workout library and uses partial/fuzzy/muscle matching, not the live `exercise_aliases` table. That explains suggestions that dropped "incline" or drifted to `Cable Crunch` and `Chest Fly` (S2, M4).

### Conversation-history handling

The route does carry forward user, assistant, tool-call, and tool-result messages in `conversationState`; the widget returns that state on later turns. The live cases show that short references and windows can survive: "that exercise" resolved to Incline Dumbbell Press in M5, and "last month" survived in M7.

The main history weakness is semantic rather than transport loss: there is no structured pending intent such as `{metric: progression, window: 90 days, unresolvedExercise: incline press}`. The model must infer that state from raw transcript/tool messages, including failed or over-broad prior SQL. A later clarification can therefore inherit the metric/window but still anchor to the wrong or unresolved exercise.

## P5-T57 prompt regression contract

The system prompt now requires an exact exercise identity before any metric query. An ambiguous phrase must produce one short variant clarification and no query; a variant-only reply fills the unresolved exercise field in the pending intent while preserving metric, time window, comparison operands, and response shape. Exact zero-row results remain scoped to the selected canonical exercise and must not trigger broad filters or unrelated static suggestions.

The P5-T48 cases exercise this contract as follows:

| Cases | Required prompt behavior |
| --- | --- |
| S1, S2, S4 | Clarify an ambiguous incline/bench phrase before querying, or use an already unambiguous canonical/alias identity. |
| M1, M2, M3, M7 | After the variant reply, query only that exact variant while retaining progression, best-set, set-count, or volume intent and the original time window. |
| M4 | Treat the machine variant as the selector; do not reuse fuzzy suggestions that drop the incline identity. |
| M5 | Resolve "that exercise" to the previously bound canonical identity while allowing the explicitly changed metric to replace only the metric field. |
| M6 | Keep both bound exercise identities when the follow-up changes only the comparison metric. |

Evidence for a rerun should record, per case, whether a pre-clarification metric query occurred, the exact exercise parameter(s), retained metric/window/comparison fields, row counts, and any suggestions. A passing rerun must show no metric query while an exercise is unresolved and no broad or unrelated fallback after an exact zero-row result.

## Follow-up scope suggested by the baseline

Future tickets may separately cover database-backed canonical/alias resolution and regression automation around live model transcripts; this ticket intentionally keeps the change at the system-prompt contract layer.
