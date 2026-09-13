# Local Testing

How to run, verify, and commit changes to the website.

## Commands

```bash
pnpm install                              # install the workspace
pnpm --filter web build                   # production build (typecheck + lint)
pnpm --filter web exec next dev           # dev server (http://localhost:3000)
pnpm --filter web exec next lint          # lint web only (if configured)
pnpm test                                 # full workspace test suite (105 tests)
node scripts/audit-links.mjs              # static link audit (no server needed)
node scripts/audit-links.mjs --json       # machine-readable output
```

## Manual route verification

After starting the dev server:

```bash
# Smoke-test every documented route; expect 200 for all except
# redirects listed in ROUTE_MAP.md (expect 308).
for p in / /what-is-seai /architecture /evolution /evolution/live \
         /minds /research /benchmarks /docs /roadmap \
         /privacy /security /license; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$p")
  echo "$p -> $code"
done
```

Expect every real route to return `200`. The following redirect to 308
by design: `/command`, `/darwin`, `/releases`, `/paios`, `/test`.

## Build verification

```bash
pnpm --filter web build
```

A successful build outputs a route table similar to:

```
├ ○ /
├ ● /benchmarks/[slug]
├ ● /docs/[...slug]
├ ● /minds/[slug]
...
```

`●` indicates dynamic routes correctly registered; `○` indicates
static prerendered pages. A failed build is a failed PR.

## Link audit

The audit discovers routes from `src/app`, expands dynamic params using
the content registry, scans all of `src/` for internal `href`s, and
fails on any dead link or any `/docs/<slug>` not in `docs.ts`.

```bash
node scripts/audit-links.mjs
# Exit 0 → clean
# Exit 1 → prints problematic links
```

## Tests

The website has no internal tests (it is a static site). The full
workspace test suite is the relevant check:

```bash
pnpm test
# core 21 · state 10 · runtime 7 · mind 59 · cli 8 = 105 tests
```

## Commit flow

After local verification:

1. `git status` — only intended files changed
2. `git diff` — review content and code changes
3. Conventional commit on a feature branch (`feat(web): ...`,
   `docs(website): ...`)
4. Verify build passes and `audit-links` is clean
5. Push, open a PR

**Do not deploy to Vercel locally.** Deployment is managed separately
by repository maintainers.
