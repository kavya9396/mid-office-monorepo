# Login module — SIT test cases

Document for **System Integration Testing** of the Common app login and related auth screens.

---

## 1. Scope

| In scope | Out of scope (other teams / later) |
|----------|-------------------------------------|
| Login screen (Retail / Group tab) | Inbox, DRS, pool columns after login |
| Change password (first-login flow) | Backend API contract validation (use API logs if needed) |
| Forgot password dialog | |
| Reset password page (`/reset-password/validate`) | |
| Logout from Retail/Group header | |
| Session redirect rules (login ↔ change password) | |

---

## 2. Environment setup

| Item | Detail |
|------|--------|
| **Application URL (local SIT)** | `http://localhost:5183/login` — start with `pnpm dev` (Common gateway; do **not** open Retail/Group on `:5184`/`:5185` alone) |
| **Mock mode** | `.env` → `VITE_USE_MOCK=true` — uses mock JSON, no real IAM calls |
| **Real / UAT mode** | `VITE_USE_MOCK=false` — needs VPN, `VITE_AUTH_*` URLs, Apigee basic credentials |
| **Browser** | Chrome/Edge; one tab; clear site data if tests behave oddly |

---

## 3. Password rules (all “new password” fields)

New password must have **all** of:

- Minimum **12** characters  
- At least one **uppercase** letter  
- At least one **lowercase** letter  
- At least one **digit**  
- At least one **special** character (non-alphanumeric)  
- **No spaces**

**Examples (valid):** `NewerPass@1234`, `NewPass@30201`  
**Examples (invalid):** `short` (too short), `nosppecial123` (no special char)

---

## 4. Mock test data (when `VITE_USE_MOCK=true`)

| User ID | Password (mock) | Retail / Group tab | Login API behaviour (mock) |
|---------|-----------------|--------------------|----------------------------|
| **LDAP12345** | Any non-empty | Either | `firstLogin: true`, `mustChangePassword: true` → **change password** |
| **UW001** | Any non-empty | **Retail** | Normal login → **Retail inbox** |
| **UW002** | Any non-empty | **Group** | Normal login → **Group inbox** |
| **UW003** | Any non-empty | Either (match tab) | Normal login → inbox for selected business |

**Forgot password (mock):** known IDs include `UW001`, `LDAP12345`, `tejveer@gmail.com` — others return “User not found.”

**Reset password (mock):** use URL  
`http://localhost:5183/reset-password/validate?token=EqChCEGM80Y8QeeJrpZ4WkAsGLQc3AuMiDy-Ga7rG_TET5UF-ZtAEif0B5FxD4Hr2rv0KaAygm0Q13AQtpsGdHnS1eg9VNJlYIEehM82ZWI%3D`  
(unknown token → “Invalid or expired reset token.”)

**Change password (mock) after LDAP12345 first login:** e.g. current `OlderPass@1234`, new `NewerPass@5678` (must meet policy).

---

## 5. Real / UAT test data

Use credentials provided by **IAM / environment owner**. Confirm login response in browser Network tab:

- Redirect to change password **only if** `data.firstLogin === true` **and** `data.mustChangePassword === true`.  
- If **either** is `false` → user must land on **inbox**, not change password.

---

## 6. Test case format

Each case: **ID**, **Priority** (P1 = must pass for release), **Steps**, **Expected result**.

---

## 6.1 Login — UI and validation

### LOGIN-01 — Empty form cannot submit  
**Priority:** P1  
**Precondition:** On `/login`, mock or real.

| Step | Action |
|------|--------|
| 1 | Leave User ID and Password empty. |
| 2 | Observe **Log In** button. |

**Expected:** Button disabled (or submit does not proceed). Required-field validation shown when applicable.

---

### LOGIN-02 — User ID required  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | Enter password only. |
| 2 | Try to log in. |

**Expected:** User ID validation message; no API call / no navigation.

---

### LOGIN-03 — Password required  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | Enter User ID only. |
| 2 | Try to log in. |

