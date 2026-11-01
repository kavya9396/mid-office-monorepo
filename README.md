# Insurance Monorepo POC

A developer-focused proof of concept for an insurance application built with pnpm, Turborepo, React, Vite, TypeScript, Material UI, and React Router.

The repository contains three independently buildable front-end applications:

- **Common** — login, mock authorization, and the reusable summary screen.
- **Retail** — Retail Inbox and Retail DRS details.
- **Group** — Group Inbox and Group DRS details.

It demonstrates:

- Login with a selected business type, then a full-page handoff to that business Inbox.
- Separate Retail and Group Inbox screens, each showing only its own tasks.
- A header toggle that authorizes the other business in the background.
- A JWT-like token, user, and active business stored in same-origin `sessionStorage`.
- Shared UI, route configuration, session helpers, validation, and currency formatting.
- Local JSON mocks with asynchronous service functions.
- Independent application builds managed through Turborepo.

> This is a POC. Token presence is used as the session check; no token signature or server-side session is validated.

## Prerequisites

- Node.js 20 or newer.
- Corepack, included with most Node.js installations.
- pnpm 10.15.0, as declared in the root `package.json`.

Enable pnpm if it is not already available:

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
```

If `corepack enable` cannot create a system-level link, run commands as `corepack pnpm <command>` instead of `pnpm <command>`.

## Quick start

From the repository root:

```bash
pnpm install
pnpm dev
```

Open:

```text
http://localhost:5183
```

Use any non-empty password with one of these mock users:

```text
UW001 — Retail only
UW002 — Group only
UW003 — Retail and Group
```

Always enter the application through port `5183`. Common acts as the same-origin development gateway and proxies Retail and Group.

## Local URLs

- Common: `http://localhost:5183`
- Login: `http://localhost:5183/login`
- Retail Inbox: `http://localhost:5183/retail/inbox`
- Group Inbox: `http://localhost:5183/group/inbox`
- Retail DRS: `http://localhost:5183/retail/drs?applicationNo=RET1001`
- Retail summary: `http://localhost:5183/retail/summary?applicationNo=RET1001`
- Group DRS: `http://localhost:5183/group/drs?applicationNo=GRP2001`
- Group summary: `http://localhost:5183/group/summary?applicationNo=GRP2001`
- Production-build preview: `http://localhost:8080`

The underlying Vite servers are:

- Common/gateway: port `5183`
- Retail: port `5184`, mounted through the gateway at `/retail`
- Group: port `5185`, mounted through the gateway at `/group`

Ports and base paths are centralized in `packages/routes/src/dev-config.json`.

## Commands

### Run all applications

```bash
pnpm dev
```

Turborepo starts Common, Retail, and Group together. Use `http://localhost:5183` for the complete login and navigation flow.

### Run one application

```bash
pnpm dev:common
pnpm dev:retail
pnpm dev:group
```

You can also use package filters:

```bash
pnpm --filter @insurance-poc/common dev
pnpm --filter @insurance-poc/retail dev
pnpm --filter @insurance-poc/group dev
```

Running Retail or Group alone is useful for isolated development, but it does not reproduce shared login because `sessionStorage` is origin-specific. Run all applications and use the Common gateway to test authentication.

### Type-check

```bash
pnpm typecheck
```

Check one application or package:

```bash
pnpm --filter @insurance-poc/common typecheck
pnpm --filter @insurance-poc/retail typecheck
pnpm --filter @insurance-poc/group typecheck
pnpm --filter @insurance-poc/ui typecheck
pnpm --filter @insurance-poc/routes typecheck
pnpm --filter @insurance-poc/util typecheck
```

### Build

Build every application:

```bash
pnpm build
```

Build one application:

```bash
pnpm --filter @insurance-poc/common build
pnpm --filter @insurance-poc/retail build
pnpm --filter @insurance-poc/group build
```

Each application writes its independent output to its own `dist/` directory.

Verify all three independent deployment artifacts:

```bash
pnpm verify:deployments
```

This command builds every application separately, continues to the next
application even if one build fails, and reports the status of:

```text
apps/common/dist/index.html
apps/retail/dist/index.html
apps/group/dist/index.html
```

