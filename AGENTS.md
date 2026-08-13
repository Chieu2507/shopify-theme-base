# Spinel Theme Delivery Workflow

## Default branch and task isolation

- Use `codex/spinel-chieutt-dev` as the single default branch for normal work.
- Do not create a branch for a single active task. Make edits directly on the
  dev branch and preserve its existing worktree history.
- If two independent tasks must be implemented at the same time, keep the first
  task on `codex/spinel-chieutt-dev` and create one temporary `codex/*` branch
  for the new task only.
- Keep a temporary task branch isolated until the user explicitly says the task
  is complete (for example, “oke đóng task vụ”). Then merge it into
  `codex/spinel-chieutt-dev`, validate the merge, push dev, and delete the
  temporary local and remote branch.
- Never merge or push to `main` unless the user explicitly says `push main` or
  otherwise explicitly requests a main delivery.

## Preview and editor verification

- The sole Shopify preview target for this workflow is theme `144448127024`
  (`spinel-theme/codex/spinel-chieutt-dev`). Never preview or upload changes to
  live theme `144223469616`.
- Before every Shopify CLI command, run `shopify theme info` and confirm the
  target ID, name, and role.
- After each code change, start or refresh the local Theme Editor preview for
  theme `144448127024` so the user can inspect the current result immediately.
- Use `shopify theme dev --theme 144448127024`; never use `--allow-live`.
- Stop the preview watcher after QA or before changing branches. Confirm that
  port `9292` has no stale listener.

## Git delivery

- Before editing, run `git status --short --branch` and confirm the active
  worktree and remote branch.
- Keep unrelated user changes untouched. Commit only files belonging to the
  active task.
- Before pushing dev, run the validation required by the scope of the change.
  Shared CSS/JS, Liquid/schema, dialogs, responsive layout, navigation, and
  dynamic sections require Theme Check and affected Theme Editor/storefront QA.
- Push only to `origin/codex/spinel-chieutt-dev` unless the user explicitly
  requests another branch or `main`.

## `push main` synchronization protocol

When the user says `push main`:

1. Fetch `origin/main` and `origin/codex/spinel-chieutt-dev`, then inspect
   divergence and changed files.
2. Integrate the latest `origin/main` into `codex/spinel-chieutt-dev`, preserving
   both histories. Never reset, force-push, or replace main with an older dev
   snapshot.
3. Resolve conflicts and validate on dev, then push the synchronized dev branch.
4. Fetch main again. If it advanced during validation, repeat the synchronization.
5. Fast-forward main to the verified dev commit and push main.
6. Fetch both branches and verify they point to the same commit with zero
   divergence.
