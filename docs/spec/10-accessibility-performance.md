# Accessibility, Internationalization and Performance

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## 15. Accessibility and Internationalization

- Target WCAG 2.1 AA (confirm required level with compliance).
- Support full keyboard operation, visible focus, correct semantic HTML, and ARIA only where native semantics are insufficient.
- Ensure colour contrast, text resizing, and screen-reader labelling for forms, tables, and dialogs.
- Modals must trap focus, restore focus on close, and close on `Escape`.
- Announce asynchronous status changes via live regions.
- Externalize all user-facing strings for i18n (for example `react-i18next`); use `BusinessContext.locale` for formatting.
- Format currency, dates, and numbers with `Intl` using the INR currency and the `en-IN` locale by default; support additional locales per product requirements.

### Current implementation status

| Requirement | Status in the codebase |
|---|---|
| Currency formatting (`en-IN`) | Implemented — `formatIndianCurrency` in `@insurance-poc/utils` (`Intl.NumberFormat("en-IN")`). Dates/numbers have no shared helper yet. |
| Modal focus trap, `Escape` to close | Inherited from MUI `Dialog` via `CustomDialog` (`packages/ui/src/Dialog/Dialog.tsx`); the close button has `aria-label="Close dialog"`. Do not set `disableEscapeKeyDown` / `disableEnforceFocus`. |
| Labelling | `aria-label` / `role` used in Login, inbox, previous-policy, `DecisionBar`, `DetailCard`, `QuickLinks` and `ProfileImage`. Every new input needs a `<label>` or `aria-label` (checked by `/check`). |
| Live regions for async status | Not implemented. `CustomSnackbar` is the only status component; add `role="status"` / `aria-live` when building loading/error states. |
| i18n (`react-i18next`, `BusinessContext.locale`) | **Not implemented.** UI strings are literals copied verbatim from the HTML prototypes (required by `.bob/rules/01-spec-rules.md`). No i18n library is installed — do not add one without confirmation. |
| Colour contrast / focus ring | Prototype tokens are copied verbatim; the focus ring is `outline: 2px solid #e45f14`. No automated contrast or axe check exists. |

---

## 16. Performance Standards

- Code-split by route and by business line; lazy-load heavy components (charts, document viewers, bulk upload).
- Set bundle size budgets and enforce them in CI.
- Virtualize large tables and lists (for example Group member lists).
- Use TanStack Query caching, `staleTime`, and request cancellation appropriately, subject to data-classification limits.
- Optimize images and fonts; avoid layout shift.
- Track Core Web Vitals and set targets (LCP, INP, CLS) agreed with stakeholders.

### Current implementation status

| Requirement | Status in the codebase |
|---|---|
| Split by business line | Implemented structurally — Retail and Group are separate SPAs with independent `dist/` artifacts (`pnpm verify:deployments`). |
| Route-level code splitting | Not implemented. Routes in `apps/*/src/routes/AppRoutes.tsx` import pages statically (no `React.lazy`). |
| Bundle size budgets in CI | Not implemented. There is no CI pipeline or budget config in the repo. |
| Virtualized tables | Not implemented. `CustomTable` renders all rows. |
| TanStack Query caching / cancellation | Not installed. Server state uses `useEffect` + `useState` over mock services. |
| Core Web Vitals tracking | Not implemented. |
