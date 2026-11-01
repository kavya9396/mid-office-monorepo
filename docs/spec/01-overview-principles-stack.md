# React Frontend Architecture & Engineering Specification

**Financial Services Insurance Platform — Group & Retail Insurance**

| Item | Value |
|---|---|
| Document type | Technical Architecture and Development Standards |
| Status | Baseline specification for implementation |
| Target framework | React + TypeScript |
| Architecture style | Feature-based modular architecture with shared components and domain-driven boundaries |
| Business domains | Group Insurance and Retail Insurance |
| Security classification | Financial-services application; security controls must be validated against applicable regulations and organizational policies |

---

## 1. Purpose and Objectives

This document defines mandatory architectural principles, folder structures, coding standards, component design rules, API integration patterns, and security requirements for building and maintaining a React-based insurance application.

The application must support multiple insurance business lines through configuration and explicit business context rather than duplicated implementations.

### Primary objectives

- **Modular architecture:** Each feature must be independently maintainable, testable, and modifiable.
- **Reusable components:** Common UI components and business capabilities must be reusable across Group and Retail Insurance.
- **Parameter-driven business behavior:** The application must select the appropriate business rules and workflows based on an explicit business context, such as `GROUP` or `RETAIL`.
- **Component-wise API integration:** API calls, request/response mapping, validation, and error handling must be organized by feature and business capability.
- **Security by design:** Authentication, authorization, data protection, secure session handling, and auditability must be incorporated throughout development.
- **Scalability:** New insurance products, workflows, and business lines must be added with minimal changes to existing functionality.
- **Quality assurance:** Code must be covered by automated tests, static analysis, accessibility checks, and security testing.

---

## 2. Architecture Principles

| Principle | Requirement |
|---|---|
| Separation of concerns | UI, business logic, API access, and configuration must remain separate. |
| Feature independence | Each feature owns its components, hooks, services, schemas, and tests. |
| Reusability | Common components must not depend on individual business-line implementations. |
| Explicit business context | Group and Retail behavior must be selected using validated, typed configuration. |
| Dependency inversion | Features should depend on domain contracts and abstractions, not infrastructure details. |
| Type safety | TypeScript strict mode must be enabled. Avoid `any` and unsafe type assertions. |
| Secure defaults | Sensitive actions must be denied unless explicitly authorized. |
| Testability | Business rules must be testable without rendering the UI or calling real APIs. |
| Independent modification | Changes to one feature must not require unrelated feature changes. |
| Observability | Errors, security events, and operational failures must be observable without leaking sensitive data. |

### Architectural boundaries

The application must follow this dependency direction:

```
Application → Features → Domain / Shared Contracts → Infrastructure Adapters
```

The UI must not directly call `fetch`, Axios, or another HTTP client from arbitrary components. All remote communication must pass through the designated API integration layer.

Shared modules must not import business-specific feature modules. Cross-feature communication must use explicit contracts or application-level orchestration.

---

## 3. Recommended Technology Stack

The following is the recommended baseline. Exact versions must be pinned and approved during project setup.

| Technology | Purpose |
|---|---|
| React + TypeScript | UI development and compile-time safety |
| Vite | Development server and production bundling |
| React Router | Route definitions and navigation |
| TanStack Query | Server-state fetching, caching, cancellation, and invalidation |
| React Hook Form + Zod | Form management and runtime schema validation |
| Axios or a standardized Fetch wrapper | Centralized HTTP integration. Select one primary approach. |
| Vitest + React Testing Library | Unit and component testing |
| Playwright | End-to-end testing |
| ESLint + Prettier | Static code quality and formatting |
| MSW | API mocking for development and automated tests |

Use an approved dependency set and maintain a software bill of materials. Libraries must be reviewed for licensing, vulnerability exposure, maintenance status, and supply-chain risk.

