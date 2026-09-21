# Shared overlays

## Ownership

- `snippets/component-overlay.liquid`: native dialog shell, optional title,
  accessible label, close control, drag handle and scrollable body.
- `assets/component-overlay.css`: popup/drawer/sheet geometry, spacing, radius,
  backdrop and motion. Uses existing Theme Settings tokens.
- `assets/component-overlay.js`: open/close state, Escape/backdrop, focus return,
  interrupted transitions, reduced motion and reusable `SheetGesture`.
- Feature controllers own only content, forms, variants and trigger wiring.

Popup blocks, Pickup availability, back-in-stock Notify and Size chart render
this same shell. Native `showModal()` places them in the browser top layer;
dialogs marked with `append_to_body` are portaled to `document.body` before
opening so Product Details transforms and overflow cannot clip them. The
controller remembers the original location and restores it during teardown.

Cart order options and Localization retain their existing commerce/navigation
shells. They consume the shared sheet radius/header classes and `SheetGesture`
through adapters; their existing open/close and focus controllers remain.
The main Cart drawer, Search and product media viewer are not native-shell
migrations in this change. Do not describe them as migrated to the new snippet.

## Contract

Capture body markup and render `component-overlay` with a unique `id`, `label`
and `content`. Optional parameters are documented in its LiquidDoc. Omit `title`
for a headerless layout (Contact/Pickup); close and mobile drag affordances remain.
Feature CSS may style body content, but must not recreate panel dimensions,
padding, transitions, backdrop, header, close control or radius.

```js
const overlay = window.ThemeOverlay.get(dialog);
overlay.open({ opener: trigger });
overlay.close();
// On section removal:
overlay.destroy();
```

Desktop uses `popup` (scale .95 → 1 + fade) or `drawer` (slide from right).
Mobile through 767.98px uses `bottom_sheet` (slide from bottom) or `drawer`.
All modes use the global motion and backdrop tokens. Sheets are content-height
with a viewport cap, common top corner radius, safe-area padding, and a
scrollable body. Dragging starts only on the header/handle, not form controls.

## Validation

Run `node --test tests/component-overlay.test.cjs` for controller regressions.
`tests/overlay-fixture.html` is a manual native-dialog fixture with the real
component CSS/JS; its output records opening transforms and backdrop opacity.
It does not render Liquid or replace storefront/Theme Editor QA.

Before release verify the actual theme at mobile, 768px and desktop: popup
animation, drawer animation, drag/cancel, Escape, backdrop, Tab confinement,
focus return, long content scroll, sticky PDP position and reduced motion.
In Theme Editor verify add/remove/duplicate/reorder/select/save/reload, all
existing desktop/mobile layout settings, and variant-dependent pickup/Notify.
