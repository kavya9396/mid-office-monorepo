# Coding Standards

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## 13. Coding Standards

### 13.1 TypeScript

- `"strict": true`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`, and `exactOptionalPropertyTypes` where practical.
- No `any`; use `unknown` and narrow. Avoid non-null assertions and unsafe `as` casts.
- Prefer discriminated unions for status and workflow states.
- Use path aliases (`@app`, `@core`, `@domains`, `@features`, `@shared`) and enforce import boundaries via lint rules.

### 13.2 React

- Function components and hooks only.
- Keep components small and focused; extract logic into hooks and pure functions.
- Follow the Rules of Hooks; enable `eslint-plugin-react-hooks`.
- Use stable keys; avoid index keys for dynamic lists.
- Use `React.memo`, `useMemo`, and `useCallback` only where profiling shows benefit.
- Wrap route-level trees in error boundaries and Suspense.

### 13.3 Naming and structure

| Item | Convention |
|---|---|
| Components | `PascalCase.tsx` |
| Hooks | `useCamelCase.ts` |
| API modules | `feature.api.ts`, `feature.queries.ts`, `feature.mappers.ts` |
| Types and interfaces | `PascalCase` |
| Constants | `UPPER_SNAKE_CASE` or `as const` objects |
| Tests | `*.test.ts(x)` colocated or in `__tests__/` |

### 13.4 Import boundary rules (enforced by ESLint)

- `shared/*` must not import from `features/*`, `business-lines/*`, or `app/*`.
- `domains/*` must not import from `features/*`, `shared/ui/*`, or `core/*` infrastructure.
- `features/*` must not import another feature's internals; use its `index.ts`.
- Components must not import `core/api/http-client` directly; only feature `api/` modules may.
- `business-lines/*` must not depend on feature internals; they supply config and policy implementations through contracts.
