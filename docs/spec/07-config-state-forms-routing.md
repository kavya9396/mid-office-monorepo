# Configuration, State, Forms and Routing

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## 9. Environment and Configuration Management

- Provide typed, validated environment access in `app/config/environment.ts`; fail fast at startup if required values are missing or invalid.
- Validate runtime configuration (`runtime-config.ts`) with Zod and define safe failure behavior (for example, fall back to a minimal safe mode or show a maintenance page).
- Never commit environment files containing real endpoints for production or any credentials. Commit only `.env.example`.
- Separate configuration per environment (local, dev, test, UAT, production) with no production data in lower environments.
- Feature flags must be typed, versioned, owned, and removed once obsolete. Flags must not grant authorization.
- Remote configuration must be fetched from a trusted origin, schema-validated, and integrity-protected.

```ts
// app/config/environment.ts
import { z } from "zod";

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_APP_ENV: z.enum(["local", "dev", "test", "uat", "production"]),
});

export const env = EnvSchema.parse(import.meta.env);
```

---

## 10. State Management Standards

| State type | Approach |
|---|---|
| Server state | TanStack Query; do not copy server data into global stores. |
| Form state | React Hook Form with Zod resolvers. |
| URL state | React Router (filters, pagination, selected tab); never sensitive values. |
| Local UI state | `useState` / `useReducer` within the component. |
| Cross-cutting app state | React Context for auth session, business context, and theme. Keep contexts small and focused. |

Rules:

- Do not introduce a global store (Redux, Zustand) unless a demonstrated need exists and it is approved.
- Context values must be memoized and split by change frequency to avoid unnecessary re-renders.
- Query keys must include business line, product code, and all parameters, for example `["quotation", businessLine, productCode, id]`.
- Multi-step workflows (enrollment, claims wizard) keep draft state in memory only, unless policy explicitly approves server-side drafts.
- Sensitive state must not be persisted to browser storage.

---

## 11. Forms and Validation

- Use React Hook Form with Zod schemas. Schemas live in `features/<feature>/schemas/` or `domains/<domain>/schemas.ts` when shared.
- Client validation improves usability only; the server remains authoritative.
- Validate formats (PAN, mobile number, PIN code, date of birth, IFSC) using shared, tested validators in `shared/utils`.
- Display field-level errors accessibly (`aria-invalid`, `aria-describedby`, `role="alert"`) and move focus to the first error on submit.
- Map server validation errors to fields via the error model.
- Prevent double submission and use idempotency keys for financial operations.
- Bulk data (Group enrollment) must be parsed and validated in a bounded manner (file-size and row limits) with row-level error reporting; heavy parsing should run in a Web Worker.

```ts
// domains/customer/schemas.ts
import { z } from "zod";

export const CustomerSchema = z.object({
  fullName: z.string().min(1).max(120),
  dateOfBirth: z.string().date(),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;
```

---

## 12. Routing and Navigation

- Define routes centrally in `app/router/routes.tsx`, with feature routes lazy-loaded.
- Business-line routes are namespaced (`/group/*`, `/retail/*`) and derive their config from the registry via a validated route loader.
- Protect routes using guards that check authentication, permission, and business-line entitlement.
- Provide not-found, forbidden, and error routes with safe messaging.
- Do not place PII, tokens, or policy numbers that act as secrets in URLs.
- Preserve accessibility on navigation: update document title and move focus to the main heading.

```tsx
// app/router/routes.tsx (illustrative)
const GroupQuotationPage = lazy(
  () => import("../../features/quotation/pages/GroupQuotationPage"),
);
```
