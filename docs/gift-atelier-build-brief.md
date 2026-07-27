# Build brief — Gift Omniselle section for Omniselle

## Mục tiêu

Hãy build một Shopify OS 2.0 section signature tên **Gift Omniselle** cho theme Omniselle.

Gift Omniselle là trải nghiệm tìm quà trang sức theo “câu chuyện”, không phải product quiz chung chung. Khách chọn người nhận, dịp tặng và yếu tố cá nhân hoá; section trả về một **Gift Edit** gồm copy theo ngữ cảnh, danh sách sản phẩm hoặc collection phù hợp, cùng CTA rõ ràng.

Tham khảo visual prototype: `docs/gift-atelier-prototype.html`.

## User flow

1. Hiển thị heading/intro editorial.
2. Khách trả lời lần lượt ba câu hỏi:
   - **Who is it for?**: Partner, Mother, Friend, Myself.
   - **What are you celebrating?**: Birthday, Anniversary, New beginning, Just because.
   - **What makes it personal?**: Birthstone, Engraving, Timeless gold, Matching set.
3. Sau lựa chọn thứ ba, thay UI câu hỏi bằng **Your curated gift edit**.
4. Gift Edit hiển thị:
   - Heading được tạo theo lựa chọn, ví dụ: `A birthday piece for Mum.`
   - Đoạn copy ngắn theo ngữ cảnh.
   - Ba choice chips đã chọn.
   - 3–6 product cards của path phù hợp.
   - CTA chính: `Explore this gift edit` dẫn tới collection/search URL phù hợp.
   - CTA phụ: `Make it personal`, chỉ hiển thị khi path bật personalization và có URL.
   - Link/button `Start a new story` để reset trải nghiệm.

## Điều quan trọng về logic

Không được cố tìm/filter toàn bộ catalog bằng Liquid/JavaScript ở client. Merchant phải cấu hình từng kết quả bằng **Gift path blocks** trong Theme Editor.

Mỗi Gift path block bao gồm điều kiện và output:

| Input | Setting / behavior |
| --- | --- |
| Recipient | Select: partner, mother, friend, myself |
| Occasion | Select: birthday, anniversary, new-beginning, just-because |
| Personal touch | Select: birthstone, engraving, timeless-gold, matching-set |
| Result collection | Collection picker, là nguồn product cards và CTA fallback |
| Result products | Product list (tối đa 6), có ưu tiên hơn collection khi được chọn |
| Heading | Text, hỗ trợ `{recipient}`, `{occasion}`, `{personal_touch}` placeholders |
| Copy | Rich text ngắn, hỗ trợ placeholders khi có thể |
| Primary CTA label | Text, default `Explore this gift edit` |
| Primary CTA link | URL; nếu trống dùng `result_collection.url` |
| Show personalization CTA | Checkbox |
| Personalization CTA label | Text, default `Make it personal` |
| Personalization CTA link | URL |
| Featured badge | Text tùy chọn, ví dụ `Made for birthdays` |

Nếu không tìm được block khớp đủ ba lựa chọn, dùng một section-level **fallback path** (collection/products/copy). Không hiển thị empty state vô ích hoặc lỗi JavaScript.

## Theme Editor schema

### Section settings

- Eyebrow
- Heading
- Intro text
- Question 1 label
- Question 2 label
- Question 3 label
- Recipient labels: Partner, Mother, Friend, Myself
- Occasion labels: Birthday, Anniversary, New beginning, Just because
- Personal-touch labels: Birthstone, Engraving, Timeless gold, Matching set
- Products to show: 3–6
- Desktop padding top/bottom
- Mobile padding top/bottom
- Section width: page / full
- Color scheme
- Fallback collection
- Fallback product list
- Fallback heading
- Fallback copy

### Blocks

- Block type: `gift_path`
- Maximum: 64 blocks (4 × 4 × 4 combinations).
- Hiển thị mô tả rõ trong Theme Editor, ví dụ `Mother · Birthday · Birthstone`.

