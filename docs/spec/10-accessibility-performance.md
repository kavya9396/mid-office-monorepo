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

---

## 16. Performance Standards

- Code-split by route and by business line; lazy-load heavy components (charts, document viewers, bulk upload).
- Set bundle size budgets and enforce them in CI.
- Virtualize large tables and lists (for example Group member lists).
- Use TanStack Query caching, `staleTime`, and request cancellation appropriately, subject to data-classification limits.
- Optimize images and fonts; avoid layout shift.
- Track Core Web Vitals and set targets (LCP, INP, CLS) agreed with stakeholders.
