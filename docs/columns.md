# Columns block contract

`blocks/columns.liquid` uses the `columns` type ID and displays **Columns**.
It allows only the dedicated `_columns-column` kernel as direct children. Columns owns
column counts, column spacing, desktop width, mobile swipe and vertical padding;
Column owns content flow and presentation. Do not reintroduce tablet/alignment
or left/right padding controls to the parent.

The option inventory follows the observed Columns block in reference theme
139629002837: desktop 2–6 (default 4), mobile 1–2 (default 1), mobile swipe,
Custom columns, horizontal/vertical gaps, desktop Fill/Custom width and top/bottom
padding with mobile overrides. `Columns per breakpoint` is visible only when
Custom columns is enabled; Custom width only for Custom; vertical mobile gap is
hidden while swipe is enabled; mobile padding appears only under Custom for mobile.
Desktop gaps range 0–100px; mobile gaps 0–50px; custom width 10–100%.

The hidden branches were checked directly in the reference editor: Custom columns
reveals Columns per breakpoint; Custom desktop width reveals a 50% default range;
Custom for mobile reveals Top (mobile) and Bottom (mobile), both defaulting to 0;
enabling mobile swipe hides Vertical (mobile). Reference values were restored
after inspection without saving.

Custom columns accepts comma-separated `xs`, `sm`, `md`, `lg`, `xl`, `xxl` values
at 0/576/768/992/1200/1400px. Values must be integers 1–50 (the Shopify block
capacity); malformed values and unknown breakpoint names are ignored. Later
duplicate entries win. Missing mobile overrides fall back to mobile columns;
desktop overrides fall back to desktop columns and inherit through larger
breakpoints. Custom values are emitted as numeric scoped CSS variables only.

Mobile swipe uses native horizontal scrolling, scroll snap and keyboard focus,
without JavaScript. It is disabled by CSS from 768px onward. Desktop Custom width
never shrinks the mobile container. Vertical mobile gap does not affect swipe.

Before deploying to saved templates, run:

```sh
node scripts/migrate-columns.cjs templates/<template>.json
```

The migration maps old shared gaps to both axes, moves tablet counts into explicit
custom breakpoint values, and wraps existing content in Column blocks. Original
content IDs, content settings, order and disabled state are retained. Old middle/
bottom alignment moves into child Group layout instead of remaining a Grid option.
The tablet-to-desktop boundary now follows the reference's 1200px `xl` breakpoint.
Migration is idempotent. Changes affect local JSON only.

Validate with `node --test tests/columns.test.cjs` and full Theme Check.

## Column contract

Adding a Column creates Image → Heading → Text → Button, matching the reference
composition with original copy. Its preset uses vertical direction, left alignment,
Fit height and 8px desktop/mobile gaps. Adding Columns creates four such columns
with matching Heading titles, original descriptions and Button label buttons. Preset changes apply to
new blocks; existing merchant content is retained.

`blocks/_columns-column.liquid` is the dedicated child of Columns. Row/Footer
continue using `_column`. Columns owns track width; its Column exposes no width
control. Column owns direction, alignment/position, gaps (default 8px), Fit/Fill
height, border, radius (including Custom), five shadow choices, background
image/mobile image/video, overlay color/blur, inherited/scheme color, block link
and all four padding edges with mobile overrides.

Horizontal direction reveals Position, horizontal Alignment (including Space
between), Vertical on mobile, and conditional Alignment (mobile). Vertical
Position is visible only with Fill height. Custom radius, image/mobile image,
video, overlay color/blur, scheme, and mobile padding each use their respective
`visible_if` branch. Image uses the shared responsive media renderer; background
video uses an idempotent module that pauses offscreen and with reduced motion.
Block links remain siblings of interactive child content, with editor navigation
suppressed. No nested anchors are introduced.

## Change history — 2026-10-14

- `0c7639ba`: initial Grid rebuild displaying Columns while retaining `grid`.
- Follow-up: rename runtime type/file to `columns`, CSS hooks to `block-columns`,
  CSS variables/locales/tests/docs to Columns, and migrate saved template types
  and local block IDs. Retire `blocks/grid.liquid`.
- Replace direct `_column` children with `_columns-column`, based on the reference
  Column editor, including hidden settings. Preserve existing content IDs/order,
  disabled state, explicit gaps and padding (legacy child gaps above 50px are clamped to the
  reference range). Shared `_column` remains for Row.
- Migration entry point is now `scripts/migrate-columns.cjs`; it accepts legacy
  `grid` and current `columns` and is idempotent. Run it on any saved remote JSON
  before deploying this rename. This local change does not migrate store data.
- Reference theme 139629002837 was inspected without saving; Save was disabled
  after restoring the tested options.

Validation: seven Columns tests pass, covering migration idempotency, hidden
branches, zero gaps, integer-only breakpoints, surface rendering, editor links
and mobile padding. JavaScript syntax and diff whitespace checks pass. Full
Theme Check reports no errors and six existing warnings in unrelated files.
Storefront/Theme Editor runtime QA of the rebuilt local code is still pending.
