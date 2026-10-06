# Password reference audit — 2026-10-06

Reference: theme 166302089264 (Updated copy of Elvara), `/password`. Development target: unpublished theme 144448127024; reference theme is read-only.

## Observed behavior and implementation contract

- Header shows the global shop logo/name at left and Enter using password at right.
- The page fills the viewport with a centered, outlined 560px coming-soon panel. Heading, explanatory text, labelled countdown, newsletter and optional social links are merchant-managed content.
- Password entry opens a right drawer with a password input, Enter and owner login. Escape, close and backdrop dismiss; input errors keep the entry UI open. No credentials are modified.
- Footer shows Shopify attribution and owner login, with a visibility setting.
- Mobile keeps one DOM tree, fits the panel within global page margins, stacks newsletter fields when configured and uses the shared overlay mobile lifecycle.
- Countdown date is merchant data. Do not fabricate a launch date from the reference's transient remaining duration. New default countdown is hidden until configured in storefront, with editor preview available.

## Architecture

Password template only, one main section. Header logo reuses the existing private `_header-logo` kernel in a fixed static `password-logo` slot; this fixed companion is intentionally absent from Add block. Dynamic allow-list: Heading, Text, Countdown timer, Email signup, Social links; section cap 5 (one default instance of each useful content role). No app blocks. Dynamic blocks can be hidden, removed, reordered and selected. Empty content stays empty. Typography, newsletter, countdown, logo, buttons and overlay reuse Spinel kernels/components; section owns viewport layout, panel, scheme and spacing.

## Initial findings

- P1: Existing page only rendered a direct password form; missing reference content, newsletter and drawer.
- P1: Password layout lacked the main landmark and overlay dependencies.
- P2: Password controls lacked required/error associations and scoped IDs.

## Validation

Overall: PASS WITH FOLLOW-UPS.

- PASS: final Shopify Theme Check has 0 errors; password section has one scoped-CSS warning for a global form primitive (intentional reuse). JavaScript syntax and git diff whitespace checks pass.
- PASS: server upload/schema validation to verified unpublished development theme 144448127024, exact name spinel-theme/codex/spinel-chieutt-dev. Theme info reports no watcher development ID; theme list verified target identity/role.
- PASS: desktop and mobile preview; centered kernel content, newsletter horizontal/vertical behavior, drawer initial input focus, Escape/close and opener focus return.
- PASS: representative Theme Editor changes to width, max width, gap, boxed layout, footer, scheme, top/bottom padding; custom background covers full viewport. Section rerender keeps password opener functional. Temporary changes undone, Save disabled.
- PASS: incorrect password submitted on standalone development preview returns Shopify error, automatically reopens drawer and focuses password. Invalid newsletter email is blocked by browser validation.
- NOT TESTED: successful newsletter submission (would create a subscriber), successful unlock (no credential requested), every unchanged child-block setting permutation, exact boundary viewport widths, no-JavaScript browser execution and non-English copy. Defaults, child eligibility and static slot were checked in editor; source provides required/error associations and scoped fallback IDs.
- Follow-up: configure the real launch date and unhide countdown. Social links remain empty until global links are configured. Spinel global typography is retained rather than importing reference font settings.
- P2 addressed during QA: background root masked wrapper override; no-JavaScript style hid opener after AJAX section rerender; header fallback name clipped by logo width. Width-only composition fix retains existing header logo typography.
- Port 9292: no listener before/after; no watcher started.
- Existing unrelated dirty files are preserved; no commits or Git pushes, and no live-theme changes. Only selected password files and required locale files were uploaded. Locale files also retain pre-existing local edits. No cross-repository sync is authorized; shared kernels remain unmodified.
