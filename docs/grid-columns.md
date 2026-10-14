# Columns block contract

`blocks/grid.liquid` keeps the saved `grid` type ID and displays **Columns**.
It allows only the existing `_column` kernel as direct children. Columns owns
column counts, grid spacing, desktop width, mobile swipe and vertical padding;
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
node scripts/migrate-grid-columns.cjs templates/<template>.json
```

The migration maps old shared gaps to both axes, moves tablet counts into explicit
custom breakpoint values, and wraps existing content in Column blocks. Original
content IDs, content settings, order and disabled state are retained. Old middle/
bottom alignment moves into child Group layout instead of remaining a Grid option.
The tablet-to-desktop boundary now follows the reference's 1200px `xl` breakpoint.
Migration is idempotent. Changes affect local JSON only.

Validate with `node --test tests/grid-columns.test.cjs` and full Theme Check.
