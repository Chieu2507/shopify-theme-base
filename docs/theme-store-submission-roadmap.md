# Omniselle — Theme Store submission roadmap

> Mục tiêu: biến Omniselle thành một theme có khác biệt **ở cấp độ trải nghiệm và kiến trúc**, đủ rõ ràng để trình bày khi submit Shopify Theme Store. Không xem việc đổi màu, font, animation hoặc thêm vài section là điểm khác biệt cốt lõi.

## Định vị đề xuất

**Omniselle** là theme editorial commerce cho fine jewelry, personalized jewelry và meaningful gifting. Theme giúp merchant chuyển cảm hứng thị giác thành hành trình mua hàng rõ ràng qua khám phá theo dịp tặng quà, sản phẩm cá nhân hoá và các bộ trang sức có thể phối cùng nhau.

### Điểm khác biệt cần xây thành hệ thống

1. **Jewelry Discovery System** — khách tìm sản phẩm theo dịp, người nhận, loại trang sức, chất liệu, stone/birth month và ngân sách.
2. **Build Your Stack / Complete the Look** — khách phối một set trang sức tương thích, thấy tổng giá và có thể thêm nhiều món vào cart.
3. **Personalization workflow** — engraving, gift message, packaging, lead time và chính sách riêng của sản phẩm cá nhân hoá được hiển thị nhất quán.
4. **Jewelry facts từ metafields** — thông tin metal, stone, dimension, chain length, care, certification và size được chuẩn hoá, tái dùng trên PDP, cards, collection và finder.

Các hệ thống trên phải cùng dùng một data model và xuất hiện ở nhiều template. Đây là phần làm Omniselle khó tái tạo chỉ bằng cách chỉnh setting của một theme khác.

---

## Phase 0 — Chuẩn bị submission (làm trước)

### 0.1 Chốt phạm vi v1

- [ ] Chỉ chọn một tập merchant chính: **fine jewelry và personalized gifting**.
- [ ] Viết một câu value proposition: “From meaningful gift discovery to a finished jewelry stack.”
- [ ] Chọn 2 preset có use case khác nhau:
  - [ ] `Omniselle`: fine jewelry / editorial collections.
  - [ ] `Heirloom`: personalized gifts / engraving / milestones.
- [ ] Không dùng “Jewelry”, “Fashion”, “Shopify”, tên công ty hay tên tính năng làm tên preset/theme.
- [ ] Kiểm tra `Omniselle` và `Heirloom` không trùng tên theme/preset đang có trên Theme Store trước khi upload.

### 0.2 Dọn package và demo state

- [ ] Tạo thư mục `/listings` theo cấu trúc Shopify yêu cầu; mỗi preset cần có template cài đặt và thể hiện đúng demo tương ứng.
- [ ] Đảm bảo preset install state có nội dung demo hợp lý ngay cả khi demo image không được chuyển sang store cài đặt.
- [ ] Thay toàn bộ copy mâu thuẫn hoặc quá chung chung bằng nội dung nhất quán với fine jewelry/gifting.
- [ ] Rà các link, collection handle, product handle và page references trong `templates/*.json`; không để CTA rỗng ở demo quan trọng.
- [ ] Kiểm tra `config/settings_schema.json`: theme name, version, author và documentation/contact details phải là dữ liệu phát hành thực tế.

**Done khi:** cài theme mới có hai preset rõ ràng, không vỡ layout, không có placeholder/copy sai ngữ cảnh ở các trang demo chính.

---

## Phase 1 — Data model cho jewelry (nền tảng của khác biệt)

Tạo definitions trong Shopify Admin trước, sau đó theme chỉ đọc data. Tránh hard-code thông tin vật liệu và tương thích vào Liquid.

### Product metafields đề xuất

