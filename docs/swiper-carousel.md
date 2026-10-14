# Shared Swiper carousel

The theme exposes a reusable Swiper rendering and lifecycle contract for
slideshow, featured collection, content list, and product media surfaces.

## Separate testimonial and general blocks

The general `carousel` / `slide` pair remains reusable. Only `sections/testimonial-carousel.liquid`
explicitly allows the private `_testimonial-carousel` block, which owns
`testimonial-item` and `_testimonial-slide` children. Private blocks are not
offered through `@theme`, so the testimonial carousel is added directly to its
owning section rather than a general Group.

`carousel-block.js` initializes only `[data-carousel-block]` roots.
`testimonial-carousel.js` initializes only `[data-testimonial-carousel]` roots
and owns testimonial gap synchronization. Both use `carousel-runtime.js` for
Swiper, controls and editor lifecycle, with separate instance state and cleanup.
Each pair has its own schema; testimonial schema excludes gallery/card controls.

The Testimonial: Carousel preset uses the private types. Background and
horizontal testimonial sections keep the general `carousel` / `slide` pair.
For template/group JSON pulled from an older theme, run:

```sh
node scripts/migrate-testimonial-carousel.cjs templates/<template>.json
```

The migration uses private types in `testimonial-carousel` and repairs any
mistaken private types in Background/Horizontal back to common `carousel`/`slide`,
preserving IDs, settings, nested content, disabled state and ordering.
It is idempotent and leaves other section types unchanged. Run common-option
cleanup afterward if repairing a saved private carousel in Background/Horizontal.
Remote theme
configuration must be pulled and migrated before deploying the split.

## Liquid markup

The common Carousel has Layout, Gap, Size, Navigation, Pagination, Autoplay and
Padding controls. Shared column/navigation/pagination/autoplay labels, choices
follow Product List in Featured Collection when the option exists
in the reference. Navigation/Pagination defaults follow the inspected reference. Existing spacing and pause-on-hover IDs remain stable. Gap
range/default and speed validation follow Product List. The reference retains
one desktop column, Outside/Inside navigation and Primary/Secondary/Outline;
Product List-only Top and Icon only choices are excluded. Desktop/mobile column
counts use the standard 768px breakpoint; custom breakpoint columns are removed.
Preview overflow follows the configured desktop column count. Navigation centering subtracts the
pagination padding/size as in Product List.

Navigation Position, Style, Icon and Behavior are visible only when desktop
navigation is enabled. Pagination Type remains visible regardless of device
switches. Desktop top padding (0–70px) and mobile top padding (0–50px) are visible
only for their enabled device. Progress bar exposes Limit width when either
device is enabled; Max width (100–500px, step 10px) additionally requires Limit
width. Bullets never expose width controls. The width cap applies to both devices.

Slide owns child flow, mobile stacking/alignment, fit/fill height, background
image/video, overlay and blur, border thickness, radius, shadow, a block link,
and desktop/mobile padding. Background videos play only while visible and
pause for reduced motion or a hidden tab. The slide root carries editor attributes;
background/overlay layers are decorative, and nested links and controls stay
interactive above the block link. Theme Editor omits the block-link destination.
Slide Gap ranges from 0–50px; Custom corner radius ranges from 0–40px
(default 20px), and Backdrop blur ranges from 0–100px. Image/Video pickers,
overlay color/blur, color scheme and mobile padding follow their owning switches.
Open link in new tab remains visible even with an empty Link.
Vertical layouts inherit desktop alignment on mobile; a horizontal layout can
stack vertically and set its own mobile alignment without changing its position.

The rebuild uses the observed editor behavior of reference theme 139629002837;
the trial theme does not expose source through Shopify CLI. Common Carousel
excludes transition, loop, fraction controls and all
card-specific settings. Slide excludes border style/color, background color,
custom link-label controls and radius/shadow choices absent from the reference.
Only Inherit/Square/Rounded/Custom radius and None/Extra small/Small shadow remain.
Preset and saved template cleanup removes unsupported settings while retaining
block IDs, child content and order. For older pulled JSON, run:

```sh
node scripts/migrate-common-carousel-options.cjs templates/<template>.json
```

Capture direct `.swiper-slide` items and render the shared viewport:

```liquid
{% capture slides %}
  {% for item in items %}
    <article class="swiper-slide content-card">
      {{ item.title }}
    </article>
  {% endfor %}
{% endcapture %}

{% capture pagination %}
  <div class="swiper-pagination" data-swiper-pagination></div>
{% endcapture %}

{% render 'swiper-carousel',
  id: 'FeaturedContent',
  content: slides,
  root_class: 'content-list__carousel',
  aria_label: 'Featured content',
  pagination: pagination
%}
```

The snippet owns the `.swiper` and `.swiper-wrapper` contract. The caller owns
slide markup, controls, pagination markup, and section-specific styling.
Pass `layout: 'grid'` when the same items should render as a responsive grid;
that mode keeps the markup contract but skips Swiper initialization. Set
`--swiper-carousel-grid-columns` and `--swiper-carousel-grid-gap` from the
owning section or block when using grid mode.
Render `swiper-stylesheet` once in the owning section or layout where the
component is used.

The built-in Product List block and Collection Tab block use the same
`product-collection-grid` renderer. Their `grid` option keeps the existing CSS
grid, while `carousel` adds Swiper slide markup and delegates initialization to
`product-collection-carousel.js`.

