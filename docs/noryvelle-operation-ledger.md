# Noryvelle demo-store operation ledger

> Cập nhật: 25/07/2026
> Store: `noryvelle-fashion.myshopify.com`
> Repository: `cassharper/omniselle-jewelry`
> Branch: `preset-noryvelle`
> Git-connected theme: `omniselle-jewelry/preset-noryvelle` — ID `160312000735`
> Shopify readback: role `MAIN`; development store có password.
> Giới hạn an toàn: quy trình này không publish/unpublish theme, không sửa hoặc xoá
> dữ liệu Omniselle.

## 1. Catalog đã tạo

Tất cả sản phẩm dùng vendor `Noryvelle`, trạng thái `ACTIVE`, option `Color`, inventory
tracking, SKU riêng và tag `noryvelle-v1`. Mỗi color variant có ảnh front được gắn làm
variant media và một ảnh interior cùng màu trong product gallery.

| Product | Product GID | Variant / tồn kho | Giá đặc biệt |
|---|---|---|---|
| Aster Work Tote | `gid://shopify/Product/9453767524575` | Espresso 8; Black 5 | — |
| Vale East-West Tote | `gid://shopify/Product/9453767557343` | Oxblood 5; Taupe 0 | — |
| Lune Shoulder Bag | `gid://shopify/Product/9453767655647` | Ivory 4; Black 6 | — |
| Serein Hobo | `gid://shopify/Product/9453767590111` | Cognac 5; Olive 2 | Olive: 288 / compare-at 360 |
| Orla Crossbody | `gid://shopify/Product/9453767688415` | Burgundy 4; Black 0 | — |
| Miro Camera Bag | `gid://shopify/Product/9453767753951` | Camel 5; Chocolate 6 | — |
| Celeste Mini Bag | `gid://shopify/Product/9453767786719` | Champagne 3; Black 0 | — |
| Nocturne Clutch | `gid://shopify/Product/9453767819487` | Oxblood 0; Black 0 | Product sold out hoàn toàn |
| Aria Top Handle | `gid://shopify/Product/9453767950559` | Ivory 4; Espresso 3 | Espresso: 272 / compare-at 340 |
| Atlas Weekender | `gid://shopify/Product/9453767885023` | Tan 2; Black 1 | Black là low stock |
| Nomad Convertible Backpack | `gid://shopify/Product/9453767917791` | Olive 4; Black 1 | Olive: 408 / compare-at 510; Black low stock |
| Halo Card Wallet | `gid://shopify/Product/9453767852255` | Burgundy 8; Taupe 7 | Taupe: 76 / compare-at 95 |

Readback đã xác nhận:

- 12 product, 24 variant và 48 product image.
- Mỗi product có 2 variant và 4 media item.
- Variant front media ở trạng thái `READY`.
- Có variant còn hàng, sold out, sale và low-stock trong cùng catalog.

## 2. Collections đã tạo

| Handle | Collection GID | Số product |
|---|---|---:|
| `shop-all` | `gid://shopify/Collection/502503538911` | 12 |
| `new-arrivals` | `gid://shopify/Collection/502503571679` | 8 |
| `totes-carryalls` | `gid://shopify/Collection/502503473375` | 3 |
| `shoulder-crossbody` | `gid://shopify/Collection/502503702751` | 4 |
| `evening-bags` | `gid://shopify/Collection/502503604447` | 3 |
| `work-travel` | `gid://shopify/Collection/502503669983` | 5 |
| `wallets-small-leather-goods` | `gid://shopify/Collection/502503866591` | 1 |
| `archive-colours` | `gid://shopify/Collection/502503801055` | 5 |
| `the-noryvelle-edit` | `gid://shopify/Collection/502503768287` | 6 |

Mỗi collection dùng smart rule theo vendor/tag và có collection image Noryvelle. Collection
`frontpage` có sẵn được giữ nguyên.

## 3. Product metafields

Đã tạo, pin và populate đủ 11 definition dưới namespace `custom` cho cả 12 product:

- `summary`
- `silhouette`
- `occasions`
- `capacity`
- `dimensions`
- `what_fits`
- `strap_carry`
- `material`
- `care`
- `hardware`
- `carry_edit_routes`

Readback đã xác nhận 132 value, tương ứng 11 value trên mỗi product.

Standard definition `Complementary products` đã tồn tại trên store:

- Namespace/key:
  `shopify--discovery--product_recommendation.complementary_products`
