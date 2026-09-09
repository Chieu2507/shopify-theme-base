---
name: build-base
description: "Project-local conventions for building this Shopify base theme: section DOM, Theme Editor schemas, inherited alignment, width containers, kernel blocks, static blocks, and theme validation. Use only in this repository for theme foundation work."
---

# Build Base

Use this skill only for `/Users/chieutrinh/Documents/GitHub/shopify-theme-base`. It records the current architecture decisions for the Spinel base theme; the root `AGENTS.md` remains authoritative for branch, secret, Shopify CLI, and Git delivery safety.

## Scope

Apply these conventions when building or changing Theme Settings, section kernels, theme blocks, shared tokens, section DOM, responsive behavior, or reusable Liquid/CSS components in this repository.

Do not load `shopify-section-builder` or `section-editor-standards` for this project unless the user explicitly re-enables them. Do not infer new settings or brand UI from an old screenshot; extend the current contract only when requested.

## Architecture layers

Build the theme in four deliberate layers. A lower layer provides tokens and context; a higher layer composes them. Do not move a responsibility upward merely to make one component convenient.

### 1. Theme Settings — global contract

- `config/settings_schema.json` is the merchant-facing global contract. Every setting needs a stable semantic ID, supported type/options, default, constraint, and clear token mapping.
- `config/settings_data.json` contains the current theme values; do not treat it as the place to invent new setting definitions.
- `snippets/css-variables.liquid` translates global settings and color schemes into CSS custom properties. It is the bridge from Theme Editor values to the CSS foundation.
- `assets/critical.css` consumes those tokens and owns resets, primitives, responsive behavior, and shared utilities. Components should read tokens with `var(...)`, not recreate global values.
- Keep global settings global: page width/margins, typography roles, schemes, radius presets, motion, button/form contracts, prices, and shared commerce tokens belong in Theme Settings. Section and block schema settings are for composition or local overrides.
- For every new setting, trace the complete path: `settings_schema.json` → `css-variables.liquid` or section/block mapping → CSS custom property → consuming component. Add locale keys when the schema label is translatable.

### 2. Block — reusable content kernel

Each reusable block lives in `blocks/<name>.liquid` and owns only its role:

1. Normalize and validate `block.settings` in Liquid, including fallback values.
2. Capture only non-default local CSS custom properties for the rendered element.
3. Render the smallest useful markup and put `block.shopify_attributes` directly on that element.
4. Keep block-local CSS and schema together; use schema headers for editor groups.
5. Read parent context and foundation tokens; do not own section layout, brand colors, or a duplicate global token system.

Heading, Text, Eyebrow, and Header are Basic kernel blocks. Heading separates semantic `html_tag` from visual typography role. Text is rich text without an HTML-tag control. Eyebrow uses the Accent role and optional background/icon. Header composes child blocks and owns child flow/gap/padding, but not child typography or alignment.

### 3. Section — composition and context owner

Each section in `sections/<name>.liquid` owns composition-level concerns:

- section schema settings for width, alignment/context, appearance/background, and section spacing;
- the section-specific outer schema class;
- the `section-spacing` surface and background layer;
- the `container` width mapping;
- the block allow-list or fixed static block calls;
- responsive section overrides and fallback behavior.

Sections must not reimplement global typography, button, form, radius, or color logic. They map section settings to local custom properties such as `--flex-align`, `--flex-align-mobile`, and section padding tokens, then let blocks consume the context.

### 4. Section base/kernel — shared implementation

The base layer is the contract shared by every new section:

- `assets/critical.css` provides `.container`, `.page-width`, `.container.full-width`, `.align-content`, focus rules, responsive breakpoints, and foundation token consumers.
- `snippets/css-variables.liquid` provides the global variables consumed by that base layer.
- A new section should compose the base DOM and utilities instead of adding section-specific versions of them.
- If a new primitive is genuinely reusable, add it to the base layer first and then consume it from sections/blocks. Do not hide a global primitive inside one section's stylesheet.

## Mapping section, base, and blocks

The dependency direction is:

```text
Theme Editor settings
  -> css-variables.liquid / section Liquid mapping
  -> global CSS foundation and semantic tokens
  -> section surface/container/context
  -> block markup and local presentation
```

For a section, map settings in this order:

1. Resolve and validate section settings in Liquid.
2. Set the section color scheme and inherited context on `section-spacing`.
3. Select exactly one container mode: `page-width` or `full-width`.
4. Apply `.align-content` to the composition wrapper when the section contains stacked blocks.
5. Render blocks through the section's allow-list or static block contract.
6. Let each block read inherited alignment and global tokens; only pass a local override when the block contract explicitly provides one.

The section controls the parent context; the block controls its content role; the base controls the shared implementation. A block must remain usable in another compatible section without copying section CSS.

## Section DOM contract

Shopify already emits the outer wrapper:

```html
<div id="shopify-section-..." class="shopify-section section-...">
```

The Liquid section must not add another semantic `<section>` wrapper for the kernel. Render the section content directly as a `div`, with `section-spacing` as the first child when applicable:

```html
<div class="section-spacing ... color-scheme ...">
  <div class="container page-width|full-width ...">
    <div class="align-content">...</div>
  </div>
</div>
```

Use a section-specific schema `class` (for example `section-rich--text`) when the section needs a stable outer hook. Keep the outer class and container responsibilities separate:

