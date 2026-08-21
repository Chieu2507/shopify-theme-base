# Design Shopify Theme

This guide turns Shopify’s theme-design principles into the working design
standard for Spinel. It is a decision checklist, not a replacement for the
theme’s section, block, and component contracts.

Source: [Shopify — Designing Shopify themes](https://shopify.dev/docs/storefronts/themes/best-practices/design).

## Design outcome

A Spinel page should feel editorial and premium without hiding the route to a
product or purchase. Every visual decision must balance three outcomes:

1. Brand expression — refined typography, imagery, tone, and pacing.
2. Product discovery — clear routes from story to collection, product, and cart.
3. Conversion — understandable actions, feedback, trust, and a short purchase path.

Do not add a second component when an existing component can be styled or
extended to achieve the same customer outcome.

## Merchant experience

### Purposeful

- Build sections for a verified merchandising purpose, not just a visual
  pattern.
- Give each homepage section one primary job: introduce, inspire, browse,
  compare, build trust, or convert.
- Keep the page’s story and commerce cadence intentional: editorial content
  must lead to a relevant collection, product, or next decision.

### Easy to set up

- Expose only settings that substantially affect the merchant’s outcome.
- Use Theme Blocks for content that benefits from reordering or independent
  editing; use static slots for fixed composition roles.
- Defaults and empty states must look launch-ready and must use role-appropriate
  Shopify outline placeholders.
- A resource-picker section owns its product, collection, or blog data. Do not
  also offer manual cards for the same data source.

### Antifragile

- Support empty, short, long, translated, and reordered content without
  clipping, overlap, or invalid layout.
- Ensure every image ratio option preserves a coherent card or media frame.
- Keep typography semantic: headings use heading font systems; product titles
  inherit the Product cards font family.
- Use scheme tokens for color and contrast. Never solve a contrast issue by
  hard-coding a color that breaks another scheme.
- Reserve clear space for floating widgets such as chat, cookie, and offer UI.

### Flexible and extensible

- Provide predictable controls for layout, content, appearance, and responsive
  behavior; avoid settings that have hidden side effects.
- Use metafields, Theme Blocks, and app blocks only where the layout has a
  deliberate extension slot.
- Preserve Shopify platform behavior rather than duplicating it in theme
  settings.

## Customer experience

### Accessible

- Preserve DOM and keyboard order even when a design changes visual order.
- Give icon-only controls accessible labels and visible focus states.
- Verify text, buttons, overlays, and media controls against every supported
  color scheme.
- Honour reduced motion and avoid animation that blocks a customer action.

### Expressive and cohesive

- Use a small set of repeatable visual primitives: global button variants,
  typography kernels, navigator controls, spacing, and color schemes.
- Keep image treatment, card behaviour, button motion, labels, and spacing
  consistent across similar sections.
- Use editorial motion to reveal hierarchy, not as decoration that competes
  with the product or makes the page feel slow.

### Intuitive and efficient

- Keep primary navigation discoverable and stable.
- Make product, collection, and cart actions obvious and give immediate
  feedback.
- Include commerce entry points in storytelling sections when they are relevant.
- Test mobile first: content must remain legible, controls reachable, and no
  critical action may be hidden below another fixed interface.

## Homepage review checklist

### Narrative and conversion

- [ ] The first viewport communicates brand, product category, and a clear CTA.
- [ ] Every long-form editorial sequence has a natural commerce exit.
- [ ] Featured products/collections appear before the page becomes cognitively
      dense.
- [ ] Video, lookbook, blog, and community content support discovery rather
      than duplicate it.
- [ ] Trust, gifting, shipping, and support content sit near plausible decision
      points.

### System consistency

- [ ] Section background lives on the Shopify section wrapper and respects its
      selected scheme or explicit background override.
- [ ] Shared buttons use `btn-*`; navigators use the common navigator component.
- [ ] Repeated cards share typography, media, placeholder, hover, and reveal
      contracts.
- [ ] Carousels hide controls and View all when there is no overflow.
- [ ] Empty carousels still render enough semantic skeleton items for their
      layout and controller.

### Editor, responsive, and QA

- [ ] Section and block allow-lists only expose rendered, meaningful options.
- [ ] Static/dynamic blocks have intentional cardinality and valid selection
      behaviour in Theme Editor.
- [ ] The page has no horizontal overflow at 390px, 768px, 1150px, and 1440px.
- [ ] Keyboard navigation, focus, dialogs, sliders, and media controls are
      tested.
- [ ] Theme Check and runtime console checks pass before release.

## Scoring rubric

Score each dimension from 0–10, then use a weighted average:

| Dimension | Weight | What it measures |
| --- | ---: | --- |
| Brand expression and cohesion | 20% | Art direction, typography, spacing, motion, and schemes |
| Product discovery and conversion | 20% | Clear routes to collections, products, cart, and checkout |
| Merchant usability | 15% | Predictable Theme Editor configuration and useful defaults |
| Responsive robustness | 15% | Mobile/tablet/desktop layout, no overlap or overflow |
| Accessibility and trust | 15% | Semantics, contrast, focus, controls, and transparent UX |
| Performance and interaction quality | 15% | Motion restraint, stable layout, responsive controls |

Use the score to prioritize fixes:

- `9–10`: release-quality; only polish remains.
- `8–8.9`: strong foundation; resolve listed follow-ups before broad release.
- `7–7.9`: usable, but material consistency or UX risks remain.
- `<7`: resolve structural, accessibility, or conversion issues before further
  visual expansion.
