# Reusable Component Standards

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## 6. Common Reusable Component Standards

### 6.1 Component categories

**Level 1 — Design-system components**
Examples: `Button`, `Input`, `Select`, `Modal`, `Tooltip`, `Spinner`, `Badge`.
These components must be business-agnostic and reusable across all business lines.

**Level 2 — Domain components**
Examples: `CustomerSummary`, `AddressForm`, `PolicyStatus`, `PremiumBreakdown`, `DocumentUpload`.
These components can understand a domain contract but should not own unrelated API orchestration.

**Level 3 — Feature components**
Examples: `GroupEnrollmentForm`, `RetailQuotationPage`, `ClaimsSubmissionWizard`.
These components can compose common and domain components to implement feature-specific workflows.

### 6.2 Component design rules

Every reusable component must:

- Have a single, clearly documented responsibility.
- Use typed props and explicit callbacks.
- Support independent testing.
- Avoid direct dependencies on global business-line state where props or context contracts are more appropriate.
- Avoid embedding API calls in low-level presentation components.
- Expose accessibility attributes and support keyboard interaction.
- Avoid mutating incoming props or shared objects.
- Avoid accessing browser storage directly for business or security decisions.
- Support independent styling and changes without breaking unrelated features.
- Have a defined public export and ownership boundary.

### 6.3 Example reusable form component

```tsx
// shared/ui/Input/Input.tsx

import type { InputHTMLAttributes } from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({
  id,
  label,
  error,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        {...props}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />

      {error && (
        <p id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

The component should not know whether it is used in Group Insurance, Retail Insurance, claims, or quotation workflows.

### 6.4 Reuse versus over-abstraction

Create a shared component when its behavior, accessibility, and design requirements are genuinely common. Keep specialized components local until a stable reusable contract emerges.

Do not create a generic framework for every small UI difference. Reusability must reduce coupling, not introduce complex configuration or obscure business rules.
