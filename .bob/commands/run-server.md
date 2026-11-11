---
description: Start the dev servers (Common + Retail + Group behind the gateway) in the background and report the URL
argument-hint: [optional app: common | retail | group — omit to run all three]
---
Start the dev server. App: $ARGUMENTS

1. If `$ARGUMENTS` is empty, run `pnpm dev` from the repo root (all three apps; gateway at
   `http://localhost:5183`). Auth only works in this mode because `sessionStorage` is origin-scoped.
   If `$ARGUMENTS` is `common`, `retail`, or `group`, run `pnpm dev:<app>` instead and warn me
   that the auth flow is broken when an app runs in isolation.
   Any other value: stop and tell me the valid options.

2. Run the command with `background: true` (it is a long-running process). Do not use `cwd`.

3. Read the stdout/stderr log files returned by the tool and confirm Vite started on the
   expected ports from `packages/routes/src/dev-config.json`. If a port is in use or a
   compile error appears, report it and fix only if the cause is obvious.

4. Report: the command run, the PID, the log file paths, and `http://localhost:5183`.
   Tell me how to stop it: `taskkill /T /F /PID <pid>`.

Never open Retail/Group on ports 5184/5185 directly — always use the gateway origin.
