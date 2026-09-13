# SE-AI Website Architecture

## Purpose

`web/` is the public documentation and product site for SE-AI. It is a
standalone Next.js application with **zero `@seai/*` runtime dependencies**:
it documents the kernel; it does not import or execute it.

## Structure

```
web/
├── src/app/                 Next.js App Router pages
├── src/components/
│   ├── home/                Home-page sections (Hero, EvolutionLoop, ...)
│   ├── layout/              Navigation + Footer
│   └── ui/                  PageHeader, CardLink, ProseSection, StatusPill, Button
├── src/lib/content/         Typed content registry (nav, docs, minds, research, ...)
├── scripts/audit-links.mjs  Static link audit
├── next.config.mjs          Redirects + security headers
└── public/                  Static assets (favicon, og-image, robots.txt, ...)
```

## Content flow

All public content lives in `src/lib/content/` and is consumed by pages via
typed getters (`getDoc`, `getResearchEntry`, `getExperiment`, `getMind`,
`getStaticParams`). There is no CMS, no database, no runtime data fetch.
Every number on the site traces to a documented experiment record or the
verified snapshot (`verifiedAt: 2026-09-13`).

## Pages

- `/` — marketing + docs hub
- `/what-is-seai` — category comparison (LLM, agent, personal AI, private AI,
  evolving AI, SE-AI Mind)
- `/architecture` — the 7 build units and dependency direction
- `/evolution` — lifecycle + gate decision table + thresholds
- `/evolution/live` — the two measured evolution experiments
- `/minds` + `/minds/[slug]` — reference Mind and honest FUTURE examples
- `/research` + `/research/[slug]` — hypotheses, executed experiments, future queue
- `/benchmarks` + `/benchmarks/[slug]` — metric categories + experiment records
- `/docs` + `/docs/[...slug]` — 16 real docs pages
- `/roadmap` — honest statuses + generations Darwin → Einstein
- `/privacy`, `/security`, `/license` — legal pages
- `/sitemap.xml` — generated from the same content registry

## Redirects

- `/command` → `/evolution/live`
- `/darwin` → `/roadmap`
- `/releases` → `/roadmap`
- `/paios` → `/minds/paios`
- `/test` → `/`

## Link integrity

`scripts/audit-links.mjs` discovers routes from `src/app`, expands dynamic
params from the content registry, scans all `src/` for internal `href`s, and
fails on any dead link or any `/docs/<slug>` whose slug is not registered.
Run: `node scripts/audit-links.mjs`

## Verification

```
node scripts/audit-links.mjs
pnpm --filter web build
pnpm --filter web exec next dev      # then curl every route in ROUTE_MAP.md
pnpm test                            # full workspace (105 tests)
```