- `page-width` applies the global page-width cap.
- `full-width` belongs only on the inner `.container`, not on the section root.
- `.container.full-width` removes the max-width cap but preserves the current responsive page margins with `calc(100% - (var(--page-margin-current) * 2))`.
- Background and spacing belong to `section-spacing`; content width belongs to the container.

Do not add duplicate `rich-text`, `rich-text--full-width`, or utility `full-width` wrappers around a section kernel.

## Alignment inheritance

Section alignment is owned by the section or parent composition. A section maps its desktop setting to `--flex-align` and, only when `Customize for mobile` is enabled, maps the mobile setting to `--flex-align-mobile`.

The shared content wrapper follows this contract:

```css
.align-content {
  --text-align: var(--flex-align, start);
  display: flex;
  flex-direction: column;
  align-items: var(--flex-align, start);
  text-align: var(--text-align);
}

@media (max-width: 767.98px) {
  .align-content {
    --text-align: var(--flex-align-mobile, var(--flex-align, start));
    align-items: var(--flex-align-mobile, var(--flex-align, start));
  }
}
```

Heading, Text, Eyebrow, and Header blocks must inherit this context rather than owning an alignment setting. Text-like blocks use `text-align: var(--text-align-default, inherit)`. Header uses `align-items: var(--flex-align, start)` on desktop and the mobile token inside the mobile media query. A missing mobile override falls back to desktop alignment.

## Kernel block and schema conventions

- Use schema headers to separate groups such as `Content`, `Size`/`Layout`, `Appearance`, `Gap`, and `Padding`.
- Keep visual typography independent from semantic HTML. Heading visual size is a token/role; `html_tag` alone selects `div`/`h1`–`h6`. Text has no HTML-tag setting.
- Block alignment is inherited from the section or compound parent. Do not add per-block alignment controls unless the user explicitly changes this contract.
- Use `block.shopify_attributes` directly on the rendered block element. Avoid an extra wrapper solely to carry editor attributes.
- Emit inline CSS custom properties only when a value is non-default or an active mobile override differs from desktop. Default zero padding and default width/alignment should not appear in the `style` attribute.
- Keep `fit`, `fill`, and `custom` width modes consistent. Show max-width only for `custom`; show mobile width/custom values only when `Customize for mobile` is enabled.
- Shared Header is a compound block with at most one Eyebrow, Heading, and Text child, in the recommended order Eyebrow → Heading → Text. It owns child flow/gap/padding, not child typography or alignment.
- Eyebrow background is opt-in. When enabled, its default surface padding is `1rem 1.4rem`; its icon choices are the contract-defined decorative shapes (circle, square, triangle, diamond). Radius options use the shared presets `Square`, `Slightly rounded`, `Rounded`, and `Pill` rather than an ad-hoc range.

Rich text-style sections use static kernel blocks when the composition is fixed:

```liquid
{% content_for "block", type: "eyebrow", id: "eyebrow" %}
{% content_for "block", type: "heading", id: "heading" %}
{% content_for "block", type: "text", id: "text" %}
```

Static blocks may be customized or hidden in the editor, but their fixed order and presence are controlled by the section implementation. Keep the section schema allow-list aligned with the static block calls.

## Mapping blocks into sections

Choose one mapping pattern per composition and keep the schema, Liquid calls, and JSON template in sync:

- **Merchant-managed composition:** the section schema declares the allowed block types and Liquid uses `{% content_for 'blocks' %}`. The merchant can add, remove, reorder, duplicate, and configure those blocks according to the allow-list and limits.
- **Fixed composition:** the section schema declares the permitted block types and Liquid calls each static block with a stable ID using `{% content_for 'block', type: ..., id: ... %}`. The template JSON lists those blocks with `"static": true` and keeps their order in the section `order`/block structure. Static blocks can be customized or hidden, but are not freely reordered or removed.
- **Compound block:** a block such as Header declares its own child allow-list and limits, renders `{% content_for 'blocks' %}`, and must reject nesting itself when the contract disallows it. The parent section still owns the outer width, alignment, and background context.

When adding a section/block relationship, verify all three surfaces together: the section schema, the Liquid rendering call, and the relevant `templates/*.json` entry. A block type that is allowed but never rendered, rendered but absent from the allow-list, or marked static without a matching stable ID is an incomplete mapping.

## Foundation and settings decisions

- Components consume semantic color, typography, radius, motion, button, form, price, and layout tokens; do not hard-code brand colors or section-specific dimensions.
- The Layout settings expose page width plus desktop/tablet/mobile page margins. There is no `Minimum page margin` setting or hidden minimum-margin clamp.
- Radius controls use the shared preset vocabulary. Do not switch one component to a numeric range unless the contract explicitly requires it.
- Keep the current badge scope: do not reintroduce the removed generic status-color group; collection badges and custom product-card tags are separate concerns.
- Button Tertiary remains the third button level and follows its own label/hover-label contract; do not add unrelated outline/subtle naming.

## Delivery and validation

Before editing, inspect the worktree and remote and preserve unrelated user changes. Work on `dev` unless the user explicitly requests another branch. Follow the root `AGENTS.md` for the exact Shopify theme safety rules.

For Shopify CLI validation, verify the development theme with `shopify theme info` immediately before each Shopify CLI command, then run Theme Check. Keep the requested `shopify theme dev` watcher running, but do not leave an unrequested watcher after QA. Validate `git diff --check`, inspect the preview at desktop/mobile widths, and check that editor attributes, empty content, responsive fallbacks, and keyboard focus remain correct.

Do not commit or push this skill or theme changes unless the user explicitly asks for delivery.
