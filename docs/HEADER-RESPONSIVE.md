# Header responsive contract

This document applies only to the Shopify storefront Header. It does not change the responsive contract for other sections.

## Breakpoints

| Range | Header mode | Expected layout |
| --- | --- | --- |
| `0–767.98px` | Mobile | Hamburger, centered logo, right-side actions. |
| `768–1023.98px` | Tablet | The same Header drawer pattern as mobile. |
| `>=1024px` | Desktop | Left logo, centered desktop navigation, right-side localization and actions. |

## Why 1024px

Shopify Theme Editor displays the storefront in an embedded canvas. With both editor side panels open at Chrome 90% zoom, the canvas is 1025 CSS pixels wide. A `1024px` desktop threshold keeps the desktop Header visible in that editor scenario while preserving the drawer below the width where the logo, navigation, localization, and actions become too tight.

## Implementation boundary

When changing this contract, update every Header-specific breakpoint together:

- `assets/section-header-critical-1.css`
- `assets/section-header-critical-3.css`
- `assets/section-header-mobile.css`
- `assets/section-header.js`
- `layout/theme.liquid`
- `sections/header.liquid`
- `snippets/header-navigation.liquid`

Do not change global section breakpoints to match this exception. Verify the Header at `1023.98px`, `1024px`, and the Theme Editor canvas before delivery.