| Namespace/key | Kiểu | Dùng cho |
| --- | --- | --- |
| `custom.jewelry_type` | Single line text / list | Necklace, ring, earring, bracelet; finder và filter |
| `custom.metal` | List of single line text | Gold type, silver, vermeil; filters và facts |
| `custom.gemstone` | List of single line text | Stone/birthstone; finder và facts |
| `custom.birth_month` | List of single line text | Birthstone discovery |
| `custom.occasion` | List of single line text | Birthday, anniversary, bridal, self-gift |
| `custom.recipient` | List of single line text | Partner, mother, friend, bridal party |
| `custom.price_band` | Single line text | Finder budget shortcut (không thay price filter) |
| `custom.stack_group` | Single line text | Nhóm sản phẩm có thể phối |
| `custom.stack_position` | List of single line text | Ring stack, ear stack, layered necklace |
| `custom.compatible_products` | List of product references | Complete the look / stack builder |
| `custom.personalizable` | Boolean | Điều kiện hiển thị personalization |
| `custom.personalization_note` | Rich text | Hướng dẫn engraving/message |
| `custom.personalization_lead_time` | Single line text | Thời gian xử lý riêng |
| `custom.metal_details` | Rich text | Material facts |
| `custom.stone_details` | Rich text | Stone facts/certification |
| `custom.dimensions` | Single line text | Kích thước |
| `custom.chain_length` | Single line text | Dây chuyền |
| `custom.care` | Rich text / page reference | Care information |

### Việc cần làm

- [ ] Chốt naming/values taxonomy; không tạo giá trị tự do như `Gold`, `gold`, `14K Gold` cho cùng một khái niệm.
- [ ] Nhập data cho ít nhất 24–40 product demo, đủ để finder và stack builder có kết quả đa dạng.
- [ ] Đưa các metafield chọn lọc vào Shopify Search & Discovery filters.
- [ ] Viết fallback UI khi metafield trống để theme vẫn hoạt động với merchant không bán jewelry.

**Done khi:** merchant có thể thay data trên product và UI ở product/collection thay đổi đúng mà không phải sửa code.

---

## Phase 2 — Jewelry Discovery System (signature feature số 1)

### Trải nghiệm cần có

Một section/page “Find a meaningful piece” gồm các bước nhẹ:

1. Gift for / recipient
2. Occasion
3. Jewelry type
4. Metal hoặc birth month / gemstone
5. Budget
6. Kết quả sản phẩm có filter còn hoạt động

Không cần quiz phức tạp hoặc AI. Cốt lõi là chuyển lựa chọn của khách thành URL filter chuẩn của Shopify, có thể chia sẻ và quay lại chỉnh sửa.

### Implementation outline

- [ ] Tạo section `sections/jewelry-finder.liquid` có preset và blocks cho từng bước lựa chọn.
- [ ] Tạo asset JS nhỏ chỉ quản lý state, progressive enhancement và tạo collection/search URL.
- [ ] Dùng Shopify storefront filtering thay vì tự xây engine kết quả riêng.
- [ ] Thêm entry point vào header mega menu và homepage của cả hai preset.
- [ ] Hiển thị “gift context” đã chọn trong result page và một nút reset rõ ràng.
- [ ] Thêm empty state có CTA chuyển sang best sellers hoặc personalized edit.
- [ ] Hỗ trợ keyboard, focus management, labels và `prefers-reduced-motion`.

### Files dự kiến

- `sections/jewelry-finder.liquid` (mới)
- `assets/jewelry-finder.js` (mới)
- `assets/section-jewelry-finder.css` (mới)
- `sections/header-group.json`
- `templates/index.json` và template preset trong `/listings`
- `sections/collection.liquid`, `sections/search.liquid` (chỉ khi cần hiển thị context)
- `locales/en.default.json`

**Done khi:** khách hoàn thành finder trên mobile/desktop, nhận result đúng filter, có thể xoá/chỉnh filter và không bị kẹt nếu JavaScript không chạy.

---

## Phase 3 — Build Your Stack / Complete the Look (signature feature số 2)

### Trải nghiệm cần có

