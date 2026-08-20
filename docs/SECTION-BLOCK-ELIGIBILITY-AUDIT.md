# Section & Block Eligibility Audit

Status: proposed implementation contract. Scope is limited to sections currently
active in `templates/index.json` plus active Header and Footer group sections.
Dormant or hidden sections are intentionally excluded.

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
schema. It also rejects a section that combines static Theme Blocks with local
section block definitions. Therefore, sections that retain fixed kernel blocks
as static (`Editorial collection tabs`, `Shoppable video`, `Video banner`,
`Testimonials`, and `Instagram gallery`) must retain `@theme` as their dynamic
extension mechanism until their static composition is intentionally migrated to
local blocks. Their active IDs and settings are preserved; their broader Add
block catalogue is a documented, migration-sensitive exception rather than an
invalid schema workaround.

## Active Home section block model

| Section | Fixed slots | Dynamic Add block list | Intended limits |
| --- | --- | --- | --- |
| Editorial slideshow | None at section level | Editorial slide | 2–6 slides |
| Editorial slide | Product card slot | Label, Heading, Text, Spacer, Button group | Label 2 (eyebrow + specification), Heading 1, Text 1, Button group 1, Spacer 3 |
| Highlight text with image | Heading/text composition is section-owned | Inline image | 1–8 inline images |
| Editorial collection | Label, Heading, Text | None; products come from Collection picker | N/A |
| Shoppable video | Label, Heading, Text | Shoppable video | 2–6 items |
| Video banner | Media is section-owned | Label, Heading, Text, Button/Button group, Spacer | each content kernel 1, Spacer 2 |
| Editorial collection tabs | Label, Heading, Text | Editorial collection tab | 2–6 tabs |
| Collection list split promotions | Label, Heading, Text, Button | Collection card and a dedicated promotion card if implemented | Collection cards 2–6; promotion card 1 |
| Image stack | None at section level | Image stack scene | 2–6 scenes |
| Image stack scene | Media/background are item settings | Label, Heading, Text, Button, Spacer | Label 1, Heading 1, Text 1, Button 1, Spacer 2 |
| Shop the look | Label, Heading, Text | Product hotspot | 1–5 hotspots |
| Blog posts | Label, Heading, Text, Button | None; posts come from Blog picker | N/A |
| Testimonials | Section label | Testimonial | 2–6 testimonials |
| Instagram gallery | Header Label, Heading, Text, Button | Instagram image, Instagram gallery content | Images 4–8; content card 1 |

## Header and Footer model

| Section | Placement | Block model |
| --- | --- | --- |
| Header | Header group only | Existing logo/mega-menu blocks only; do not admit generic page blocks |
| Announcement bar | Header group only | Announcement slide items only, with a practical cap of 6 |
| Scroll navigation | Header group only | No merchant-created blocks |
| Icon with text | Footer group only | Optional fixed header slot; trust-point items, 2–6 recommended |
| Footer | Footer group only | Static newsletter, appointment and house-signature; Footer menu items 2–4 |

## Findings requiring schema work

### P1 — generic block lists

- `sections/editorial-collection-tabs.liquid` uses `@theme` although it renders
  only `editorial-collection-tab` items. Replace with that explicit type and a
  six-item cap.
- `sections/gallery.liquid` uses `@theme` despite its editorial grid requiring
  only image items and one content card. Replace it with
  `instagram-gallery-image` and `instagram-gallery-content` (`limit: 1`).
- Nested slide/scene/content-card schemas must apply the same explicit
  allow-list and per-kernel limits.

### P1 — group placement is not strict enough

- `sections/footer.liquid` has no explicit Footer-group allow-list.
- `sections/icon-with-text.liquid` only excludes Header; it should be Footer
  group only because the active configuration places it before Footer there.

### P2 — Home editorial placement is currently broad

The active editorial sections do not consistently constrain their template
placement. Add `enabled_on: { "templates": ["index"] }` when touching each
section schema, after confirming every active JSON instance is preserved.

### P2 — fixed slot migration needs data-aware handling

Some active sections already store header kernels in `block_order` while newer
ones correctly use static IDs. Do not flip these to static in a blind schema
edit: migrate the matching active JSON config at the same time, or retain the
current block type with `limit: 1` until a dedicated migration pass.

## Implementation sequence

1. Repair/verify declared custom block files before changing a section's
   allow-list; in particular Gallery's content-card type must exist before its
   schema stops using `@theme`.
2. Apply group `enabled_on` restrictions first (Header, Footer, Overlay).
3. Replace curated `@theme` lists with exact types, preserving the active JSON
   block IDs and order.
4. Add per-type limits and reduce global caps only where the existing active
   configuration is already within the new limit.
5. Migrate fixed slots to `static: true` only with a matching JSON migration.
6. Validate Theme Editor Add section/Add block, duplicate, reorder, remove,
   block selection, and save behavior.

## Acceptance checks

- The editor never offers an unrelated block in a curated section.
- Gallery offers only Instagram image and one Instagram content card.
- Footer cannot offer slideshow, gallery, product hotspot, or other page blocks.
- A Home section cannot be added to Header, Footer, or Overlay.
- Existing active configuration data remains valid and uses only declared block
  types.