### Preview production builds

```bash
pnpm build
pnpm preview
```

Then open `http://localhost:8080`. The preview gateway serves all three builds from one origin and supports SPA route fallbacks.

## Docker images

Each application has its own multi-stage Dockerfile:

```text
apps/common/Dockerfile
apps/retail/Dockerfile
apps/group/Dockerfile
```

Each image:

1. Uses Node.js 22 Alpine for the build stage.
2. Installs pnpm 10.15.0 with npm so the pipeline proxy is honored. Corepack is not used because its downloader fails behind that proxy.
3. Installs the monorepo from `pnpm-lock.yaml`.
4. Builds only the selected application.
5. Copies that application's `dist` output into an Nginx Alpine image.
6. Configures an SPA fallback to the correct `index.html`.
7. Validates the Nginx configuration during the image build.

All builds must use the repository root as Docker build context because the
applications import workspace packages, Common exports, shared mocks, and root
configuration:

```bash
docker build -f apps/common/Dockerfile -t insurance-common .
docker build -f apps/retail/Dockerfile -t insurance-retail .
docker build -f apps/group/Dockerfile -t insurance-group .
```

The runtime mounts are:

```text
insurance-common   /
insurance-retail   /retail/
insurance-group    /group/
```

Retail and Group expect an external gateway to preserve their request prefixes.
For example, `/retail/inbox` must reach the Retail container as
`/retail/inbox`, not `/inbox`.

Example external Nginx routing:

```nginx
upstream common_app {
  server common:80;
}

upstream retail_app {
  server retail:80;
}

upstream group_app {
  server group:80;
}

server {
  listen 80;
  server_name _;

  location = /retail {
    return 301 /retail/;
  }

  location /retail/ {
    proxy_pass http://retail_app;
  }

  location = /group {
    return 301 /group/;
  }

  location /group/ {
    proxy_pass http://group_app;
  }

  location / {
    proxy_pass http://common_app;
  }
}
```

The gateway is required for the complete flow. Exposing the containers on three
different browser origins prevents their `sessionStorage` values from being
shared.

## Architecture

This repository uses an **independent multi-SPA architecture**:

```text
Browser at http://localhost:5183
          |
          +-- /login --------------> Common Vite application
          |
          +-- /retail/inbox, /* ---> Retail Vite application
          |
          +-- /group/inbox, /* ----> Group Vite application
```

Each application has:

- Its own `package.json`.
- Its own Vite configuration and HTML entry point.
- Its own React root and React Router routes.
- Its own services and feature modules.
- An independent `build` command and `dist/` output.

Login has no application header. After a successful login, Common performs a
full-page navigation to `/retail/inbox` or `/group/inbox`. Inbox, DRS, and
Summary navigation then stays inside that Retail or Group SPA. The shared header
on those screens contains a Retail/Group toggle. Switching runs mock
authorization in the background and loads the other business Inbox only when
the user is authorized. An unauthorized switch stays on the current screen and
shows the mock error in a snackbar.

Workspace packages provide code shared by all applications:

```text
@insurance-poc/ui       Shared MUI components and theme
@insurance-poc/routes   Cross-application paths and URL helpers
@insurance-poc/util     Currency formatter, validation, and session helpers
```

Applications import public workspace package names:

```ts
import { AppHeader, BusinessTypeToggle, CustomButton } from "@insurance-poc/ui";
import { businessInboxUrl } from "@insurance-poc/routes";
import { formatIndianCurrency, hasSession } from "@insurance-poc/util";
```

Do not import another package through paths such as `../../../packages/util/src`. Public workspace imports keep package boundaries clear and make independent builds reliable.

## Authentication and session flow

The POC login flow is:

1. Common loads `/login` when no token exists.
2. The user selects Retail or Group and enters a user ID and password.
3. The login screen calls the mock JWT service.
4. A usable mock token is stored under the `sessionStorage` key `token`.
5. The mock login service validates the user and selected business authorization.
6. Successful Retail login loads `/retail/inbox`; Group loads `/group/inbox`.
7. Retail and Group revalidate business authorization on protected routes.
8. The header toggle authorizes the target business before switching applications.
9. Logout clears token, user, and business session data and returns to Common Login.

