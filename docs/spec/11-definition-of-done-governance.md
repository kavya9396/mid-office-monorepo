# Definition of Done, Extensibility and Governance

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## 19. Definition of Done

A feature is complete only when:

- [ ] It follows the folder structure and import boundaries.
- [ ] It receives an explicit, validated business context.
- [ ] Its API calls go through the feature API module and central HTTP client, with runtime response validation.
- [ ] Authorization and error states are handled; the backend remains authoritative.
- [ ] No sensitive data is persisted in browser storage, URLs, logs, or telemetry.
- [ ] Unit, component, integration, and accessibility tests pass; E2E covers critical paths.
- [ ] Security review is complete for authentication, payment, or personal-data flows.
- [ ] Documentation (feature README, public API in `index.ts`) is updated.
- [ ] CI quality gates pass with no new warnings.

### Current-repo checklist

The items above are the target-architecture checklist. Several rely on tooling that is not yet in
the repo (feature API module, central HTTP client, runtime response validation, Vitest/Playwright,
CI). Until then, a screen or task is done when:

- [ ] `pnpm --filter @insurance-poc/<app> typecheck` passes with zero errors (`pnpm typecheck` is the only automated check; there are no lint or test scripts).
- [ ] No relative cross-package imports — only `@insurance-poc/*` workspace names.
- [ ] No bare MUI imports in app code — UI goes through `@insurance-poc/ui` wrappers; all styling uses `sx`.
- [ ] No direct `mock/` JSON imports in screens — data goes through a service wrapped with `wait(ms)`; "not found" returns `null` and renders an explicit not-found state.
- [ ] Labels, button text, error messages, and rendered text composition match the HTML prototype (`.bob/rules/01-spec-rules.md`, rule 7); `data-testid` = `data-field-id`.
- [ ] Session access only through `@insurance-poc/utils` helpers; cross-SPA navigation only via `replaceUrl()` / `assignUrl()`.
- [ ] New path constants are in `packages/routes/src/index.ts`; ports/base paths changed only in `dev-config.json`.
- [ ] `docs/spec/02-folder-structure.md` is updated if the folder tree, exports, routes, or mock files changed.
- [ ] The screen spec is updated (tasks ticked, open questions recorded) and `/check <screen>` has been run.

---

## 20. Adding a New Business Line or Product

1. Extend the `BusinessLine` union and add a validated entry in `business-lines/`.
2. Create `config.ts`, `workflows/`, `rules/`, and `api/` for the new line, implementing existing contracts.
3. Register it in `business-lines/registry.ts` and extend `parseBusinessLine`.
4. Add namespaced routes, entitlement checks, and guards.
5. Reuse existing shared UI, domain components, and features; add only new behavior.
6. Add tests proving capability flags, workflows, and entitlement behavior.
7. Obtain product-owner and backend-team approval of capabilities before release.

### Current-repo procedure

The `business-lines/` registry above is the target design and does not exist yet. In the current
monorepo a business line is an app and a workstream is a module inside it:

1. Add the workstream under `apps/retail` or `apps/group` using the `add-feature-module` skill
   (`.bob/skills/add-feature-module.md`): `modules/<workstream>/`, `services/<workstream>Service.ts`,
   routes in `routes/AppRoutes.tsx` wrapped by the existing `RequireSession` guard.
2. Write and get approval of `docs/spec/screens/<workstream>.md` first (`Status: Approved`).
3. Add path constants to `packages/routes/src/index.ts` and mock data under `mock/<workstream>/`.
4. Add a genuinely new business line (beyond `RETAIL` / `GROUP`) only after extending
   `SessionBusinessType`, `authorizeBusiness`, `businessInboxUrl` / `drsUrl`, `dev-config.json`
   (port and base path), a new app with its own Dockerfile, and the Common gateway proxy.
5. Update `docs/spec/02-folder-structure.md`.

---

## 21. Governance and Open Items

- **Ownership:** Each feature and shared module has a named owner (CODEOWNERS).
- **Architecture decisions:** Significant decisions are recorded as ADRs.
- **Exceptions:** Deviations from this specification require documented approval from the architecture and security teams.
- **Review cadence:** This document is reviewed at least quarterly and after major incidents.

### Current governance status

- No `CODEOWNERS` file and no ADR folder exist in the repo; ownership and decision records are still to be set up.
- Agent/process governance lives in `AGENTS.md` and `.bob/` (rules, commands, skills) and is part of the review scope.

### Items requiring confirmation

- Identity provider, BFF design, session and idle timeouts.
- Step-up authentication triggers and mechanisms.
- Regulatory mapping (IRDAI, DPDP Act, and internal policies).
- Authoritative capability matrix for Group and Retail products.
- Final library versions, coverage thresholds, and performance targets.
- Idempotency-key contract with backend services for financial mutations.
