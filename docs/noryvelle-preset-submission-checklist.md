# Checklist xây dựng và submit preset Noryvelle

> **Trạng thái cập nhật — 25/07/2026:** Đã push checkpoint build hoàn chỉnh preset
> Noryvelle Bags và readback thành công trên Git-connected theme; chưa chuyển sang
> QA chéo Omniselle ↔ Noryvelle. Trước đợt này đã build và push preset nền,
> tạo install-state hai preset, populate demo store với 12 product/24 variant/48 ảnh,
> upload video editorial và cấu hình đủ 9 storefront filter. Homepage, Carry Edit,
> collection, PDP, sold-out PDP, search, cart, Journal và Theme Editor đã qua
> smoke-test có phạm vi hẹp. Shopify đang báo theme Git-connected ID `160312000735`
> là `MAIN` trên development store có password; trong quy trình này không có thao tác
> publish hoặc unpublish.

## 1. Chốt mốc ổn định của preset Jewelry

- [ ] Xác nhận Gift Omniselle, homepage Jewelry và PDP Jewelry đang ở trạng thái mong muốn.
- [x] Kiểm tra branch và các file chưa commit; chỉ stage phần thay đổi thuộc checkpoint này.
- [x] Tạo checkpoint `168572f` (`docs: add Omniselle preset planning materials`) trên `main`; commit chỉ chứa bốn tài liệu kế hoạch, không có thay đổi theme code.
- [ ] Ghi lại branch hiện tại, cách deploy và URL demo store Jewelry.

## 2. Tạo branch cho preset mới

```bash
git switch -c preset-noryvelle
```

- [x] Tạo và push branch `preset-noryvelle` từ checkpoint Jewelry; branch đang theo dõi `origin/preset-noryvelle`.
- [x] Giữ nguyên codebase Omniselle hiện tại; không tạo Skeleton theme mới và không nhân bản repository.
- [x] Dùng `sections/`, `snippets/` và `assets/` hiện có làm nền tảng dùng chung; chưa sửa source code ở bước khởi tạo này.
- [x] Chỉ thêm section riêng cho Fashion khi logic hoặc nội dung thực sự chỉ dành cho Fashion: `carry-edit.liquid`.

## 3. Tạo demo store Fashion Bags

- [x] Tạo development store `noryvelle-fashion` cho Fashion Bags.
- [x] Kết nối GitHub repository `cassharper/omniselle-jewelry`, branch `preset-noryvelle` vào theme `omniselle-jewelry/preset-noryvelle` (ID `160312000735`).
- [x] Ghi nhận trạng thái Shopify readback: theme có role `MAIN`, store là development store có password; không chạy mutation publish/unpublish.
- [x] Không sửa demo store Jewelry trong lúc phát triển preset Fashion; mọi store mutation trong ledger đều nhắm `noryvelle-fashion`.
- [x] Chỉ dùng asset Fashion có nguồn rõ ràng: bộ ảnh/video AI gốc Noryvelle, không sao chép trực tiếp media Omniselle.

## 4. Xác định trải nghiệm Noryvelle Bags trước khi code — đã chốt

- [x] Industry: `Bags` — catalog demo tập trung handbag, tote, shoulder bag, clutch và wallet.
- [x] Catalog mục tiêu: `Some (11–100+)`; build tối thiểu 12 product Bags thật trước khi chọn tag này trên listing.
- [x] Tên preset: `Noryvelle`; kiểm tra tên lần cuối trước khi upload package.
- [x] Tagline: `Editorial bags for modern wardrobes and meaningful accessories.`
- [x] Customer journey chính:

```text
Occasion → Bag silhouette → Capacity & carry mode → Color / hardware → Curated carry edit
```

- [x] Chốt 4 Carry Edit route; mỗi route sẽ map 3–6 product thật khi demo catalog được tạo:

| Route | Nhu cầu chính | Bag edit hướng đến |
|---|---|---|
| Workday | Laptop 13 inch, tài liệu, quai vai | Structured tote / work bag |
| Off duty | Essentials nhẹ, đeo rảnh tay | Shoulder bag / crossbody |
| After dark | Phone, card, một vài essentials | Mini bag / clutch |
| In transit | Laptop 16 inch hoặc đồ cho chuyến đi ngắn | Large tote / weekender |

