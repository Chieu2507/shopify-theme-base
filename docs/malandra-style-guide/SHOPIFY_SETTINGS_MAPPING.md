# Shopify Theme Settings Mapping

## Global settings

The following Figma concepts are merchant-editable in `config/settings_schema.json`:

- Layout: 1600 px content width and device-specific page margins.
- Typography: Shopify-hosted heading/body font pickers, responsive H1–H5 sizes, line heights, and body sizes.
- Color schemes: four semantic schemes with heading, text, surface, variant, and three button roles.
- Commerce colors: sale, sold-out, and two custom badge palettes.
- Component shapes: media/card, button, badge, swatch, and form modes.
- Buttons and forms: desktop/mobile height and horizontal padding, disabled opacity, and overlay opacity.

## Documented but not merchant-editable

The raw spacing, opacity, neutral gray, and radius scales are implementation tokens. They are documented in `TOKENS.md` and will become CSS custom properties when the storefront foundation is implemented. They are intentionally not exposed as dozens of independent Theme Editor controls.

## Section-level settings deferred

The following do not belong in global settings and will be defined only when the matching section is built:

- Section width and composition.
- Section spacing preset.
- Section color scheme selection.
- Media aspect ratio, crop, focal point, and overlay.
- Heading, copy, buttons, product, collection, article, and repeated merchant content.

## Font decision

Figma specifies Kaisei Decol Regular and Figtree Regular. Both families are mapped directly to Shopify's font library using `kaisei_decol_n4` and `figtree_n4`.

## No-image boundary

This phase does not create, download, crop, transform, or upload Figma imagery. Future media settings will use Shopify `image_picker` controls and resilient placeholders.