**Expected:** Password validation message; no navigation.

---

### LOGIN-04 — Show / hide password  
**Priority:** P2  

| Step | Action |
|------|--------|
| 1 | Type in Password field. |
| 2 | Click show/hide password control. |

**Expected:** Password toggles between hidden and visible; value unchanged.

---

### LOGIN-05 — Retail tab selection  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | Click **Retail** tab. |
| 2 | Log in as **UW001** (mock) with valid password. |

**Expected:** Redirect to **Retail inbox** (`/retail/inbox` on gateway URL).

---

### LOGIN-06 — Group tab selection  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | Click **Group** tab. |
| 2 | Log in as **UW002** (mock) with valid password. |

**Expected:** Redirect to **Group inbox** (`/group/inbox`).

---

### LOGIN-07 — Invalid credentials (real API)  
**Priority:** P1  
**Precondition:** `VITE_USE_MOCK=false`, invalid password for a valid user ID.

| Step | Action |
|------|--------|
| 1 | Enter valid User ID and wrong password. |
| 2 | Click **Log In**. |

**Expected:** Error message from API (e.g. invalid credentials); user stays on login; **no** session / no inbox.

---

### LOGIN-08 — Already logged in visits login  
**Priority:** P2  
**Precondition:** Successful login as UW001 (not in change-password flow).

| Step | Action |
|------|--------|
| 1 | Navigate to `/login` again. |

**Expected:** Redirect to Retail inbox (session still valid).

---

## 6.2 First login → change password

### LOGIN-09 — Both flags true → change password  
**Priority:** P1  
**Precondition:** Mock **LDAP12345** or UAT user with `firstLogin: true` and `mustChangePassword: true`.

| Step | Action |
|------|--------|
| 1 | Log in with valid credentials. |

**Expected:** Navigate to **Change your password** screen (not inbox).

---

### LOGIN-10 — Only one flag true → inbox (no change password)  
**Priority:** P1  
**Precondition:** Real API user where API returns e.g. `firstLogin: true` and `mustChangePassword: false` (or the opposite). *Mock has no such user; use UAT or API stub.*

| Step | Action |
|------|--------|
| 1 | Log in. |

**Expected:** **Inbox** for selected business; **no** change-password screen.

---

### LOGIN-11 — User ID prefilled on change password  
**Priority:** P1  
**Precondition:** Completed LOGIN-09.

| Step | Action |
|------|--------|
| 1 | On change-password screen, check User ID field. |

**Expected:** User ID matches login `data.username` (e.g. `LDAP12345` / `NL123456`); field **disabled** / not editable.

---

### LOGIN-12 — Change password — password mismatch  
**Priority:** P1  
**Precondition:** On change-password after LOGIN-09.

| Step | Action |
|------|--------|
| 1 | Enter current password. |
| 2 | Enter new password (valid policy). |
| 3 | Enter different confirm password. |

**Expected:** “Passwords do not match”; submit disabled or blocked.

---

### LOGIN-13 — Change password — policy too short  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | New + confirm password with fewer than 12 characters (e.g. `Short@1`). |

**Expected:** Policy error message; cannot submit successfully.

---

### LOGIN-14 — Change password — success  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | Current, new, confirm — all valid and matching (see §3). |
| 2 | Click **Change password**. |

**Expected:** Success message; then redirect to **login**; session cleared.

---

### LOGIN-15 — Login again after change password  
**Priority:** P1  
**Precondition:** LOGIN-14 done.

| Step | Action |
|------|--------|
| 1 | Log in with same User ID and **new** password. |

**Expected:** Mock: inbox (no change-password). UAT: `firstLogin` / `mustChangePassword` false → inbox; refresh token available for logout.

---

## 6.3 Change password — security (strict flow)

### LOGIN-16 — Manual URL to change password  
**Priority:** P1  
**Precondition:** Not coming from LOGIN-09 (e.g. fresh browser, or normal user).

