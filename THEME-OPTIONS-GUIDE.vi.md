# Kiến trúc option cho Shopify Theme

> Tài liệu tham chiếu để xây theme, section, block và preset mới. Nội dung chỉ giữ các cấu trúc có thể tái sử dụng; không bao gồm dữ liệu merchant, ID instance, nội dung demo hoặc vấn đề riêng của theme nguồn.

## 1. Mục tiêu

Tài liệu này giúp:

- Thiết kế option nhất quán giữa các section và block.
- Tách đúng global settings, section settings, block settings và page template.
- Tạo preset có thể tái sử dụng giữa nhiều theme.
- Giảm số lượng option trùng lặp hoặc chỉ khác tên.
- Giữ Theme Editor dễ hiểu đối với merchant.
- Chuẩn hoá contract trước khi viết Liquid, CSS và JavaScript.

## 2. Bốn tầng cấu hình

| Tầng | Nơi định nghĩa | Nơi lưu giá trị | Phạm vi | Cách đọc trong Liquid |
|---|---|---|---|---|
| Global settings | `config/settings_schema.json` | `config/settings_data.json` | Toàn theme | `settings.<id>` |
| Section settings | `{% schema %}` trong `sections/*.liquid` | JSON template hoặc section group | Một section instance | `section.settings.<id>` |
| Block settings | Schema của inline block hoặc `blocks/*.liquid` | Block instance trong template | Một block instance | `block.settings.<id>` |
| Page composition | `templates/*.json`, `sections/*-group.json` | Chính file JSON | Một loại trang | Shopify dựng theo `sections` và `order` |

Quy tắc quan trọng:

- Schema định nghĩa option.
- Preset cung cấp giá trị khởi tạo.
- Template sắp xếp instance và lưu giá trị đã chọn.
- `settings_data.json` là trạng thái global của một theme, không phải thư viện schema.
- ID section và block instance do Shopify tạo có thể thay đổi; không dùng literal ID làm contract.

## 3. Khi nào dùng từng loại cấu trúc

| Nhu cầu | Cấu trúc nên dùng |
|---|---|
| Token dùng toàn site | Global setting |
| Layout hoặc hành vi của một vùng trang | Section setting |
| Nội dung lặp lại do merchant sắp xếp | Inline block |
| Thành phần cần dùng lại hoặc lồng nhau | Theme block trong `blocks/` |
| Markup nhỏ, không cần merchant chỉnh trực tiếp | Snippet |
| Bố cục hoàn chỉnh cho một loại trang | JSON template |
| Header hoặc footer dùng toàn site | Section group |
| Trạng thái ban đầu khi Add section | Section preset |
| Cấu hình thiết kế mặc định toàn theme | Theme preset trong `settings_data.json` |

### Dùng inline block khi

- Block chỉ có ý nghĩa trong một section cụ thể.
- Markup của block phụ thuộc mạnh vào section cha.
- Block không cần xuất hiện trong các section khác.
- Ví dụ: slide trong slideshow, câu hỏi trong FAQ, item trong announcement bar.

### Dùng theme block khi

- Thành phần cần tái sử dụng ở nhiều context.
- Merchant cần lồng block để tạo composition.
- Thành phần có contract độc lập.
- Ví dụ: heading, text, button, media, group, accordion, product price.

### Dùng snippet khi

- Thành phần không cần schema riêng.
- Cần tái sử dụng markup hoặc logic render.
- Input được truyền bằng tham số.
- Ví dụ: responsive image, product card, price formatter, icon.

## 4. Nguyên tắc thiết kế option

### 4.1. Một ID chỉ có một contract

Trong toàn theme, một ID nên giữ:

- Cùng `type`.
- Cùng ý nghĩa.
- Cùng vocabulary đối với `select`.
- Cùng đơn vị đối với `range`.
- Cùng chiến lược fallback.

Không nên để `alignment` lúc là `select`, lúc là `text_alignment`, hoặc `section_width` có vocabulary khác nhau giữa các section.

### 4.2. Global trước, local override sau

Ưu tiên global settings cho:

- Font family.
- Cỡ chữ semantic.
- Color scheme.
- Button style.
- Form control.
- Card radius.
- Badge.
- Price formatting.
- Motion.
- Page width và page margin.

Section chỉ thêm override khi merchant có nhu cầu thực tế làm section đó khác toàn theme.

