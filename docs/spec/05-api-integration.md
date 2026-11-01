# API Integration and Error Handling

> Part of the [React Frontend Architecture & Engineering Specification](./README.md).

## 7. API Integration Architecture

### 7.1 Required integration layers

The application must separate API responsibilities into four layers:

1. **HTTP infrastructure:** Base configuration, authentication integration, request IDs, timeout handling, cancellation, and normalized transport errors.
2. **Feature API modules:** Endpoint-specific operations and request/response contracts.
3. **Query and mutation hooks:** Server-state lifecycle, caching, retries, invalidation, and loading states.
4. **UI components:** Display state and invoke feature actions without knowing transport details.

Example:

```
QuotationPage
    |
    v
useCreateQuotation()
    |
    v
quotation.api.ts
    |
    v
http-client.ts
    |
    v
Backend API / API Gateway
```

### 7.2 Central HTTP client

```ts
// core/api/http-client.ts

import axios from "axios";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});
```

The base URL must point to a trusted, environment-specific API endpoint. Credentials must never be placed in source code or committed environment files.

The central client should also provide:

- Correlation or request IDs where supported.
- Standardized error normalization.
- Safe handling of expired sessions.
- Request cancellation.
- Approved CSRF protection for cookie-authenticated requests.
- Safe telemetry and logging.
- Explicit timeout and retry policies.

Authentication and refresh behavior must be designed with the identity provider and backend. Avoid automatic retry loops or duplicate execution of financial operations.

### 7.3 Feature-level API module

```ts
// features/quotation/api/quotation.api.ts

import { httpClient } from "../../../core/api/http-client";

export interface CreateQuotationRequest {
  productCode: string;
  businessLine: "GROUP" | "RETAIL";
  customerId: string;
}

export interface QuotationResponse {
  quotationId: string;
  status: "PENDING" | "READY" | "REJECTED";
}

export async function createQuotation(
  request: CreateQuotationRequest,
): Promise<QuotationResponse> {
  const response = await httpClient.post<QuotationResponse>(
    "/v1/quotations",
    request,
  );

  return response.data;
}
```

This is an illustrative contract. The actual endpoint, authentication model, and response fields must match the backend API specification.

Production code must validate untrusted API responses at runtime where appropriate. TypeScript generic parameters alone do not validate server responses.

### 7.4 Query and mutation hooks

```ts
// features/quotation/api/quotation.queries.ts

import { useMutation } from "@tanstack/react-query";
import {
  createQuotation,
  type CreateQuotationRequest,
} from "./quotation.api";

export function useCreateQuotation() {
  return useMutation({
    mutationFn: (request: CreateQuotationRequest) =>
      createQuotation(request),
  });
}
```

UI usage:

```tsx
const quotationMutation = useCreateQuotation();

function handleCreateQuotation() {
  quotationMutation.mutate({
    productCode: "RETAIL_HEALTH",
    businessLine: "RETAIL",
    customerId: customer.id,
  });
}
```

Add appropriate pending, success, and failure states. Disable duplicate submissions while a mutation is in progress, but do not rely on the UI alone to prevent duplicate financial operations.

### 7.5 API integration rules

- Every feature owns its API functions and request/response contracts.
- Use stable, versioned API contracts and generated types when supported by the backend.
- Keep request/response mappers separate when backend and UI models differ.
- Use query keys that include all relevant parameters and business context.
- Never cache sensitive data beyond the approved session and data-classification policy.
- Clear user-specific cached data on logout, account switching, and session invalidation.
- Do not expose raw backend stack traces or internal service errors to users.
- Do not retry non-idempotent operations blindly.
- Financial mutations must use backend-supported idempotency controls where appropriate.
- Treat all client-supplied IDs, product codes, amounts, and business-line fields as untrusted.
- Validate and authorize every operation on the server, regardless of frontend checks.

### 7.6 API error model

Normalize errors into categories such as:

- `VALIDATION_ERROR`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `NETWORK_ERROR`
- `TIMEOUT`
- `SERVER_ERROR`
- `UNKNOWN_ERROR`

Provide a safe, user-friendly message for each category. Keep diagnostic details in approved, redacted telemetry. Never show tokens, internal headers, stack traces, or sensitive server responses in UI notifications.

---

## 17. Error Handling and User Feedback

- Normalize all transport and API errors into the categories in Section 7.6 inside `core/api/api-error.ts`.
- Provide a single mapping from error category to safe user message and recommended action (retry, re-login, contact support).
- Use error boundaries for rendering failures and global handlers for unhandled rejections, reporting redacted diagnostics.
- Show clear loading, empty, success, and failure states for every asynchronous view.
- Include a support reference (correlation ID) in user-visible errors where policy allows.

```ts
// core/api/api-error.ts (illustrative)
export type ApiErrorCategory =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly category: ApiErrorCategory,
    public readonly userMessage: string,
    public readonly requestId?: string,
    public readonly fieldErrors?: Readonly<Record<string, string>>,
  ) {
    super(userMessage);
    this.name = "ApiError";
  }
}
```

