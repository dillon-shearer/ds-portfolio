# UI evidence harness

Use this harness for every ticket that changes a rendered page, component, layout, or interaction. It extends the machine-wide `capture-ui` method with checked-in scenarios, deterministic app fixtures, and a JSON report that is safe to run alongside other work.

## One-time local support install

The repository deliberately does not add Playwright to `package.json`. This follows the project rule requiring approval for repository dependencies and reuses the established `capture-ui` driver choice. Install the browser client into the ignored support directory once:

```powershell
npm install --prefix .ui-evidence/support playwright-core
```

It drives the locally installed Chrome or Chromium. Set `CHROME_PATH` if Chrome is not in its normal Windows location.

## Run a scenario

Use a supplied app URL when one is already available:

```powershell
node scripts/ui-evidence.cjs --scenario home --task-ref P5-T19 --url http://localhost:3000
```

Or start and clean up an isolated development server from the current worktree:

```powershell
node scripts/ui-evidence.cjs --scenario gym --task-ref P5-T19 --isolated
```

Run all checked-in scenarios with `node scripts/ui-evidence.cjs --scenario all --task-ref <ticket> --isolated`. Artifacts always go to `.ui-evidence/<task-ref>/<scenario>/`, and the runner writes `<task-ref>-report.json` next to them. These paths are ignored, so parallel agents cannot overwrite another ticket's captures when they use their own task reference.

The command exits 0 only when every required action, assertion, viewport check, and screenshot succeeds. It exits 1 for incomplete evidence and 2 when the tool itself cannot run. It prints the standard `VISUAL EVIDENCE` block and absolute artifact paths for the ticket comment.

## Scenario contract

Scenarios live in `scripts/ui-scenarios/<name>.json`. A scenario declares:

- `route`, the path below the supplied or isolated URL.
- `viewports`, exact CSS-pixel `{ width, height }` pairs. Every UI scenario must include 360 and 1440 widths.
- `states`, each with a named route override, real `ready` locator, assertions, optional network mocks, and actions.
- `reducedMotion`, which forces `prefers-reduced-motion: reduce` and can be asserted in the scenario.

Supported assertion kinds are `visible`, `count`, `text`, and `eval`. Actions are `click`, `fill`, `press`, `wait` for a visible selector, `focus`, and `tabs`. A focus or Tab action fails the run when the computed focus indicator is not visible. The runner captures every named state before its actions, then captures a `-focus` image after actions.

For client requests, add a `network` entry to a state to fulfill or abort a route deterministically. A declared `delayMs` delays that mocked response by design, never by a blind scenario sleep. For server-driven states, provide a small development/test-only seam instead.

## Gym fixture seam

`/dashboards/gym?__uiState=loaded|empty|loading|error` is available only when `NODE_ENV` is not `production`. It uses in-memory deterministic fixtures for loaded and empty data, holds the server response behind the real loading boundary for the spinner capture, and enters the route error boundary for error evidence. Production ignores the query parameter and retains its normal database behavior.

The checked-in gym scenario covers Dashboard, its Day view using fixture data, and loaded, empty, loading, and error states at both required widths. It never reads the live gym database.

## Add a future scenario

1. Copy the smallest related scenario and name its file after the route or component flow.
2. Add 360 and 1440 viewports, a user-visible readiness locator, meaningful assertions, and named non-happy states.
3. For server-rendered data, add a development/test-only fixture seam that production cannot activate. For client fetches, prefer the scenario's network mock.
4. Include a real focus target, a Tab sequence, and reduced-motion assertion when the surface animates.
5. Run the scenario, inspect each screenshot, fix the worst visible issue, then run it again. Attach the emitted `VISUAL EVIDENCE` block and report path to the ticket.

The report is evidence, not a visual quality score. Complete the rubric lines in the emitted block after inspecting the images using the global design-a-user-facing-change workflow.
