# oh-our-opencodes

Lightweight agent orchestration plugin for OpenCode. This fork extends the upstream project with extra orchestration behavior, runtime hooks, background task management, MCP integrations, and agent definitions used by coding agents.

- `src/`: TypeScript source
  - `src/agents/`: agent prompts, roles, and orchestration definitions
  - `src/background/`: background task/session management
  - `src/cli/`: installer, config I/O, provider setup, and CLI entrypoints
  - `src/commands/`: command implementations exposed to the plugin/runtime
  - `src/config/`: config schema, parsing, normalization, and loaders
  - `src/hooks/`: runtime hooks such as retries, recovery, and update checks
  - `src/mcp/`: MCP server integrations and remote MCP definitions
  - `src/skills/`: packaged skills shipped with the project
  - `src/tools/`: tool wrappers for grep, LSP, ast-grep, background tasks, etc.
  - `src/utils/`: shared utilities and helpers
- `docs/`: user-facing documentation
- `dist/`: generated build output and declaration files
- `.github/`: CI and repository metadata

## MOST IMPORTANT RULES

- DO NOT modify AGENTS.md unless the user permits it by explicitly asking you to do so.
- When you adding new feature or fixing a bug, please consider about how to minimize the impact on the existing code, which means modify codes as less as possible.
- When you want to ask user for making decisions, if there is a `question` tool or `ask_user` tool, prefer to use it instead of asking the user directly. If there is no suitable tool, ask the user directly.
- Before making any changes, write a TODO list to remind yourself to implement the features later, if there is a `todo` tool, prefer to use it instead of writing the TODO list manually.
- Before you start writing code, you need to inform the user of the solution you intend to adopt. Only after discussing and confirming with the user should you begin the work. And also remember that DO NOT ASK ANY QUESTIONS IN SUBAGENTS.

## Run / Build / Lint / Test

This repo is Bun-first. Prefer Bun for install, scripts, and tests unless the user explicitly asks for another tool.

Core local loop:

- Install dependencies: `bun install`
- Run autofix + lint + format-safe checks: `bun run check`
- Run tests: `bun test`
- Build distributable output: `bun run build`

Primary scripts from `package.json`:

- Build: `bun run build`
- Typecheck only: `bun run typecheck`
- Lint only: `bun run lint`
- Format all files: `bun run format`
- Check with writes: `bun run check`
- CI check without writes: `bun run check:ci`
- Dev helper: `bun run dev` (requires `opencode` on `PATH`)

Testing guidance:

- Run all tests: `bun test` or `bun run test`
- Run a single test file: `bun test src/cli/providers.test.ts`
- Run tests by name pattern: `bun test -t "pattern"`
- Prefer the narrowest relevant scope before the full suite
- Tests are co-located in `src/**` as `*.test.ts`

Build and test notes:

- CI-style dependency install: `bun install --frozen-lockfile`
- `tsc` excludes `**/*.test.ts`, so test-only TypeScript issues are caught by `bun test`, not `bun run typecheck`
- `bun run build` compiles runtime files to `dist/` and emits declarations via `tsc --emitDeclarationOnly`
- Do not edit `dist/` by hand; change `src/` and rebuild
- Avoid `release:*` scripts unless explicitly performing a release; they version, push tags, and publish

Practical agent workflow:

- For code changes, usually run the most relevant single test file first, then `bun test` if the change has wider impact
- If a change touches config loading, CLI install flow, hooks, or tool wrappers, add or update nearby co-located tests
- If you change public behavior or generated output assumptions, finish with `bun run build`

Cursor/Copilot rules:

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` files are present in this repo at the time this file was written

## Code Style

### General formatting

- Use Biome for formatting and linting; do not hand-format code that Biome already controls
- Formatting defaults come from `biome.json`: 2-space indentation, LF endings, 80-column line width, single quotes, trailing commas set to `all`
- Keep imports organized; Biome organize-imports is enabled
- Prefer small, focused edits that preserve surrounding structure and behavior

### TypeScript / modules / imports

- The project is ESM (`package.json` uses `"type": "module"`); prefer `import` and `export`
- TypeScript runs in `strict` mode; do not weaken types to make errors disappear
- Prefer named exports in new code; avoid default exports unless there is a strong existing pattern to match
- Use `import type { ... }` for type-only imports whenever possible
- Use Node built-ins via `node:` specifiers such as `node:fs`, `node:path`, and `node:os`
- Prefer explicit local relative imports that match the existing folder layout

### Types and validation

- Prefer `unknown` plus narrowing over `any`; `any` is discouraged and only relaxed in test files by Biome override
- Validate external or user-provided data with Zod schemas, especially config, JSON, CLI input, and MCP payloads
- Use `Record<string, unknown>` for unknown object maps, then narrow carefully
- Use `as const` for literal maps or option tables when you need precise key/value inference
- Keep public helper signatures narrow and avoid leaking implementation-only union branches when a smaller surface works

### Naming and file structure

- Use `camelCase` for variables and functions
- Use `PascalCase` for types, interfaces, and classes
- Use `UPPER_SNAKE_CASE` for true constants
- Prefer `kebab-case` filenames and directories
- Keep modules single-purpose and colocate tests next to the implementation where practical
- Config keys written to JSON/JSONC may intentionally use `snake_case` to match the config schema

### Error handling and logging

- Prefer explicit, actionable error messages
- In `catch` blocks, normalize unknown failures with `error instanceof Error ? error.message : String(error)`
- Use `console.warn` for best-effort or recoverable startup/config issues when the program can continue safely
- Avoid throwing in utility or startup paths unless fail-fast behavior is clearly required
- Preserve existing recovery-oriented behavior in hooks and loaders unless the change specifically tightens validation

### Testing and implementation habits

- Add or update co-located `*.test.ts` files when behavior changes
- Keep test fixtures focused and local to the module under test
- Prefer the smallest behavior-preserving refactor that solves the task
- Follow existing patterns in nearby files before introducing a new abstraction
- Update `docs/` when a user-visible workflow or configuration behavior changes

### Comments and generated files

- Write comments only when they explain why a non-obvious choice exists
- Do not restate code in comments
- Do not manually edit generated output under `dist/`

## Git Commit Message Style

The git commit message style should be composed of two parts: title and body. The title should be `<type>: <subject>` (such as `feat: add new feature` or `fix: fix bug`). The body should be the detailed description of the changes in list format.

It's important that DO NOT include any symbol like $ or ` in the title or body. This would cause the bash shell to interpret the title or body as a command or a code block.
