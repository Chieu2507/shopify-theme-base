# Malandra Style Guide

Source: [Figma – Malandra Copy](https://www.figma.com/design/QsZTEKYQSuRJcn5MIIrDMP/%E2%9C%85-Malandra--Copy-?node-id=43001-11865)

Figma page: `✅ Style Guide` (`43001:11865`)

This directory records the design foundation extracted on 2026-07-18 before any jewelry storefront sections or templates are implemented.

## Files

- [TYPOGRAPHY.md](TYPOGRAPHY.md): font families, responsive heading sizes, body roles, line heights, and text treatment.
- [TOKENS.md](TOKENS.md): color schemes, semantic commerce colors, spacing, radii, opacity, and device/container values.
- [SHOPIFY_SETTINGS_MAPPING.md](SHOPIFY_SETTINGS_MAPPING.md): the boundary between Figma tokens and merchant-editable Shopify Theme Settings.

## Implementation status

- Style Guide inspected: complete.
- Theme Settings schema and default data: complete.
- Section, block, page-template, and image implementation: intentionally not started.
- Figma imagery is not extracted, generated, retouched, or added to the theme.

## Source-of-truth rule

Figma is the visual specification. The Markdown files are the implementation contract. `config/settings_schema.json` defines merchant-editable controls, and `config/settings_data.json` holds the Malandra defaults for theme `191202263412`.