- [x] Chốt taxonomy để dùng cho menu, collection và filter: silhouette, occasion, capacity, color, material và hardware.
- [x] Chốt data contract Bags: dimensions, what fits, capacity, strap/carry options, material, care, hardware, style-it-with products, color/finish variant, compare-at price, availability và variant media.
- [x] Inventory section dùng lại: `header.liquid`, `slideshow.liquid`, `video-banner.liquid`, `featured-collection.liquid`, `collection-list.liquid`, `collection-showcase.liquid`, `gallery.liquid`, `shop-the-look.liquid`, `product-main.liquid`, `product-recommendations.liquid`, `product-card.liquid` và product media gallery.
- [x] Section mới bắt buộc: `carry-edit.liquid`. Chỉ tạo `product-bag-details.liquid` nếu accordion group trong `product-main.liquid` không thể hiển thị data contract Bags theo cách merchant quản lý được.
- [x] Quy tắc UX cho Carry Edit: desktop có step state rõ ràng; mobile hiển thị một câu hỏi tại một thời điểm; keyboard và Theme Editor block selection điều khiển cùng active state; tổ hợp chưa curate phải có fallback rõ ràng.

## 5. Xây preset Noryvelle

- [x] Tạo navigation Bags: sáu top-level `New arrivals`, `Bags`, `Work & travel`, `Carry Edit`, `Materials`, `Journal`; `Evening bags` và `Wallets & small leather goods` nằm trong mega menu `Bags`.
- [x] Tạo homepage composition theo phong cách editorial bags, trong đó túi là catalog chính và trang sức/phụ kiện là phần hoàn thiện styling.
- [x] Build `carry-edit.liquid` là section riêng cho Bags: chọn occasion, silhouette, sức chứa và finish để nhận bag edit phù hợp; không đổi nhãn hoặc dữ liệu Gift Omniselle theo cách làm sai ngữ nghĩa field.
- [x] Hoàn thiện Carry Edit bằng weighted wildcard routing: 8 exact route + 8
  wildcard route, 400/400 tổ hợp có compatible result và cả 16 route reachable.
- [x] Cấu hình Search & Discovery và readback trên storefront với 9 filter: Availability, Price, Bag silhouette, Capacity, Color, Hardware finish, Material, Occasions và Product type.
- [x] Cấu hình PDP Bags mặc định:
  - [x] Dimensions & what fits
  - [x] Strap / carry options
  - [x] Material & care
  - [x] Style it with / Complete the look
- [x] Tăng cường Shop The Look để liên kết túi với trang sức/phụ kiện; storefront DOM/readback xác nhận ba product hotspot dùng đúng handle, còn tương tác mobile chuyên biệt nằm trong ma trận QA bước 8.
- [x] Tái sử dụng product card, gallery, video, collection, testimonial, blog và color system hiện có khi đáp ứng yêu cầu.
- [x] Kiểm tra binding hẹp cho các setting Noryvelle dùng trong root/install-state; Theme Editor đọc đúng composition và các block đại diện.

## 6. Populate demo Fashion Bags

- [x] Tạo product, variant và collection Bags thật; túi chiếm đa số catalog để khớp industry `Bags`.
- [x] Thêm dữ liệu cần cho filter, PDP và Carry Edit: silhouette, dimensions, capacity/what fits, strap, màu, hardware, chất liệu, care và sản phẩm phối cùng.
- [x] Populate standard complementary-product reference cho cả 12 product; readback
  xác nhận mỗi product có 2–3 target và không recommend Nocturne sold out.
- [x] Áp dụng contract commerce cho 12 product demo Bags:
  - [x] Mỗi product có 2 color variant có ý nghĩa; không tạo variant kích thước giả.
  - [x] Mỗi variant có SKU, giá và trạng thái tồn kho riêng; Vale Taupe, Orla Black và Celeste Black sold out nhưng product còn mua được; Nocturne sold out hoàn toàn.
  - [x] Dùng `compare_at_price` có chủ đích cho Serein Olive, Aria Espresso, Nomad Olive và Halo Taupe.
  - [x] Mỗi color variant có featured front media và interior media cùng màu; readback xác nhận variant front media `READY`, còn storefront smoke xác nhận đổi variant cập nhật Color, SKU và tồn kho.
  - [x] Catalog readback có đủ full price, sale, low-stock và sold out; storefront smoke trực tiếp xác nhận các trạng thái đại diện trên collection, search, PDP và cart.
