# Jovie — Theme Submission Optimization Plan

## Objective

Resolve the current submission, performance, accessibility, and release-quality findings while preserving the existing Jovie UI, UX, merchant settings, and section behaviour.

## Guardrails

- Do not change visual design, responsive layout, section order, or existing merchant-facing settings unless a task explicitly requires it.
- Preserve current image ratios, typography, Swiper behaviour, and interaction patterns.
- Prefer conditional loading, safe fallbacks, semantic markup, and asset deduplication over visual rewrites.
- Verify only the pages and behaviours affected by each implementation task.

## Phase 1 — Submission blockers

### 1. Testimonials missing asset

**Finding:** `sections/testimonials.liquid` references `testimonials-selected-icon.png`, but the asset is not present.

**Implementation approach:**

- Replace the fragile asset reference with an existing asset or inline SVG.
- Provide a safe fallback when the merchant has not selected an icon.
- Keep the current testimonial card appearance unchanged.

### 2. Remove Skeleton demo artefacts

**Finding:** The theme still ships the `Hello World` Skeleton section and the associated `shoppy-x-ray.svg` asset.

**Implementation approach:**

- Remove the unused `hello-world` section and its demo asset.
- Confirm no template, section group, or preset references it first.
- Replace the Skeleton README with Jovie documentation as a separate release-hygiene task.

### 3. Add the Contact page H1

**Finding:** The Contact page does not currently expose an H1.

**Implementation approach:**

- Render the page title as the page H1 at the top of the Contact page.
- Preserve the existing heading hierarchy and visual appearance of the Contact form blocks.

### 4. Guarantee image alt attributes

**Finding:** Some decorative and content images on the homepage render without an `alt` attribute.

**Implementation approach:**

- Decorative imagery must explicitly render `alt=""`.
- Content imagery should use Shopify image alt text, with a safe merchant-readable fallback where appropriate.
- Do not change image URLs, image dimensions, or layout.

### 5. Configure real demo imagery for the homepage slideshow

**Finding:** The active homepage slideshow uses generic placeholder slides.

**Implementation approach:**

- Retain branded SVG fallbacks for an unconfigured section.
- Before submission, assign real imagery to the supplied demo configuration.
- Ensure only the first visible hero image receives LCP priority.

## Phase 2 — JavaScript and CSS delivery

### 6. Load product-card JavaScript only where product cards exist

**Finding:** `product-card.js` is currently loaded globally, including pages with no product cards.

**Implementation approach:**

- Load it only when the rendered page contains product cards, or initialize it after a safe idle/visibility condition.
- Retain all quick view, variant, swatch, and hover interactions.

### 7. Split the product-page bundle by interaction

**Finding:** The Product page and Quick view reference a large `product-page.js` bundle.

**Implementation approach:**

- Keep variant selection and add-to-cart code available immediately on product pages.
- Load gallery/lightbox functionality after the gallery is used.
- Load Quick view code only when Quick view is opened.
- Do not alter the product form UI or product purchase flow.

### 8. Load cart feedback only when it is needed

**Finding:** `cart-feedback.js` is included on every page.

**Implementation approach:**

- Initialize the module only on pages that render the relevant cart UI or after the first cart interaction.
- Preserve success/error messages and cart updates.

### 9. Make Swiper assets section-scoped

**Finding:** Swiper base, navigation, and pagination styles are loaded globally even on pages without sliders.

**Implementation approach:**

- Request Swiper CSS/JS only from sections that use Swiper.
- Keep the currently integrated Swiper version and motion settings.
- Avoid duplicate requests when several slider sections exist on one page.

### 10. Deduplicate repeated section CSS

**Finding:** Homepage instances of Collection list can emit the same stylesheet more than once.

**Implementation approach:**

- Deduplicate by asset URL in the `section-stylesheet` helper or its loader.
- Preserve deferred CSS loading for below-the-fold sections.
- Do not consolidate visual CSS rules merely for this task.

### 11. Reduce the critical CSS path carefully

**Finding:** Header-related critical CSS and preloads need a measured review to prevent avoidable FCP/LCP cost.

**Implementation approach:**

- Keep only Header and first viewport requirements in critical CSS.
- Continue deferring below-the-fold section styles.
- Benchmark each change on Home, Collection, and Product before retaining it.

## Phase 3 — Image delivery and LCP

### 12. Apply LCP priority to one correct hero image

**Implementation approach:**

- The first visible slideshow/hero image should be discoverable in initial HTML.
- Use `fetchpriority="high"` and eager loading only for that image.
- Leave all non-LCP media lazy-loaded.

### 13. Keep hover imagery out of mobile transfers

**Implementation approach:**

- Continue loading product secondary images only for devices with `hover: hover`.
- Keep the desktop product-card hover effect intact.
- Do not request secondary card images on touch-only mobile devices.

### 14. Preserve responsive images

**Implementation approach:**

- Retain `srcset`, `sizes`, explicit width, and explicit height for all product and editorial images.
- Use appropriate Shopify CDN widths rather than downloading a fixed oversized rendition.

## Phase 4 — Accessibility, SEO, and production hygiene

### 15. Correct the homepage heading outline

**Finding:** Closed Mega menu content can appear as H3 headings before the homepage H1.

**Implementation approach:**

- Use non-heading semantic elements for decorative/card titles in closed navigation content, styled identically.
- Retain actual page and section headings in the correct hierarchy.

### 16. Standardize modal and drawer close controls

**Implementation approach:**

- Reuse the established Search close-button styling and accessible name pattern.
- Keep `:focus-visible` support while preventing Safari’s default double-outline treatment.
- Cover Search, filters, Quick view, popup, and Offer flyout.

### 17. Configure store metadata

**Implementation approach:**

- Set a real store name, homepage meta description, and page/collection/blog SEO descriptions in Shopify Admin.
- Preserve canonical and Open Graph Liquid logic.

### 18. Release cleanup

**Implementation approach:**

- Remove production debug logging.
- Remove or use orphaned snippets.
- Replace Skeleton repository documentation with Jovie setup, section architecture, deployment, and QA instructions.
- Verify theme metadata (author, documentation URL, support URL) belongs to the Jovie release owner.

## Recommended execution order

1. Testimonials asset, Hello World removal, Contact H1, image alt attributes, real slideshow demo content.
2. Conditional JavaScript loading, Swiper section scoping, repeated stylesheet deduplication.
3. LCP prioritization, responsive image delivery, and measured critical CSS reduction.
4. Heading outline, close control focus behaviour, metadata, and release cleanup.

## Verification after each phase

- Run only scoped checks for changed files and affected pages.
- Smoke test the affected interaction on desktop and mobile.
- For performance phases, compare Home, Collection, and Product with authenticated storefront access; do not benchmark the password page.
- Before submission, run the full Theme Check and the Theme Store Lighthouse benchmark across Home, Collection, and Product on desktop and mobile.

## Submission baseline

Shopify Theme Store requirements require all mandatory criteria to pass. The published performance baseline is an average Lighthouse Performance score of at least 60 and Accessibility score of at least 90 across Home, Collection, and Product pages on desktop and mobile. The Jovie release target should remain higher than this minimum.

Source: <https://shopify.dev/docs/storefronts/themes/store/requirements>
