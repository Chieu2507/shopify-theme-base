# Quick add media zoom — 2026-10-06

Scope: shared ProductMediaGallery pointer handling for the desktop Quick add image strip. Existing product-media and product-media-lightbox markup, native dialog, Swiper, image zoom, focus restoration, and merchant zoom settings are reused. No schema, translations, layout, breakpoint, media loading, or cross-repository synchronization changes were made.

## Reproduced defect and change

The gallery swipe guard treated movement of at least 4px as a drag, while the Quick add strip accepted clicks until 6px. A complete pointerdown/move/up/click sequence with 4px, 5px, or 5.9px movement therefore suppressed the image click without dragging the strip. A new regression test failed before the fix at 4px. Both handlers now share the strip's 6px threshold. Other gallery modes and lightbox pan retain their existing 4px threshold.

## Validation

- PASS: 9 targeted pointer and pagination tests. Includes full pointer sequences through both controllers, activation of the clicked image, and genuine swipe suppression.
- PASS: JavaScript module syntax and git diff --check.
- PASS: Shopify Theme Check, 0 errors / 34 existing warnings.
- PASS: upload only assets/product-media.js with --nodelete to theme 144448127024, spinel-theme/codex/spinel-chieutt-dev, verified unpublished. No Git push or base sync.
- PASS: native Chrome local fixture using the real shared gallery, Swiper and overlay scripts: dynamic insertion; image 2 and image 3 open matching lightbox slides; close restores focus to the clicked image; repeated removal/insertion and reopening work; high resolution image click activates lightbox zoom (scale 1.6447); no console errors. Proof: /tmp/quickadd-zoom-local-fixture.png (local fixture, not deployed storefront).
- NOT TESTED: actual development storefront and Theme Editor runtime; the permitted browser storefront is password-protected. Existing unsaved editor state was preserved. The reproduced pointer-jitter defect does not establish that every possible cause of the reported deployed symptom is resolved.
- NOT TESTED: mobile native QA, multiple real products/variant changes, and video/model interactions. These paths were not changed.

Shared component and setting coverage audit: PASS WITH FOLLOW-UPS because actual storefront/Theme Editor QA remains unavailable. No new setting or lifecycle ownership was introduced. A separate nested overlay Escape handling concern was observed during source review and left outside this focused change.

Cleanup: no Shopify preview watcher was started. Temporary fixture server stopped; ports 9292 and 9293 have no listener at handoff. No cart or customer state was changed.