- Type: `list.product_reference`
- Đã populate và readback đủ 12 product; mỗi product có 2–3 sản phẩm phối cùng.
- Gợi ý mua kèm không dùng Nocturne đã sold out làm target; Nocturne vẫn có ba
  target còn hàng để PDP sold-out không kết thúc hành trình khám phá.

## 4. Storefront filters

Search & Discovery đã có sẵn trên store khi kiểm tra lại; không có thao tác cài app
trong quy trình này. Đã thêm và readback đủ 9 filter:

| Label | Source |
|---|---|
| Availability | Standard |
| Price | Standard |
| Bag silhouette | Product metafield |
| Capacity | Product metafield |
| Color | Product option |
| Hardware finish | Product metafield |
| Material | Product metafield |
| Occasions | Product metafield |
| Product type | Standard |

Storefront smoke xác nhận filter drawer có value/count thật và filter
`Occasions = Workday` trả đúng 6 product.

## 5. Pages, blog và navigation

Pages đã publish:

| Page | Handle | Template suffix | GID |
|---|---|---|---|
| About Noryvelle | `about-noryvelle` | `about` | `gid://shopify/Page/132972052703` |
| Materials & Care | `materials-care` | `materials-care` | `gid://shopify/Page/132972085471` |
| Shipping & Returns | `shipping-returns` | `shipping-returns` | `gid://shopify/Page/132972118239` |
| FAQ | `faq` | `faq` | `gid://shopify/Page/132972151007` |
| Contact Noryvelle | `contact` | `contact` | `gid://shopify/Page/132970971359` |

Blog `Journal` — `gid://shopify/Blog/104771092703` — có ba article:

- `choosing-a-work-bag-by-the-way-you-move` — `gid://shopify/Article/617932718303`
- `hardware-as-jewelry` — `gid://shopify/Article/617932751071`
- `a-care-ritual-for-leather` — `gid://shopify/Article/617932783839`

Main menu `gid://shopify/Menu/258041250015` — handle `main-menu` — có sáu top-level:

- `New arrivals`
- `Bags`
- `Work & travel`
- `Carry Edit`
- `Materials`
- `Journal`

`Bags` giữ năm child link: Shop all, Totes & carryalls, Shoulder & crossbody,
Evening bags và Wallets & small leather goods. Hai top-level trùng `Evening` và
`Accessories` đã được bỏ khỏi menu, không xoá collection. Footer menu
`gid://shopify/Menu/258041282783` — handle `footer` — giữ service pages, Journal và
link hệ thống `Your Privacy Choices`.

## 6. Media editorial

- Product và collection media: ảnh AI gốc Noryvelle, không sao chép trực tiếp ảnh
  Omniselle.
- Homepage hero `noryvelle-workday-hero.png`:
  `gid://shopify/MediaImage/41453212434655`.
- Homepage hero `noryvelle-after-dark-hero.png`:
  `gid://shopify/MediaImage/41453211353311`.
- Shop The Look composition `noryvelle-commuter-edit-v2.png`:
  `gid://shopify/MediaImage/41453295206623` — readback `READY`, 1122×1402.
- Material study `noryvelle-material-study-v2.png`:
  `gid://shopify/MediaImage/41453295337695` — readback `READY`, 1122×1402.
- Editorial video local:
  `docs/noryvelle-assets/editorial/noryvelle-carry-edit-film.mp4`.
- Shopify video: `gid://shopify/Video/41453168623839`.
- Filename trong Shopify Files: `noryvelle-carry-edit-film.mp4`.
- Readback: `READY`, 12.5 giây, có MP4 480p, MP4 720p và HLS.
- Homepage binding:
  `shopify://files/videos/noryvelle-carry-edit-film.mp4`.

## 7. Theme, install-state và sync

- Root templates hiện là composition Noryvelle Bags cho demo store.
- Install-state Jewelry:
  `listings/omniselle/templates/` và `listings/omniselle/sections/`.
- Install-state Bags:
  `listings/noryvelle/templates/` và `listings/noryvelle/sections/`.
- Shared source vẫn nằm trong `sections/`, `snippets/` và `assets/`.
- Section riêng của Bags: `sections/carry-edit.liquid`.
- `config/settings_data.json` có đủ hai named theme-style preset:
  `Omniselle` và `Noryvelle`; cả hai dùng schema ID hiện hành và không chứa
  resource/runtime setting.
- Noryvelle system templates đã được hoàn thiện cho 404, password, generic page,
  list collections, search, FAQ, article và cart.
- About, Materials & Care và Shipping & Returns đã được nâng từ single hero thành
  multi-section composition trong cả root và `listings/noryvelle`.
- Carry Edit install-state có 8 exact route và 8 wildcard route; enumeration local
  xác nhận 400/400 tổ hợp có compatible route và cả 16 route đều reachable.
