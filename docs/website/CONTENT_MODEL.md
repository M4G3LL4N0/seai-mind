# Website Content Model

All website content lives in `web/src/lib/content/` as typed TypeScript
modules. There is no external CMS.

## Registry files

| File | Exports | Consumers |
|---|---|---|
| `types.ts` | `FeatureStatus`, `NavLink`, `NavGroup`, `FooterGroup`, `DocSection`, `Doc` | All |
| `site.ts` | `site` (name, domain, tagline, description, github, generation) | Layout, Footer, Hero |
| `nav.ts` | `primaryNav`, `moreNav`, `evolutionNav`, `footerGroups`, `footerIntro` | Navigation, Footer |
| `stats.ts` | `snapshot`, `snapshotFootnote` | Hero, LiveEvolution |
| `architecture.ts` | `architectureModules`, `dependencyChain`, `architectureFacts` | /architecture, Home |
| `minds.ts` | `minds`, `getMind(slug)` | /minds, /minds/[slug], Footer |
| `research.ts` | `researchEntries`, `getResearchEntry(slug)` | /research, /research/[slug], Footer |
| `benchmarks.ts` | `metricCategories`, `experiments`, `getExperiment(slug)` | /benchmarks, /benchmarks/[slug], Home |
| `roadmap.ts` | `roadmapAreas`, `generations`, `roadmapNote` | /roadmap |
| `evolution.ts` | `lifecycle`, `gateChecks`, `thresholdTable` | /evolution, Home |
| `docs.ts` | `docSections`, `docs`, `docsMap`, `docsList`, `getDoc(slug)` | /docs, /docs/[...slug], Home |
| `index.ts` | barrel export + `getExperiment` | All pages |

## Status taxonomy

`FeatureStatus` is a union of exactly:

- `complete` — implemented, tested, exercised
- `in-progress` — actively being built
- `partial` — some parts real, some stubbed
- `experimental` — mechanism works, corpus building
- `future` — designed, not built

Every component, Mind, roadmap area, and research entry carries a status.
The site **never claims `complete` for partial/experimental/future work**.

## Data honesty rules

1. Every number on the site appears in the content layer and traces to a
   documented experiment record (`docs/research/*.md`) or the verified snapshot.
2. No fabricated benchmarks, no simulated results labeled as real, no LLM
   judge presented as evidence.
3. The "CURRENT VERIFIED SNAPSHOT" banner (`verifiedAt: 2026-09-13`)
   indicates point-in-time facts, not live telemetry.
4. Future work is documented on dedicated pages (`/research/evolution-immune-system`,
   `/roadmap`, `/minds/legalone` etc.) with status `future` and clear
   "not yet built" language.

## Content → Page mapping

- `nav.ts` → Navigation, Footer
- `stats.ts` + `experiments` → Hero, LiveEvolutionPreview
- `architectureModules` → /architecture, ArchitectureOverview
- `lifecycle` + `gateChecks` + `thresholdTable` → /evolution
- `experiments` → /evolution/live, /benchmarks/[slug]
- `minds` → /minds, /minds/[slug]
- `researchEntries` → /research, /research/[slug]
- `metricCategories` → /benchmarks, IntelligenceEfficiency
- `roadmapAreas` + `generations` → /roadmap
- `docSections` + `docs` → /docs, /docs/[...slug]

## Adding content

1. Edit the relevant `*.ts` in `web/src/lib/content/`
2. Run `node scripts/audit-links.mjs`
3. Run `pnpm --filter web build`
4. Commit