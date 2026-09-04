# Kiến trúc responsive — Base contract và ma trận section

## Mục đích

Tài liệu này là nguồn chuẩn để thiết kế, triển khai và review responsive cho Spinel. Nó tách rõ:

1. **Base contract** — breakpoint mặc định cho mọi section storefront.
2. **Nhóm section** — section cùng loại dùng chung ý đồ layout, không cần tự tạo một breakpoint riêng.
3. **Ngoại lệ có chủ đích** — chỉ dùng khi component có yêu cầu UX khác base.
4. **Trạng thái áp dụng** — theo dõi phần code đã migration và phần còn dùng mốc cũ.

Khi thêm section mới, bổ sung vào nhóm phù hợp trong ma trận bên dưới. Chỉ tạo nhóm mới nếu cấu trúc và hành vi responsive thực sự khác.

## 1. Base contract storefront

| Range | Mode | CSS dùng cho layout | Ý nghĩa |
| --- | --- | --- | --- |
| `0–767.98px` | Mobile | `@media (max-width: 767.98px)` | Layout một cột hoặc touch-first; không để tablet override mobile. |
| `768–992px` | Tablet | `@media (min-width: 768px) and (max-width: 992px)` | Layout medium: giảm số cột, mật độ, kích thước media hoặc controls khi cần. |
| `≥993px` | Desktop | `@media (min-width: 993px)` | Desktop layout đầy đủ: multi-column, desktop navigation/control và media ratio desktop. |

### Quy tắc bắt buộc

- Giữ nguyên mobile `≤767.98px` khi chỉ migration ranh giới tablet/desktop.
- Không dùng `1149.98px`/`1150px` cho section mới hoặc section đang được migration, trừ khi được ghi rõ là ngoại lệ trong tài liệu này.
- Một section không bắt buộc phải có cả ba media query. Layout fluid hoặc mobile-only là hợp lệ nếu không cần đổi cấu trúc ở tablet/desktop.
- Khi một section có `desktop` và `tablet` setting riêng, breakpoint của cả CSS và responsive image `sizes` phải cùng là `993px`.
- `576px`, `899px`, `1200px`, `1400px`… chỉ là tinh chỉnh cục bộ trong cùng mode; không tự tạo mode cấp cao mới.
- Với component tái sử dụng trong container hẹp, ưu tiên container query thay vì tự đặt viewport breakpoint mới.

## 2. Ngoại lệ được phép

| Loại | Contract | Lý do |
| --- | --- | --- |
| Header | Mobile + tablet `≤1023.98px`; desktop `≥1024px` | Navigation desktop cần đủ không gian cho logo, menu và actions. Xem [HEADER-RESPONSIVE.md](HEADER-RESPONSIVE.md). |
| Header compact | `≤374px` | Chỉ giảm mật độ controls trong mobile header. |
| Large desktop refinement | `≥1200px` hoặc `≥1400px` khi ghi rõ tại component | Chỉ tinh chỉnh spacing/typography/media, không chuyển đổi mode cơ bản. |
| Overlay gắn với Header | Theo contract Header khi cần đồng bộ drawer/menu state | Ví dụ offer flyout có thể dùng mốc Header, không áp dụng quy tắc này cho content section thông thường. |

## 3. Ma trận loại section

`Base` trong bảng là contract mục tiêu khi section có sự đổi layout theo viewport. `Fluid/mobile-only` nghĩa là không cần desktop/tablet split riêng.