### 4.3. Option phải thay đổi được kết quả

Chỉ đưa option ra Theme Editor nếu nó thay đổi:

- Nội dung.
- Resource.
- Markup.
- Layout.
- Style.
- Hành vi.

Không đưa biến kỹ thuật, selector, cache key hoặc implementation detail ra schema.

### 4.4. Responsive có fallback rõ ràng

Mẫu nên dùng:

- `mobile_image` trống thì dùng `image`.
- Option mobile trống thì dùng desktop.
- Chỉ tách desktop/mobile khi hai breakpoint thật sự cần khác nhau.
- Không tạo ba option desktop/tablet/mobile nếu CSS responsive giải quyết được.

### 4.5. Thứ tự option trong Theme Editor

Nên sắp xếp:

1. Nội dung.
2. Nguồn dữ liệu.
3. Media.
4. Layout.
5. Mobile.
6. Hành vi.
7. Màu sắc.
8. Spacing.

## 5. Thư viện input type

| Type | Dùng cho | Không nên dùng khi |
|---|---|---|
| `checkbox` | Bật/tắt tính năng | Có từ ba trạng thái trở lên |
| `select` | Vocabulary hữu hạn | Giá trị số liên tục |
| `range` | Size, spacing, opacity, gap, limit | Giá trị cần nhập theo format |
| `text` | Label, title ngắn, dữ liệu format | Nội dung nhiều đoạn |
| `textarea` | Văn bản dài không cần format | Merchant cần bold/link/list |
| `inline_richtext` | Nội dung ngắn có format inline | Nội dung nhiều đoạn |
| `richtext` | Nội dung nhiều đoạn | Dữ liệu máy đọc như datetime |
| `url` | Link | Chọn resource cụ thể |
| `image_picker` | Ảnh | Video hoặc resource động |
| `video` | Shopify-hosted video | Link video ngoài |
| `color_scheme` | Chọn scheme toàn theme | Chọn một màu đơn lẻ |
| `color` | Màu đơn | Section cần đồng bộ cả palette |
| `color_background` | Solid hoặc gradient | Text/icon color |
| `font_picker` | Font global | Font riêng cho từng section |
| `text_alignment` | Căn trái/giữa/phải | Căn theo flex start/end |
| `collection` | Chọn collection | Chọn nhiều collection |
| `product` | Chọn product | Chọn nhiều product |
| `product_list` | Chọn danh sách product | Nguồn phải tự động từ collection |
| `article` | Chọn article | Danh sách article |
| `page` | Chọn page | Nội dung rich text trực tiếp |
| `link_list` | Chọn menu | Một URL đơn |
| `liquid` | Custom Liquid có chủ đích | Merchant phổ thông chỉ cần content |
| `header` | Chia nhóm trong editor | Lưu dữ liệu |
| `paragraph` | Hướng dẫn trong editor | Nội dung storefront |

## 6. Contract đặt tên chuẩn

### 6.1. Nội dung

| ID | Type đề xuất | Ý nghĩa |
|---|---|---|
| `eyebrow` | `text` | Dòng nhãn ngắn phía trên heading |
| `heading` | `inline_richtext` hoặc `text` | Tiêu đề |
| `heading_size` | `select` | Visual style của heading |
| `heading_tag` | `select` | HTML tag semantic |
| `text` | `richtext` | Nội dung chính |
| `text_size` | `select` | Visual style của nội dung |
| `label` | `text` | Nhãn ngắn của control hoặc item |
| `content` | `richtext` | Nội dung block |

Quy tắc:

- `heading_size` và `heading_tag` là hai khái niệm khác nhau.
- `heading_size` điều khiển visual style.
- `heading_tag` điều khiển semantic và SEO.
- Chọn một type duy nhất cho `heading` trong toàn design system.

### 6.2. CTA

| ID | Type đề xuất | Ý nghĩa |
|---|---|---|
| `button_label` | `text` | Nội dung nút |
| `button_link` | `url` | Link nút |
| `button_style` | `select` | `primary`, `secondary`, `tertiary` |
| `open_in_new_tab` | `checkbox` | Mở tab mới |

Chỉ render CTA khi có `button_label`. Nếu label có nhưng link trống, cần xác định rõ nút là button hay link.

### 6.3. Media