Trên PDP, merchant chọn các product tương thích thông qua `custom.compatible_products`. Khách chọn 1–n sản phẩm, thấy tổng số món/tổng giá và thêm cả set vào cart. Trên homepage/editorial, “Shop the look” dẫn vào cùng data/logic này thay vì là một trải nghiệm tách rời.

### Việc cần làm

- [ ] Tạo product block `blocks/product-stack-builder.liquid` hoặc section có thể thêm vào product template.
- [ ] Render product references từ metafield, kèm fallback sang complementary products khi data trống.
- [ ] Chỉ cho chọn variant available; cập nhật giá, image, trạng thái sold out và tổng giá.
- [ ] Add nhiều variant vào `/cart/add.js`; xử lý partial failure và feedback rõ ràng.
- [ ] Hiển thị thứ tự/logic phối: `Ring stack`, `Layered necklaces`, `Ear stack`.
- [ ] Tạo section nhỏ “Complete the look” dùng chung renderer/data model cho collection/editorial page nếu hợp lý.
- [ ] Không tự động thêm món không được khách chọn.
- [ ] Kiểm tra với product có 0, 1, nhiều compatible products; unavailable variants; tiền tệ khác; cart drawer/page cart.

### Files dự kiến

- `blocks/product-stack-builder.liquid` (mới)
- `snippets/stack-product-card.liquid` (mới)
- `assets/product-stack-builder.js` (mới)
- `assets/product-page.css` hoặc CSS section riêng
- `templates/product.json`
- `sections/shop-the-look.liquid` (kết nối trải nghiệm khi phù hợp)
- `locales/en.default.json`

**Done khi:** khách chọn được set, tổng giá đúng theo variant và các line items được thêm vào cart đáng tin cậy.

---

## Phase 4 — Personalization workflow (signature feature số 3)

### Việc cần làm

- [ ] Tạo `product-personalization` block, hiển thị khi `custom.personalizable` là true.
- [ ] Thu engraving/message qua line item properties, có limit ký tự và validation rõ ràng.
- [ ] Nếu product có nhiều engraving positions, dùng fields theo từng position và label từ metafield/metaobject.
- [ ] Hiển thị preview text đơn giản, không hứa hẹn preview typography/chữ khắc chính xác nếu chưa build được.
- [ ] Nêu lead time, packaging và return-policy từ metafield/page reference trước CTA mua.
- [ ] Đảm bảo Quick View không làm mất personalization context; nếu không hỗ trợ đầy đủ, Quick View cần dẫn sang PDP.
- [ ] Hiển thị personalization properties trong cart và order context.

### Files dự kiến

- `blocks/product-personalization.liquid` (mới)
- `snippets/product-form.liquid`
- `assets/product-page.js`
- `templates/product.json`
- `sections/cart.liquid` và cart feedback/drawer liên quan
- `locales/en.default.json`

**Done khi:** text cá nhân hoá có mặt trong cart/order line item, variant đổi vẫn giữ state hợp lệ, validation và policy rõ ràng.

---

## Phase 5 — Jewelry facts & confidence layer

### Việc cần làm

- [ ] Tạo block `product-jewelry-facts` để render facts ngắn, scannable từ metafields.
- [ ] Tạo block/accordion chi tiết material, gemstone, size, care, shipping/returns có fallback hợp lý.
- [ ] Đưa 1–3 facts quan trọng lên product card (ví dụ metal, stone hoặc personalizable) nhưng không làm card quá tải.
- [ ] Thêm size guide/chain guide minh hoạ thật cho preset fine jewelry.
- [ ] Dùng wording chính xác, tránh claim về materials, certification, sustainability hay warranty nếu demo/merchant không thể chứng minh.

### Files dự kiến

- `blocks/product-jewelry-facts.liquid` (mới)
- `snippets/product-card.liquid`
- `templates/product.json`
- `sections/featured-product.liquid`
- `sections/featured-collection.liquid`
- `locales/en.default.json`

**Done khi:** product page có hierarchy rõ ràng: quyết định mua trước, facts quan trọng kế tiếp, nội dung chi tiết sau cùng.

---

