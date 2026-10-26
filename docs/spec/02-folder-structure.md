# Monorepo Folder Structure & Pod Architecture

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## Monorepo Architecture Overview

Axiom Underwriting is structured as an enterprise **TypeScript Monorepo** containing **2 deployable applications** (`Group` and `Retail`) and reusable **Common Components & Packages** (`@axiom/ui`, `@axiom/types`, `@axiom/config`, `@axiom/auth`, `@axiom/api-client`, etc.).

```
axiom/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Monorepo CI/CD pipeline
├── apps/                          # 2 Deployable Application Targets
│   ├── retail/                    # Retail Underwriting App (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   └── app.ts
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── group/                     # Group Corporate Underwriting App (Vite + TypeScript)
│       ├── src/
│       ├── main.ts
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── packages/                      # Common Components & Reusable Libraries
│   ├── ui/                        # @axiom/ui (Header, Sidebar, DataTable, Toolbar, Pagination, FilterModal, BusinessToggle, Snackbar, StatusBadge)
│   ├── types/                     # @axiom/types (Domain models, Auth, Navigation, Inbox, SLAs)
│   ├── config/                    # @axiom/config (Pod config, Environments, Endpoints)
│   ├── auth/                      # @axiom/auth (RBAC, Role Matrix, Auth helpers)
│   ├── api-client/                # @axiom/api-client (Base fetch & RTK Query query wrapper)
│   ├── session/                   # @axiom/session (Cross-window storage, Tokens)
│   ├── crypto/                    # @axiom/crypto (PII masking, Field-level encryption)
│   ├── forms/                     # @axiom/forms (Validation utilities & form controls)
│   ├── utils/                     # @axiom/utils (INR/Cr formatters, Dates, SLAs)
│   └── testing/                   # @axiom/testing (Synthetic fixtures & test helpers)
│
├── docs/                          # Architecture & design specifications
│   └── spec/
├── pnpm-workspace.yaml            # pnpm workspace definition
├── package.json                   # Root monorepo orchestrator
├── turbo.json                     # Turborepo task pipeline
└── tsconfig.base.json             # Root TypeScript configuration
```

---

## 1. The Two Deployable Applications (`apps/*`)

### 1. `apps/retail` — Retail Underwriting App
- **Domain**: Retail life insurance underwriting (individual proposals, DVT informal/formal tasks, medical grid, financial assessment, BRE decisioning).
- **Backend Pod**: Retail Cluster (`DEV: https://dev-retail-api.icicipru.local/api/v1`, `PROD: https://retail-api.icicipruinsurance.com/api/v1`).
- **Tech Stack**: Vite + TypeScript consuming `@axiom/ui` and `@axiom/core` packages.

### 2. `apps/group` — Group Underwriting App
- **Domain**: Corporate group underwriting (master schemes, quote configuration, employee/member census batches, reinsurance treaties).
- **Backend Pod**: Group Cluster (`DEV: https://dev-group-api.icicipru.local/api/v1`, `PROD: https://group-api.icicipruinsurance.com/api/v1`).
- **Tech Stack**: Vite + TypeScript consuming `@axiom/ui` and `@axiom/core` packages.

---

## 2. Common Components & Shared Packages (`packages/*`)

### `@axiom/ui` (Common Component Library)
- **`Header`**: Top application bar with logo, active business-line badge, user greeting, and logout action.
- **`Sidebar` / `TaskRail`**: Dynamic task queues with live counters (`totalCount`, `atRiskCount`, `overdueCount`) and utility links.
- **`DataTable`**: High-performance underwriting case table with dynamic column configuration and auto-formatting (INR Lakhs/Crores, dates, SLA badges).
- **`Toolbar`**: Search filter, refresh trigger, filter modal opener, and CSV/Excel export action.
- **`Pagination`**: Pagination controls, rows-per-page selector, and entry counters.
- **`FilterModal`**: Multi-criteria dialog filter.
- **`BusinessToggle`**: Retail vs Group business-line toggle switch.
- **`Snackbar`**: Toast notification feedback.
- **`StatusBadge`**: SLA and underwriting status indicators.

### Other Shared Libraries
- **`@axiom/types`**: Unified TypeScript types for domain objects, inbox rows, SLAs, and auth state.
- **`@axiom/config`**: Environment and pod mapping across `DEV`, `SIT`, `UAT`, `PROD`, and `LOCAL`.
- **`@axiom/auth`**: Role-based access control (RBAC), permission validator, and token lifecycle.
- **`@axiom/api-client`**: Resilient HTTP client with pod routing and timeout handling.
- **`@axiom/session`**: Safe storage abstractions with URL override support.
- **`@axiom/crypto`**: PII masking (Aadhaar, PAN, Bank account) and browser crypto helpers.
- **`@axiom/utils`**: Indian currency formatters (Lakhs/Crores), date parsers, string tools.
- **`@axiom/forms`**: Field validation rules.
- **`@axiom/testing`**: Mock fixtures and test data.
