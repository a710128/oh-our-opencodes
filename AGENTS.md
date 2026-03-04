# Agent Notes for oh-our-opencodes

This repository is a TypeScript (ESM) OpenCode plugin built with Bun.
Use this document as the default operational guide for agentic coding.

## Build / Lint / Test

All commands are run from the repo root.

```bash
# Install
bun install

# Build JS bundles + emit .d.ts
bun run build

# Typecheck only
bun run typecheck

# Lint (no autofix)
bun run lint

# Format (writes)
bun run format

# One-shot "fix everything" (writes): format + lint + organize imports
bun run check

# CI-style check (no writes)
bun run check:ci

# Run tests
bun test

# Build then run OpenCode (requires `opencode` installed)
bun run dev
```

CI runs: `bun install --frozen-lockfile` then `lint`, `typecheck`, `bun test`, `build`.

## Running A Single Test (Bun)

```bash
# Run one test file
bun test src/utils/logger.test.ts

# Run tests in files whose path/name matches a pattern
bun test logger

# Run a single test by name (regex)
bun test -t "writes log message"

# Use .only in code, then enforce only-only mode
bun test --only
```

Notes:
- `bun test [<patterns>]` filters by file name/path.
- `-t/--test-name-pattern` filters by test name (regex).

## Tooling And Project Layout

- Language: TypeScript, strict mode (`tsconfig.json`).
- Module system: ESM (`"type": "module"` in `package.json`).
- Lint/format: Biome (`biome.json`). Import organization is enabled.
- Build output: `dist/` via `bun build`, plus declarations via `tsc --emitDeclarationOnly`.
- Tests: Bun test runner (`bun:test`). Tests live in `src/**/*.test.ts`.

Key entry points:
- `src/index.ts` (plugin entry)
- `src/cli/index.ts` (CLI entry)

## Code Style (Enforced By Biome)

Biome is the source of truth. When in doubt:

```bash
bun run check
```

Formatting expectations (see `biome.json`):
- Indentation: 2 spaces
- Quotes: single quotes
- Line width: 80
- Line endings: LF
- Trailing commas: enabled

## Imports

Prefer these conventions (Biome will also reorganize):
- Use `node:` specifiers for Node built-ins (example: `import * as fs from 'node:fs'`).
- Use `import type { ... } from '...'` for type-only imports.
- Grouping guideline: Node built-ins, then external deps, then local modules.

## Types And Interfaces

- Keep TypeScript `strict`-compatible.
- Prefer `unknown` over `any` and narrow explicitly.
- Avoid `any` in production code; Biome warns on explicit `any`.
  - Exception: tests may use `any` when it simplifies test setup.
- Prefer explicit return types for exported functions.
- Use `zod` for runtime validation of untrusted inputs (config, tool args, etc.).

## Naming

- Files/dirs: typically kebab-case for feature folders (examples in `src/hooks/`).
- Types/interfaces: `PascalCase`.
- Values/functions: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE` for true constants; otherwise `camelCase`.

## Error Handling

- Do not swallow errors unless the operation is best-effort (example: logging).
- When catching unknown errors, preserve message safely:
  - `e instanceof Error ? e.message : String(e)`
- Prefer returning typed results with an `error` string for tool-style APIs.
- Throw `Error` with actionable messages when the caller must handle/abort.

## Testing Conventions

- Use `bun:test` exports: `describe`, `test`/`it`, `expect`, and lifecycle hooks.
- Keep tests deterministic; avoid real network calls.
- Prefer small, focused tests around pure functions and parsing/formatting logic.
- When tests interact with the filesystem, use temp locations (`os.tmpdir()`) and clean up.

## Agent-Specific Repository Instructions

There are no Cursor rule files (`.cursor/rules/**` or `.cursorrules`) and no
Copilot instruction file (`.github/copilot-instructions.md`) in this repo.

Relevant in-repo guidance for agents:
- `codemap.md` describes architecture and canonical dev commands.

## Practical Workflow For Agents

- Prefer repo scripts (`bun run ...`) over ad-hoc commands.
- Before changing behavior: add/adjust tests, then run `bun test`.
- Before handing work back: run `bun run check:ci` and `bun run typecheck`.
