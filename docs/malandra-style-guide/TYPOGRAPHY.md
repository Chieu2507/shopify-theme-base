# Typography

## Font families

| Role | Figma family | Weight | Shopify default |
|---|---|---:|---|
| Headings H1–H5 | Kaisei Decol | 400 | `kaisei_decol_n4` |
| Body and utility copy | Figtree | 400 | `figtree_n4` |

Kaisei Decol and Figtree are loaded from Shopify's font library. The storefront uses the selected Shopify font objects directly so Theme Editor choices and rendered `@font-face` declarations cannot diverge.

## Responsive heading scale

| Role | Desktop | Tablet | Mobile | Line height | Letter spacing | Case |
|---|---:|---:|---:|---:|---:|---|
| H1 | 54 px | 46 px | 40 px | 130% | 0 px | Title case |
| H2 | 34 px | 32 px | 30 px | 120% | 0 px | Title case |
| H3 | 26 px | 24 px | 22 px | 140% | 0 px | Title case |
| H4 | 20 px | 20 px | 20 px | 140% | 0 px | Title case |
| H5 | 16 px | 16 px | 16 px | 150% | 0 px | Title case |

The Figma device modes are 1920 px desktop, 768 px tablet, and 375 px mobile. The implementation may use fluid interpolation between these anchor values, but must preserve the exact values at the reference breakpoints.

## Body roles

| Role | Size | Line height | Letter spacing | Case |
|---|---:|---:|---:|---|
| Body | 16 px | 150% | 0 px | Original |
| Body small | 14 px | 150% | 0 px | Original |
| Body large | 18 px | 150% | 0 px | Original |
| Caption/custom | 12 px | 150% | 0 px | Original |

Body sizes do not change across the desktop, tablet, and mobile samples.

## Theme Editor contract

- Heading and body fonts are independently selectable.
- H1–H5 sizes are independently configurable for desktop, tablet, and mobile.
- Heading line heights and body line height are configurable.
- Semantic heading level must remain separate from visual size when sections are implemented.