Shared session helpers live in:

```text
packages/util/src/session.ts
```

Available functions:

```ts
getToken();
setToken(token);
clearToken();
hasSession();
setSessionUser(user);
getSessionUser();
setSessionBusinessType(businessType);
getSessionBusinessType();
```

`clearToken()` also removes `userId`, `displayName`, and `businessType`.

### Why the gateway is required

`sessionStorage` is scoped to a browser tab and origin. Ports `5183`, `5184`, and `5185` are different origins, even though they all use `localhost`.

The Common Vite server proxies `/retail` and `/group`, so the browser sees all applications under one origin:

```text
http://localhost:5183
```

This allows one `sessionStorage` bucket to remain available while navigating between applications. Login-to-Inbox and an authorized business switch reload the document because they cross SPAs. Inbox, DRS, and Summary stay inside one SPA and do not reload. The token is never placed in query parameters, route state, or URL fragments.

If production deploys these applications on separate origins, this approach will not share `sessionStorage`. Replace it with an appropriate SSO flow or server-managed shared session.

## Verifying deployment isolation

Independent deployment means that Common, Retail, and Group are separate build
artifacts and separate running processes. An unavailable business application
must not stop the other applications.

### Build isolation test

Run:

```bash
pnpm verify:deployments
```

Expected result:

```text
PASS Common: apps/common/dist/index.html
PASS Retail: apps/retail/dist/index.html
PASS Group: apps/group/dist/index.html
```

The verifier invokes each package build separately. If one build fails, it
continues to build and report the other two. This demonstrates that one package
does not prevent the other deployment artifacts from being produced.

### Runtime outage test

Use three terminals instead of `pnpm dev`.

Terminal 1:

```bash
pnpm dev:common
```

Terminal 2:

```bash
pnpm dev:retail
```

Leave Group stopped initially.

1. Open `http://localhost:5183` and sign in as `UW003` with Retail selected.
2. Retail Inbox and Retail tasks should work.
3. Toggle to Group. Only the `/group` request should fail because Group is
   stopped.
4. Return to `http://localhost:5183/retail/inbox`. Common Login and Retail
   remain available.
5. Start Group in Terminal 3:

```bash
pnpm dev:group
```

6. Toggle to Group again. It should now work without another login.
7. Stop Retail with `Ctrl+C`. Common and Group should continue to work; only
   Retail routes should be unavailable.

This is the local equivalent of independently deploying or temporarily losing
one application. Do not use the root `pnpm dev` command for this test because
Turborepo owns all three child processes in that mode.

### Why sessionStorage works across the three applications

The browser does not actually maintain three session-storage copies in this
setup. It maintains one storage bucket for this browser tab and origin:

```text
http://localhost:5183
```

The gateway maps paths to independently running applications:

```text
/               -> Common
/retail/*       -> Retail
/group/*        -> Group
```

Because scheme, host, and port remain identical, all three applications read
the same `sessionStorage` keys. Full page reloads do not clear
`sessionStorage`, so the session remains when the browser moves from Login to a
business Inbox and between authorized business applications.

To verify this manually, open browser developer tools and run the following on
Login after sign-in, Retail Inbox, and Group Inbox:

```js
({
  origin: window.location.origin,
  token: sessionStorage.getItem("token"),
  userId: sessionStorage.getItem("userId"),
  businessType: sessionStorage.getItem("businessType"),
});
```

The expected origin and token on every gateway path are:

```js
{
  origin: "http://localhost:5183",
  token: "mock-jwt-token",
}
```

`userId` and `businessType` follow the signed-in user and the active business.

As a negative test, directly open Retail on port `5184` or Group on port `5185`
and run the same code. Those URLs have different origins, so they do not see the
token stored by Common on port `5183`.

Important session behavior:

- The token survives refreshes and full page application handoffs in the same
  tab.
- A newly opened tab has a separate `sessionStorage` session.
- Closing the tab clears the session.
- Different ports or domains do not share the session.
- Independently deployed applications must be exposed behind one public origin
  for this POC approach to work.
- If production requires separate public origins, use SSO or a server-managed
  session instead of relying on `sessionStorage`.

