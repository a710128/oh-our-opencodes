# oh-our-opencodes

Lightweight agent orchestration plugin for OpenCode (this repo is a fork for continued development).

- `src/`: TypeScript source
  - `src/agents/`: agent prompts/roles (orchestrator/explorer/librarian/designer/fixer)
  - `src/cli/`: installer + CLI logic
  - `src/config/`: config schema + loading
  - `src/hooks/`: runtime behavior hooks
  - `src/tools/`: tool wrappers
  - `src/mcp/`: MCP integrations
- `docs/`: documentation
- `dist/`: build output (generated)

## MOST IMPORTANT RULES

- DO NOT modify AGENTS.md unless the user permits it by explicitly asking you to do so.
- When you adding new feature or fixing a bug, please consider about how to minimize the impact on the existing code, which means modify codes as less as possible.
- When you want to ask user for making decisions, if there is a `question` tool or `ask_user` tool, prefer to use it instead of asking the user directly. If there is no suitable tool, ask the user directly.
- Before making any changes, write a TODO list to remind yourself to implement the features later, if there is a `todo` tool, prefer to use it instead of writing the TODO list manually.
- Before you start writing code, you need to inform the user of the solution you intend to adopt. Only after discussing and confirming with the user should you begin the work. And also remember that DO NOT ASK ANY QUESTIONS IN SUBAGENTS.

## Run / Build / Lint / Test

This repo is Bun-first (CI uses Bun).

Quick start (typical local loop):

- `bun install`
- `bun run check`
- `bun test`
- `bun run build`

- Install deps: `bun install`
  - CI equivalent: `bun install --frozen-lockfile`
- Build: `bun run build`
- Typecheck: `bun run typecheck`
- Lint: `bun run lint`
- Format: `bun run format`
- Autofix (format + safe fixes): `bun run check`
- CI check (no writes): `bun run check:ci`

Tests use Bun's test runner:

- Run all tests: `bun test` (or `bun run test`)
- Run a single test file: `bun test src/cli/providers.test.ts`
- Run tests matching a name/pattern: `bun test -t "pattern"`

Tips:

- Prefer running the narrowest test scope first (single file or `-t`) before running the full suite.
- If a change affects config loading or CLI behavior, add/adjust tests under `src/**` (tests are co-located as `*.test.ts`).

Local dev helper:

- `bun run dev` (builds then runs `opencode`)
  - Requires `opencode` installed and available on PATH.

Notes:

- `tsc` excludes `**/*.test.ts` via `tsconfig.json`, so rely on `bun test` to catch test-only TS issues.
- `dist/` is generated output; edit `src/` and rebuild instead of editing `dist/` by hand.
- Avoid running `release:*` scripts unless explicitly doing a release (they run `npm version`, `git push --follow-tags`, and `npm publish`).

Cursor/Copilot rules:

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found in this repo.

## Code Style

### Formatting / Linting (Biome)

- Use Biome for formatting and linting; do not hand-format.
- 2-space indentation, LF line endings, 80-column line width.
- Prefer single quotes; trailing commas are enabled.
- Keep imports organized (Biome organize-imports is on).
- `any` is discouraged (Biome `noExplicitAny` warns), but allowed in `**/*.test.ts`.

### TypeScript / Modules / Imports

- ESM project (`package.json` has `"type": "module"`): prefer `import`/`export`.
- TypeScript is `strict: true`; avoid weakening types.
- Prefer `unknown` + narrowing over `any`.
- Use Node built-ins via `node:` specifiers (e.g. `import * as fs from 'node:fs'`).
- Prefer `import type { ... }` for type-only imports (keeps runtime bundles clean).
- Avoid default exports in new code unless there is a strong reason; this repo mostly uses named exports.

### Naming / Structure

- Variables/functions: `camelCase`; types/interfaces/classes: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` for true constants.
- Config keys written to JSON/JSONC may use `snake_case` (matches existing config shape).
- Files and directories generally use `kebab-case` (e.g. `dynamic-model-selection.ts`, `delegate-task-retry/`).
- Prefer small, focused modules; colocate tests next to implementation when practical.

### Types / Data validation

- Prefer Zod schemas for validating external/untrusted input (configs, CLI I/O, JSON files).
- For “unknown object” shapes, prefer `Record<string, unknown>` and narrow carefully.
- Use `as const` for literal mapping objects when you want strongly-typed keys/values.

### Error handling / Logging

- Prefer explicit error messages and actionable `console.warn` for best-effort/non-fatal failures.
- In `catch`, normalize unknown errors (`error instanceof Error ? error.message : String(error)`).
- Avoid throwing in startup/utility paths unless failing fast is required; prefer best-effort behavior when safe.

### Comments / Docs

- Prefer short, intention-revealing comments (why something is done), not restating the code.
- If behavior changes in a user-visible way, update relevant docs under `docs/`.

## Git Commit Message Style

The git commit message style should be composed of two parts: title and body. The title should be `<type>: <subject>` (such as `feat: add new feature` or `fix: fix bug`). The body should be the detailed description of the changes in list format.

It's important that DO NOT include any symbol like $ or ` in the title or body. This would cause the bash shell to interpret the title or body as a command or a code block.
