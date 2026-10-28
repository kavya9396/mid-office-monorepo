# Group and Retail Business-Line Design

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## 5. Group and Retail Insurance Design

### 5.1 Business context

Every business workflow must receive an explicit business context. The context must be derived from an authorized application route, server-provided assignment, or validated workflow state.

Do not trust a URL parameter, local storage value, or client-side configuration as proof of business authorization.

```ts
// domains/business-context.ts

export type BusinessLine = "GROUP" | "RETAIL";

export interface BusinessContext {
  businessLine: BusinessLine;
  productCode: string;
  locale: string;
}
```

### 5.2 Configuration-driven behavior

Shared features should receive configuration and policy implementations through typed contracts.

```ts
// business-lines/contracts.ts

import type { BusinessContext } from "../domains/business-context";

export interface InsuranceBusinessConfig {
  context: BusinessContext;
  capabilities: {
    supportsBulkEnrollment: boolean;
    supportsDependents: boolean;
    supportsIndividualPayment: boolean;
  };
  routes: {
    quotation: string;
    policy: string;
    claims: string;
  };
}
```

Example business configurations:

```ts
// business-lines/group/config.ts

import type { InsuranceBusinessConfig } from "../contracts";

export const groupConfig: InsuranceBusinessConfig = {
  context: {
    businessLine: "GROUP",
    productCode: "GROUP_HEALTH",
    locale: "en-IN",
  },
  capabilities: {
    supportsBulkEnrollment: true,
    supportsDependents: true,
    supportsIndividualPayment: false,
  },
  routes: {
    quotation: "/group/quotations",
    policy: "/group/policies",
    claims: "/group/claims",
  },
};
```

```ts
// business-lines/retail/config.ts

import type { InsuranceBusinessConfig } from "../contracts";

export const retailConfig: InsuranceBusinessConfig = {
  context: {
    businessLine: "RETAIL",
    productCode: "RETAIL_HEALTH",
    locale: "en-IN",
  },
  capabilities: {
    supportsBulkEnrollment: false,
    supportsDependents: true,
    supportsIndividualPayment: true,
  },
  routes: {
    quotation: "/retail/quotations",
    policy: "/retail/policies",
    claims: "/retail/claims",
  },
};
```

> The values above are illustrative defaults, not authoritative insurance rules. Actual capabilities must be approved by product owners and the backend domain teams.

### 5.3 Runtime selection

```ts
// business-lines/registry.ts

import { groupConfig } from "./group/config";
import { retailConfig } from "./retail/config";
import type { BusinessLine } from "../domains/business-context";

const configs = {
  GROUP: groupConfig,
  RETAIL: retailConfig,
} as const;

export function getBusinessConfig(line: BusinessLine) {
  return configs[line];
}
```

Validate untrusted input before accessing the registry:

```ts
export function parseBusinessLine(
  value: unknown,
): BusinessLine {
  if (value === "GROUP" || value === "RETAIL") {
    return value;
  }

  throw new Error("Unsupported business line");
}
```

The authenticated server-side context must determine which business lines and products a user is allowed to access.

### 5.4 Conditional UI rules

Use capability flags for simple presentation differences.

```tsx
interface EnrollmentOptionsProps {
  config: InsuranceBusinessConfig;
}

export function EnrollmentOptions({
  config,
}: EnrollmentOptionsProps) {
  return (
    <section>
      {config.capabilities.supportsBulkEnrollment && (
        <BulkEnrollment />
      )}

      {config.capabilities.supportsDependents && (
        <DependentSelection />
      )}
    </section>
  );
}
```

For substantial workflow differences, use separate Group and Retail workflow implementations behind a common interface rather than adding many nested conditions to one component.

**Mandatory rules:**

- Do not scatter `businessLine === "GROUP"` checks throughout the application.
- Do not duplicate shared customer, address, document, or policy UI without a demonstrated need.
- Do not encode underwriting, premium calculation, eligibility, or final authorization decisions solely in the frontend.
- Treat backend responses as authoritative for protected business operations.
- Keep product-specific configuration versioned and validated.
- If configuration is supplied remotely, validate its schema and integrity, and define safe failure behavior.
