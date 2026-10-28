# Testing, Quality Gates and Release

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## 14. Testing Strategy

| Level | Tooling | Scope | Target |
|---|---|---|---|
| Unit | Vitest | Domain rules, mappers, validators, utilities | High coverage of business logic |
| Component | Vitest + React Testing Library | Shared UI and feature components, behavior-focused | All shared UI; critical feature components |
| Integration | RTL + MSW | Feature flows with mocked API | Each feature's main flows and error states |
| End-to-end | Playwright | Critical journeys for Group and Retail | Login, quotation, policy view, payment, claim submission |
| Accessibility | jest-axe / axe-core + Playwright | WCAG checks | All pages and shared components |
| Security | SAST, SCA, DAST, manual review | Dependencies, code patterns, running app | Per release and on schedule |
| Performance | Lighthouse CI, bundle analysis | Core Web Vitals, bundle budgets | Per pull request |

Rules:

- Test behavior, not implementation details.
- Mock network at the boundary with MSW; never call real backends from tests.
- Each business line must have tests proving capability flags and workflows behave correctly.
- Include negative tests: unauthorized access, expired session, malformed API responses, and error categories.
- Do not use real customer data in fixtures; use synthetic data.
- Recommended minimum coverage thresholds (to be confirmed by the team): 80% lines/branches overall, 90% for `domains/` and `core/`.


---

## 18. Quality Gates, CI/CD, and Release

### 18.1 Pull request checks (all mandatory)

1. Type check (`tsc --noEmit`) with strict mode.
2. ESLint (including import-boundary, a11y, and security rules) and Prettier check.
3. Unit, component, and integration tests with coverage thresholds.
4. Dependency vulnerability and licence scan; secret scan.
5. SAST scan.
6. Build succeeds; bundle-size budgets met.
7. Accessibility checks pass.
8. At least one reviewer approval (two for `core/security`, `core/auth`, and payment-related code).

### 18.2 Pipeline stages

`Lint/Typecheck → Test → Security scans → Build → SBOM → Deploy to environment → E2E/DAST → Approval → Release`

### 18.3 Release practices

- Semantic versioning and a maintained changelog.
- Immutable, versioned build artifacts promoted across environments.
- Controlled rollout (canary or phased) with documented rollback.
- Production deployments follow the organization's change-management process.
