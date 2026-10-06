# Default page reference contract

Reference: Shopify editor theme `166302089264`, default page `/pages/gifts`, inspected read-only on 2026-10-06.

The main Page renders the Shopify page title followed by its rich HTML content. Gifts currently has no body content. The title is visible, left aligned on desktop/mobile, uses Heading 2 visual scale and H1 semantics, and has 50px top/bottom section padding. There are no page-specific interactions or item blocks.

Implementation keeps the existing `page` section and its page-only placement. Page title/content are resource-owned, with no replacement merchant text. Layout controls use shared page-width/full-width containers and inherited alignment. Heading scale remains independent from its HTML tag, using Spinel typography tokens. Mobile alignment may override desktop. Appearance keeps the existing scheme ID and adds a blank background override. Padding follows Spinel scaling: desktop 1x, tablet .75x, mobile .5x; independent mobile padding is intentionally omitted under the repository standards.

Children: no static slots, dynamic blocks, or app slots; Add block is absent. Empty body content is omitted, long content wraps, and hiding the title preserves the page body. No JavaScript or instance lifecycle state is needed. Additional editorial sections remain addable through the page template.

Shared-base review: container, typography, scheme and responsive contracts are reused. No cross-repository synchronization is performed or needed for this page-specific implementation.

## Validation

- PASS: `git diff --check`; Shopify accepted targeted upload to unpublished development theme `144448127024`.
- PASS: Theme Check has no findings in `sections/page.liquid` or `locales/en.default.schema.json`. Repository-wide check remains FAIL for existing missing `facet_resource` storefront translations in `_collection-filter` and `_collection-sort`; unrelated warnings also remain.
- PASS: Theme Editor renders default Gifts H1/xl title, blank body, 50px spacing and expected settings. Title hiding removes the title and hides typography controls. Typography selection produces H2/sm. Full width and desktop center alignment update output. Mobile override produces right alignment, 100px top/50px bottom become 50px/25px, with no horizontal overflow. Background override changes both outer wrapper and section surface; scheme selection changes surface tokens. Temporary settings were not saved.
- NOT TESTED: populated long page content and table/media rendering with real merchant data, independent tablet viewport, page-section reorder and save/reload of altered settings.
- Skill validator helper could not start because its installed package lacks `@shopify/theme-check-common`; Shopify CLI Theme Check was used.
- Deployment included `sections/page.liquid` and the full `locales/en.default.schema.json`. The locale file also contained five pre-existing search labels; those were included in the development upload. Their local edits were preserved. No live theme, Git commit/push, or cross-repository sync occurred.
- Port 9292 was free before and after work; no preview watcher was started.