| ID | Type đề xuất | Ý nghĩa |
|---|---|---|
| `image` | `image_picker` | Ảnh desktop/mặc định |
| `mobile_image` | `image_picker` | Ảnh override trên mobile |
| `video` | `video` | Video Shopify-hosted |
| `image_alt` | `text` | Alt text override khi cần |
| `media_ratio` | `select` | Tỉ lệ media |
| `focal_point` | `select` | Vị trí trọng tâm |
| `overlay_opacity` | `range` | Độ mờ overlay |

Vocabulary đề xuất cho `media_ratio`:

- `auto`
- `square`
- `portrait`
- `landscape`
- `wide`

Không dùng nhiều vocabulary khác nhau như `wide-landscape`, `super-wide`, `inherit`, `adapt` nếu cùng một hệ thống card có thể dùng bộ chung.

### 6.4. Layout

| ID | Type đề xuất | Giá trị đề xuất |
|---|---|---|
| `section_width` | `select` | `page`, `full`, `custom` |
| `custom_width` | `range` | Chỉ hiện khi `section_width == custom` |
| `content_width` | `range` | Chiều rộng vùng content |
| `content_position` | `select` | Grid 3 × 3 hoặc trục dọc thống nhất |
| `content_alignment` | `text_alignment` | `left`, `center`, `right` |
| `columns_desktop` | `range` hoặc `select` | Số cột desktop |
| `columns_mobile` | `select` | `1`, `2` |
| `column_gap` | `range` | Khoảng cách ngang |
| `row_gap` | `range` | Khoảng cách dọc |

Không trộn `contained`, `page`, `wide` cho cùng ý nghĩa. Nếu theme có page container chuẩn, dùng `page`.

### 6.5. Spacing

| ID | Type đề xuất | Ghi chú |
|---|---|---|
| `padding_top` | `range` | Section spacing phía trên |
| `padding_bottom` | `range` | Section spacing phía dưới |
| `content_padding` | `range` | Padding bên trong content panel |
| `column_gap` | `range` | Gap giữa cột |
| `row_gap` | `range` | Gap giữa hàng |

Nên dùng cùng min, max, step và unit giữa các section. Không tạo một thang spacing khác cho từng file.

### 6.6. Style

| ID | Type đề xuất | Ý nghĩa |
|---|---|---|
| `color_scheme` | `color_scheme` | Palette của section |
| `show_border` | `checkbox` | Border phân cách |
| `media_radius` | `select` hoặc token global | Bo góc media |
| `card_style` | `select` | Visual variant của card |
| `button_style` | `select` | Variant button |

### 6.7. Behavior

| ID | Type đề xuất | Ý nghĩa |
|---|---|---|
| `enable_autoplay` | `checkbox` | Tự chuyển slide |
| `autoplay_interval` | `range` | Thời gian giữa các slide |
| `enable_loop` | `checkbox` | Lặp vô hạn |
| `transition_style` | `select` | Kiểu chuyển động |
| `show_navigation` | `checkbox` | Hiện arrows |
| `show_pagination` | `checkbox` | Hiện dots/progress |
| `enable_motion` | Global `checkbox` | Motion toàn theme |

Các option phụ nên dùng `visible_if`, ví dụ chỉ hiện `autoplay_interval` khi bật autoplay.

## 7. Global settings có thể tái sử dụng

### 7.1. Brand

| ID | Type | Phạm vi |
|---|---|---|
| `logo` | `image_picker` | Header, footer, gift card |
| `favicon` | `image_picker` | Browser tab |

Logo width nên đặt ở section header/footer vì phụ thuộc vị trí render.

### 7.2. Color schemes

Nên dùng `color_scheme_group` làm nguồn palette. Một scheme nên có role:

- Background.
- Background gradient.
- Heading.
- Text.
- Primary button background/label/border.
- Secondary button background/label/border.
- Tertiary link/button.
- Border.
- Component background.
- Shadow.

Section chỉ lưu `color_scheme`, không nên lặp lại toàn bộ màu.

### 7.3. Typography

Global typography nên gồm:

- `heading_font`.
- `body_font`.
- Semantic scale cho H1–H6.
- Desktop size.
- Mobile size.
- Line height.
- Letter spacing.
- Text transform.
- Body text scale.
- Eyebrow scale.

Nên tách semantic HTML và visual size:

