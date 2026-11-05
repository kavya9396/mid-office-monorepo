# Change password — manual testing guide

Use the Common app at `http://localhost:5183/login` (`pnpm dev`). Retail/Group must stay on the same origin for session.

Password rules (UI and mock): **at least 12 characters**, uppercase, lowercase, digit, special character, no spaces.

Example valid passwords: `NewerPass@1234`, `NewPass@30201`.

---

## Mock mode (`VITE_USE_MOCK=true`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login as **LDAP12345** / any password (≥1 char) / Retail or Group tab | Redirect to **Change password** |
| 2 | **User ID** | Prefilled **LDAP12345**, disabled (not editable) |
| 3 | Current / new / confirm | Use policy-compliant values; e.g. current `OlderPass@1234`, new `NewerPass@5678` |
| 4 | Submit | Success snackbar → session cleared → **Login** |
| 5 | Login again as **LDAP12345** | Goes to inbox (full token + refresh in mock); no change-password redirect |

Mock first-login envelope matches real API shape: **`firstLogin: true`** drives the UI (not sessionStorage). `refreshToken: null`, `sessionId` set, restricted token.

Other mock users (**UW001**, **UW002**, **UW003**) skip change-password and go straight to inbox.

---

## Real API mode (`VITE_USE_MOCK=false`)

Configure in `.env`:

- `VITE_AUTH_*` URLs and Apigee basic credentials
- Valid UAT user whose login returns **`firstLogin: true`**

| Step | Action | Expected |
|------|--------|----------|
| 1 | Sign in with first-time user | API returns **`firstLogin: true`** → redirect to change password |
| 2 | **User ID** | Matches API `data.username` (from login response), read-only |
| 3 | Change password | POST body: `{ "username", "oldPassword", "newPassword" }` + Bearer access token |
| 4 | Success | Session cleared; sign in again with **new** password |
| 5 | Second login | Full `token`, `refreshToken`, `sessionId`; inbox loads; logout sends `{ "refreshToken": "..." }` |

---

## Reset password link (routing)

Email/link format:

`https://<host>/reset-password/validate?token=<token>`

On Common dev: `http://localhost:5183/reset-password/validate?token=...`

Submit still POSTs `{ "token", "newPassword" }` to `VITE_AUTH_RESET_PASSWORD_API` (unchanged).

---

## Protection checks

- **Strict flow (case A):** change-password is allowed **only** immediately after login when the API returned **`firstLogin: true`** (in-memory gate; not sessionStorage).
- Typing `/change-password`, refreshing that page, or opening it without the gate → **session cleared** → **login** (no shortcut to inbox with a first-login token).
- Sign in again; if the API still returns `firstLogin: true`, you are sent to change password again.
- User ID on change-password is read-only (from login `data.username`).

---

## Automated tests

```bash
pnpm --filter @insurance-poc/common test
pnpm typecheck
```

Covers login envelope, change-password POST body (including `username`), reset route, and 12-character policy.
