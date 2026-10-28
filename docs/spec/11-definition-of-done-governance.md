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

---

## 20. Adding a New Business Line or Product

1. Extend the `BusinessLine` union and add a validated entry in `business-lines/`.
2. Create `config.ts`, `workflows/`, `rules/`, and `api/` for the new line, implementing existing contracts.
3. Register it in `business-lines/registry.ts` and extend `parseBusinessLine`.
4. Add namespaced routes, entitlement checks, and guards.
5. Reuse existing shared UI, domain components, and features; add only new behavior.
6. Add tests proving capability flags, workflows, and entitlement behavior.
7. Obtain product-owner and backend-team approval of capabilities before release.

---

## 21. Governance and Open Items

- **Ownership:** Each feature and shared module has a named owner (CODEOWNERS).
- **Architecture decisions:** Significant decisions are recorded as ADRs.
- **Exceptions:** Deviations from this specification require documented approval from the architecture and security teams.
- **Review cadence:** This document is reviewed at least quarterly and after major incidents.

### Items requiring confirmation

- Identity provider, BFF design, session and idle timeouts.
- Step-up authentication triggers and mechanisms.
- Regulatory mapping (IRDAI, DPDP Act, and internal policies).
- Authoritative capability matrix for Group and Retail products.
- Final library versions, coverage thresholds, and performance targets.
- Idempotency-key contract with backend services for financial mutations.