Autoplay is an opt-in component contract. Pass `autoplay`, `pause_on_hover`,
and `autoplay_delay` to `swiper-carousel`; it exposes the normalized values as
`data-swiper-autoplay`, `data-swiper-autoplay-pause-on-hover`, and
`data-swiper-autoplay-delay` on the Swiper root. The runtime respects reduced
motion preferences, pauses on hover when configured, and uses the delay in
milliseconds.

Navigation buttons use the shared `swiper-nav-button` class with optional
`swiper-nav-button--prev`, `swiper-nav-button--next`, and
`swiper-nav-button--icon-only` modifiers. The icon-only modifier lets the
button fit its rendered SVG instead of using the default navigation control
size. Global
`--swiper-nav-size`, `--swiper-nav-size-mobile`, and `--swiper-nav-icon-size`
control the button and SVG dimensions. The button radius always follows
`--navigation-radius`, while a component may override these variables on its
carousel root when its navigation needs a different scale.

For shared hover navigation, add `swiper-carousel__container` to the wrapper
that contains the Swiper viewport and navigation, then add
`swiper-carousel__navigation--show_on_hover` to the navigation element. On
hover-capable desktop devices, the shared stylesheet fades the buttons in and
slides them inward by half their configured size; touch layouts keep the
controls available without requiring hover.

Pagination consumes Swiper's `--swiper-pagination-progressbar-size` token for
progress bars. Use pagination-specific custom properties on a component when
its colors or bullet sizing need a local override; keep pagination width and
placement in the owning component. Slideshow and hotspot carousel share
`swiper-pagination--overlay` with `swiper-pagination--desktop-left|center|right`
and `swiper-pagination--mobile-left|center|right` alignment modifiers. The section
provides `--swiper-pagination-inline-padding`; overlay controls use 24px desktop
and 16px mobile bottom spacing. Progress bars span this inset at every alignment.
Add `swiper-pagination--below` when the
pagination should flow below the carousel; it provides shared position,
spacing, width, and centering behavior through `--swiper-pagination-spacing`
and `--swiper-pagination-width`. Use
`swiper-carousel__navigation--centered` for overlay controls that should stay
centered on the slide area when below-flow pagination is present; set
`--swiper-navigation-center-offset` to the pagination flow offset.

Bullet buttons use a 24px height by default. Inactive buttons are 24px wide;
the active button is 48px wide. Override the pagination hit-size and hit-width
custom properties on the pagination root when a component needs different
dimensions. Their width tokens are `--swiper-pagination-bullet-hit-width` and
`--swiper-pagination-bullet-active-hit-width`; height uses
`--swiper-pagination-bullet-hit-size`. The `::before` and `::after` layers own
the visible dot and active indicator through the bullet width/height and
active width/height tokens. Override these tokens on the pagination root
instead of resizing or painting the button itself. The fill inherits the button
radius and reveals through a rounded clip-path, following Essen, so autoplay
does not compress the end radius. RTL reveals from the right; reduced motion
shows the complete fill. Optional placement/spacing
tokens intentionally have consumer fallbacks; they are not missing global
settings.

Pass `show_next_slide_preview: true` to `swiper-carousel` when a desktop
carousel should reveal the next item. The shared contract keeps the numeric
`slidesPerView` value at the configured column count and uses the component
viewport's controlled visual overflow to reveal a 15% preview
(`--swiper-carousel-preview-size`), so the visible items retain their
configured column width. The preview is desktop-only and does not affect grid
layouts or mobile slide counts.

Pass `show_next_slide_preview_on_mobile: true` when a one-column mobile
carousel should reveal the next item. The product/collection carousel runtime
uses `slidesPerView: 1.2` at mobile widths; an explicit two-column mobile
setting remains unchanged.

## JavaScript

Use the shared factory from a section or feature module:

```js
import { Pagination } from './swiper-loader.js';
import { bindSwiperControls, bindSwiperSlideControls, createSwiperCarousel } from './swiper-carousel.js';

const root = document.querySelector('[data-content-list]');
const swiper = createSwiperCarousel(root.querySelector('[data-swiper-carousel]'), {
  modules: [Pagination],
  slidesPerView: 1,
  spaceBetween: 16,
  breakpoints: { 768: { slidesPerView: 3 } },
  pagination: { el: root.querySelector('[data-swiper-pagination]'), clickable: true }
});

bindSwiperControls(swiper, {
  scope: root,
  previous: '[data-swiper-previous]',
  next: '[data-swiper-next]'
});

bindSwiperSlideControls(swiper, {
  scope: root.querySelector('[data-slide-navigation]'),
  selector: '[data-swiper-slide-index]',
  activeClass: 'is-active',
  currentValue: 'step',
  scrollActiveIntoView: true
});
```

`createSwiperCarousel` adds the shared A11y module, enables `watchOverflow`,
deduplicates modules, and is idempotent per element. Use
`destroySwiperCarousel` during section unload or component disconnect. The
factory returns the native Swiper instance so existing product/media behavior
can keep using `slideTo`, `slidePrev`, `slideNext`, `update`, and Swiper events.

`bindSwiperSlideControls` provides a reusable indexed-control contract for
year rails, step navigation, or other controls that target a specific slide.
Each button supplies a numeric `data-swiper-slide-index`; the binder delegates
clicks within the supplied scope, updates an optional active class and
`aria-current`, and returns cleanup for editor unloads. `scrollActiveIntoView`
is opt-in and respects reduced-motion preferences.
