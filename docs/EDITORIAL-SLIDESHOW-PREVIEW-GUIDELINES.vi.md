# Editorial slideshow — Quy chuẩn preview và checklist nghiệm thu

## Mục đích

Tài liệu này là nguồn kiểm tra bắt buộc khi triển khai hoặc chỉnh sửa `Editorial slideshow`, `Editorial slide`, các nested content block và `Editorial product card`.

Mục tiêu:

- Instance mới trong Theme Editor luôn có preview hoàn chỉnh và dễ hiểu.
- Placeholder, nội dung mẫu và trạng thái rỗng nhất quán trên mọi slide.
- Dữ liệu merchant đã lưu không bị thay đổi.
- Mọi lần triển khai đều được nghiệm thu bằng `PASS`, `FAIL` hoặc `NOT TESTED` với bằng chứng runtime.

## Nguồn chuẩn

- [Shopify `placeholder_svg_tag`](https://shopify.dev/docs/api/liquid/filters/placeholder_svg_tag)
- [Shopify section schema và presets](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema)
- [Shopify Theme Store testing checklist](https://shopify.dev/docs/storefronts/themes/store/test-theme/checklist)
- Quy trình dự án trong [`AGENTS.md`](../AGENTS.md)
- Code Spinel hiện tại là chuẩn cho kiến trúc, token và khả năng tương thích ngược; tài liệu này quyết định yêu cầu preview mới của Editorial slideshow.

## Phạm vi component

- `sections/editorial-slideshow.liquid`
- `blocks/editorial-slide.liquid`
- `blocks/editorial-product-card.liquid`
- Nested block được Editorial slide hỗ trợ: `heading`, `text`, `spacer`, `button-group`, `button` và app block.
- Asset CSS/JS và snippet dùng chung mà các component trên gọi tới.

Trước khi sửa component dùng chung, dùng `rg` để xác định toàn bộ call site và phạm vi regression.

## 1. Quy tắc ảnh placeholder

### 1.1 Trạng thái chưa có media

- Ưu tiên placeholder chính thức của Shopify qua `placeholder_svg_tag`.
- Editorial slideshow dùng family `hero-apparel-*` vì đây là slideshow có ảnh toàn khung và text overlay.
- Ba slide đầu dùng tuần tự:
  - Slide 1: `hero-apparel-1`
  - Slide 2: `hero-apparel-2`
  - Slide 3: `hero-apparel-3`
- Từ slide 4, lặp vòng lại từ `hero-apparel-1`.
- Không dùng cùng một placeholder cho mọi slide khi Shopify có nhiều biến thể phù hợp.
- Placeholder phải có class riêng, giữ đúng khung hình, không méo và không tạo layout shift bất thường.

Ví dụ Liquid:

```liquid
{{ placeholder_name | placeholder_svg_tag: 'editorial-slideshow__placeholder' }}
```

### 1.2 Khi merchant đã chọn media

- Ảnh merchant luôn thay thế placeholder.
- Nếu có cả ảnh desktop và mobile, mỗi viewport dùng đúng ảnh tương ứng.
- Nếu chỉ có một ảnh, ảnh còn lại được fallback an toàn theo contract hiện tại.
- Giữ focal point/image position, responsive `srcset`, `sizes`, width/height và loading priority phù hợp.
- Slide đầu tiên above-the-fold có thể eager/high priority theo logic hiện tại; slide còn lại phải tránh tải eager không cần thiết.
- Alt text ưu tiên theo thứ tự: setting alt text → alt của ảnh merchant → fallback dịch được và có nghĩa. Không dùng navigator label làm alt nếu label không mô tả hình ảnh.

## 2. Quy tắc nội dung preview

### 2.1 Yêu cầu chung

- Section preset phải tạo đủ số slide để merchant nhìn thấy navigation, autoplay và trạng thái active ngay khi thêm section.
- Block preset phải có nội dung đầy đủ khi merchant thêm riêng một Editorial slide.
- Text mẫu phải generic, ngắn gọn, dễ thay thế và không tạo cảm giác là dữ liệu thật.
- Không dùng tên thương hiệu mẫu, tên sản phẩm hư cấu, giá giả, số carat giả hoặc nội dung quá đặc thù cho trang sức.
- Không hard-code nội dung preview trong Liquid nếu merchant cần sửa; đặt trong schema default/preset.
- Section preset và block preset phải đồng nhất, không sinh ra hai bộ nội dung mâu thuẫn.

### 2.2 Nội dung mẫu được phép

- Eyebrow: `FEATURED STORY`
- Heading: `This is a heading`
- Text: `Use this space to introduce your brand, product, or promotion.`
- Button: `Shop now` hoặc `View collection`
- Specification line: `ADD PRODUCT DETAILS OR A SHORT NOTE`
- Navigator label: `Story 01`, `Story 02`, `Story 03`
- Navigator detail: `EDITORIAL`

### 2.3 Editorial product card

- Khi chưa chọn product, card vẫn có preview có nghĩa nhưng không được giả làm dữ liệu commerce thật.
- Không dùng giá giả. Có thể hiển thị placeholder trung tính hoặc ẩn vùng giá cho đến khi có product, miễn layout vẫn mô tả đúng cấu trúc card.
- Khi đã chọn product, title, URL, variant price và trạng thái availability phải lấy từ product thật.
- Text override chỉ tồn tại khi có yêu cầu merchant UX rõ ràng và phải có fallback an toàn.
- Button phải dùng URL của product đã chọn; trạng thái chưa chọn product phải có hành vi an toàn và không tạo liên kết gây hiểu nhầm.

## 3. Bảo vệ dữ liệu merchant

- Chỉ thay đổi `default` và `presets` dành cho instance mới.
- Không sửa `templates/*.json`, `config/settings_data.json` hoặc dữ liệu Theme Editor đã lưu chỉ để cập nhật preview.
- Không đổi persisted setting ID, block type, static block ID hoặc schema type nếu chưa có migration/chấp thuận.
- Không ghi đè text, ảnh, product, position, animation hoặc setting merchant đã tùy chỉnh.
- Sau khi update, instance Editorial slideshow hiện có phải giữ nguyên nội dung và thứ tự block.

## 4. Contract kiến trúc Editorial slideshow

- Section tiếp tục dùng theme blocks; không trộn với local `section.blocks` contract mới ngoài cách render theme block hiện hữu.
- `Editorial slide` quản lý media, overlay, content layout và nested content blocks.
- `Editorial product card` là static theme block có ID literal ổn định `product_card` trong parent trực tiếp.
- Section quản lý viewport, Swiper, autoplay và navigator; slide không tự tạo một slideshow controller riêng.
- Mọi DOM ID, data attribute, Swiper instance, timer và listener phải an toàn khi có nhiều Editorial slideshow trên cùng trang.
- Mọi setting phải trace được theo chuỗi: schema → Liquid/HTML → CSS/JS → Theme Editor preview. Không giữ dead setting.
- Thứ tự setting theo chuẩn merchant UX: Content → Media → Layout → Appearance → Behavior → Spacing → Advanced, chỉ áp dụng các nhóm thực sự cần.

## 5. Checklist trước khi triển khai

- [ ] Đã đọc `AGENTS.md` và tài liệu này.
- [ ] Đã xác nhận branch là `codex/spinel-chieutt-dev`; không thao tác `main` nếu user chưa yêu cầu.
- [ ] Đã kiểm tra `git status`, fetch `origin/main` và divergence.
- [ ] Đã dùng Shopify docs hiện hành cho Liquid/schema/Theme Editor liên quan.
- [ ] Đã đọc section, slide block, product-card block, CSS và JS hiện tại.
- [ ] Đã tìm toàn bộ call site của block/snippet/asset dùng chung.
- [ ] Đã chuyển requirement mới thành checklist quan sát được cho desktop, mobile, interaction, animation và editor lifecycle.
- [ ] Đã xác định rõ thay đổi chỉ ảnh hưởng instance mới hay cần migration dữ liệu cũ.

## 6. Checklist nghiệm thu sau build

Điền `PASS`, `FAIL` hoặc `NOT TESTED`. Với `NOT TESTED`, ghi rõ blocker. Không kết luận hoàn tất nếu runtime bắt buộc chưa được kiểm tra.

| Nhóm | Tiêu chí | Trạng thái | Bằng chứng/Ghi chú |
| --- | --- | --- | --- |
| Preset | Thêm Editorial slideshow mới sinh đủ slide và nội dung preview |  |  |
| Preset | Thêm Editorial slide riêng sinh nested content đầy đủ |  |  |
| Placeholder | Slide 1–3 dùng `hero-apparel-1` đến `hero-apparel-3` đúng thứ tự |  |  |
| Placeholder | Slide 4+ lặp vòng placeholder đúng |  |  |
| Media | Ảnh desktop merchant thay placeholder đúng |  |  |
| Media | Ảnh mobile merchant thay placeholder/fallback đúng |  |  |
| Media | Ảnh không méo, không overflow và không gây layout shift bất thường |  |  |
| Content | Preview text generic, đầy đủ và không có brand/product/giá giả |  |  |
| Product card | Trạng thái chưa chọn product rõ ràng và không gây hiểu nhầm |  |  |
| Product card | Product thật cập nhật đúng title, URL, price và CTA |  |  |
| Navigator | Label/detail khớp slide; active state và số thứ tự đúng |  |  |
| Interaction | Previous, next, tab, autoplay và pause/resume hoạt động |  |  |
| Animation | Slide/content/product card chạy đúng animation và delay block |  |  |
| Responsive | Desktop layout đúng ở viewport mục tiêu |  |  |
| Responsive | Mobile layout đúng; content, card và navigator không đè nhau |  |  |
| Theme Editor | Add/remove/duplicate/reorder/select/deselect block hoạt động |  |  |
| Theme Editor | Setting cập nhật preview và section reload không nhân listener |  |  |
| Merchant data | Instance đã lưu không đổi nội dung, media hoặc thứ tự |  |  |
| Accessibility | Region label, alt text, button label, tab semantics và keyboard đúng |  |  |
| Accessibility | Focus visible, reduced motion và contrast đạt yêu cầu |  |  |
| Performance | Responsive image/loading priority hợp lý; không regression rõ ràng |  |  |
| Runtime | Không có Liquid error, console error hoặc network error mới |  |  |
| Validation | `git diff --check` và validator dự án đạt |  |  |

## 7. Ma trận dữ liệu bắt buộc

Kiểm tra tối thiểu các trạng thái sau:

1. Section mới với ba slide mặc định.
2. Một slide duy nhất.
3. Bốn slide để xác nhận placeholder lặp vòng.
4. Slide không có media.
5. Chỉ có ảnh desktop.
6. Chỉ có ảnh mobile.
7. Có cả ảnh desktop và mobile với aspect ratio khác nhau.
8. Heading/text/button ngắn, dài, rỗng và có line break.
9. Có và không có Editorial product card.
10. Product card chưa chọn product, product available và product unavailable/sold out nếu contract hỗ trợ.
11. Autoplay bật/tắt, một slide và nhiều slide.
12. Controls bật/tắt.
13. Section page width/full width và mọi height mode.
14. Hai Editorial slideshow trên cùng một trang.
15. Duplicate/reorder slide trong Theme Editor khi slideshow đang active.

## 8. Baseline cần xử lý trong lần triển khai preview tiếp theo

Các điểm dưới đây được ghi nhận từ code hiện tại; đây là backlog nghiệm thu, chưa phải xác nhận đã sửa:

| Mức | Hiện trạng | Kết quả mong muốn |
| --- | --- | --- |
| P1 | Editorial slide dùng asset `placeholder-image-default-2.svg` cho mọi slide | Chuyển sang `placeholder_svg_tag` với `hero-apparel-1..3` theo thứ tự và lặp vòng |
| P1 | Preset dùng nội dung Nocturne/Equinox/Vesper và mô tả mang tính sản phẩm cụ thể | Thay bằng nội dung generic cho instance mới |
| P1 | Editorial product card có tên sản phẩm và giá `$8,600` mặc định | Không dùng tên sản phẩm/giá giả; giữ preview trung tính và rõ trạng thái chưa chọn product |
| P2 | Cần xác minh runtime section preset và block preset có tạo nested content nhất quán cho cả ba slide | Cả hai điểm thêm component tạo preview hoàn chỉnh, không mâu thuẫn |

## 9. Báo cáo bàn giao

Mỗi lần triển khai Editorial slideshow, báo cáo ngắn gọn:

- File và contract đã thay đổi.
- Checklist `PASS / FAIL / NOT TESTED` theo phạm vi ảnh hưởng.
- Kết quả Theme Editor và storefront trên desktop/mobile.
- Validator, console và performance/accessibility regression liên quan.
- Ảnh hưởng đến instance đã lưu và mọi ngoại lệ kiến trúc.
- Commit/push chỉ thực hiện theo branch safety trong `AGENTS.md`.