- Root và `listings/noryvelle` khớp tại checkpoint; `listings/omniselle` vẫn giữ
  snapshot Jewelry từ checkpoint `168572f`.
- Core checkpoint commits đã push:
  - `205c59a` — `feat: build Noryvelle bags preset`
  - `6032904` — `fix: polish Noryvelle header`
  - `ab37cc6` — `fix: clean Noryvelle journal intro`
  - `50bf80f` — `fix: keep desktop navigation on one line`
  - `a66f2ce` — `fix: balance Noryvelle header columns`
  - `f264b3a` — `feat: complete Noryvelle preset build`
  - `97f3260` — `docs: record Noryvelle completion checkpoint`
- GitHub integration event ngày 25/07/2026 lúc 12:05 PM EDT:
  `30 succeeded, 20 warnings, 0 failed`, kết thúc bằng `Theme updated!`.
  Warnings chỉ là `docs/**` và `listings/noryvelle/**` bị ignored, đúng với việc
  Shopify runtime chỉ đồng bộ các theme directory chuẩn ở root.
- Header storefront dùng text fallback `Noryvelle`, sáu desktop link nằm trên một
  hàng ở viewport smoke-test và mega menu `Bags` render đủ năm child link/hai promo;
  không còn request tới hai asset wordmark Omniselle không tồn tại.
- Không có mutation publish hoặc unpublish. Shopify báo theme ID `160312000735` có
  role `MAIN`; store vẫn password-protected.

## 8. Baseline smoke-test trước đợt build hoàn chỉnh

- Homepage desktop: ảnh AI, copy, product tabs, collection cards, Carry Edit,
  Shop The Look, material story và video render.
- Responsive mobile: wordmark text, menu trigger, search results và cart layout render.
- Carry Edit phiên bản baseline: exact match, closest curated edit và Start again
  hoạt động; enumeration cũ xác nhận 400/400 tổ hợp có result và 8 path reachable.
- Collection: đủ 12 product; sale, sold-out và variant swatch hiển thị.
- Filters: đủ 9 source; Workday trả 6 product.
- PDP Aster: 4 media, đổi variant cập nhật Color/SKU/stock, accordion What fits có
  dữ liệu.
- PDP Nocturne: 4 media, hai variant hết hàng và CTA Sold out bị disable.
- Search `bag`: 8 kết quả, gồm sale và sold-out state.
- Cart drawer và cart page: thêm Aster thành công; variant, quantity, total và
  Complete with render.
- About và Journal render; intro Journal đã loại bỏ HTML literal.
- Theme Editor baseline tải đủ header, 12 homepage section và 8 Carry Edit block.
- GitHub sync không có file failed.

Các kết quả trên là mốc baseline trước khi bổ sung wildcard routing, named preset,
system templates, complementary products và ba service/brand composition mới. Đợt
build hiện tại chỉ dùng kiểm tra hẹp trên file thay đổi; chưa được ghi là QA chéo.

Readback sau checkpoint build:

- Theme list báo `Last saved: Just now` cho theme ID `160312000735`.
- Theme Editor tải đủ 16 Carry Edit block, ba Shop The Look hotspot đúng Aster/Halo/Orla
  và material story mới; trạng thái editor `Success Complete`.
- Đây là deployment/readback của build, không thay thế smoke-test tương tác hoặc QA
  chéo ở giai đoạn sau.

## 9. Việc còn chờ

- Nếu được chủ store xác nhận, lưu thêm Refund, Shipping và Terms trong Shopify
  Policies; API connector hiện chỉ có quyền đọc policy.
- Smoke-test độc lập Omniselle Jewelry và đối chiếu Jewelry demo store với
  `listings/omniselle`.
- Kiểm tra ma trận keyboard/focus, empty data, missing media, reduced motion và
  localization cho cả hai preset.
- Chỉ sau đó mới merge release, cập nhật version/release notes, package ZIP và chạy
  submission verification đầy đủ khi được yêu cầu.

## 10. Ranh giới rollback

- Không chạy xoá tự động.
- Catalog Noryvelle có thể nhận diện bằng vendor `Noryvelle`, tag `noryvelle-v1`, các
  handle trong ledger và GID ở trên.
- Nếu cần rollback theme, checkout commit trước milestone trên branch hoặc ngắt
  Git-connected theme khỏi commit mới; không rollback bằng cách sửa Jewelry demo store.
- Việc xoá product, collection, page, blog, file hoặc app phải được chủ store xác nhận
  riêng trước khi thực hiện.