| Nhóm base | Section | Base responsive mong muốn | Ghi chú thiết kế |
| --- | --- | --- | --- |
| Header & navigation | Header, Announcement bar, Scroll navigation | Header exception `≤1023.98px` / `≥1024px` | Announcement và scroll navigation theo state/navigation; không ép theo content base. |
| Slideshow & banner | Hero banner, Slideshow, Slideshow with video, Editorial slideshow, Video banner, Horizontal banners | Mobile / Tablet `768–992` / Desktop `≥993` | Media, content position, height, navigator và image `sizes` phải chuyển cùng ranh giới. |
| Media storytelling | Image with text, Image stack, Highlight text with image, Gallery, Image comparison, Review parallax | Mobile / Tablet `768–992` / Desktop `≥993` khi có đổi bố cục | Cho phép fluid nếu chỉ thay typography/spacing. |
| Collections & discovery | Collection list, Collection showcase, Featured collection, Editorial featured collection, Editorial collection tabs, Product featured collection, Shop the look, Shoppable video | Mobile / Tablet `768–992` / Desktop `≥993` | Tablet giảm columns/slide width hoặc chuyển grid ↔ carousel theo setting. |
| Product detail & conversion | Product main, Featured product, Quick view, Product recommendations, Recently viewed products, Pickup availability | Mobile / Tablet `≤992` / Desktop `≥993` | Gallery, detail, sticky controls, modal/drawer và responsive image phải dùng cùng contract. |
| Cart & search overlay | Cart, Cart drawer, Search, Search drawer | Mobile / Tablet `768–992` / Desktop `≥993` | Overlay có thể có compact-mobile riêng, nhưng không để 993–1149 dùng layout tablet ngoài ý muốn. |
| Editorial & content pages | Blog, Blog posts, Article, Collections, Collection, Page header, Page content, Contact form, FAQ, Collapsible content | Mobile / Tablet `768–992` / Desktop `≥993` khi đổi grid/spacing | Nếu page chỉ có một flow column, mobile-only là đủ. |
| Trust, promotion & utility | Why choose us, Testimonials, Icon with text, Countdown timer, Marquee, Gift Spinel, Newsletter, Offer flyout | Mobile / Tablet `768–992` / Desktop `≥993` khi đổi cấu trúc | `≤899px` chỉ dùng khi component thật sự cần compact control, không thay base. |
| Footer & password | Footer, Password, Password header, Password footer | Mobile / Tablet `768–992` / Desktop `≥993` khi đổi cấu trúc | Footer có thể có large-desktop refinement cho wordmark/spacing. |
| Utility pages | 404, Breadcrumb, Size chart, Custom section | Fluid hoặc mobile-only | Không thêm breakpoint nếu không có thay đổi cấu trúc quan sát được. |

## 4. Trạng thái implementation hiện tại

Đây là snapshot để lập kế hoạch migration; cập nhật bảng này mỗi khi đổi breakpoint thực tế.

| Trạng thái | Nhóm/section hiện tại | Breakpoint đang dùng |
| --- | --- | --- |
| Đã theo base `992/993` | Shop the look, Gift Spinel, Hero banner, Collection list, Editorial collection tabs, Image with text, Gallery | `≤992px` / `≥993px` (Hero banner chỉ chuyển height desktop tại `993px`). |
| Đã theo base `992/993` qua asset chung | Product main, Featured product, Quick view | `product-page.css`: compact `≤992px`, desktop `≥993px`. |
| Header exception | Header | `≤1023.98px` / `≥1024px`. |
| Còn mốc legacy `1150` | Search drawer, Cart drawer, Search, Cart, Collections, Collection, Product featured collection, Featured collection, Editorial featured collection, Blog posts, Editorial slideshow, Horizontal banners, Video banner, Scroll navigation, Shoppable video, Review parallax, Icon with text, Image stack, Sticky scroll, Highlight text with image, Footer | Có ít nhất một rule `768–1149.98px`, `≤1149.98px` hoặc `≥1150px`. |
| Mốc cục bộ hoặc fluid/mobile-only | Countdown timer, Offer flyout, Collection showcase, Why choose us, Testimonials, Image comparison, Marquee, Slideshow, Slideshow with video, FAQ, Newsletter, Article, Breadcrumb, 404, Password, Size chart và utility pages | Dùng mobile-only, fluid, hoặc mốc refinement cục bộ; review theo UX trước khi migration. |

## 5. Checklist khi thêm hoặc sửa section

| Hạng mục | Kiểm tra |
| --- | --- |
| Phân loại | Section thuộc nhóm base nào? Nếu không rõ, thêm vào nhóm gần nhất trước. |
| Breakpoint | Có dùng đúng `767.98 / 768 / 992 / 993` không? Nếu là Header, dùng contract Header. |
| Mobile | Rule mới không làm đổi `≤767.98px` ngoài yêu cầu. |
| Layout | Grid, order, sticky, carousel, drawer và controls không có khoảng trống logic giữa `992px` và `993px`. |
| Media | `picture`, `mobile_breakpoint`, `sizes` và desktop/mobile image cùng ranh giới với layout. |
| Settings | Tên setting `desktop`, `tablet`, `mobile` phản ánh đúng mode đang render. |
| QA | Kiểm tra ít nhất `767.98px`, `768px`, `992px`, `993px`; thêm breakpoint ngoại lệ nếu nhóm section yêu cầu. |
| Tài liệu | Cập nhật bảng trạng thái implementation trong file này. |

## 6. Cách mở rộng tài liệu

- Thêm section mới: thêm tên vào hàng **Nhóm base** phù hợp.
- Một nhóm cần quy tắc riêng: thêm subsection ngay dưới phần 3, mô tả lý do và breakpoint chính xác.
- Một migration hoàn tất: chuyển section từ hàng `Còn mốc legacy 1150` sang `Đã theo base 992/993`.
- Không ghi một ngoại lệ chỉ vì code cũ đang dùng breakpoint lạ; trước tiên xác định đó là yêu cầu UX thật hay debt cần migration.
