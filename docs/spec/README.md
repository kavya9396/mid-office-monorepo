# React Frontend Architecture & Engineering Specification

Financial Services Insurance Platform — Group & Retail Insurance

| Item | Value |
|---|---|
| Status | Baseline specification for implementation |
| Target framework | React + TypeScript |
| Architecture style | Feature-based modular architecture with shared components and domain-driven boundaries |

The specification is split into focused documents. Section numbers are kept from the original document so cross-references (for example "Section 7.6") remain valid.

## Contents

| File | Sections | Topic |
|---|---|---|
| [01-overview-principles-stack.md](./01-overview-principles-stack.md) | 1–3 | Purpose, objectives, architecture principles, technology stack |
| [02-folder-structure.md](./02-folder-structure.md) | 4 | Folder structure and ownership rules |
| [03-business-lines.md](./03-business-lines.md) | 5 | Group and Retail business context, configuration, registry, conditional UI |
| [04-components.md](./04-components.md) | 6 | Reusable component levels, rules, and examples |
| [05-api-integration.md](./05-api-integration.md) | 7, 17 | API layers, HTTP client, hooks, rules, error model, user feedback |
| [06-security.md](./06-security.md) | 8 | Authentication, authorization, data protection, secure coding, audit, supply chain |
| [07-config-state-forms-routing.md](./07-config-state-forms-routing.md) | 9–12 | Environment config, state management, forms and validation, routing |
| [08-coding-standards.md](./08-coding-standards.md) | 13 | TypeScript, React, naming, import-boundary rules |
| [09-testing-and-delivery.md](./09-testing-and-delivery.md) | 14, 18 | Testing strategy, CI/CD quality gates, release practices |
| [10-accessibility-performance.md](./10-accessibility-performance.md) | 15, 16 | Accessibility, i18n, performance |
| [11-definition-of-done-governance.md](./11-definition-of-done-governance.md) | 19–21 | Definition of Done, adding a business line, governance, open items |
| [screens/README.md](./screens/README.md) | 22 | Screen specs — all 134 UI prototype screens across Group, Retail, Search |

## Reading order

- **New developers:** 01 → 02 → 08 → 04 → 05
- **Feature work for Group or Retail:** 03 → 05 → 06
- **Security and compliance review:** 06 → 05 → 11
- **QA and release:** 09 → 10 → 11

## Note on provenance

Sections 1–7 and the start of Section 8.1 come from the supplied source text. The source was truncated in Section 8.1; the remainder (8.1 onward through Section 21) is a drafted baseline and must be reviewed. See "Items requiring confirmation" in [11-definition-of-done-governance.md](./11-definition-of-done-governance.md).
