# Financial-Services Security Requirements

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## 8. Financial-Services Security Requirements

Security controls must be validated with the organization's security architecture, identity platform, backend teams, and compliance stakeholders. Frontend controls alone cannot guarantee application security.

### 8.1 Authentication and session management

- Use an approved identity provider and standard protocols such as OpenID Connect.
- Prefer a Backend-for-Frontend (BFF) architecture where appropriate, with server-managed sessions and `HttpOnly`, `Secure`, appropriately configured `SameSite` cookies.
- Avoid persistent browser storage for access tokens, refresh tokens, and session secrets.
- Implement session expiry, logout, session invalidation, and reauthentication for sensitive actions.
- Apply step-up authentication or re-authentication for high-risk actions, such as changing bank details, nominee or beneficiary changes, claim payout changes, policy surrender, bulk uploads, and administrative privilege changes.
- Handle session expiry gracefully: preserve no sensitive form data after expiry, redirect to the approved login flow, and return only to validated, same-origin destinations.
- Clear all user-specific in-memory state, query caches, and local drafts on logout, session invalidation, and account switching.
- Support idle timeout and absolute session timeout as defined by security policy, with accessible warnings before expiry.
- Never implement custom cryptography, password handling, or token issuance in the frontend.

### 8.2 Authorization

- Authorization is enforced by the backend. Frontend checks only control presentation and navigation and must never be treated as a security boundary.
- Deny by default: routes, actions, and components requiring permissions must be hidden or disabled unless the permission is explicitly granted by the authenticated session.
- Model permissions as typed constants in `core/auth/permissions.ts`; do not compare raw role strings in components.
- Authorization must consider user, role, business line, product, and resource ownership (for example, a Group administrator must not access another employer's group data).
- Route guards in `app/router/route-guards.tsx` must validate authentication, permission, and business-line entitlement before rendering protected pages.
- Handle `401` and `403` responses consistently through the central HTTP client and error model.

```tsx
// core/auth/permissions.ts
export const Permissions = {
  QUOTATION_CREATE: "quotation:create",
  POLICY_VIEW: "policy:view",
  CLAIM_SUBMIT: "claim:submit",
  ADMIN_MANAGE_USERS: "admin:manage-users",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export function hasPermission(
  granted: ReadonlySet<Permission>,
  required: Permission,
): boolean {
  return granted.has(required);
}
```

### 8.3 Data protection and privacy

- Classify data handled by the UI (for example public, internal, confidential, restricted) and apply handling rules per class.
- Treat PII, health information, KYC identifiers, bank and payment details, and claim documents as sensitive.
- Do not store sensitive data in `localStorage`, `sessionStorage`, IndexedDB, cookies readable by scripts, URLs, or query strings.
- Mask sensitive values by default (for example PAN, Aadhaar, account numbers, policy holder contact details) and reveal only on authorized user action.
- Disable browser autocomplete and caching for sensitive fields where required by policy.
- Never log sensitive data. Use `core/security/redaction.ts` before sending any data to logs or telemetry.
- Do not include sensitive data in analytics events, error messages, or crash reports.
- Apply `Cache-Control: no-store` (set by the server) to responses containing restricted data.
- Comply with applicable data protection and insurance regulations (for example IRDAI guidelines and the Digital Personal Data Protection Act, 2023). Compliance mapping must be confirmed with the legal and compliance teams.

### 8.4 Secure coding and browser protections

- Do not use `dangerouslySetInnerHTML`, `eval`, `new Function`, or dynamic script injection. If HTML rendering is unavoidable, sanitize with an approved library and obtain security review.
- Validate and encode all user-supplied and server-supplied content before display.
- Redirects must use `core/security/secure-navigation.ts` to allow only same-origin or allow-listed destinations (prevents open redirect).
- Apply a strict Content Security Policy (no `unsafe-inline` or `unsafe-eval` where feasible), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` / `X-Frame-Options`, and HSTS at the server or CDN.
- Use Subresource Integrity for any third-party scripts loaded from a CDN; prefer self-hosting.
- Apply CSRF protection (synchronizer token or double-submit cookie, plus `SameSite`) for cookie-authenticated state-changing requests.
- File uploads must restrict type, size, and count on the client for usability, with authoritative validation and malware scanning on the server.
- Do not expose secrets in the bundle. All `VITE_*` variables are public; only non-secret configuration may use them.
- Disable production source maps for public delivery, or restrict them to the error-monitoring service.
- Prevent clickjacking and tabnabbing: use `rel="noopener noreferrer"` on external links.

### 8.5 Audit logging and observability

- Security-relevant events (login, logout, session expiry, step-up challenge, authorization failure, sensitive-data reveal, financial submission) must be reported through `core/observability` using approved event schemas.
- Include correlation/request IDs, a pseudonymous user reference, business line, and timestamp. Exclude PII, tokens, and payloads.
- Authoritative audit trails are written by the backend; the frontend only supplies contextual metadata.
- Error boundaries in `core/errors/error-boundary.tsx` must show safe messages and report redacted diagnostics.
- Define alerting thresholds for repeated authorization failures, unusual error rates, and failed step-up attempts.

### 8.6 Dependency and supply-chain security

- Pin dependency versions and commit the lockfile; use `npm ci` (or equivalent) in CI.
- Run dependency vulnerability scanning (for example `npm audit`, OSV, or an approved SCA tool) on every pull request and on a schedule.
- Generate and retain an SBOM (CycloneDX or SPDX) per release.
- Review new dependencies for licence, maintenance status, and transitive risk before approval.
- Enable secret scanning and prevent committing `.env` files containing credentials.
- Build artifacts must be produced by CI from reviewed source and be reproducible and traceable to a commit.
