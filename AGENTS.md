# AGENTS

This file is guidance for agentic coding tools working in this repo.

## Project Purpose and Priorities

This repository is a privately maintained Safari-compatible fork of
[`keleus/BewlyCat`](https://github.com/keleus/BewlyCat). Its purpose is to keep
the upstream extension usable on Safari with the smallest practical set of
local compatibility patches.

Follow these priorities in order:

1. Preserve Safari compatibility and the ability to build and run the Safari
   extension.
2. Keep the fork synchronized with the latest upstream BewlyCat changes.
3. Adopt upstream features only when they do not break Safari compatibility.

When an upstream change conflicts with a local Safari patch, do not blindly
accept either side. Start from the latest upstream implementation, adapt the
Safari-specific behavior to it, and verify the result with the Safari build.
Prefer small, isolated compatibility patches so that future upstream
synchronizations remain easy to review.

This is not an upstream-contribution repository:

- Do not create pull requests for routine maintenance or Safari compatibility
  work.
- Do not open upstream issues, publish branches, or otherwise contact upstream
  unless the user explicitly requests it.
- Do not merge the configured upstream branch directly into `main`. Synchronize
  through a temporary `sync/<version-or-sha>` branch using the linear patch
  stack workflow below.

## Linear Upstream Synchronization Workflow

Keep BewlyCat's commits unchanged and place all BewlyNeko-specific work after
the latest upstream commit. The intended history is:

```text
<unchanged BewlyCat history>
  -> local tooling commits
  -> local repository-maintenance commits
  -> baseline Safari compatibility commits
  -> Safari adaptations for specific upstream features
  -> main
```

Treat all local commits after the previous upstream base as one ordered **local
patch stack**, but keep each concern in a separate, focused commit. In
particular:

- Tooling migrations, such as replacing ESLint with Biome, come before Safari
  compatibility commits so later work is checked with the maintained toolchain.
- Repository cleanup, such as removing unwanted tracked `.vscode` files, uses
  separate maintenance commits.
- Baseline Safari fixes use separate compatibility commits.
- Each upstream feature that needs additional Safari work gets its own detailed
  Safari adaptation commit.
- Do not squash unrelated tooling, cleanup, branding, and Safari work into one
  commit merely to make synchronization appear simpler.

### Branch Roles

- `bewly-cat/main`: remote-tracking reference for the untouched upstream
  history. Never develop or commit on it.
- `main`: the tested, stable Safari-compatible release branch. Do not perform
  experimental synchronization work directly on it.
- `sync/<version-or-sha>`: temporary branch for rebasing the complete local
  patch stack onto a new upstream version, resolving conflicts, integrating
  feature adaptations, and running the final verification suite.
- `safari/<feature-name>`: temporary branch for implementing and testing Safari
  compatibility for one specific upstream feature.

An optional `upstream-main` local branch may mirror `bewly-cat/main`, but it is
not required because the remote-tracking branch already provides the same
reference.

### Synchronization Procedure

1. Fetch `bewly-cat` and inspect the new upstream commits and affected files.
2. Determine the previous upstream base with `git merge-base main
   bewly-cat/main` before changing history.
3. Create a backup branch from the current `main`.
4. Create `sync/<version-or-sha>` from the current stable `main`.
5. Rebase the entire local patch stack with `git rebase --onto
   bewly-cat/main <previous-upstream-base>`.
6. Resolve each local commit in its original order: tooling, repository
   maintenance, baseline Safari compatibility, then feature-specific Safari
   adaptations.
7. Run the complete verification suite on the sync branch.
8. Only after verification succeeds, move `main` to the tested sync result and
   push with `--force-with-lease` when explicitly requested.
9. Delete temporary sync and feature branches only after the stable branch is
   safely updated and a backup remains available.

Do not merge the rebased sync branch into the old `main` with a normal merge.
The rebased local commits have new hashes, so a normal merge would create the
non-linear history this workflow is designed to avoid. Move the `main` pointer
to the verified sync result instead.

### Handling Upstream Changes

When replaying a local patch onto the latest upstream implementation, handle
each affected area according to these cases:

1. **Unrelated upstream change:** keep the upstream commit untouched and replay
   the local patch without additional changes.
2. **Upstream extends code covered by a Safari patch:** use the latest upstream
   implementation as the base, preserve the original Safari behavioral
   guarantee, and create `safari/<feature-name>` if the new feature requires
   substantial compatibility development or runtime testing.
3. **Upstream now provides equivalent Safari support:** remove the redundant
   local code. Skip the local commit only when every change in that commit has
   been superseded; otherwise retain only its still-required parts.

For conflicts, compare the old upstream base, the latest upstream version, and
the previous Safari-patched version. Do not blindly select `ours` or `theirs`.
Implementation details may change, but Safari behavior must remain correct.

### Feature Adaptation and Integration

Create `safari/<feature-name>` from the current sync branch for any substantial
Safari adaptation. The commit must identify the upstream feature and commit,
explain the incompatibility, describe the compatibility implementation, and
record verification. After testing, rebase the feature branch onto the current
sync branch if necessary and integrate it with `git merge --ff-only` so no
local merge commit is added.

At minimum, final synchronization verification includes:

```text
bun run typecheck
bun run lint
bun run test -- --run
bun run build-safari
```

Run Chrome/Firefox builds and real Safari runtime checks when the affected code
or release risk warrants them. A successful Safari build alone does not prove
that media APIs, messaging, storage, permissions, or extension lifecycles work
correctly at runtime.

## Git Commit Requirements

- Every commit message must explain both **what changed** and **why the change
  was necessary**. A short subject without an explanatory body is not
  sufficient for non-trivial changes.
- For Safari fixes, document the Safari-specific failure or platform behavior,
  the compatibility approach chosen, and why the upstream implementation alone
  was insufficient.
- For upstream synchronization commits, describe important conflicts, which
  side was retained or adapted, and how Safari compatibility was preserved.
- Include relevant verification in the commit body, such as typecheck, tests,
  lint, and `bun run build-safari`.
- Keep commits focused. Separate unrelated maintenance, branding, and Safari
  compatibility changes whenever practical.

Recommended commit form:

```text
fix(safari): preserve message responses after upstream sync

Upstream changed the background message registration flow. Safari treats
non-matching runtime listeners differently and returned undefined responses,
so the handlers continue to use a single dispatcher.

Verified with typecheck, tests, lint, and the Safari production build.
```

## Project Snapshot

- Web extension for Bilibili using Vue 3 + Vite + TypeScript
- Package manager and tooling runtime: `bun` 1.3.14
- Primary code in `src/` (background, content scripts, popup, options)
- Primary LLM for this repo: Codex
- Forked from upstream BewlyCat; Chrome-focused extension with added Safari support

## Setup

- Install deps: `bun install`
- A separate Node.js installation is not required; CI uses `bun --bun` to force
  package binaries to run with Bun
- `node:` imports in tooling scripts use Bun's Node.js-compatible APIs and do
  not imply that the Node.js runtime is required
- Dev builds create `extension/` (Chrome/Edge) or `extension-firefox/` (Firefox)

## Build / Lint / Test Commands

### Development

- Chrome/Edge dev build: `bun run dev`
- Firefox dev build: `bun run dev-firefox`
- Launch Chromium with profile: `bun run start:chromium`
- Launch Firefox with profile: `bun run start:firefox`

### Build Targets

- Production build (Chrome/Edge): `bun run build`
- Production build (Firefox): `bun run build-firefox`
- Production build (Safari): `bun run build-safari`
- Build and package all: `bun run build-pack`

### Lint / Typecheck

- Lint: `bun run lint`
- Lint with autofix: `bun run lint:fix`
- Typecheck: `bun run typecheck`

### Tests

- Run all tests: `bun run test`
- Run a single test file: `bun run test -- --run src/tests/uriParse.spec.ts`
- Run a single test by name: `bun run test -- --run -t "should parse bilibili uri"`

### Other Useful Commands

- Remove build artifacts: `bun run clear`, `bun run clear-firefox`, `bun run clear-safari`
- Dead-code checks: `bun run knip`
- Package zip/crx/xpi: `bun run pack`, `bun run pack:zip`, `bun run pack:crx`, `bun run pack:xpi`

## Code Style and Conventions

### Language / Tooling

- TypeScript in `moduleResolution: "bundler"` with strict mode enabled
- Vue 3 Composition API with `<script lang="ts" setup>` in SFCs
- Vite-based build with multiple configs in `vite.config*.ts`
- Pinia for state management (`defineStore` in `src/stores/`)

### Formatting

- Formatting is enforced via ESLint (antfu config + formatters)
- Print width: 120
- Use existing style in the file; ESLint auto-fix is authoritative
- Semicolons are not used in current code
- Prefer trailing commas in multiline objects/arrays

### Imports

- Import sorting is enforced by `eslint-plugin-simple-import-sort`
- Use path aliases: `~/` and `~` map to `src/`
- Use type-only imports with `import type { ... }` when possible
- Group imports with blank lines (external → internal → local)

### Naming

- `camelCase` for functions/variables
- `PascalCase` for components, types, interfaces, and classes
- `SCREAMING_SNAKE_CASE` for constants (e.g., `CATEGORY_KEYS`)
- Vue components use `PascalCase` filenames and default exports

### Types

- `strict` is on but `noImplicitAny` is false; still prefer explicit types
- Prefer `interface` for object shapes and `type` for unions
- Use `ReadonlyArray<T>` or `readonly` for immutable collections
- Use `Record<K, V>` for map-like objects

### Vue / SFC Practices

- Use `<script setup>` with `ref`, `computed`, `watch`, etc.
- Keep props/emit typing explicit if not inferred
- Max 5 attributes per line in Vue templates (eslint rule)
- Prefer early returns and guard clauses in composables and utils

### Error Handling

- Guard against null/undefined results from `URLSearchParams` and APIs
- Use `try/catch` around network or storage operations when needed
- `alert()` is allowed (`no-alert` is disabled)
- `console` is allowed for `debug`, `warn`, `error`, and `log`

### i18n

- i18n files are in `src/_locales`
- Manually maintain i18n entries; do not use i18n Ally or similar tools

### Tests

- Tests use Vitest and live in `src/tests/`
- Prefer descriptive test names and inline snapshots when useful

## Repository Notes

- Build outputs live in `extension/`, `extension-firefox/`, `extension-safari/`
- Background scripts in `src/background/`
- Content scripts and app views in `src/contentScripts/`
- Popup UI in `src/popup/` and Options UI in `src/options/`
- Injected scripts live in `src/inject/`
