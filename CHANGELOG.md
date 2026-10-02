# Changelog

All notable changes to SE-AI Mind are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [0.1.0-alpha] — 2026-10-02

> **Alpha.** The kernel runs and the evolution loop is deterministic, but the
> evaluation harness is early and the model story depends on a local Ollama
> server. Treat this as a research substrate, not a product.

### Added

- **Six-package kernel** — `core`, `mind`, `runtime`, `state`, `sdk`, `cli`,
  wired as a pnpm workspace.
- **Deterministic evolution loop.** `evolve propose`, `evolve history`,
  `evolve promote`, `evolve rollback` — a full proposal-to-rollback cycle that
  runs **without a model**, which makes it testable.
- **Honest degradation.** With no local model available the system reports that
  it cannot run the task rather than fabricating inference.
- **`doctor`** for capability probing.
- **CI workflow** running build, typecheck and the full suite.
- **MIT licence.**

### Fixed

- **Lint no longer pretends to work.** ESLint 9 was configured with no flat
  config, so `pnpm run lint` failed with "couldn't find an eslint.config file".
  It now runs a real static check instead of an ESLint fan-out that could not
  execute.
- **Verify order corrected.** Workspace packages resolve to `dist/`, so
  `typecheck` and `test` failed on a clean clone before `build` had run.
  `verify` is now `build && typecheck && test`.

### Verified

- `pnpm run verify` exits 0 from a clean install
- 146 tests pass across 5 packages, 3 skipped
- No runtime model dependency: the kernel and evolution loop are stdlib-local

### Known limitations

- No model provider is bundled. `doctor` will report a missing model rather
  than silently substituting one.
- 3 tests are skipped, not passing.
- Evaluation breadth is narrow; the scores it produces should not be compared
  against published benchmarks yet.

[Unreleased]: https://github.com/M4G3LL4N0/seai-mind/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/M4G3LL4N0/seai-mind/releases/tag/v0.1.0-alpha