- [x] Thêm collection image, product image, video và blog content có nguồn asset hợp lệ.
- [x] Hoàn thiện homepage, collection page, product page, cart, search, FAQ/contact và policy/service page.
- [x] Hoàn thiện multi-section composition cho About, Materials & Care và Shipping
  & Returns trong root/install-state.
- [x] Hoàn thiện branded system templates: 404, password, generic page, list
  collections, search, FAQ, article và cart.
- [x] Thay toàn bộ composition demo Jewelry trong store Noryvelle bằng nội dung Bags phù hợp.
- [x] Không dùng app hoặc UI nhúng trong ảnh để tạo cảm giác theme có chức năng mà theme không tự cung cấp.

## 7. Tạo install state cho nhiều preset

- [x] Tạo `listings/omniselle/templates/` cho install state Jewelry.
- [x] Tạo `listings/noryvelle/templates/` cho install state Fashion.
- [x] Chỉ thêm thư mục `sections/` riêng trong từng preset khi header/footer section group khác nhau.
- [x] Giữ source section dùng chung ở ngoài `/listings`.
- [x] Thêm named theme-style preset `Omniselle` và `Noryvelle` trong
  `config/settings_data.json`; không chứa resource/runtime setting.
- [x] Noryvelle root templates và `listings/noryvelle` khớp byte-for-byte tại
  checkpoint build; install-state có 16 Carry Edit route.
- [x] Readback Theme Editor của checkpoint build hoàn chỉnh: 16 Carry Edit block,
  Shop The Look đúng ba product và material story mới; Git integration
  `30 succeeded, 20 warnings, 0 failed`.
- [ ] Chạy smoke-test độc lập Omniselle và đối chiếu `listings/omniselle` với Jewelry demo store trước khi merge release.

## 8. Test từng preset độc lập

### Omniselle Jewelry

- [ ] Home, collection, product, search và cart hoạt động với dữ liệu Jewelry thật.
- [ ] Gift Omniselle map từng gift path đến đúng gift edit.
- [ ] Copy, collection và personalization link của Jewelry đều đúng.

### Noryvelle Fashion Bags

- [x] Home, collection, product, sold-out product, search, cart, About và Journal hoạt động với dữ liệu Bags thật.
- [x] Carry Edit baseline storefront smoke xác nhận exact match, closest curated edit
  và Start again; build mới đã enumeration 400/400 compatible result và 16/16 route
  reachable, còn chờ readback storefront sau push.
- [x] Filter drawer hiển thị đủ 9 source và áp dụng Workday trả đúng 6 product; PDP hiển thị dimensions/what-fits/strap/material-care, variant/SKU/stock; Shop The Look, cart Complete with và navigation dùng đúng handle.

### Cả hai preset

- [ ] Kiểm tra desktop, mobile và Theme Editor cho cả hai preset. Noryvelle đã smoke desktop/mobile và Theme Editor; Omniselle còn chờ.
- [ ] Kiểm tra keyboard, focus, empty data, missing media, reduced motion và localization.
- [x] Trong quá trình build, chỉ chạy các check/validation hẹp cần cho file vừa thay đổi.
- [ ] Chỉ chạy full Theme Store submission verification khi cả hai preset đã hoàn thiện.

## 9. Chuẩn bị phát hành

- [x] Tạo và push các commit độc lập trên `preset-noryvelle`: `205c59a` (preset), `6032904` (logo/mega menu), `ab37cc6` (Journal), `50bf80f` và `a66f2ce` (header desktop).
- [x] Tạo checkpoint build hoàn chỉnh `f264b3a`
  (`feat: complete Noryvelle preset build`).
- [x] Push checkpoint tài liệu `97f3260`
  (`docs: record Noryvelle completion checkpoint`); Shopify Git integration kết thúc
  bằng `Theme updated!`.
- [ ] Chỉ merge vào release branch khi hai demo store và hai install state đã khớp.
- [ ] Cập nhật version và release notes.
- [ ] Package một ZIP chứa cả hai preset.
- [ ] Submit một Theme Store submission, nhưng điền listing information và demo-store URL riêng cho Omniselle và Noryvelle.

## Ghi nhận bài học sau milestone

Sau khi hoàn thành preset Noryvelle, chỉ cập nhật `docs/shopify-theme-learning-loop.md` với bài học đã được kiểm chứng. Mỗi bài học phải có: nguyên nhân gốc, cách sửa được giữ lại, rủi ro regression và phạm vi áp dụng.