### Example production routing

The applications can be deployed independently while a reverse proxy exposes
them under one browser origin:

```nginx
server {
  listen 443 ssl;
  server_name insurance.example.com;

  location /retail/ {
    proxy_pass http://retail-deployment/;
  }

  location /group/ {
    proxy_pass http://group-deployment/;
  }

  location / {
    proxy_pass http://common-deployment/;
  }
}
```

Deploying a new Retail artifact changes only `retail-deployment`. Common and
Group continue serving their existing artifacts. The browser still sees
`https://insurance.example.com` for every path, preserving the same
`sessionStorage` bucket.

## Application flow

### Common

1. The login screen has no header.
2. The user selects Retail or Group, then enters a user ID and password.
3. Mock authentication checks `authorizedBusinessTypes` in `mock/auth/login.json`.
4. Successful login stores the session and loads that business's Inbox.
5. An unauthorized business selection shows the mock message and stays on Login.

### Retail and Group

1. The protected route verifies the session and rechecks business authorization.
2. Each Inbox loads only records whose `businessType` matches that application.
3. Opening a task navigates from Inbox to DRS inside the same SPA.
4. The DRS screen reads `applicationNo` from the query string and loads that record.
5. **Open summary** stays inside the SPA and renders the Common-owned summary.
6. **Back to Inbox** returns to the same application's Inbox without a reload.
7. The shared header toggle authorizes the other business in the background.
8. An authorized switch loads that business Inbox. An unauthorized switch shows a snackbar and remains on the current screen.

## Folder structure

```text
.
├── apps/
│   ├── common/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── login/
│   │   │   │   └── summary/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── retail/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── inbox/
│   │   │   │   └── drs/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── group/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── inbox/
│       │   │   └── drs/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── Dockerfile
│       ├── package.json
│       └── vite.config.ts
├── packages/
│   ├── ui/
│   │   └── src/
│   │       ├── AppHeader.tsx
│   │       ├── AppSnackbar.tsx
│   │       ├── BusinessTypeSelect.tsx
│   │       ├── BusinessTypeToggle.tsx
│   │       ├── CustomButton.tsx
│   │       ├── theme.ts
│   │       └── index.ts
│   ├── routes/
│   │   └── src/
│   │       ├── dev-config.json
│   │       └── index.ts
│   └── util/
│       └── src/
│           ├── formatIndianCurrency.ts
│           ├── regexPatterns.ts
│           ├── session.ts
│           └── index.ts
├── mock/
│   ├── auth/
│   ├── inbox/
│   └── drs/
├── scripts/
│   ├── dev-config.mjs
│   ├── serve-gateway.mjs
│   └── verify-independent-builds.mjs
├── package.json
├── .dockerignore
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── turbo.json
```

## Where to make changes

### Change the login screen or login behavior

- UI: `apps/common/src/modules/login/LoginPage.tsx`
- Mock JWT call: `apps/common/src/services/jwtService.ts`
- Mock login call: `apps/common/src/services/loginService.ts`
- Mock responses: `mock/auth/jwt.json` and `mock/auth/login.json`
- Business selector: `packages/ui/src/BusinessTypeSelect.tsx`
- Route guards: `apps/common/src/routes/guards.tsx`
- Shared session functions: `packages/util/src/session.ts`

Keep passwords out of mock JSON. The POC password field only checks for a non-empty value. Add or remove business access by editing `authorizedBusinessTypes` for a user in `mock/auth/login.json`.

### Change the header business toggle

- Toggle control: `packages/ui/src/BusinessTypeToggle.tsx`
- Header placement: `packages/ui/src/AppHeader.tsx`
- Unauthorized message: `packages/ui/src/AppSnackbar.tsx`
- Retail switch behavior: `apps/retail/src/routes/RetailAppLayout.tsx`
- Group switch behavior: `apps/group/src/routes/GroupAppLayout.tsx`
- Authorization check: `apps/common/src/services/loginService.ts`

The toggle calls the shared mock authorization function before changing applications. It does not change the active business when authorization fails.

### Change the Inbox

