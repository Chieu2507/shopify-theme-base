# Eligibility Audit

Scope: active instances in `templates/index.json`, Header group, and Footer
group. Dormant or hidden sections are intentionally excluded.

## Summary

PASS: Active Home sections use explicit `enabled_on` template rules; active
Header/Footer sections use explicit group rules; the curated item streams in
this scope no longer expose `@theme`.

WARN: Shopify Theme Block schemas do not support per-type child limits. Global
section caps and fixed static slots are used where the active layout needs an
exact cardinality.

FAIL: None.

## Section matrix

| Section | Placement | Allow-list | Static/dynamic | Limits | Existing data | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Editorial slideshow | Home only | `editorial-slide` | Dynamic slides | Existing section cap | Preserved | PASS |
| Editorial collection tabs | Home only | `editorial-collection-tab` | Dynamic tabs | Existing cap 6 | Preserved | PASS |
| Testimonials | Home only | `testimonial` | Dynamic Swiper items | Section cap 6 | Preserved | PASS |
| Gallery | Home only | `instagram-gallery-image` | 8 dynamic images + static content card | Section cap 9 | `instagram_content` migrated static | PASS |
| Gift Spinel | Home only | `gift-path` | Dynamic paths with nested curated kernels | Existing cap | Preserved | PASS |
| Image stack | Home only | `image-stack-scene` | Dynamic scenes with nested curated kernels | Existing cap | Preserved | PASS |
| Video banner | Home only | label/heading/text/button/spacer | Dynamic document-order content | Section cap 4 | Preserved | PASS |
| Header | Header group only | Existing header roles | Curated | Section cap 6 | Preserved | PASS |
| Footer | Footer group only | Existing footer roles | Curated | Section cap 4 | Preserved | PASS |
| Icon with text | Footer group only | Existing trust-point roles | Curated | Section cap 7 | Preserved | PASS |

For the remaining active Home sections, the current schema already has an
explicit `enabled_on: { "templates": ["index"] }` rule and an allow-list that
matches its renderer. They are retained without unrelated migration.

## Decisions

- Curated editorial sections belong to the Home template only.
- Header, Footer, and Overlay sections are group-owned and must use an explicit
  `enabled_on.groups` allow-list.
- A section's `blocks` schema is an allow-list, never a generic catalogue.
- Fixed visual slots are static; repeatable item blocks are purpose-specific and
  capped to the usable capacity of their layout.
- Data-source sections (Blog/Collection pickers) do not offer manually-created
  versions of the same data item.

## Placement matrix

| Surface | Allowed active sections |
| --- | --- |
| Home (`index`) | Editorial slideshow, Highlight text with image, Editorial collection, Shoppable video, Video banner, Editorial collection tabs, Collection list, Image stack, Shop the look, Blog posts, Testimonials, Instagram gallery |
| Header group | Announcement bar, Header, Scroll navigation |
| Footer group | Icon with text, Footer, footer-owned newsletter/offer components |
| Overlay group | Cart drawer, Search drawer, Quick view and dedicated modal helpers |

No Home editorial section may be addable to Header, Footer, or Overlay. No
Footer/Overlay component may be addable to a page template.

## Shopify schema constraint

Shopify does not permit `max_blocks` or per-child `limit` in a Theme Block
schema. It also rejects a section that combines **local section block
definitions** with static Theme Blocks. That restriction does *not* require a
curated section to retain `@theme`: a section can combine static Theme Blocks
with an explicit direct Theme Block allow-list such as
`{ "type": "testimonial" }`.

Direct Theme Block references must contain only `type`. Adding local-block
properties such as `name`, `settings`, or `limit` changes the schema entry into
a local section block and makes that combination invalid. Curated sections
therefore use explicit direct type references; `@theme` remains reserved for a
documented generic composition surface.

## Active Home section block model

