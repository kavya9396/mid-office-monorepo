# AGENTS.md — Ask Mode

This file provides guidance to agents when working with code in this repository.

## Non-obvious documentation context

- **Two co-existing spec layers.** `docs/spec/` describes the *target* React architecture using `@axiom/*`
  package names (e.g. `@axiom/ui`, `@axiom/auth`). The *current* codebase uses `@insurance-poc/*` packages
  and a simpler implementation. Do not conflate them — the spec is a planning document for future work.

- **`design-reference/ui-prototypes/` contains 134 standalone HTML files** that are the authoritative UI
  source of truth. Screen behaviour and visual questions must be answered from these files, not from
  `docs/spec/` (which describes future React screens). The prototypes are never imported into the app build.

- **`docs/spec/screens/` derives from the prototypes**, not the other way around. When the spec and the
  prototype disagree on a visual detail, the prototype wins.

- **Workstream acronyms** (easily confused):
  - **CUW** = Chief Underwriter (Retail). Not "Credit Underwriter".
  - **CVT** = Credit Verification Team (Retail).
  - **SUW** = Sub-Underwriter (Retail — Reinstatement flow).
  - **MAS** = Medical Appointment Scheduling (Retail).
  - **PIVV** = Video verification (Retail).
  - **GUW** = Group Underwriting (Group — Formal and Informal variants).
  - **DVT** = Document Verification Team (both Retail and Group).
  - **DRS** = Decision-Ready Screen — the main underwriter workspace. Not a data store.

- **Prototype file naming conventions:**
  - `landing-prototype.html` = Inbox / task list screen.
  - `drs-screen-prototype.html` = DRS main workspace.
  - `*-mr-view-medical.html` = Medical report view.
  - `*-nmr-view-financial.html` = Financial / non-medical referral report view.
  - Files with `_` suffix (e.g. `guw-mr-view-medical_.html`) are alternate variants — ask which is canonical.
  - `index.html` in a workstream folder is the task index, not the app entry point.

- **`@insurance-poc/utils` (not `@insurance-poc/util`).** The README and some older docs say `util`
  (no `s`). The actual `package.json` name is `@insurance-poc/utils`. Always use the `s` form.

- **Three completely separate SPAs.** Common, Retail, and Group each have their own `BrowserRouter` and
  React root. App-to-app transitions are full-page navigations (`window.location.assign`), not React Router.
  The shared `sessionStorage` only works because all three are served from one browser origin via the
  Common Vite proxy in development.

- **No tests, no lint, no MSW in the current codebase.** `pnpm typecheck` is the only automated check.
  The spec mentions Vitest, Playwright, ESLint, Prettier, and MSW — these are target-state, not current.

- **Spec sections after 8.1 are drafted baseline, not confirmed.** See
  `docs/spec/11-definition-of-done-governance.md` for items requiring confirmation.

- **Mock credentials:** `UW001` (Retail only), `UW002` (Group only), `UW003` (both).
  Password field only checks non-empty — no real validation.