- HTML tag do content hierarchy quyết định.
- Visual class do `heading_size` quyết định.

### 7.4. Layout

| ID | Type |
|---|---|
| `max_page_width` | `select` hoặc `range` |
| `min_page_margin` | `range` |
| `page_margin_desktop` | `range` |
| `page_margin_tablet` | `range` |
| `page_margin_mobile` | `range` |

Mọi section `section_width: page` nên dùng chung các token này.

### 7.5. Buttons

Global button contract:

- Radius.
- Horizontal padding desktop/mobile.
- Font family role.
- Text transform.
- Border width.
- Disabled opacity.
- Tertiary underline và underline offset.

Section/block chỉ chọn `button_style`, không tự định nghĩa lại typography và radius.

### 7.6. Form controls

Global form contract:

- Radius.
- Input corner radius.
- Control height desktop/mobile.
- Border color lấy từ color scheme.
- Error/success style thống nhất.

### 7.7. Product cards

Global product-card contract:

- Media ratio.
- Card radius.
- Secondary image.
- Vendor.
- Compare-at price.
- Variant indicator.
- Sale badge.
- Sold-out badge.

Section listing chỉ điều khiển data source, columns, gap, limit và carousel.

### 7.8. Commerce và motion

Các global option thường cần:

- Cart drawer enabled.
- Cart drawer width.
- Cart drawer color scheme.
- Related products trong cart.
- Discount code.
- Order note.
- Currency code.
- Motion enabled.
- Search results per page.

## 8. Option bundle dùng chung

### Bundle A — Section frame

Áp dụng cho hầu hết section:

| ID | Type |
|---|---|
| `section_width` | `select` |
| `color_scheme` | `color_scheme` |
| `padding_top` | `range` |
| `padding_bottom` | `range` |

### Bundle B — Section header

| ID | Type |
|---|---|
| `eyebrow` | `text` |
| `heading` | `inline_richtext` |
| `heading_size` | `select` |
| `heading_tag` | `select` |
| `text` | `richtext` |
| `text_size` | `select` |
| `content_alignment` | `text_alignment` |

Nếu section cho merchant tự sắp xếp content, chuyển bundle này thành theme blocks `heading`, `text`, `button`.

### Bundle C — CTA

| ID | Type |
|---|---|
| `button_label` | `text` |
| `button_link` | `url` |
| `button_style` | `select` |
| `open_in_new_tab` | `checkbox` |

### Bundle D — Responsive media

| ID | Type |
|---|---|
| `image` | `image_picker` |
| `mobile_image` | `image_picker` |
| `media_ratio` | `select` |
| `focal_point` | `select` |
| `overlay_opacity` | `range` |

### Bundle E — Grid

| ID | Type |
|---|---|
| `columns_desktop` | `range` |
| `columns_mobile` | `select` |
| `column_gap` | `range` |
| `row_gap` | `range` |

### Bundle F — Carousel

| ID | Type |
|---|---|
| `enable_autoplay` | `checkbox` |
| `autoplay_interval` | `range` |
| `enable_loop` | `checkbox` |
| `show_navigation` | `checkbox` |
| `show_pagination` | `checkbox` |
| `transition_style` | `select` |

## 9. Section archetype tái sử dụng

### 9.1. Announcement bar

Section settings:

- Text behavior.
- Autoplay interval.
- Navigation style.
- Font weight.
- Desktop/mobile height.
- Section width.
- Color scheme.

Inline blocks:

- `text_slide`: text.
- `link`: label, URL, open in new tab.
- `countdown`: label, end datetime.
- `social_links`: URL theo platform.

Preset tối thiểu:

- Một `text_slide`.
- Không bật autoplay nếu chỉ có một slide.

### 9.2. Header

Section settings:

- Main menu.
- Sticky behavior.
- Transparent header.
- Transparent color scheme.
- Border.
- Desktop/mobile height.
- Search.
- Localization.
- Account.
- Cart.
- Section width.
- Color scheme.

Blocks:

- Logo.
- Mega-menu column.
- Mega-menu promotion.
- App block nếu cần.

Header nên nằm trong `header-group`, không đặt trong từng page template.

### 9.3. Footer

Section settings:

- Section width.
- Color scheme.
- Desktop/mobile spacing.
- Bottom-bar behavior.