| Section | Fixed slots | Dynamic Add block list | Intended limits |
| --- | --- | --- | --- |
| Editorial slideshow | None at section level | Editorial slide | 2–6 slides |
| Editorial slide | Product card slot | Label, Heading, Text, Spacer, Button group | Label 2 (eyebrow + specification), Heading 1, Text 1, Button group 1, Spacer 3 |
| Highlight text with image | Heading/text composition is section-owned | Inline image | 1–8 inline images |
| Editorial collection | Label, Heading, Text | None; products come from Collection picker | N/A |
| Shoppable video | Label, Heading, Text | Shoppable video | 2–6 items |
| Video banner | Media is section-owned | Label, Heading, Text, Button, Spacer | section max 4; content stack renders in document order |
| Editorial collection tabs | Label, Heading, Text | Editorial collection tab | 2–6 tabs |
| Collection list split promotions | Label, Heading, Text, Button | Collection card and a dedicated promotion card if implemented | Collection cards 2–6; promotion card 1 |
| Image stack | None at section level | Image stack scene | 2–6 scenes |
| Image stack scene | Media/background are item settings | Label, Heading, Text, Button, Spacer | Label 1, Heading 1, Text 1, Button 1, Spacer 2 |
| Shop the look | Label, Heading, Text | Product hotspot | 1–5 hotspots |
| Blog posts | Label, Heading, Text, Button | None; posts come from Blog picker | N/A |
| Testimonials | Section label | Testimonial | section max 6; no generic content or Gift path block in the Swiper item stream |
| Instagram gallery | Header Label, Heading, Text, Button, Instagram content card | Instagram image | section max 9; the card is static and its nested content remains merchant-editable |

## Header and Footer model

| Section | Placement | Block model |
| --- | --- | --- |
| Header | Header group only | Existing logo/mega-menu blocks only; do not admit generic page blocks |
| Announcement bar | Header group only | Announcement slide items only, with a practical cap of 6 |
| Scroll navigation | Header group only | No merchant-created blocks |
| Icon with text | Footer group only | Optional fixed header slot; trust-point items, 2–6 recommended |
| Footer | Footer group only | Static newsletter, appointment and house-signature; Footer menu items 2–4 |

## Implemented schema work

### P1 — generic block lists

- `sections/editorial-collection-tabs.liquid` now allows only
  `editorial-collection-tab`, with the existing six-item cap.
- `sections/gallery.liquid` now allows only `instagram-gallery-image`. Its
  single Instagram content card is a static Theme Block; its existing active
  `instagram_content` ID, settings, and nested child blocks were preserved and
  removed from `block_order` as required by Shopify.
- `sections/testimonials.liquid` now allows only `testimonial`; arbitrary
  theme blocks can no longer enter its Swiper item stream.
- `sections/video-banner.liquid`, `sections/gift-spinel.liquid`, and
  `sections/image-stack.liquid` now expose only the Theme Block types each
  renderer supports.

### P2 — platform limitation retained intentionally

Theme Blocks cannot declare per-type `limit` values. Where a section needs a
single fixed visual role, it uses a static block (Gallery's content card). For
repeatable Theme Block streams, the section-level cap is retained; narrowing it
below the current active count is intentionally avoided.

## Implementation sequence

1. Repair/verify declared custom block files before changing a section's
   allow-list; in particular Gallery's content-card type must exist before its
   schema stops using `@theme`.
2. Apply group `enabled_on` restrictions first (Header, Footer, Overlay).
3. Replace curated `@theme` lists with direct exact Theme Block types,
   preserving the active JSON block IDs and order. Do not add `name`, `limit`,
   or local `settings` to those direct references.
4. Add a global section cap only where it is valid for the already active
   configuration. Theme Block child caps are unsupported and remain an
   intentional platform limitation.
5. Migrate fixed slots to `static: true` only with a matching JSON migration.
6. Validate Theme Editor Add section/Add block, duplicate, reorder, remove,
   block selection, and save behavior.

## Acceptance checks

- The editor never offers an unrelated block in a curated section.
- Gallery offers only Instagram image; its single editable content card is
  static and cannot be duplicated into an invalid grid position.
- Footer cannot offer slideshow, gallery, product hotspot, or other page blocks.
- A Home section cannot be added to Header, Footer, or Overlay.
- Existing active configuration data remains valid and uses only declared block
  types.
- An item-stream section never receives unrelated content blocks that would be
  rendered as malformed rows or slides.