## Phase 6 — Preset, art direction và content system

### Omniselle preset

- [ ] Hướng “quiet luxury / editorial fine jewelry”.
- [ ] Dùng collection edit, shop-the-look, campaign banners và gemstone stories.
- [ ] Demo catalog có rings, necklaces, earrings, bracelets và đủ product data để discovery hoạt động.

### Heirloom preset

- [ ] Hướng “milestone gifting / personalization”.
- [ ] Homepage bắt đầu từ Gift Finder, tiếp theo personalized products, birthstones và packaging/lead-time explanation.
- [ ] PDP mặc định phải có personalization block, gift confidence facts và compatible products.

### Không dùng làm điểm khác biệt chính

- [ ] Chỉ đổi palette/font/spacing.
- [ ] Chỉ thêm animation, gradient, blur hoặc shape divider.
- [ ] Chỉ gom các section phổ biến như testimonials, countdown, gallery và newsletter.

**Done khi:** nhìn 2 preset đã khác use case và customer journey, nhưng vẫn nhận ra cùng một design system Omniselle.

---

## Phase 7 — Quality gate trước submission

> Chỉ chạy full theme check/audit khi các phase triển khai đã xong và bạn sẵn sàng chuẩn bị bản submit.

- [ ] Test install state của từng preset trên development store.
- [ ] Test core templates: home, product, collection, search, cart, page, blog/article, 404, password.
- [ ] Test trên mobile, tablet và desktop; ưu tiên finder, stack builder, personalization, menu, filters, cart.
- [ ] Test keyboard-only: focus order, dialog close, visible focus, dropdowns, filters và errors.
- [ ] Test no-JS/fallback cho những luồng có thể degrade.
- [ ] Rà contrast, input `id`/`label`, alt text, touch targets và reduced motion.
- [ ] Test realistic benchmark content, không dùng section trống.
- [ ] Đạt Lighthouse trung bình tối thiểu: performance 60 và accessibility 90 trên homepage, product và collection, ở desktop lẫn mobile.
- [ ] Package theme và kiểm tra ZIP có `/listings` cùng toàn bộ preset assets/templates cần thiết.
- [ ] Chuẩn bị version và release notes.

Shopify yêu cầu theme phải có khác biệt mang tính thiết kế/chức năng xuyên suốt; thay đổi bề mặt hoặc thêm ít sections không đủ. Xem yêu cầu chính thức: <https://shopify.dev/docs/storefronts/themes/store/requirements>.

---

## Copy cho submission form (dùng sau khi hoàn thành signature features)

> Omniselle is an editorial commerce theme designed for fine jewelry and meaningful gifting. It combines a high-fashion storytelling system with product-led discovery: gift-led product finding, shoppable lookbooks, curated collection edits, and campaign merchandising help merchants turn visual inspiration into a clear path to purchase.
>
> Its jewelry-specific product experience connects material, gemstone, personalization, and compatibility data across product discovery and purchase. Shoppers can find a meaningful piece by occasion or recipient, build a coordinated stack, and add personalized details with clear lead-time and care information. The flexible OS 2.0 system gives merchants a refined editorial presentation without sacrificing practical, data-driven merchandising.

**Không dùng copy này nếu chưa build Gift Finder, stack builder và personalization workflow.** Khi đó, hãy dùng mô tả trung thực hơn về editorial merchandising và product-detail flexibility, nhưng chưa nên claim theme có khác biệt mạnh.

---

## Thứ tự thực thi khuyến nghị

1. Phase 0 — xác định preset + package/demo foundation.
2. Phase 1 — metafields và demo data.
3. Phase 2 — Jewelry Discovery System.
4. Phase 3 — Build Your Stack.
5. Phase 4 — Personalization.
6. Phase 5 — Jewelry facts.
7. Phase 6 — hoàn thiện hai preset.
8. Phase 7 — quality gate, package và submit.

Sau mỗi phase, commit một thay đổi nhỏ, self-contained và test đúng phần vừa sửa trước khi sang phase tiếp theo.
