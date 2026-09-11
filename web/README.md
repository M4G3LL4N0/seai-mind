# SE-AI Mind Web Platform

The public web platform for SE-AI Mind (Darwin 0.1) — Self-Evolving Artificial Intelligence.

## Overview

This Next.js application serves as the public face of SE-AI Mind, providing:

- **Landing page** with hero, architecture overview, evolution loop, and intelligence efficiency
- **Darwin 0.1 specification** with capabilities and roadmap
- **Command Center** dashboard for managing Minds
- **Documentation** hub with guides and API references
- **Benchmarks** with MindBench metrics and experiments
- **Mind Gallery** showcasing reference and experimental Minds
- **Releases** with codename registry and release notes
- **Research** areas with integrity labels

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Package Manager**: pnpm

## Getting Started

```bash
# From the web directory
cd web
pnpm install
pnpm dev
```

## Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── darwin/            # Darwin 0.1 page
│   │   ├── command/           # Command Center
│   │   ├── architecture/      # Architecture page
│   │   ├── research/          # Research page
│   │   ├── benchmarks/        # Benchmarks page
│   │   ├── minds/             # Mind Gallery
│   │   ├── docs/              # Documentation hub
│   │   ├── releases/          # Releases page
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── home/              # Landing page components
│   │   ├── layout/            # Navigation, Footer
│   │   └── ui/                # Reusable UI components
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   └── styles/
│       └── globals.css        # Global styles
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── vercel.json
```

## Key Features

### Design System
- **Colors**: SE-AI blue (`seai`), Darwin orange (`darwin`), Slate neutrals
- **Typography**: Inter (UI), Space Grotesk (Display), JetBrains Mono (Code)
- **Components**: Button, Card, Badge, Navigation, Footer
- **Animations**: Framer Motion for scroll-triggered animations

### Pages
1. **Home** (`/`) - Hero, Model vs Mind, Evolution Loop, Intelligence Efficiency, Architecture, Darwin, CTA
2. **Darwin** (`/darwin`) - Complete Darwin 0.1 specification
3. **Command Center** (`/command`) - Dashboard with sidebar navigation
4. **Architecture** (`/architecture`) - Four-layer architecture breakdown
5. **Research** (`/research`) - Research areas with integrity labels
6. **Benchmarks** (`/benchmarks`) - MindBench metrics and experiments
7. **Minds** (`/minds`) - Gallery of reference and experimental Minds
8. **Docs** (`/docs`) - Complete documentation hub
9. **Releases** (`/releases`) - Release history and codename registry

### Command Center
- Responsive sidebar navigation
- System stats dashboard
- Recent activity feed
- Quick actions
- System health metrics

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure:
   - Framework Preset: Next.js
   - Root Directory: `web`
   - Build Command: `cd web && pnpm build`
   - Dev Command: `cd web && pnpm dev`
   - Install Command: `pnpm install`

3. Add Environment Variables:
   - `VERCEL_TOKEN` (for CI/CD)
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### Manual Build

```bash
cd web
pnpm install
pnpm build
pnpm start
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR:

1. **Install** - Install dependencies with pnpm
2. **Lint** - ESLint
3. **Type Check** - TypeScript compilation
4. **Build** - Next.js production build
5. **Test** - Vitest unit tests
6. **Security** - npm audit + Snyk scan
7. **Deploy Preview** - Vercel preview deployment (PRs)
8. **Deploy Production** - Vercel production deployment (main branch)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run quality gates: `pnpm lint && pnpm typecheck && pnpm test`
5. Submit a PR

## License

MIT License - see LICENSE file for details.

## Disclaimer

This is the public web platform for SE-AI Mind. The core kernel lives in the parent directory (`/packages`, `/runtimes`). The kernel remains independent of Vercel and any hosting platform.