Blocks:

- Logo/brand.
- Menu column.
- Text.
- Newsletter.
- Social links.
- Payment icons.
- Localization.
- Copyright.

Footer nên nằm trong `footer-group`.

### 9.4. Hero banner

Section settings:

- Responsive media bundle.
- Height mode.
- Desktop/mobile height.
- Content width.
- Content position.
- Content alignment.
- Color scheme.
- Section spacing.

Blocks hoặc content fields:

- Eyebrow.
- Heading.
- Text.
- Một hoặc hai CTA.

Preset tối thiểu:

- Heading.
- Text ngắn.
- Một CTA.
- Placeholder media.

### 9.5. Slideshow

Section settings:

- Height.
- Carousel bundle.
- Content transition.
- Section width.
- Color scheme.

Slide block:

- Image.
- Mobile image.
- Focal point.
- Overlay opacity.
- Eyebrow.
- Heading.
- Heading size/tag.
- Text.
- Content position/alignment.
- CTA.

Mỗi slide phải tự chứa content và media của nó. Không lưu slide-specific option ở section.

### 9.6. Video banner

Section settings:

- Height mode.
- Content layout.
- Overlay.
- Playback behavior.
- Color scheme.
- Section spacing.

Content blocks:

- Eyebrow.
- Heading.
- Text.
- CTA.

Video contract:

- Shopify-hosted video.
- Poster image.
- Mobile poster hoặc mobile video chỉ khi cần.
- Autoplay chỉ khi muted.
- Luôn có fallback poster.

### 9.7. Image with text

Section settings:

- Media position.
- Media width.
- Media ratio.
- Content alignment.
- Content padding.
- Section frame bundle.

Theme blocks:

- Heading.
- Text.
- Button.
- Media.
- Group.

Preset tối thiểu:

- Một media.
- Một heading.
- Một text.
- Một button.

### 9.8. Collection hoặc product listing

Section settings:

- Data source: collection hoặc product list.
- Product limit.
- Grid bundle.
- Grid/carousel mode.
- Carousel bundle nếu cần.
- Section header bundle.
- Section frame bundle.

Không lặp card style trong section nếu đã có global product-card settings.

Block chỉ cần khi có:

- Promotion card.
- Manually curated product.
- View-all CTA cần sắp xếp như item.

### 9.9. Collection list

Section settings:

- Layout mode.
- Grid bundle.
- Media ratio.
- Section header.
- Section frame.

Collection block:

- Collection resource.
- Optional custom image.
- Optional custom title.
- Optional link override.

Nếu collection được lấy tự động, không cần block thủ công.

### 9.10. Editorial gallery

Section settings:

- Layout variant.
- Grid columns/gap.
- Media ratio.
- Section header.
- Section frame.

Item block:

- Image hoặc video.
- Caption.
- Link.
- Focal point.
- Span/size trong grid nếu layout cho phép.

### 9.11. Shop the look

Section settings:

- Responsive media.
- Layout/slider behavior.
- Content alignment.
- Section frame.

Blocks:

- Product hotspot: product, x position, y position.
- Heading.
- Text.
- CTA.

Vị trí hotspot nên là range theo phần trăm và có giá trị riêng cho mobile chỉ khi media mobile khác đáng kể.

### 9.12. Image comparison

Section settings:

- Before image.
- After image.
- Initial handle position.
- Orientation.
- Before/after label.
- Media ratio.
- Section header.
- Section frame.

Chỉ dùng block nếu cần nhiều comparison item trong cùng section.

### 9.13. Icon with text

Section settings:

- Grid bundle.
- Icon position.
- Content alignment.
- Section frame.

Item block:

- Icon.
- Heading.
- Text.
- Link.

Nếu icon vocabulary cố định, dùng `select`. Nếu merchant tải icon riêng, dùng `image_picker`. Không dùng cùng một ID `icon` cho cả hai type.

### 9.14. Scrolling text

Section settings:

- Direction.
- Speed.
- Pause on hover.
- Item gap.
- Text style.
- Color scheme.
- Section width.

Text block:

- Text.
- Optional link.
- Optional icon.

Không dùng autoplay interval theo kiểu slideshow; marquee nên dùng speed contract riêng.

### 9.15. Countdown

Section settings:

- Layout.
- Content alignment.
- Gap.
- Section frame.

