# SE-AI Mind (Darwin 0.1) — Vercel Status

**Date:** 2026-09-11
**Status:** DEPLOYED AND VERIFIED (supersedes the 2025-09-08 audit, which predates auth/linkage)

---

## Current Status (verified by execution)

| Property | Value |
|----------|-------|
| CLI auth | `vercel whoami` → scope `noaerth-labs` |
| Project | `noaerth/seai-mind` (`prj_xpgPnLu33VExs7vD3V3R1kvAgUi8`, team `team_Lz4OCU2eTnruvq8tL9XUVkUZ`) |
| Root Directory | `web` (fixed 2026-09-11 via `vercel api PATCH /v9/projects/:id`; was `null`) |
| Deployment | `dpl_45L4ZVLqi3ShWR5wuwWTMyTiYaqS` |
| State | **READY** (production target) |
| Production URL | https://seai-mind-6i4yqi1e2-noaerth.vercel.app |
| Alias | https://seai-mind.vercel.app |
| HTTP verification | `/` → 200; `/darwin`, `/architecture`, `/research`, `/benchmarks`, `/minds`, `/docs`, `/releases` → all 200 |

---

## Root Cause of the Previous Block

`rootDirectory` was `null` (repository root) while Next.js lives in `web/`,
so framework detection failed with "No Next.js version detected" on every
deployment (including the 3-day-old Error deployment that predates this work).

Fix (correct Vercel mechanism, repo layout unchanged — `packages/` + `web/` kept):
1. `vercel api /v9/projects/:id -X PATCH -f rootDirectory=web`
2. `git mv vercel.json web/vercel.json` (Vercel reads config from the Root
   Directory) with web-relative commands.
3. `web/.npmrc` with `legacy-peer-deps=true`: with no lockfile under `web/`,
   Vercel installs with npm, which is strict about the brochure site's
   eslint-8 vs `@eslint/js`-10 peer combination (the local pnpm workspace
   only warns). Scoped to `web/` only; kernel toolchain untouched.

One intermediate deployment failed on `npm install` (exit 1) before the
`.npmrc` fix; the failure is recorded in `vercel ls` history — not hidden.

---

*Vercel status verified via `vercel api`, `vercel --prod`, `vercel inspect`,
`vercel ls`, and `curl` against the production alias on 2026-09-11.*
