# IBM Bob GitHub SDLC Lab

This lab demonstrates how to use **IBM Bob** together with **GitHub.com** to build, test, review, and evolve a small finance analytics application with an end-to-end agentic workflow.

The scenario uses a simple React-based market dashboard application that:
- pulls market data for **IBM** and up to 4 competitors
- shows views for **current day**, **last 7 days**, and **last quarter**
- is validated locally before code is committed and pushed
- is extended through GitHub pull requests that Bob can interpret and implement

---

## Lab Goals

By the end of this lab, participants should understand how IBM Bob can help with:

1. **Code generation**
   - Scaffold a new application
   - Implement dashboards and data integrations
   - Add tests and documentation

2. **Local engineering workflow**
   - Inspect the repository
   - run tests
   - review changes
   - prepare commits

3. **GitHub workflow integration**
   - analyze Git diffs
   - generate PR descriptions
   - align code changes to GitHub issues or PR requests
   - support PR-driven feature delivery

4. **Autonomous change handling**
   - interpret a requested enhancement from GitHub
   - implement a new feature branch
   - validate the change
   - push the update back to the repository for review and merge

---

## Reference Style

This repository contains a reference folder with an example workshop style.  
This new lab follows the same approach:
- clear workshop framing
- step-by-step exercises
- concrete prompts to use with Bob
- focus on realistic engineering outcomes

---

## Lab Contents

- `WORKSHOP-part1-BUILD.md` — Build the finance dashboard application with Bob
- `WORKSHOP-part2-GITHUB-AUTOMATION.md` — Use Bob with GitHub issues, branches, PRs, and review automation
- `.github/workflows/finance-app-ci.yml` — Example CI workflow for the finance app
- `.github/PULL_REQUEST_TEMPLATE.md` — Example pull request template for human + Bob collaboration
- `docs/pr-feature-request-example.md` — Example PR/request scenario for autonomous feature implementation

---

## Target Demo Scenario

### Application
A React application that presents finance dashboards for:
- IBM
- Microsoft
- Oracle
- SAP
- Salesforce

The dashboards should cover:
- **current day**
- **last 7 days**
- **last quarter**

Example data source:
- Yahoo Finance, typically through a public npm package such as `yahoo-finance2`, or via a backend proxy if needed

### Operational Flow
1. Bob creates the application structure
2. Bob implements finance data retrieval and dashboard views
3. Bob adds or updates tests
4. Bob validates the project locally
5. Bob reviews the diff
6. Bob helps create commit and PR content
7. A new GitHub PR requests a feature such as:
   - “add a graph for a user-selected company”
8. Bob fetches the request context, implements the feature, tests it, and pushes the branch updates

---

## Running and Validating the App Locally

Requires **Node.js 22 or later** (a requirement of `yahoo-finance2`) and npm.

```bash
npm install
```

### Run the dashboard

| Command | What it does |
|---|---|
| `npm run dev` | Dashboard with deterministic **mock data**. Works offline; this is the default. |
| `npm run dev:live` | Starts the Yahoo Finance proxy (port 3001) and the dashboard in `live` mode, which reads `.env.live` (`VITE_DATA_SOURCE=http`). |

Open the URL that Vite prints (usually http://localhost:5173).

### Validation checks

| Command | Checks |
|---|---|
| `npm run typecheck` | TypeScript type check of the app, server and config (`tsc --noEmit`). |
| `npm run lint` | ESLint, with zero warnings allowed. |
| `npm test` | All unit and component tests (Vitest). No test uses the network. |
| `npm run test:coverage` | Same tests plus coverage, failing if it drops below the floors in `vite.config.ts` (85% lines/statements/functions, 75% branches). |
| `npm run build` | Type check plus production build into `dist/`. |
| `npm run validate` | **Everything above in CI order**: typecheck, lint, tests with coverage, build. |

`npm run validate` is the same sequence the GitHub Actions workflow runs. Run it before every commit or push.

### What success looks like

- `npm run validate` exits with code 0 and prints no warnings or errors.
- Every test file passes. Coverage stays above the thresholds.
- `npm run build` finishes with `✓ built in …` and writes `dist/`.
- `npm run dev` shows five quote cards (IBM, MSFT, ORCL, SAP, CRM), the three tabs (Current day, Last 7 days, Last quarter), and a comparison chart with a ranking table. Switching tabs changes the chart without a page reload.
- With `npm run dev:live` running, `http://localhost:3001/api/quotes?symbols=IBM` returns JSON with a price, and `…/api/history?symbols=IBM&window=week` returns an ascending list of points.
- Failure cases behave as designed: an unknown ticker returns HTTP 400 with `"code":"INVALID_SYMBOL"`, an invalid `window` returns HTTP 400 with `"code":"BAD_REQUEST"`, and the dashboard shows an error message with a **Retry** button if the data service is unreachable.


## Important Practical Note

Bob can:
- inspect code
- modify files
- run tests and commands
- analyze diffs
- fetch GitHub issue context
- generate PR descriptions
- help prepare and push branch changes using git commands

Bob typically does **not** directly merge or close PRs through GitHub UI APIs unless a dedicated integration or slash-command path is available in the environment.

Therefore, in this lab, “close the PR” should be understood as one of these realistic outcomes:
- Bob pushes the requested implementation to the PR branch so the PR is ready to merge
- Bob creates the branch, commit, and PR description for a maintainer to merge
- optionally, the maintainer or an external automation closes/merges the PR after validation

---

## Suggested Audience

- Developer advocates
- Solution architects
- Engineering leads
- AI-assisted development champions
- DevOps / platform teams exploring agentic workflows with GitHub

---

## Suggested Lab Duration

- Part 1: 30–45 minutes
- Part 2: 30–45 minutes

---

## Expected Takeaways

Participants should leave with a practical understanding of:
- how Bob accelerates initial application delivery
- how Bob fits into a Git-based workflow
- how Bob can process feature requests coming from GitHub
- how to structure a realistic “AI engineer in the loop” lab for demonstrations and workshops

---

## Related Reference

See the existing reference materials in [Git Platform Operations Guide](https://github.ibm.com/ClientEngineering/bob/blob/main/GitOps/README.md).
