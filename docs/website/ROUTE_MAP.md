# Website Route Map

All routes are real and resolve to 200 (or intentional 308 redirects).

## Static routes

| Route | Status |
|---|---|
| `/` | Home |
| `/what-is-seai` | Core distinction |
| `/architecture` | 7 build units |
| `/evolution` | Lifecycle + gates |
| `/evolution/live` | Live experiments |
| `/minds` | Mind gallery |
| `/minds/paios` | Reference Mind |
| `/research` | Research hub |
| `/research/seai-hypotheses` | Hypotheses |
| `/research/model-evolution` | First experiment |
| `/research/trustworthy-evolution` | Repeated runs |
| `/research/intelligence-efficiency` | Core thesis |
| `/research/mindbench` | Benchmark infrastructure |
| `/research/evolution` | Gates + lifecycle |
| `/research/holdout-evaluation` | Generalization check |
| `/research/protected-capabilities` | Category regression |
| `/research/evolution-immune-system` | Future |
| `/research/future-research` | Future queue |
| `/benchmarks` | Metric categories |
| `/benchmarks/model-evolution` | Experiment record |
| `/benchmarks/trustworthy-evolution` | Experiment record |
| `/docs` | Docs hub |
| `/docs/getting-started` | Setup |
| `/docs/architecture` | Dependency tree |
| `/docs/evolution` | Promotion rules |
| `/docs/memory` | Memory |
| `/docs/runtime` | Runtime |
| `/docs/minds` | Mind anatomy |
| `/docs/skills` | Skills |
| `/docs/tools` | Tools |
| `/docs/genome` | Genome |
| `/docs/evaluation` | Deterministic criteria |
| `/docs/benchmarks` | MindBench |
| `/docs/cli` | CLI |
| `/docs/sdk` | SDK |
| `/docs/security` | Security |
| `/docs/privacy` | Privacy |
| `/docs/contributing` | Contributing |
| `/roadmap` | Honest roadmap |
| `/privacy` | Legal |
| `/security` | Legal |
| `/license` | Legal (no LICENSE file yet) |

## Redirects

| Route | → |
|---|---|
| `/command` | `/evolution/live` |
| `/darwin` | `/roadmap` |
| `/releases` | `/roadmap` |
| `/paios` | `/minds/paios` |
| `/test` | `/` |

## Dynamic routes

- `/minds/[slug]` — populated from `minds.ts` (7 entries)
- `/research/[slug]` — populated from `research.ts` (10 entries)
- `/benchmarks/[slug]` — populated from `benchmarks.ts` (2 measured experiments)
- `/docs/[...slug]` — populated from `docs.ts` (16 docs)

## Sitemap

`src/app/sitemap.ts` emits only routes that exist. It is generated from the
same content registry, so it cannot drift from the actual routes.