Blocks:

- Heading.
- Text.
- Countdown: end datetime, unit labels, completion behavior.
- Button.

Datetime nên dùng một format duy nhất và tài liệu hoá timezone.

### 9.16. Testimonials

Section settings:

- Layout hoặc carousel.
- Columns.
- Card style.
- Alignment.
- Section header.
- Section frame.

Testimonial block:

- Quote.
- Author.
- Role/source.
- Image.
- Rating nếu có.

Không dùng `heading` cho quote; giữ contract riêng như `quote`.

### 9.17. FAQ và collapsible content

Section settings:

- Section header.
- Content width.
- Icon style.
- First item open.
- Allow multiple open.
- Section frame.

Block structure:

- Optional group heading.
- Question/item.
- Answer/content.
- Optional anchor.

Nếu accordion cần dùng lại trong product page và content page, nên tạo theme block `collapsible-item`.

### 9.18. Newsletter

Section settings:

- Responsive media.
- Layout.
- Content position/alignment.
- Form width.
- Color scheme.
- Section spacing.

Blocks:

- Eyebrow.
- Heading.
- Text.
- Form.
- Consent/help text.

Form phải dùng Shopify customer/contact form contract phù hợp và render error/success state.

### 9.19. Contact form

Section settings:

- Heading/content.
- Form width.
- Layout.
- Color scheme.
- Section spacing.

Field block:

- Field type.
- Name.
- Label.
- Placeholder.
- Required.
- Width.

Không cho merchant nhập tùy ý `name` nếu backend chỉ chấp nhận một contract cố định.

### 9.20. Blog posts

Section settings:

- Blog resource.
- Article limit.
- Grid/carousel.
- Show image/date/author/excerpt.
- Image ratio.
- Section header.
- Section frame.

Promotion block chỉ thêm khi cần trộn content thủ công vào article list.

### 9.21. Main collection

Section settings:

- Products per page.
- Grid bundle.
- Filtering.
- Sorting.
- Filter presentation.
- Open filter groups.
- Collection description.
- Section frame.

Product card appearance lấy từ global settings.

### 9.22. Search results

Section settings:

- Prefix search.
- Filtering.
- Sorting.
- Result type presentation.
- Article image/date/author.
- Grid bundle.
- Results per page.
- Section frame.

Nếu `results_per_page` là policy toàn site, đặt global; nếu search cần khác collection, đặt ở section.

### 9.23. Main product

Section settings nên chỉ giữ layout cấp cao:

- Media/details gap.
- Media width.
- Mobile gap.
- Color scheme.
- Section spacing.

Composition nên dùng theme blocks:

- Breadcrumbs.
- Media gallery.
- Product details group.
- USP list.
- Sticky add to cart.

Product details group nên cho phép `@theme` để merchant sắp xếp title, vendor, price, picker, quantity, buy buttons, accordion và app block.

### 9.24. Cart

Section settings:

- Cart layout.
- Item media ratio/size.
- Show vendor.
- Show discount.
- Show order note.
- Upsell hoặc recommendations.
- Color scheme.
- Section spacing.

Blocks:

- Cart items.
- Discount.
- Order note.
- Subtotal.
- Checkout.
- Recommendations.

Cart drawer dùng global settings; cart page dùng section settings.

### 9.25. Page, article và blog

Page header:

- Show title.
- Breadcrumb.
- Alignment.
- Width.
- Color scheme.
- Spacing.

Page content:

- Content width.
- Typography style.
- Color scheme.
- Spacing.

Article:

- Header/meta.
- Featured image.
- Content.
- Share.
- Related posts.

Blog:

- Grid.
- Filtering/tag navigation nếu có.
- Image/date/author/excerpt.
- Pagination.

### 9.26. Utility pages

404:

- Heading.
- Text.
- Return CTA.
- Optional featured links.
- Section frame.

Password:

- Logo/header.
- Newsletter hoặc access form.
- Social/footer.
- Layout riêng `password`.

Gift card:

- Template Liquid độc lập.
- Dùng global logo và typography cơ bản.
- Không cần section schema nếu storefront không chỉnh bằng Theme Editor.

## 10. Theme block library

### 10.1. Generic content blocks