### Preset

- Preset name: `Gift Omniselle`
- Có sẵn tối thiểu 4 demo paths để merchant hiểu cách cấu hình.

## Data and merchandising direction

Version đầu tiên phải chạy chỉ với collection và product picker, không bắt buộc Shopify metafields.

Sau khi MVP hoạt động, có thể bổ sung metafields `custom.recipient`, `custom.occasion`, `custom.birth_month`, `custom.personalizable`, và `custom.compatible_products` để quản trị catalog tốt hơn. Đừng biến metafields thành dependency bắt buộc của section v1.

## UX và visual direction

- Style: quiet luxury, editorial, confident, nhiều khoảng thở; không biến thành form/quiz SaaS.
- Desktop: intro/editorial panel và interaction panel song song hoặc theo layout tương đương prototype.
- Mobile: intro trên, flow dưới; chạm một tay dễ dàng.
- Mỗi step chỉ có một câu hỏi và tối đa 4 lựa chọn.
- Lựa chọn phải hiển thị selected state rõ ràng.
- Dùng animation nhỏ, tôn trọng `prefers-reduced-motion`.
- Product card tái sử dụng `snippets/product-card.liquid`; không tạo card markup/dữ liệu riêng.
- Nên dùng image và typography thật từ theme, không dùng SVG minh hoạ tự tạo.

## Accessibility và resilience

- Mọi lựa chọn là `<button type="button">`, hỗ trợ tab/Enter/Space.
- Focus chuyển đến heading của step tiếp theo hoặc result sau mỗi selection.
- Result update được thông báo hợp lý cho screen reader (`aria-live`).
- Color contrast và focus ring phải theo token/theme hiện có.
- Không chặn scroll toàn trang.
- Không crash nếu thiếu product/collection/image.
- Không có JavaScript: hiển thị section intro + fallback collection CTA hữu ích; không để khách thấy giao diện chết.

## Implementation boundaries

Tạo các file mới (tên có thể điều chỉnh nếu cần nhất quán với codebase):

- `sections/gift-atelier.liquid`
- `assets/section-gift-atelier.css`
- `assets/gift-atelier.js`

Tái sử dụng:

- `snippets/product-card.liquid`
- CSS variables và color schemes đang có trong theme
- pattern tải JavaScript / custom element hiện có trong `assets/`
- strings trong `locales/en.default.json` nếu có UI text cố định

Không được sửa các section/template không liên quan. Thêm Gift Omniselle vào `templates/index.json` chỉ khi được yêu cầu riêng; section cần có preset để merchant tự thêm qua Theme Editor.

## Acceptance criteria

- [ ] Merchant có thể thêm Gift Omniselle từ Theme Editor.
- [ ] Merchant cấu hình được Gift path không cần code.
- [ ] Khách hoàn thành 3 bước trên desktop và mobile.
- [ ] Mỗi lựa chọn map đúng tới một Gift path block.
- [ ] Result hiển thị 3–6 products; product list được ưu tiên, collection là fallback.
- [ ] Primary CTA có URL hợp lệ hoặc fallback về selected collection.
- [ ] Personalization CTA chỉ xuất hiện khi được cấu hình.
- [ ] `Start a new story` reset hoàn toàn flow.
- [ ] Path không khớp dùng fallback path, không báo lỗi.
- [ ] Keyboard, focus, screen-reader update và reduced motion hoạt động.
- [ ] Liquid/JSON thay đổi được kiểm tra theo workflow Shopify Liquid của project.
- [ ] Không có regression ở các section hiện hữu.

## Out of scope cho v1

- AI recommendation engine.
- Search toàn catalog client-side.
- Add multiple products to cart.
- Engraving preview thực tế.
- Đồng bộ dữ liệu với app bên thứ ba.
- Persisting câu trả lời qua nhiều session.

Sau khi v1 được nghiệm thu, bước kế tiếp phù hợp là liên kết Gift Omniselle với PDP personalization và Build Your Stack, dùng cùng data model product/metafield.