- Retail screen: `apps/retail/src/modules/inbox/RetailInboxPage.tsx`
- Retail data mapping: `apps/retail/src/services/inboxService.ts`
- Retail mock records: `apps/retail/src/modules/inbox/mock/retailInbox.json`
- Group screen: `apps/group/src/modules/inbox/GroupInboxPage.tsx`
- Group data mapping: `apps/group/src/services/inboxService.ts`
- Group mock records: `apps/group/src/modules/inbox/mock/groupInbox.json`

Keep each Inbox inside its corresponding business application.

The sidebar uses the role-list API pool keys. Keep its `poolData` keys aligned with
`ROLE_POOL_KEYS` in `apps/common/src/modules/inbox/inboxApi.ts`.

When adding a task, preserve the existing record fields. `businessType` must be `RETAIL` or `GROUP`. Retail Inbox displays only `RETAIL` records, and Group Inbox displays only `GROUP` records.

### Change Retail DRS

- DRS screen: `apps/retail/src/modules/drs/RetailDrsPage.tsx`
- Shared summary screen: `apps/common/src/modules/summary/SummaryPage.tsx`
- Service and record type: `apps/retail/src/services/drsService.ts`
- Mock data: `mock/drs/retail-drs.json`
- Routes: `apps/retail/src/routes/AppRoutes.tsx`
- Session guard: `apps/retail/src/routes/RequireSession.tsx`

Ensure each inbox Retail `applicationNo` has a matching record in `retail-drs.json`.

### Change Group DRS

- DRS screen: `apps/group/src/modules/drs/GroupDrsPage.tsx`
- Shared summary screen: `apps/common/src/modules/summary/SummaryPage.tsx`
- Service and record type: `apps/group/src/services/drsService.ts`
- Mock data: `mock/drs/group-drs.json`
- Routes: `apps/group/src/routes/AppRoutes.tsx`
- Session guard: `apps/group/src/routes/RequireSession.tsx`

Ensure each inbox Group `applicationNo` has a matching record in `group-drs.json`.

### Add or change a shared UI component

1. Add or update the component under `packages/ui/src`.
2. Export it from `packages/ui/src/index.ts`.
3. Import it from `@insurance-poc/ui` in any application.
4. Run UI and application type checks.

Example:

```ts
import { CustomButton } from "@insurance-poc/ui";
```

`CustomButton` uses MUI button types, defaults to `contained`, applies orange styling, and allows caller-provided `sx` overrides.

### Add or change a shared utility

1. Add or update the utility under `packages/util/src`.
2. Export it from `packages/util/src/index.ts`.
3. Import it from `@insurance-poc/util`.
4. Do not copy the implementation into an application.

Example:

```ts
import { formatIndianCurrency } from "@insurance-poc/util";

const amount = formatIndianCurrency(record.appliedSa);
```

`formatIndianCurrency` is visibly used in both business Inboxes and DRS screens.

### Change cross-application routes, ports, or base paths

- Browser route helpers: `packages/routes/src/index.ts`
- Ports and Vite base paths: `packages/routes/src/dev-config.json`
- Dev proxy: `apps/common/vite.config.ts`
- App Vite settings: each app's `vite.config.ts`
- Production preview gateway: `scripts/serve-gateway.mjs`

Keep route values centralized. Do not hardcode application origins throughout screens.

If a base path changes, rebuild all applications and verify direct access, task navigation, refresh, and Back to Inbox.

## Adding a new application

Follow this pattern if the POC is extended with another independently built application:

1. Add `apps/<application>` with its own `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, and React routes.
2. Add the application's port and base path to `packages/routes/src/dev-config.json`.
3. Export its centralized paths and navigation helper from `packages/routes/src/index.ts`.
4. Add a proxy entry to `apps/common/vite.config.ts`.
5. Add it to the root `dev` script's Turbo filters.
6. Add a mount in `scripts/serve-gateway.mjs`.
7. Add the new `businessType` to `businessInboxUrl` and to the login and header business options.
8. Add an application Dockerfile and an external gateway route that preserves its base-path prefix.
9. Reuse `@insurance-poc/ui`, `@insurance-poc/routes`, and `@insurance-poc/util`.
10. Add mocks and service functions rather than importing mock JSON directly into the screen.
11. Verify that login, refresh, direct access, logout, Docker build, and the production preview still work.

## Development conventions

- Keep application-specific code under its application.
- Put reusable components in `packages/ui`.
- Put reusable stateless helpers and session functions in `packages/util`.
- Put cross-application paths and navigation logic in `packages/routes`.
- Export shared code through each package's `src/index.ts`.
- Use React state and service functions; do not introduce Redux or React Context for this POC.
- Access local JSON through service modules, not directly from screens.
- Pass only non-sensitive record identifiers between applications.
- Never place the token in a URL.
- Handle loading, empty, error, missing identifier, and missing record states.
- Run `pnpm typecheck` and `pnpm build` before submitting changes.

## Adding dependencies

Add an application-only dependency:

```bash
pnpm --filter @insurance-poc/common add <package>
pnpm --filter @insurance-poc/retail add <package>
pnpm --filter @insurance-poc/group add <package>
```

Add a dependency to a shared package:

```bash
pnpm --filter @insurance-poc/ui add <package>
pnpm --filter @insurance-poc/util add <package>
```

Add a root development dependency:

```bash
pnpm add -Dw <package>
```

Do not use npm or Yarn in this repository. Commit `pnpm-lock.yaml` when dependencies change.

## Verification checklist

After making changes:

```bash
pnpm typecheck
pnpm build
pnpm dev
```

Then verify:

1. `/` redirects to Login without a token.
2. `UW001` can open Retail Inbox but is rejected for Group.
3. `UW002` can open Group Inbox but is rejected for Retail.
4. `UW003` can log in to either business and switch with the header toggle.
5. Inbox category selection changes the displayed records.
6. Currency values use Indian grouping.
7. A Retail task opens the matching Retail record without a full reload.
8. A Group task opens the matching Group record without a full reload.
9. An unauthorized toggle shows a snackbar and stays in the current app.
10. Refreshing Retail or Group keeps the user signed in.
11. Back to Inbox returns to the current business Inbox.
12. Logout clears the session.
13. Direct Retail or Group access without a session redirects to Login.

## Troubleshooting

### `pnpm: command not found`

Run:

```bash
corepack prepare pnpm@10.15.0 --activate
corepack pnpm install
corepack pnpm dev
```

### A port is already in use

Change the ports in:

```text
packages/routes/src/dev-config.json
```

Then restart `pnpm dev`. Because every Vite configuration reads this file, avoid changing ports separately in individual app configs.

### Retail or Group asks for login again

Confirm that:

- All three development servers are running.
- You opened Common at `http://localhost:5183`.
- Navigation uses `/retail/*` or `/group/*` under port `5183`.
- You did not open Retail directly on `5184` or Group directly on `5185`.
- You remained in the same browser tab.

### A DRS record is not found

Confirm that the selected inbox row's `applicationNo` exactly matches a record in:

- `mock/drs/retail-drs.json` for `RETAIL`.
- `mock/drs/group-drs.json` for `GROUP`.

The DRS pages intentionally do not display the first record as a fallback.

### Workspace imports do not resolve

Run:

```bash
pnpm install
pnpm typecheck
```

Confirm that the shared package is listed as a `workspace:*` dependency in the consuming application's `package.json`, and that the symbol is exported through the shared package's `src/index.ts`.

## Production considerations

Before using this design in production:

- Replace mock authentication with a real identity provider or authentication API.
- Validate tokens server-side and handle expiry and renewal.
- Use SSO or a server-managed session if applications are hosted on different origins.
- Define authorization rules separately from token presence.
- Do not store real passwords or secrets in the repository.
- Replace local JSON services with typed backend clients.
- Add automated unit, integration, and end-to-end tests.
- Configure deployment rewrites so each SPA route serves the appropriate `index.html`.
- Review browser security controls such as CSP, HTTPS, secure cookies, and logout propagation.

# mid-office-monorepo


pnpm install

** if port is in use
netstat -ano | findstr :{PORT_NO}
tasklist /FI "PID eq {TASK_ID}"   
taskkill /PID {TASK_ID} /F   
pnpm --filter @insurance-poc/common dev    
pnpm dev