| Block | Setting chính | Có thể lồng |
|---|---|---|
| `heading` | heading, size, tag, alignment | Không |
| `text` | text, size, alignment | Không |
| `button` | label, link, style, new tab | Không |
| `media` | image/video, ratio, focal point | Không |
| `group` | layout, gap, alignment | `@theme` |
| `collapsible-item` | heading, content, open state, icon | Tuỳ kiến trúc |

### 10.2. Product blocks

| Block | Option nên có |
|---|---|
| `product-title` | Heading size, HTML tag |
| `product-vendor` | Không cần option hoặc style nhỏ |
| `product-price` | Size, show compare-at |
| `product-rating` | Source, count visibility |
| `product-badges` | Dùng global badge tokens |
| `product-option-picker` | Picker type, swatch, size chart link |
| `product-quantity` | Thường không cần option |
| `product-buy-buttons` | Layout, quantity, dynamic checkout |
| `product-inventory` | Threshold, low-stock behavior |
| `product-sku` | Thường không cần option |
| `product-description` | Collapsible, truncate hoặc heading |
| `product-metafield` | Namespace/key hoặc dynamic source |
| `product-popup` | Label, page/content source |
| `product-share` | Label, enabled networks |
| `product-accordion` | Heading, content source, icon |
| `product-usp-list` | Layout, icon size, gap |
| `product-benefit-item` | Icon, heading, text, link |
| `product-pickup-availability` | Thường không cần option |
| `product-recommendations` | Source, heading, limit, layout |
| `product-apps` | Cho phép `@app` |
| `product-custom-liquid` | Liquid |
| `product-sticky-add-to-cart` | Enable hoặc breakpoint nếu cần |

### 10.3. Composition lồng nhau

Mẫu product page nên dùng:

- `product-main`
  - Media gallery.
  - Product details group.
    - `@theme` product blocks.
    - Accordion group.
      - Product accordion.
    - USP list.
      - Benefit item.
    - App group.
      - `@app`.
  - Sticky add to cart.

Lợi ích:

- Merchant sắp xếp được chức năng.
- Block có thể tái sử dụng.
- Không cần tạo schema section quá lớn.
- Preset product page có thể thay đổi composition mà không thay markup section.

## 11. Page template recipes

Template chỉ nên chứa section type, block composition, setting value khởi tạo và `order`. Không coi template là nơi định nghĩa option.

| Page type | Cấu trúc đề xuất |
|---|---|
| Home | Hero/slideshow → trust strip → featured collection → collection list → editorial content → social proof → newsletter |
| Product | Product main → product story → details/FAQ → related collection → recently viewed |
| Collection | Optional collection navigation → breadcrumb/header → main collection → editorial content |
| List collections | Page header → collection grid |
| Standard page | Page header → page content |
| About | Hero/image with text → story sections → values/benefits → testimonials → newsletter |
| Contact | Page header → contact form → optional store/contact information |
| FAQ | Page header/hero → category navigation → FAQ/collapsible content |
| Blog | Blog header → main blog listing |
| Article | Article main → related posts → newsletter |
| Search | Search main |
| Cart | Cart main → recommendations |
| Password | Password header → signup/access content → password footer |
| 404 | 404 main → optional featured collection |

### Quy tắc page template

- Header/footer nằm trong section group, không lặp trong từng template.
- Section bắt buộc của system page nên dùng ID ổn định như `main` trong template, nhưng code không phụ thuộc literal section ID.
- Thứ tự section phải kể được flow của trang.
- Không sao chép content của một merchant sang preset dùng chung.
- Media demo dùng placeholder hoặc asset được phép phân phối.
- Dynamic resource nên để trống hoặc dùng resource hợp lệ của demo store.

## 12. Section preset

Preset tốt cần:

- Tên rõ ràng.
- Category nhất quán.
- Setting tối thiểu để section render đẹp.
- Block tối thiểu để nhìn thấy cấu trúc.
- Nội dung trung tính, dễ thay.
- Không gắn resource riêng của một store.
- Không phụ thuộc ID do Shopify sinh.

### Mức default nên dùng

| Loại option | Default đề xuất |
|---|---|
| Layout | Giá trị an toàn và phổ biến nhất |
| Color scheme | Scheme nền sáng mặc định |
| Spacing | Theo spacing scale toàn theme |
| Heading tag | Theo vị trí phổ biến của section, thường `h2` |
| Carousel | Tắt autoplay mặc định |
| Mobile image | Trống để fallback desktop |
| Link | Trống |
| Resource picker | Trống nếu không có resource portable |
| Checkbox phụ | Tắt nếu làm tăng hành vi bất ngờ |