| Step | Action |
|------|--------|
| 1 | Open `http://localhost:5183/change-password` directly. |

**Expected:** Redirect to **login**; session cleared if a stale token existed.

---

### LOGIN-17 — Refresh on change-password screen  
**Priority:** P1  
**Precondition:** Just completed LOGIN-09 (on change-password page).

| Step | Action |
|------|--------|
| 1 | Press browser refresh (F5). |

**Expected:** Redirect to **login**; session cleared; user must log in again.

---

### LOGIN-18 — After refresh, first-login user can change password again  
**Priority:** P2  
**Precondition:** LOGIN-17; mock LDAP12345 still first-login until LOGIN-14 completed.

| Step | Action |
|------|--------|
| 1 | Log in again as LDAP12345. |

**Expected:** Change-password screen again (both flags still true in mock).

---

## 6.4 Forgot password

### LOGIN-19 — Open forgot password dialog  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | On login, click **Forgot password** (or equivalent link). |

**Expected:** Dialog opens; can enter User ID / email.

---

### LOGIN-20 — Forgot password — known user (mock)  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | Enter `UW001` (or known ID from §4). |
| 2 | Submit. |

**Expected:** Success message (e.g. reset link sent).

---

### LOGIN-21 — Forgot password — unknown user (mock)  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | Enter unknown ID (e.g. `nobody@example.com`). |
| 2 | Submit. |

**Expected:** Error message (e.g. user not found).

---

## 6.5 Reset password

### LOGIN-22 — Reset page without token  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | Open `http://localhost:5183/reset-password/validate` (no `?token=`). |

**Expected:** Message that link is missing token; no reset form (or form disabled).

---

### LOGIN-23 — Reset page with valid token (mock)  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | Open reset URL with mock token from §4. |
| 2 | Enter new + confirm password (policy valid). |
| 3 | Submit. |

**Expected:** Success message; redirect to login (optional success state on login).

---

### LOGIN-24 — Reset page with invalid token (mock)  
**Priority:** P1  

| Step | Action |
|------|--------|
| 1 | Open `.../reset-password/validate?token=invalid-token`. |
| 2 | Submit valid new passwords. |

**Expected:** API error (invalid/expired token).

---

## 6.6 Logout

### LOGIN-25 — Logout after normal login (mock)  
**Priority:** P1  
**Precondition:** Logged in as UW001; inbox loaded.

| Step | Action |
|------|--------|
| 1 | Open header menu → **Logout**. |

**Expected:** Return to login; session cleared; cannot open inbox without logging in again.

---

### LOGIN-26 — Logout with refresh token (real API)  
**Priority:** P1  
**Precondition:** Second login (refresh token present in session).

| Step | Action |
|------|--------|
| 1 | Logout from header. |

**Expected:** Success; session cleared. *(First-login-only session with null refresh may block logout API — expected until full login.)*

---

## 7. SIT smoke checklist (quick run)

Use before sign-off on a build:

- [ ] LOGIN-05 or LOGIN-06 — normal login to inbox  
- [ ] LOGIN-09 + LOGIN-14 + LOGIN-15 — first-login change password path (mock LDAP12345)  
- [ ] LOGIN-16 — block manual change-password URL  
- [ ] LOGIN-17 — refresh clears change-password  
- [ ] LOGIN-20 — forgot password happy path  
- [ ] LOGIN-23 — reset password happy path (mock token)  
- [ ] LOGIN-25 — logout  

---

## 8. Defect reporting template

When logging a bug, include:

1. Test case ID (e.g. LOGIN-09)  
2. Environment: mock / UAT URL  
3. User ID (no password in ticket — use “provided test user”)  
4. Browser and steps  
5. Expected vs actual  
6. Screenshot + Network tab (login/change-password API status and message) if real API  

---

## 9. Related docs

- Change-password detail: `docs/testing/change-password-testing.md`  
- Dev commands: root `README.md` / `AGENTS.md` (`pnpm dev`, `pnpm typecheck`)