## 13. Theme preset

Theme preset trong `settings_data.json` nên chỉ chứa:

- Design token.
- Color schemes.
- Typography.
- Layout.
- Button/form/card/badge tokens.
- Commerce defaults.
- Motion defaults.

Không nên dùng theme preset làm tài liệu schema vì:

- Nó chỉ là một bộ giá trị.
- Không chứa type, label, min/max hoặc options.
- Có thể bị Theme Editor ghi đè.
- Có thể chứa dữ liệu riêng của merchant.

## 14. Quy tắc implementation

### Liquid

- Section block wrapper phải có `block.shopify_attributes`.
- Không phụ thuộc literal `section.id` hoặc `block.id`.
- Theme block lồng nhau dùng `content_for 'blocks'`.
- App integration dùng `@app`.
- Snippet nhận input qua tham số vì `render` có scope riêng.
- Array trên 50 item phải dùng pagination phù hợp.

### CSS

- Một thuộc tính động: ưu tiên CSS variable.
- Nhiều thuộc tính tạo thành variant: ưu tiên class.
- Global token xuất thành CSS custom properties.
- Không tạo CSS selector dựa vào content merchant.
- Responsive fallback phải hoạt động khi mobile setting trống.

### JavaScript

- Chỉ khởi tạo behavior khi section có tính năng tương ứng.
- Hỗ trợ Theme Editor load/unload section.
- Carousel không chạy autoplay khi chỉ có một item.
- Tôn trọng `prefers-reduced-motion`.
- Không gắn state vào ID instance cố định trong code nguồn.

### Accessibility

- Heading tag theo hierarchy, không theo visual size.
- Image có alt text phù hợp.
- Carousel có label, controls và pause.
- Accordion dùng `details/summary` hoặc ARIA đúng contract.
- Dialog có focus management.
- Button và link không thay thế lẫn nhau chỉ vì style.

## 15. Checklist tái sử dụng

### Global

- [ ] Token toàn theme nằm trong global settings.
- [ ] Color scheme có đủ role.
- [ ] Typography semantic và visual được tách.
- [ ] Button, form, card và badge dùng token chung.

### Section

- [ ] Option theo thứ tự Content → Data → Media → Layout → Mobile → Behavior → Color → Spacing.
- [ ] Dùng section frame bundle thống nhất.
- [ ] Không lặp global token không cần thiết.
- [ ] Preset render được ngay.
- [ ] `enabled_on` và `disabled_on` đúng page/group.

### Block

- [ ] Inline block chỉ dùng khi phụ thuộc section cha.
- [ ] Thành phần dùng lại được chuyển thành theme block.
- [ ] Block wrapper có `block.shopify_attributes`.
- [ ] Block lồng nhau có giới hạn và composition rõ ràng.
- [ ] App content dùng `@app`.

### Contract

- [ ] Một ID chỉ có một type.
- [ ] Một `select` ID chỉ có một vocabulary.
- [ ] Default của `select` nằm trong options.
- [ ] Default của `range` nằm trong min/max.
- [ ] Unit và step nhất quán.
- [ ] Mobile setting có fallback.

### Template và preset

- [ ] Template chỉ compose section/block.
- [ ] Không lưu content merchant trong tài liệu chuẩn.
- [ ] Không phụ thuộc ID instance.
- [ ] Header/footer dùng section group.
- [ ] Preset dùng nội dung trung tính và resource portable.

## 16. Quy trình áp dụng cho theme mới

1. Xác định global design token.
2. Chốt contract ID/type/vocabulary.
3. Tạo generic theme blocks.
4. Tạo product theme blocks.
5. Tạo section archetype bằng các option bundle.
6. Tạo section preset tối thiểu.
7. Compose JSON template theo page recipe.
8. Tạo theme preset cho design direction.
9. Validate schema và chạy Theme Check.
10. Kiểm thử Theme Editor, responsive, accessibility và empty state.

---

Tài liệu này là chuẩn cấu trúc. Khi áp dụng cho theme mới, chỉ chọn những bundle và archetype thực sự cần; không sao chép toàn bộ option vào mọi section.
