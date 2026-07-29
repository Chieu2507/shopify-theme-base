# Tài liệu hệ thống option — Spinel Theme

> Ngày quét: 29/07/2026. Phạm vi: toàn bộ <code>config/</code>, <code>sections/</code>, <code>blocks/</code>, <code>templates/</code> và section group của theme.

## 1. Kết luận nhanh

Theme đang dùng bốn tầng cấu hình khác nhau. Cần giữ tách biệt bốn tầng này khi tái sử dụng hoặc tạo preset mới:

1. **Global theme settings** — định nghĩa tại <code>config/settings_schema.json</code>, đọc bằng <code>settings.&lt;id&gt;</code>. Đây là design token và hành vi dùng toàn site.
2. **Section settings** — định nghĩa trong <code>{% schema %}</code> của từng file <code>sections/*.liquid</code>, đọc bằng <code>section.settings.&lt;id&gt;</code>. Đây là layout/hành vi của một section instance.
3. **Block settings** — có hai dạng: block cục bộ nằm trong schema section, và theme block tái sử dụng nằm ở <code>blocks/*.liquid</code>. Theme block có thể lồng <code>@theme</code>, block cụ thể hoặc <code>@app</code>.
4. **Page/template settings** — các file <code>templates/*.json</code> và <code>sections/*-group.json</code> không định nghĩa option mới; chúng tạo instance, sắp thứ tự, chọn block và lưu giá trị cụ thể. Giá trị không được ghi trong JSON sẽ rơi về default của schema.

Tổng quan lần quét này: **49 section**, **42 theme block**, **16 JSON template**, **2 section group**, **14 nhóm global settings** và **1.287 input option**.

### Cấu trúc nên chuẩn hoá cho theme/preset sau

- Dùng một bộ tên chung cho mọi section: `section_width`, `color_scheme`, `padding_top`, `padding_bottom`, `heading`, `heading_size`, `heading_tag`, `text`, `text_size`.
- Tách option theo thứ tự editor: Nội dung → Nguồn dữ liệu → Media → Layout desktop → Layout mobile → Hành vi → Màu sắc → Spacing.
- Chỉ đưa option thực sự thay đổi markup/CSS ra editor. Option thuần kỹ thuật nên giữ trong code.
- Ưu tiên theme block cho thành phần cần dùng lại hoặc lồng nhau; dùng inline block khi block chỉ có ý nghĩa trong đúng một section.
- Preset section nên chứa bộ block tối thiểu có thể nhìn thấy ngay; template JSON mới chứa nội dung và bố cục trang hoàn chỉnh.
- Global settings nên đóng vai trò token. Section chỉ override khi merchant thực sự cần khác với toàn theme.

### Điểm cần lưu ý khi tái sử dụng

- <code>sections/faq.liquid:103</code> có dấu phẩy thừa ở phần tử cuối của mảng block settings. Bộ quét phải chuẩn hoá mới đọc được schema; nên sửa trước khi dùng làm nguồn chuẩn.
- Hai setting global `logo` và `favicon` chưa có giá trị trong `settings_data.current`; đây là trạng thái hợp lệ nếu merchant chưa chọn ảnh.
- `content_for_index` xuất hiện trong dữ liệu hiện tại nhưng không phải input trong `settings_schema.json`; đây là dữ liệu hệ thống/di sản, không nên đưa vào thư viện option.
- Một số ID giống nhau nhưng dùng type hoặc hệ giá trị khác nhau: `heading`, `text`, `alignment`, `section_width`, `height_desktop`, `height_mobile`, `content_position`, `media_ratio`. Khi xây theme sau nên chọn một contract duy nhất cho từng ID.
- Riêng `section_width` hiện có nhiều vocabulary: `contained/full`, `full/page`, `full/wide`, `contained/full/custom`. Nên chuẩn hoá về một bộ thống nhất và chỉ thêm `custom` khi có setting chiều rộng đi kèm.

## 2. Bản đồ kiến trúc option

| Tầng | Nơi định nghĩa | Nơi lưu giá trị | Phạm vi | Cách truy cập |
|---|---|---|---|---|
| Global | <code>config/settings_schema.json</code> | <code>config/settings_data.json</code> | Toàn theme | <code>settings.&lt;id&gt;</code> |
| Section | Schema trong <code>sections/*.liquid</code> | <code>templates/*.json</code> hoặc section group | Một section instance | <code>section.settings.&lt;id&gt;</code> |
| Inline block | <code>blocks[]</code> trong schema section | Block instance trong template/group | Chỉ section cha | <code>block.settings.&lt;id&gt;</code> |
| Theme block | Schema trong <code>blocks/*.liquid</code> | Block instance, có thể lồng | Tái sử dụng nhiều nơi | <code>block.settings.&lt;id&gt;</code> |
| Preset section | <code>presets[]</code> trong schema section | Shopify dùng khi Add section | Giá trị khởi tạo | Không đọc trực tiếp |
| Page template | <code>templates/*.json</code> | Chính file template | Bố cục một loại trang | Shopify dựng section theo <code>order</code> |

## 3. Các loại input đang sử dụng

| Type | Số lần | Mục đích tái sử dụng |
|---|---:|---|
| <code>article</code> | 2 | Chọn bài viết. |
| <code>checkbox</code> | 138 | Bật/tắt hành vi hoặc thành phần. |
| <code>collection</code> | 8 | Chọn collection. |
| <code>color</code> | 39 | Chọn màu đơn. |
| <code>color_background</code> | 5 | Màu hoặc gradient nền. |
| <code>color_scheme</code> | 55 | Chọn scheme đã định nghĩa toàn theme. |
| <code>color_scheme_group</code> | 1 | Định nghĩa nhóm color scheme toàn theme. |
| <code>font_picker</code> | 2 | Chọn font Shopify. |
| <code>header</code> | 209 | Chia nhóm option trong editor; không tạo dữ liệu. |
| <code>image_picker</code> | 42 | Chọn ảnh. |
| <code>inline_richtext</code> | 9 | Nội dung ngắn có định dạng inline. |
| <code>link_list</code> | 5 | Chọn menu. |
| <code>liquid</code> | 2 | Nhập Custom Liquid; quyền lực cao, cần dùng có chủ đích. |
| <code>page</code> | 3 | Chọn page. |
| <code>paragraph</code> | 7 | Hiển thị hướng dẫn trong editor; không tạo dữ liệu. |
| <code>product</code> | 2 | Chọn product. |
| <code>product_list</code> | 2 | Chọn nhiều product. |
| <code>range</code> | 242 | Giá trị số có min/max/step, phù hợp spacing, size, opacity. |
| <code>richtext</code> | 38 | Nội dung nhiều đoạn có định dạng. |
| <code>select</code> | 399 | Chọn một giá trị từ vocabulary hữu hạn. |
| <code>text</code> | 220 | Chuỗi ngắn hoặc dữ liệu có format. |
| <code>text_alignment</code> | 24 | Căn chữ chuẩn của Shopify. |
| <code>textarea</code> | 4 | Văn bản dài không cần rich text. |
| <code>url</code> | 41 | Liên kết. |
| <code>video</code> | 4 | Chọn video Shopify-hosted. |

## 4. Global theme settings

Nguồn: <code>config/settings_schema.json</code>. Có 116 input trong 14 nhóm. Các hàng <code>header</code> và <code>paragraph</code> chỉ tổ chức giao diện editor.

<details>
<summary>theme_info — 0 input</summary>

_Không có setting._

</details>

<details>
<summary>Brand — 2 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>logo</code> | <code>image_picker</code> | Default logo | ghi chú: Used by the Header and gift cards. |
| <code>favicon</code> | <code>image_picker</code> | Favicon | ghi chú: Use a square image at least 32 × 32 px. |

</details>

<details>
<summary>Navigation — 4 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Mobile menu | — |
| <code>navigation_burger_icon</code> | <code>select</code> | Icon | mặc định <code>two_stripes_wide</code>; giá trị: <code>three_stripes</code>, <code>two_stripes</code>, <code>two_stripes_wide</code> |
| <code>navigation_menu_drawer_style</code> | <code>select</code> | Menu drawer style | mặc định <code>mega</code>; giá trị: <code>accordion</code>, <code>mega</code> |
| — | <code>header</code> | Desktop menu | — |
| <code>navigation_underline_active_link</code> | <code>checkbox</code> | Underline active link | mặc định <code>false</code> |
| <code>navigation_dropdown_icon</code> | <code>select</code> | Dropdown icon | mặc định <code>plus</code>; giá trị: <code>chevron</code>, <code>plus</code>; ghi chú: Shown when nested menu items are added in Navigation settings. |

</details>

<details>
<summary>Colors — 26 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>background_color</code> | <code>color</code> | Background | mặc định <code>#FFFFFF</code> |
| <code>foreground_color</code> | <code>color</code> | Text | mặc định <code>#181818</code> |
| <code>color_schemes</code> | <code>color_scheme_group</code> | — | — |
| — | <code>header</code> | Commerce | — |
| — | <code>header</code> | Cart drawer | — |
| <code>cart_drawer_enabled</code> | <code>checkbox</code> | Use cart drawer | mặc định <code>true</code>; ghi chú: Open the cart drawer after adding a product and when the header cart is selected. |
| <code>cart_drawer_color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code>; hiện khi <code>{{ settings.cart_drawer_enabled }}</code> |
| <code>cart_drawer_width</code> | <code>range</code> | Drawer width | mặc định <code>450</code>; khoảng <code>360</code> → <code>640</code>, bước <code>10</code> <code>px</code>; hiện khi <code>{{ settings.cart_drawer_enabled }}</code> |
| <code>cart_drawer_show_recommendations</code> | <code>checkbox</code> | Show related products | mặc định <code>true</code>; hiện khi <code>{{ settings.cart_drawer_enabled }}</code> |
| <code>cart_drawer_recommendations_limit</code> | <code>range</code> | Related products count | mặc định <code>4</code>; khoảng <code>2</code> → <code>8</code>, bước <code>1</code>; hiện khi <code>{{ settings.cart_drawer_enabled and settings.cart_drawer_show_recommendations }}</code> |
| <code>cart_drawer_show_discount</code> | <code>checkbox</code> | Show discount code | mặc định <code>true</code>; hiện khi <code>{{ settings.cart_drawer_enabled }}</code> |
| <code>cart_drawer_show_order_note</code> | <code>checkbox</code> | Show order note | mặc định <code>true</code>; hiện khi <code>{{ settings.cart_drawer_enabled }}</code> |

**Các field lồng trong <code>color_schemes</code>**

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>background</code> | <code>color</code> | Background | mặc định <code>#FFFFFF</code> |
| <code>background_gradient</code> | <code>color_background</code> | Background gradient | — |
| <code>heading</code> | <code>color</code> | Heading | mặc định <code>#181818</code> |
| <code>text</code> | <code>color</code> | Text | mặc định <code>#6C6C6C</code> |
| <code>variant_overlay</code> | <code>color</code> | Variant overlay | mặc định <code>#5A5A5A</code> |
| <code>variant_border</code> | <code>color</code> | Variant border | mặc định <code>#E6E6E6</code> |
| <code>variant_bar_background</code> | <code>color</code> | Variant bar background | mặc định <code>#E6E6E6</code> |
| <code>variant_component_background</code> | <code>color</code> | Variant component background | mặc định <code>#F2F2F2</code> |
| <code>primary_button</code> | <code>color</code> | Primary button background | mặc định <code>#181818</code> |
| <code>primary_button_label</code> | <code>color</code> | Primary button label | mặc định <code>#FFFFFF</code> |
| <code>primary_button_outline</code> | <code>color</code> | Primary button outline | mặc định <code>#181818</code> |
| <code>secondary_button</code> | <code>color</code> | Secondary button background | mặc định <code>#FFFFFF</code> |
| <code>secondary_button_label</code> | <code>color</code> | Secondary button label | mặc định <code>#1E1E1E</code> |
| <code>secondary_button_outline</code> | <code>color</code> | Secondary button outline | mặc định <code>#ECECEC</code> |
| <code>tertiary_button</code> | <code>color</code> | Tertiary button | mặc định <code>#181818</code> |
| <code>shadow</code> | <code>color</code> | Shadow | mặc định <code>#181818</code> |

</details>

<details>
<summary>Typography — 41 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>paragraph</code> | Set the global font families first, then tune the semantic HTML text styles used across the theme. | — |
| — | <code>header</code> | Font families | — |
| <code>heading_font</code> | <code>font_picker</code> | Heading font | mặc định <code>oranienbaum_n4</code> |
| <code>body_font</code> | <code>font_picker</code> | Body font | mặc định <code>figtree_n4</code> |
| — | <code>header</code> | Heading 1 (h1) | — |
| <code>spinel_h1_size_desktop</code> | <code>select</code> | Desktop size | mặc định <code>44</code>; giá trị: <code>44</code>, <code>48</code>, <code>56</code>, <code>64</code>, <code>72</code>, <code>80</code> |
| <code>spinel_h1_size_mobile</code> | <code>select</code> | Mobile size | mặc định <code>28</code>; giá trị: <code>28</code>, <code>36</code>, <code>40</code>, <code>44</code>, <code>48</code>, <code>52</code> |
| <code>spinel_h1_line_height</code> | <code>select</code> | Line height | mặc định <code>120</code>; giá trị: <code>120</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>h1_tracking</code> | <code>select</code> | Letter spacing | mặc định <code>2</code>; giá trị: <code>2</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>h1_case</code> | <code>select</code> | Text case | mặc định <code>uppercase</code>; giá trị: <code>none</code>, <code>uppercase</code>, <code>lowercase</code> |
| — | <code>header</code> | Heading 2 (h2) | — |
| <code>spinel_h2_size_desktop</code> | <code>select</code> | Desktop size | mặc định <code>32</code>; giá trị: <code>32</code>, <code>36</code>, <code>42</code>, <code>48</code>, <code>56</code>, <code>64</code> |
| <code>spinel_h2_size_mobile</code> | <code>select</code> | Mobile size | mặc định <code>24</code>; giá trị: <code>24</code>, <code>28</code>, <code>32</code>, <code>36</code>, <code>40</code>, <code>44</code> |
| <code>spinel_h2_line_height</code> | <code>select</code> | Line height | mặc định <code>120</code>; giá trị: <code>120</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>h2_tracking</code> | <code>select</code> | Letter spacing | mặc định <code>2</code>; giá trị: <code>2</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>h2_case</code> | <code>select</code> | Text case | mặc định <code>uppercase</code>; giá trị: <code>none</code>, <code>uppercase</code>, <code>lowercase</code> |
| — | <code>header</code> | Heading 3 (h3) | — |
| <code>spinel_h3_size_desktop</code> | <code>select</code> | Desktop size | mặc định <code>26</code>; giá trị: <code>26</code>, <code>28</code>, <code>32</code>, <code>36</code>, <code>40</code>, <code>48</code> |
| <code>spinel_h3_size_mobile</code> | <code>select</code> | Mobile size | mặc định <code>22</code>; giá trị: <code>22</code>, <code>24</code>, <code>26</code>, <code>28</code>, <code>32</code>, <code>36</code> |
| <code>spinel_h3_line_height</code> | <code>select</code> | Line height | mặc định <code>130</code>; giá trị: <code>130</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>h3_tracking</code> | <code>select</code> | Letter spacing | mặc định <code>2</code>; giá trị: <code>2</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>h3_case</code> | <code>select</code> | Text case | mặc định <code>uppercase</code>; giá trị: <code>none</code>, <code>uppercase</code>, <code>lowercase</code> |
| — | <code>header</code> | Heading 4 (h4) | — |
| <code>spinel_h4_size_desktop</code> | <code>select</code> | Desktop size | mặc định <code>20</code>; giá trị: <code>18</code>, <code>20</code>, <code>22</code>, <code>24</code>, <code>28</code> |
| <code>spinel_h4_size_mobile</code> | <code>select</code> | Mobile size | mặc định <code>18</code>; giá trị: <code>16</code>, <code>18</code>, <code>20</code>, <code>22</code>, <code>24</code> |
| <code>spinel_h4_line_height</code> | <code>select</code> | Line height | mặc định <code>140</code>; giá trị: <code>140</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>h4_tracking</code> | <code>select</code> | Letter spacing | mặc định <code>04</code>; giá trị: <code>04</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>h4_case</code> | <code>select</code> | Text case | mặc định <code>uppercase</code>; giá trị: <code>none</code>, <code>uppercase</code>, <code>lowercase</code> |
| — | <code>header</code> | Heading 5 (h5) | — |
| <code>spinel_h5_size_desktop</code> | <code>select</code> | Desktop size | mặc định <code>16</code>; giá trị: <code>16</code>, <code>18</code>, <code>20</code>, <code>22</code>, <code>24</code> |
| <code>spinel_h5_size_mobile</code> | <code>select</code> | Mobile size | mặc định <code>16</code>; giá trị: <code>14</code>, <code>16</code>, <code>18</code>, <code>20</code>, <code>22</code> |
| <code>spinel_h5_line_height</code> | <code>select</code> | Line height | mặc định <code>150</code>; giá trị: <code>150</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>h5_tracking</code> | <code>select</code> | Letter spacing | mặc định <code>04</code>; giá trị: <code>04</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>h5_case</code> | <code>select</code> | Text case | mặc định <code>uppercase</code>; giá trị: <code>none</code>, <code>uppercase</code>, <code>lowercase</code> |
| — | <code>header</code> | Heading 6 (h6) | — |
| <code>spinel_h6_size_desktop</code> | <code>select</code> | Desktop size | mặc định <code>14</code>; giá trị: <code>14</code>, <code>16</code>, <code>18</code>, <code>20</code>, <code>22</code> |
| <code>spinel_h6_size_mobile</code> | <code>select</code> | Mobile size | mặc định <code>14</code>; giá trị: <code>14</code>, <code>16</code>, <code>18</code>, <code>20</code> |
| <code>spinel_h6_line_height</code> | <code>select</code> | Line height | mặc định <code>150</code>; giá trị: <code>150</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>spinel_h6_tracking</code> | <code>select</code> | Letter spacing | mặc định <code>04</code>; giá trị: <code>04</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>spinel_h6_case</code> | <code>select</code> | Text case | mặc định <code>uppercase</code>; giá trị: <code>none</code>, <code>uppercase</code>, <code>lowercase</code> |
| — | <code>header</code> | Paragraph (p) | — |
| <code>body_text_size_desktop</code> | <code>select</code> | Desktop size | mặc định <code>16</code>; giá trị: <code>10</code>, <code>11</code>, <code>12</code>, <code>13</code>, <code>14</code>, <code>15</code>, <code>16</code>, <code>17</code>, <code>18</code>, <code>19</code>, <code>20</code> |
| <code>body_text_size_mobile</code> | <code>select</code> | Mobile size | mặc định <code>16</code>; giá trị: <code>10</code>, <code>11</code>, <code>12</code>, <code>13</code>, <code>14</code>, <code>15</code>, <code>16</code>, <code>17</code>, <code>18</code>, <code>19</code>, <code>20</code> |
| <code>body_text_line_height</code> | <code>select</code> | Line height | mặc định <code>normal</code>; giá trị: <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>body_text_tracking</code> | <code>select</code> | Letter spacing | mặc định <code>normal</code>; giá trị: <code>tight</code>, <code>normal</code>, <code>loose</code> |
| — | <code>header</code> | Eyebrow | — |
| <code>spinel_eyebrow_size_desktop</code> | <code>select</code> | Desktop size | mặc định <code>14</code>; giá trị: <code>10</code>, <code>11</code>, <code>12</code>, <code>13</code>, <code>14</code>, <code>15</code>, <code>16</code> |
| <code>spinel_eyebrow_size_mobile</code> | <code>select</code> | Mobile size | mặc định <code>14</code>; giá trị: <code>10</code>, <code>11</code>, <code>12</code>, <code>13</code>, <code>14</code>, <code>15</code>, <code>16</code> |
| <code>spinel_eyebrow_line_height</code> | <code>select</code> | Line height | mặc định <code>150</code>; giá trị: <code>150</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>spinel_eyebrow_tracking</code> | <code>select</code> | Letter spacing | mặc định <code>2</code>; giá trị: <code>2</code>, <code>tight</code>, <code>normal</code>, <code>loose</code> |
| <code>spinel_eyebrow_case</code> | <code>select</code> | Text case | mặc định <code>uppercase</code>; giá trị: <code>none</code>, <code>uppercase</code>, <code>lowercase</code> |

</details>

<details>
<summary>Layout — 5 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>max_page_width</code> | <code>select</code> | Maximum page width | mặc định <code>100rem</code>; giá trị: <code>90rem</code>, <code>100rem</code>, <code>110rem</code> |
| <code>min_page_margin</code> | <code>range</code> | Minimum page margin | mặc định <code>16</code>; khoảng <code>8</code> → <code>48</code>, bước <code>1</code> <code>px</code> |
| <code>page_margin_desktop</code> | <code>range</code> | Desktop page margin | mặc định <code>48</code>; khoảng <code>16</code> → <code>96</code>, bước <code>2</code> <code>px</code> |
| <code>page_margin_tablet</code> | <code>range</code> | Tablet page margin | mặc định <code>30</code>; khoảng <code>16</code> → <code>64</code>, bước <code>2</code> <code>px</code> |
| <code>page_margin_mobile</code> | <code>range</code> | Mobile page margin | mặc định <code>16</code>; khoảng <code>8</code> → <code>32</code>, bước <code>1</code> <code>px</code> |

</details>

<details>
<summary>Buttons — 14 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>button_radius_style</code> | <code>select</code> | Corner radius | mặc định <code>square</code>; giá trị: <code>square</code>, <code>rounded</code>, <code>pill</code> |
| <code>button_padding_desktop</code> | <code>range</code> | Desktop and tablet horizontal padding | mặc định <code>28</code>; khoảng <code>16</code> → <code>48</code>, bước <code>1</code> <code>px</code> |
| <code>button_padding_mobile</code> | <code>range</code> | Mobile horizontal padding | mặc định <code>24</code>; khoảng <code>16</code> → <code>40</code>, bước <code>1</code> <code>px</code> |
| <code>disabled_opacity</code> | <code>range</code> | Disabled opacity | mặc định <code>60</code>; khoảng <code>0</code> → <code>100</code>, bước <code>5</code> <code>%</code> |
| — | <code>paragraph</code> | Controls shared button typography without changing the current layout sizing controls. | — |
| — | <code>header</code> | Primary button | — |
| <code>primary_button_font</code> | <code>select</code> | Typeface | mặc định <code>body</code>; giá trị: <code>body</code>, <code>heading</code> |
| <code>primary_button_text_transform</code> | <code>select</code> | Text case | mặc định <code>uppercase</code>; giá trị: <code>none</code>, <code>uppercase</code>, <code>capitalize</code> |
| <code>primary_button_border_width</code> | <code>range</code> | Border thickness | mặc định <code>1</code>; khoảng <code>0</code> → <code>4</code>, bước <code>1</code> <code>px</code> |
| — | <code>header</code> | Secondary button | — |
| <code>secondary_button_font</code> | <code>select</code> | Typeface | mặc định <code>body</code>; giá trị: <code>body</code>, <code>heading</code> |
| <code>secondary_button_text_transform</code> | <code>select</code> | Text case | mặc định <code>uppercase</code>; giá trị: <code>none</code>, <code>uppercase</code>, <code>capitalize</code> |
| <code>secondary_button_border_width</code> | <code>range</code> | Border thickness | mặc định <code>1</code>; khoảng <code>0</code> → <code>4</code>, bước <code>1</code> <code>px</code> |
| — | <code>header</code> | Tertiary button | — |
| <code>tertiary_button_font</code> | <code>select</code> | Typeface | mặc định <code>body</code>; giá trị: <code>body</code>, <code>heading</code> |
| <code>tertiary_button_text_transform</code> | <code>select</code> | Text case | mặc định <code>uppercase</code>; giá trị: <code>none</code>, <code>uppercase</code>, <code>capitalize</code> |
| <code>tertiary_button_underline</code> | <code>checkbox</code> | Show underline | mặc định <code>true</code> |
| <code>tertiary_button_underline_offset</code> | <code>range</code> | Underline offset | mặc định <code>3</code>; khoảng <code>0</code> → <code>12</code>, bước <code>1</code> <code>px</code> |

</details>

<details>
<summary>Badges — 6 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>badge_radius_style</code> | <code>select</code> | Corner radius | mặc định <code>square</code>; giá trị: <code>square</code>, <code>rounded</code>, <code>pill</code> |
| — | <code>header</code> | Product status | — |
| <code>sale_price_color</code> | <code>color</code> | Sale price | mặc định <code>#D82727</code> |
| <code>sale_badge_background</code> | <code>color</code> | Sale badge background | mặc định <code>#D82727</code> |
| <code>sale_badge_text</code> | <code>color</code> | Sale badge text | mặc định <code>#FFFFFF</code> |
| <code>sold_out_badge_background</code> | <code>color</code> | Sold-out badge background | mặc định <code>#ADADAD</code> |
| <code>sold_out_badge_text</code> | <code>color</code> | Sold-out badge text | mặc định <code>#181818</code> |

</details>

<details>
<summary>Form — 4 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Form controls | — |
| <code>form_radius_style</code> | <code>select</code> | Corner radius | mặc định <code>square</code>; giá trị: <code>square</code>, <code>rounded</code>, <code>pill</code> |
| <code>input_corner_radius</code> | <code>range</code> | Input corner radius | mặc định <code>0</code>; khoảng <code>0</code> → <code>32</code>, bước <code>1</code> <code>px</code>; hiện khi <code>{{ settings.form_radius_style == 'rounded' }}</code> |
| <code>control_height_desktop</code> | <code>range</code> | Desktop and tablet height | mặc định <code>44</code>; khoảng <code>36</code> → <code>56</code>, bước <code>1</code> <code>px</code> |
| <code>control_height_mobile</code> | <code>range</code> | Mobile height | mặc định <code>40</code>; khoảng <code>36</code> → <code>52</code>, bước <code>1</code> <code>px</code> |

</details>

<details>
<summary>Product — 2 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Variant picker | — |
| <code>variant_picker_radius_style</code> | <code>select</code> | Corner radius | mặc định <code>square</code>; giá trị: <code>square</code>, <code>rounded</code>, <code>pill</code> |
| <code>variant_picker_corner_radius</code> | <code>range</code> | Custom corner radius | mặc định <code>6</code>; khoảng <code>0</code> → <code>32</code>, bước <code>1</code> <code>px</code>; hiện khi <code>{{ settings.variant_picker_radius_style == 'rounded' }}</code> |

</details>

<details>
<summary>Product cards — 8 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>media_card_radius_style</code> | <code>select</code> | Image corner radius | mặc định <code>square</code>; giá trị: <code>square</code>, <code>rounded</code> |
| <code>product_card_image_ratio</code> | <code>select</code> | Default image ratio | mặc định <code>portrait</code>; giá trị: <code>portrait</code>, <code>square</code>, <code>landscape</code> |
| <code>product_card_show_secondary_image</code> | <code>checkbox</code> | Show second image on hover | mặc định <code>true</code> |
| <code>show_product_vendor</code> | <code>checkbox</code> | Show vendor | mặc định <code>false</code> |
| <code>show_compare_at_price</code> | <code>checkbox</code> | Show compare-at price | mặc định <code>true</code> |
| <code>show_variant_indicators</code> | <code>checkbox</code> | Show variant indicators | mặc định <code>true</code> |
| <code>show_sale_badge</code> | <code>checkbox</code> | Show sale badge | mặc định <code>true</code> |
| <code>show_sold_out_badge</code> | <code>checkbox</code> | Show sold-out badge | mặc định <code>true</code> |

</details>

<details>
<summary>Prices — 2 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>show_currency_code</code> | <code>checkbox</code> | Show currency code | mặc định <code>false</code> |
| <code>hide_shipping_content</code> | <code>checkbox</code> | Hide shipping content | mặc định <code>false</code> |

</details>

<details>
<summary>Motion — 1 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>enable_motion</code> | <code>checkbox</code> | Enable interface motion | mặc định <code>true</code> |

</details>

<details>
<summary>Search — 1 input</summary>

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>search_results_per_page</code> | <code>range</code> | Results per page | mặc định <code>20</code>; khoảng <code>8</code> → <code>48</code>, bước <code>4</code> |

</details>

### Snapshot global hiện tại

Nguồn: <code>config/settings_data.json</code>. Theme có preset global <code>Spinel</code>. Hai ảnh thương hiệu chưa được chọn; <code>content_for_index</code> là mảng hệ thống rỗng.

<details>
<summary><code>current</code> — giá trị global đang hoạt động</summary>

| Key | Giá trị đang lưu |
|---|---|
| <code>navigation_burger_icon</code> | <code>two_stripes_wide</code> |
| <code>navigation_menu_drawer_style</code> | <code>mega</code> |
| <code>navigation_underline_active_link</code> | <code>false</code> |
| <code>navigation_dropdown_icon</code> | <code>plus</code> |
| <code>background_color</code> | <code>#FFFFFF</code> |
| <code>foreground_color</code> | <code>#181818</code> |
| <code>cart_drawer_enabled</code> | <code>true</code> |
| <code>cart_drawer_color_scheme</code> | <code>scheme-1</code> |
| <code>cart_drawer_width</code> | <code>450</code> |
| <code>cart_drawer_show_recommendations</code> | <code>true</code> |
| <code>cart_drawer_recommendations_limit</code> | <code>4</code> |
| <code>cart_drawer_show_discount</code> | <code>true</code> |
| <code>cart_drawer_show_order_note</code> | <code>true</code> |
| <code>heading_font</code> | <code>oranienbaum_n4</code> |
| <code>body_font</code> | <code>figtree_n4</code> |
| <code>spinel_h1_size_desktop</code> | <code>56</code> |
| <code>spinel_h1_size_mobile</code> | <code>40</code> |
| <code>spinel_h1_line_height</code> | <code>normal</code> |
| <code>h1_tracking</code> | <code>normal</code> |
| <code>h1_case</code> | <code>none</code> |
| <code>spinel_h2_size_desktop</code> | <code>36</code> |
| <code>spinel_h2_size_mobile</code> | <code>28</code> |
| <code>spinel_h2_line_height</code> | <code>tight</code> |
| <code>h2_tracking</code> | <code>normal</code> |
| <code>h2_case</code> | <code>none</code> |
| <code>spinel_h3_size_desktop</code> | <code>28</code> |
| <code>spinel_h3_size_mobile</code> | <code>24</code> |
| <code>spinel_h3_line_height</code> | <code>normal</code> |
| <code>h3_tracking</code> | <code>normal</code> |
| <code>h3_case</code> | <code>none</code> |
| <code>spinel_h4_size_desktop</code> | <code>20</code> |
| <code>spinel_h4_size_mobile</code> | <code>20</code> |
| <code>spinel_h4_line_height</code> | <code>normal</code> |
| <code>h4_tracking</code> | <code>normal</code> |
| <code>h4_case</code> | <code>none</code> |
| <code>spinel_h5_size_desktop</code> | <code>16</code> |
| <code>spinel_h5_size_mobile</code> | <code>16</code> |
| <code>spinel_h5_line_height</code> | <code>normal</code> |
| <code>h5_tracking</code> | <code>normal</code> |
| <code>h5_case</code> | <code>none</code> |
| <code>spinel_h6_size_desktop</code> | <code>16</code> |
| <code>spinel_h6_size_mobile</code> | <code>16</code> |
| <code>spinel_h6_line_height</code> | <code>normal</code> |
| <code>spinel_h6_tracking</code> | <code>normal</code> |
| <code>spinel_h6_case</code> | <code>none</code> |
| <code>body_text_size_desktop</code> | <code>16</code> |
| <code>body_text_size_mobile</code> | <code>16</code> |
| <code>body_text_line_height</code> | <code>normal</code> |
| <code>body_text_tracking</code> | <code>normal</code> |
| <code>spinel_eyebrow_size_desktop</code> | <code>12</code> |
| <code>spinel_eyebrow_size_mobile</code> | <code>12</code> |
| <code>spinel_eyebrow_line_height</code> | <code>normal</code> |
| <code>spinel_eyebrow_tracking</code> | <code>loose</code> |
| <code>spinel_eyebrow_case</code> | <code>uppercase</code> |
| <code>max_page_width</code> | <code>100rem</code> |
| <code>min_page_margin</code> | <code>16</code> |
| <code>page_margin_desktop</code> | <code>48</code> |
| <code>page_margin_tablet</code> | <code>30</code> |
| <code>page_margin_mobile</code> | <code>16</code> |
| <code>button_radius_style</code> | <code>square</code> |
| <code>button_padding_desktop</code> | <code>28</code> |
| <code>button_padding_mobile</code> | <code>24</code> |
| <code>disabled_opacity</code> | <code>60</code> |
| <code>primary_button_font</code> | <code>body</code> |
| <code>primary_button_text_transform</code> | <code>uppercase</code> |
| <code>primary_button_border_width</code> | <code>1</code> |
| <code>secondary_button_font</code> | <code>body</code> |
| <code>secondary_button_text_transform</code> | <code>uppercase</code> |
| <code>secondary_button_border_width</code> | <code>1</code> |
| <code>tertiary_button_font</code> | <code>body</code> |
| <code>tertiary_button_text_transform</code> | <code>uppercase</code> |
| <code>tertiary_button_underline</code> | <code>true</code> |
| <code>tertiary_button_underline_offset</code> | <code>3</code> |
| <code>badge_radius_style</code> | <code>square</code> |
| <code>sale_price_color</code> | <code>#D82727</code> |
| <code>sale_badge_background</code> | <code>#D82727</code> |
| <code>sale_badge_text</code> | <code>#FFFFFF</code> |
| <code>sold_out_badge_background</code> | <code>#ADADAD</code> |
| <code>sold_out_badge_text</code> | <code>#181818</code> |
| <code>form_radius_style</code> | <code>square</code> |
| <code>input_corner_radius</code> | <code>0</code> |
| <code>control_height_desktop</code> | <code>44</code> |
| <code>control_height_mobile</code> | <code>40</code> |
| <code>variant_picker_radius_style</code> | <code>square</code> |
| <code>variant_picker_corner_radius</code> | <code>6</code> |
| <code>media_card_radius_style</code> | <code>square</code> |
| <code>product_card_image_ratio</code> | <code>portrait</code> |
| <code>product_card_show_secondary_image</code> | <code>true</code> |
| <code>show_product_vendor</code> | <code>false</code> |
| <code>show_compare_at_price</code> | <code>true</code> |
| <code>show_variant_indicators</code> | <code>true</code> |
| <code>show_sale_badge</code> | <code>true</code> |
| <code>show_sold_out_badge</code> | <code>true</code> |
| <code>show_currency_code</code> | <code>true</code> |
| <code>hide_shipping_content</code> | <code>false</code> |
| <code>enable_motion</code> | <code>true</code> |
| <code>search_results_per_page</code> | <code>20</code> |
| <code>content_for_index</code> | <code>[]</code> |
| <code>color_schemes</code> | <code>{"scheme-1":{"settings":{"background":"#ffffff","background_gradient":"","heading":"#181818","text":"#636363","variant_overlay":"#5a5a5a","variant_border":"#e6e6e6","variant_bar_background":"#e6e6e6","variant_component_background":"#f2f2f2","primary_button":"#181818","primary_button_label":"#ffffff","primary_button_outline":"#181818","secondary_button":"#ffffff","secondary_button_label":"#1e1e1e","secondary_button_outline":"#ececec","tertiary_button":"#181818","shadow":"#181818"}},"scheme-2":{"settings":{"background":"#f4efe9","background_gradient":"","heading":"#181818","text":"#636363","variant_overlay":"#212121","variant_border":"#cccccc","variant_bar_background":"#cccccc","variant_component_background":"#e6e6e6","primary_button":"#1e1e1e","primary_button_label":"#ffffff","primary_button_outline":"#1e1e1e","secondary_button":"#ffffff","secondary_button_label":"#1e1e1e","secondary_button_outline":"#d8d8d8","tertiary_button":"#1e1e1e","shadow":"#181818"}},"scheme-3":{"settings":{"background":"#432315","background_gradient":"","heading":"#ffffff","text":"#ffffff","variant_overlay":"#ffffff","variant_border":"#cccccc","variant_bar_background":"#666666","variant_component_background":"#808080","primary_button":"#ffffff","primary_button_label":"#1e1e1e","primary_button_outline":"#ffffff","secondary_button":"rgba(0,0,0,0)","secondary_button_label":"#ffffff","secondary_button_outline":"#FFFFFF","tertiary_button":"#ffffff","shadow":"#181818"}},"scheme-4":{"settings":{"background":"#f9f9f9","background_gradient":"","heading":"#181818","text":"#636363","variant_overlay":"#212121","variant_border":"#cccccc","variant_bar_background":"#cccccc","variant_component_background":"#e6e6e6","primary_button":"#1e1e1e","primary_button_label":"#ffffff","primary_button_outline":"#1e1e1e","secondary_button":"#ffffff","secondary_button_label":"#1e1e1e","secondary_button_outline":"#d8d8d8","tertiary_button":"#1e1e1e","shadow":"#181818"}}}</code> |

</details>

<details>
<summary>Preset global <code>Spinel</code></summary>

| Key | Giá trị đang lưu |
|---|---|
| <code>max_page_width</code> | <code>100rem</code> |
| <code>min_page_margin</code> | <code>16</code> |
| <code>page_margin_desktop</code> | <code>48</code> |
| <code>page_margin_tablet</code> | <code>30</code> |
| <code>page_margin_mobile</code> | <code>16</code> |
| <code>navigation_burger_icon</code> | <code>two_stripes_wide</code> |
| <code>navigation_menu_drawer_style</code> | <code>mega</code> |
| <code>navigation_underline_active_link</code> | <code>false</code> |
| <code>navigation_dropdown_icon</code> | <code>plus</code> |
| <code>cart_drawer_enabled</code> | <code>true</code> |
| <code>cart_drawer_color_scheme</code> | <code>scheme-1</code> |
| <code>cart_drawer_width</code> | <code>450</code> |
| <code>cart_drawer_show_recommendations</code> | <code>true</code> |
| <code>cart_drawer_recommendations_limit</code> | <code>4</code> |
| <code>cart_drawer_show_discount</code> | <code>true</code> |
| <code>cart_drawer_show_order_note</code> | <code>true</code> |
| <code>heading_font</code> | <code>oranienbaum_n4</code> |
| <code>body_font</code> | <code>figtree_n4</code> |
| <code>body_text_size_desktop</code> | <code>16</code> |
| <code>body_text_size_mobile</code> | <code>16</code> |
| <code>body_text_line_height</code> | <code>normal</code> |
| <code>spinel_h1_size_desktop</code> | <code>56</code> |
| <code>spinel_h1_size_mobile</code> | <code>40</code> |
| <code>spinel_h1_line_height</code> | <code>normal</code> |
| <code>spinel_h2_size_desktop</code> | <code>36</code> |
| <code>spinel_h2_size_mobile</code> | <code>28</code> |
| <code>spinel_h2_line_height</code> | <code>tight</code> |
| <code>spinel_h3_size_desktop</code> | <code>28</code> |
| <code>spinel_h3_size_mobile</code> | <code>24</code> |
| <code>spinel_h3_line_height</code> | <code>normal</code> |
| <code>spinel_h4_size_desktop</code> | <code>20</code> |
| <code>spinel_h4_size_mobile</code> | <code>20</code> |
| <code>spinel_h4_line_height</code> | <code>normal</code> |
| <code>spinel_h5_size_desktop</code> | <code>16</code> |
| <code>spinel_h5_size_mobile</code> | <code>16</code> |
| <code>spinel_h5_line_height</code> | <code>normal</code> |
| <code>background_color</code> | <code>#FFFFFF</code> |
| <code>foreground_color</code> | <code>#181818</code> |
| <code>color_schemes</code> | <code>{"scheme-1":{"settings":{"background":"#FFFFFF","background_gradient":"","heading":"#181818","text":"#636363","variant_overlay":"#5A5A5A","variant_border":"#E6E6E6","variant_bar_background":"#E6E6E6","variant_component_background":"#F2F2F2","primary_button":"#181818","primary_button_label":"#FFFFFF","primary_button_outline":"#181818","secondary_button":"#FFFFFF","secondary_button_label":"#1E1E1E","secondary_button_outline":"#ECECEC","tertiary_button":"#181818","shadow":"#181818"}},"scheme-2":{"settings":{"background":"#F4EFE9","background_gradient":"","heading":"#181818","text":"#636363","variant_overlay":"#212121","variant_border":"#CCCCCC","variant_bar_background":"#CCCCCC","variant_component_background":"#E6E6E6","primary_button":"#1E1E1E","primary_button_label":"#FFFFFF","primary_button_outline":"#1E1E1E","secondary_button":"#FFFFFF","secondary_button_label":"#1E1E1E","secondary_button_outline":"#D8D8D8","tertiary_button":"#1E1E1E","shadow":"#181818"}},"scheme-3":{"settings":{"background":"#432315","background_gradient":"","heading":"#FFFFFF","text":"#FFFFFF","variant_overlay":"#FFFFFF","variant_border":"#CCCCCC","variant_bar_background":"#666666","variant_component_background":"#808080","primary_button":"#FFFFFF","primary_button_label":"#1E1E1E","primary_button_outline":"#FFFFFF","secondary_button":"#343434","secondary_button_label":"#FFFFFF","secondary_button_outline":"#181818","tertiary_button":"#FFFFFF","shadow":"#181818"}},"scheme-4":{"settings":{"background":"#F9F9F9","background_gradient":"","heading":"#181818","text":"#636363","variant_overlay":"#212121","variant_border":"#CCCCCC","variant_bar_background":"#CCCCCC","variant_component_background":"#E6E6E6","primary_button":"#1E1E1E","primary_button_label":"#FFFFFF","primary_button_outline":"#1E1E1E","secondary_button":"#FFFFFF","secondary_button_label":"#1E1E1E","secondary_button_outline":"#D8D8D8","tertiary_button":"#1E1E1E","shadow":"#181818"}}}</code> |
| <code>sale_price_color</code> | <code>#D82727</code> |
| <code>sale_badge_background</code> | <code>#D82727</code> |
| <code>sale_badge_text</code> | <code>#FFFFFF</code> |
| <code>sold_out_badge_background</code> | <code>#ADADAD</code> |
| <code>sold_out_badge_text</code> | <code>#181818</code> |
| <code>media_card_radius_style</code> | <code>square</code> |
| <code>badge_radius_style</code> | <code>square</code> |
| <code>form_radius_style</code> | <code>square</code> |
| <code>variant_picker_radius_style</code> | <code>square</code> |
| <code>variant_picker_corner_radius</code> | <code>6</code> |
| <code>input_corner_radius</code> | <code>0</code> |
| <code>control_height_desktop</code> | <code>44</code> |
| <code>control_height_mobile</code> | <code>40</code> |
| <code>button_radius_style</code> | <code>square</code> |
| <code>button_padding_desktop</code> | <code>28</code> |
| <code>button_padding_mobile</code> | <code>24</code> |
| <code>disabled_opacity</code> | <code>60</code> |
| <code>h1_tracking</code> | <code>normal</code> |
| <code>h1_case</code> | <code>none</code> |
| <code>h2_tracking</code> | <code>normal</code> |
| <code>h2_case</code> | <code>none</code> |
| <code>h3_tracking</code> | <code>normal</code> |
| <code>h3_case</code> | <code>none</code> |
| <code>h4_tracking</code> | <code>normal</code> |
| <code>h4_case</code> | <code>none</code> |
| <code>h5_tracking</code> | <code>normal</code> |
| <code>h5_case</code> | <code>none</code> |
| <code>spinel_h6_size_desktop</code> | <code>16</code> |
| <code>spinel_h6_size_mobile</code> | <code>16</code> |
| <code>spinel_h6_line_height</code> | <code>normal</code> |
| <code>spinel_h6_tracking</code> | <code>normal</code> |
| <code>spinel_h6_case</code> | <code>none</code> |
| <code>body_text_tracking</code> | <code>normal</code> |
| <code>spinel_eyebrow_size_desktop</code> | <code>12</code> |
| <code>spinel_eyebrow_size_mobile</code> | <code>12</code> |
| <code>spinel_eyebrow_line_height</code> | <code>normal</code> |
| <code>spinel_eyebrow_tracking</code> | <code>loose</code> |
| <code>spinel_eyebrow_case</code> | <code>uppercase</code> |
| <code>primary_button_font</code> | <code>body</code> |
| <code>primary_button_text_transform</code> | <code>uppercase</code> |
| <code>primary_button_border_width</code> | <code>1</code> |
| <code>secondary_button_font</code> | <code>body</code> |
| <code>secondary_button_text_transform</code> | <code>uppercase</code> |
| <code>secondary_button_border_width</code> | <code>1</code> |
| <code>tertiary_button_font</code> | <code>body</code> |
| <code>tertiary_button_text_transform</code> | <code>uppercase</code> |
| <code>tertiary_button_underline</code> | <code>true</code> |
| <code>tertiary_button_underline_offset</code> | <code>3</code> |
| <code>product_card_image_ratio</code> | <code>portrait</code> |
| <code>product_card_show_secondary_image</code> | <code>true</code> |
| <code>show_product_vendor</code> | <code>false</code> |
| <code>show_compare_at_price</code> | <code>true</code> |
| <code>show_variant_indicators</code> | <code>true</code> |
| <code>show_sale_badge</code> | <code>true</code> |
| <code>show_sold_out_badge</code> | <code>true</code> |
| <code>search_results_per_page</code> | <code>20</code> |
| <code>show_currency_code</code> | <code>true</code> |
| <code>hide_shipping_content</code> | <code>false</code> |
| <code>enable_motion</code> | <code>true</code> |

</details>

## 5. Danh mục section và inline block

Bảng tổng quan trước; phần chi tiết bên dưới liệt kê toàn bộ setting, range, select value, default và điều kiện hiển thị. `Preset` là số cấu hình khởi tạo trong schema, không phải số instance trên trang.

| File | Tên | Section input | Loại block | Preset | Ràng buộc |
|---|---|---:|---:|---:|---|
| <code>sections/404.liquid</code> | 404 page | 11 | 3 | 0 | không giới hạn riêng |
| <code>sections/announcement-bar.liquid</code> | Announcement bar | 8 | 4 | 1 | <code>max_blocks=12</code> |
| <code>sections/article.liquid</code> | Article | 6 | 5 | 1 | không giới hạn riêng |
| <code>sections/blog-posts.liquid</code> | Blog posts | 10 | 2 | 1 | <code>max_blocks=5</code> |
| <code>sections/blog.liquid</code> | Blog | 4 | 3 | 1 | <code>max_blocks=3</code> |
| <code>sections/breadcrumb.liquid</code> | Breadcrumb | 14 | 0 | 1 | <code>enabled_on={"templates":["collection"]}</code> |
| <code>sections/cart.liquid</code> | Cart | 19 | 5 | 1 | không giới hạn riêng |
| <code>sections/collapsible-content.liquid</code> | Collapsible content | 6 | 2 | 1 | không giới hạn riêng |
| <code>sections/collection-list.liquid</code> | Collection list | 19 | 2 | 2 | <code>max_blocks=7</code> |
| <code>sections/collection-showcase.liquid</code> | Collection showcase | 11 | 2 | 1 | không giới hạn riêng |
| <code>sections/collection.liquid</code> | Collection | 17 | 1 | 1 | <code>limit=1</code>, <code>enabled_on={"templates":["collection"]}</code> |
| <code>sections/collections.liquid</code> | Collection list page | 14 | 0 | 1 | không giới hạn riêng |
| <code>sections/contact-form.liquid</code> | Contact form | 15 | 3 | 1 | <code>max_blocks=12</code> |
| <code>sections/countdown-timer.liquid</code> | Countdown timer | 6 | 4 | 1 | <code>max_blocks=4</code> |
| <code>sections/custom-section.liquid</code> | Custom Liquid | 6 | 2 | 1 | không giới hạn riêng |
| <code>sections/faq.liquid</code> | FAQ | 10 | 2 | 1 | <code>max_blocks=30</code> |
| <code>sections/featured-collection.liquid</code> | Featured collection | 8 | 4 | 2 | <code>max_blocks=8</code> |
| <code>sections/featured-product.liquid</code> | Featured product | 8 | 3 | 1 | <code>max_blocks=3</code>, <code>enabled_on={"templates":["index"]}</code> |
| <code>sections/footer.liquid</code> | Footer | 5 | 7 | 1 | <code>max_blocks=10</code> |
| <code>sections/gallery.liquid</code> | Gallery | 8 | 2 | 1 | <code>max_blocks=13</code>, <code>disabled_on={"groups":["header","footer"]}</code> |
| <code>sections/gift-spinel.liquid</code> | Gift Spinel | 24 | 1 | 1 | <code>max_blocks=4</code> |
| <code>sections/header.liquid</code> | Header | 17 | 4 | 1 | <code>max_blocks=16</code>, <code>enabled_on={"groups":["header"]}</code> |
| <code>sections/hero-banner.liquid</code> | Hero banner | 9 | 4 | 1 | <code>max_blocks=6</code> |
| <code>sections/horizontal-banners.liquid</code> | Horizontal scroll banners | 11 | 3 | 1 | <code>max_blocks=8</code> |
| <code>sections/icon-with-text.liquid</code> | Icon with text | 16 | 2 | 1 | <code>max_blocks=9</code>, <code>disabled_on={"groups":["header","footer"]}</code> |
| <code>sections/image-comparison.liquid</code> | Image comparison | 16 | 1 | 1 | <code>max_blocks=2</code>, <code>disabled_on={"groups":["header","footer"]}</code> |
| <code>sections/image-with-text.liquid</code> | Image with text | 7 | 5 | 1 | <code>max_blocks=7</code> |
| <code>sections/newsletter.liquid</code> | Newsletter | 23 | 4 | 1 | không giới hạn riêng |
| <code>sections/offer-flyout.liquid</code> | Newsletter popup | 18 | 2 | 1 | <code>enabled_on={"groups":["footer"]}</code> |
| <code>sections/page-content.liquid</code> | Page content | 7 | 0 | 1 | <code>enabled_on={"templates":["page"]}</code> |
| <code>sections/page-header.liquid</code> | Page header | 14 | 0 | 1 | <code>enabled_on={"templates":["page"]}</code> |
| <code>sections/page.liquid</code> | Page | 12 | 2 | 0 | không giới hạn riêng |
| <code>sections/password-footer.liquid</code> | Password footer | 6 | 0 | 0 | không giới hạn riêng |
| <code>sections/password-header.liquid</code> | Password header | 8 | 0 | 0 | không giới hạn riêng |
| <code>sections/password.liquid</code> | Password | 11 | 3 | 0 | không giới hạn riêng |
| <code>sections/pickup-availability.liquid</code> | Pickup availability | 0 | 0 | 0 | không giới hạn riêng |
| <code>sections/product-featured-collection.liquid</code> | Product collection | 9 | 3 | 1 | <code>max_blocks=3</code> |
| <code>sections/product-main.liquid</code> | Product main | 6 | 5 | 0 | <code>disabled_on={"groups":["header","footer"]}</code> |
| <code>sections/product-recommendations.liquid</code> | Product recommendations | 3 | 0 | 1 | không giới hạn riêng |
| <code>sections/quick-view.liquid</code> | Quick view | 18 | 1 | 0 | <code>enabled_on={"templates":["product"]}</code> |
| <code>sections/recently-viewed-products.liquid</code> | Recently viewed products | 4 | 0 | 1 | không giới hạn riêng |
| <code>sections/scrolling-text.liquid</code> | Scrolling text | 14 | 1 | 1 | <code>max_blocks=12</code> |
| <code>sections/search.liquid</code> | Search results | 16 | 0 | 0 | <code>limit=1</code>, <code>enabled_on={"templates":["search"]}</code> |
| <code>sections/shop-the-look.liquid</code> | Shop the look | 6 | 4 | 1 | <code>max_blocks=8</code> |
| <code>sections/size-chart.liquid</code> | Size chart | 0 | 0 | 1 | <code>enabled_on={"templates":["page"]}</code> |
| <code>sections/slideshow-with-video.liquid</code> | Slideshow with video | 10 | 1 | 1 | <code>max_blocks=8</code> |
| <code>sections/slideshow.liquid</code> | Slideshow | 13 | 1 | 1 | <code>max_blocks=8</code> |
| <code>sections/testimonials.liquid</code> | Testimonials | 14 | 1 | 1 | <code>max_blocks=6</code>, <code>disabled_on={"groups":["header","footer"]}</code> |
| <code>sections/video-banner.liquid</code> | Video banner | 11 | 4 | 1 | <code>max_blocks=4</code> |

<details>
<summary><code>sections/404.liquid</code> — 404 page</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>0</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Background image | — |
| <code>mobile_image</code> | <code>image_picker</code> | Mobile background image | — |
| <code>overlay_opacity</code> | <code>range</code> | Image overlay opacity | mặc định <code>20</code>; khoảng <code>0</code> → <code>75</code>, bước <code>5</code> <code>%</code> |
| <code>height_desktop</code> | <code>range</code> | Desktop height | mặc định <code>560</code>; khoảng <code>400</code> → <code>1000</code>, bước <code>20</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile height | mặc định <code>480</code>; khoảng <code>360</code> → <code>900</code>, bước <code>20</code> <code>px</code> |
| — | <code>header</code> | Layout | — |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>480</code>; khoảng <code>280</code> → <code>680</code>, bước <code>20</code> <code>px</code> |
| <code>content_horizontal</code> | <code>select</code> | Horizontal content position | mặc định <code>center</code>; giá trị: <code>left</code>, <code>center</code>, <code>right</code> |
| <code>content_vertical</code> | <code>select</code> | Vertical content position | mặc định <code>center</code>; giá trị: <code>top</code>, <code>center</code>, <code>bottom</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>contained</code> |
| <code>content_surface</code> | <code>checkbox</code> | Show content surface | mặc định <code>false</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>404 page not found</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>center</code> |

#### Block <code>text</code> — Text

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;The page you requested does not exist.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |

#### Block <code>button</code> — Button

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Return home</code> |
| <code>url</code> | <code>url</code> | Link | — |

</details>

<details>
<summary><code>sections/announcement-bar.liquid</code> — Announcement bar</summary>

Ràng buộc: <code>max_blocks=12</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text_behavior</code> | <code>select</code> | Text block behavior | mặc định <code>rotate</code>; giá trị: <code>rotate</code>, <code>show_all</code> |
| <code>autoplay_interval</code> | <code>range</code> | Autoplay interval | mặc định <code>5</code>; khoảng <code>3</code> → <code>10</code>, bước <code>1</code> <code>s</code>; hiện khi <code>{{ section.settings.text_behavior == 'rotate' }}</code> |
| <code>navigator_style</code> | <code>select</code> | Navigator style | mặc định <code>arrows</code>; giá trị: <code>arrows</code>, <code>dots</code>; hiện khi <code>{{ section.settings.text_behavior == 'rotate' }}</code> |
| <code>font_weight</code> | <code>select</code> | Font weight | mặc định <code>400</code>; giá trị: <code>400</code>, <code>500</code>, <code>600</code> |
| <code>height_desktop</code> | <code>range</code> | Desktop height | mặc định <code>41</code>; khoảng <code>37</code> → <code>60</code>, bước <code>1</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile height | mặc định <code>37</code>; khoảng <code>32</code> → <code>52</code>, bước <code>1</code> <code>px</code> |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>page</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-3</code> |

### Inline/theme block được section cho phép

#### Block <code>social_links</code> — Social links

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>facebook_url</code> | <code>url</code> | Facebook URL | — |
| <code>instagram_url</code> | <code>url</code> | Instagram URL | — |
| <code>pinterest_url</code> | <code>url</code> | Pinterest URL | — |

#### Block <code>text_slide</code> — Text slide

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>inline_richtext</code> | Text | mặc định <code>Free shipping worldwide on orders over $150 USD</code> |

#### Block <code>link</code> — Link

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Shop now</code> |
| <code>url</code> | <code>url</code> | Link | — |
| <code>open_in_new_tab</code> | <code>checkbox</code> | Open in a new tab | mặc định <code>false</code> |

#### Block <code>countdown_timer</code> — Countdown timer

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Offer ends in</code> |
| <code>end_at</code> | <code>text</code> | End date and time | ghi chú: Use ISO 8601 format, for example 2026-12-31T23:59:59Z |

</details>

<details>
<summary><code>sections/article.liquid</code> — Article</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>hero_height</code> | <code>range</code> | Hero height | mặc định <code>520</code>; khoảng <code>320</code> → <code>760</code>, bước <code>20</code> <code>px</code> |
| — | <code>header</code> | Layout | — |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>760</code>; khoảng <code>560</code> → <code>980</code>, bước <code>20</code> <code>px</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>page</code>; giá trị: <code>page</code>, <code>full</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>24</code>; khoảng <code>0</code> → <code>120</code>, bước <code>8</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>article_header</code> — Article header

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>show_image</code> | <code>checkbox</code> | Show article image | mặc định <code>true</code> |
| <code>show_tag</code> | <code>checkbox</code> | Show tag | mặc định <code>true</code> |
| <code>show_excerpt</code> | <code>checkbox</code> | Show excerpt | mặc định <code>true</code> |
| <code>show_date</code> | <code>checkbox</code> | Show date | mặc định <code>true</code> |
| <code>show_author</code> | <code>checkbox</code> | Show author | mặc định <code>true</code> |

#### Block <code>article_content</code> — Article content

Giới hạn: <code>1</code>.

_Không có setting._

#### Block <code>share_links</code> — Share links

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Share this story</code> |
| <code>show_facebook</code> | <code>checkbox</code> | Show Facebook | mặc định <code>true</code> |
| <code>show_x</code> | <code>checkbox</code> | Show X | mặc định <code>true</code> |
| <code>show_email</code> | <code>checkbox</code> | Show email | mặc định <code>true</code> |

#### Block <code>related_articles</code> — Related articles

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Related Posts</code> |
| <code>article_count</code> | <code>range</code> | Articles to show | mặc định <code>3</code>; khoảng <code>2</code> → <code>4</code>, bước <code>1</code> |
| <code>show_date</code> | <code>checkbox</code> | Show date | mặc định <code>true</code> |

#### Block <code>comments</code> — Comments

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Join Our Community</code> |
| <code>show_form</code> | <code>checkbox</code> | Show comment form | mặc định <code>true</code> |
| <code>submit_label</code> | <code>text</code> | Submit button label | mặc định <code>Post comment</code> |
| <code>success_message</code> | <code>text</code> | Success message | mặc định <code>Thanks for sharing your thoughts.</code> |

</details>

<details>
<summary><code>sections/blog-posts.liquid</code> — Blog posts</summary>

Ràng buộc: <code>max_blocks=5</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>media_ratio</code> | <code>select</code> | Image ratio | mặc định <code>landscape</code>; giá trị: <code>landscape</code>, <code>square</code>, <code>portrait</code> |
| <code>show_tags</code> | <code>checkbox</code> | Show tags | mặc định <code>true</code> |
| <code>show_date</code> | <code>checkbox</code> | Show date | mặc định <code>true</code> |
| <code>show_author</code> | <code>checkbox</code> | Show author | mặc định <code>true</code> |
| <code>excerpt_words</code> | <code>range</code> | Excerpt length | mặc định <code>28</code>; khoảng <code>10</code> → <code>50</code>, bước <code>1</code> |
| <code>card_gap</code> | <code>range</code> | Card spacing | mặc định <code>36</code>; khoảng <code>16</code> → <code>64</code>, bước <code>2</code> <code>px</code> |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>page</code>, <code>full</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>header</code> — Header

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Enjoy Our Articles</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Discover the latest updates, insights, and inspirations.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>link_label</code> | <code>text</code> | Link label | mặc định <code>View all</code> |
| <code>link</code> | <code>url</code> | Link | — |

#### Block <code>article</code> — Article

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>article</code> | <code>article</code> | Article | — |
| — | <code>header</code> | Content overrides | — |
| <code>tag</code> | <code>text</code> | Tag override | — |
| <code>title</code> | <code>text</code> | Title override | — |
| <code>excerpt</code> | <code>textarea</code> | Excerpt override | — |
| <code>link</code> | <code>url</code> | Link override | — |
| — | <code>header</code> | Metadata and excerpt | — |
| <code>tag_visibility</code> | <code>select</code> | Tag visibility | mặc định <code>inherit</code>; giá trị: <code>inherit</code>, <code>show</code>, <code>hide</code> |
| <code>date_visibility</code> | <code>select</code> | Date visibility | mặc định <code>inherit</code>; giá trị: <code>inherit</code>, <code>show</code>, <code>hide</code> |
| <code>author_visibility</code> | <code>select</code> | Author visibility | mặc định <code>inherit</code>; giá trị: <code>inherit</code>, <code>show</code>, <code>hide</code> |
| <code>excerpt_visibility</code> | <code>select</code> | Excerpt visibility | mặc định <code>show</code>; giá trị: <code>show</code>, <code>hide</code> |
| <code>excerpt_words</code> | <code>range</code> | Excerpt length | mặc định <code>0</code>; khoảng <code>0</code> → <code>60</code>, bước <code>1</code> |
| — | <code>paragraph</code> | Set excerpt length to 0 to use the section setting. | — |
| — | <code>header</code> | Typography and alignment | — |
| <code>title_size</code> | <code>select</code> | Heading size | mặc định <code>h4</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>excerpt_size</code> | <code>select</code> | Excerpt size | mặc định <code>small</code>; giá trị: <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>content_alignment</code> | <code>text_alignment</code> | Content alignment | mặc định <code>left</code> |
| <code>vertical_alignment</code> | <code>select</code> | Vertical alignment | mặc định <code>center</code>; giá trị: <code>top</code>, <code>center</code>, <code>bottom</code> |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>736</code>; khoảng <code>360</code> → <code>760</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Image | — |
| <code>show_image</code> | <code>checkbox</code> | Show image | mặc định <code>true</code> |
| <code>image</code> | <code>image_picker</code> | Image override | — |
| <code>image_alt</code> | <code>text</code> | Image alt text | — |
| <code>media_ratio</code> | <code>select</code> | Image ratio | mặc định <code>inherit</code>; giá trị: <code>inherit</code>, <code>landscape</code>, <code>square</code>, <code>portrait</code> |
| <code>image_position</code> | <code>select</code> | Image focal point | mặc định <code>center center</code>; giá trị: <code>center center</code>, <code>center top</code>, <code>center bottom</code>, <code>left center</code>, <code>right center</code> |
| <code>media_position</code> | <code>select</code> | Desktop image position | mặc định <code>right</code>; giá trị: <code>right</code>, <code>left</code> |
| <code>mobile_media_position</code> | <code>select</code> | Mobile image position | mặc định <code>top</code>; giá trị: <code>top</code>, <code>bottom</code> |
| <code>media_width</code> | <code>range</code> | Desktop image width | mặc định <code>40</code>; khoảng <code>30</code> → <code>50</code>, bước <code>2</code> <code>%</code> |
| — | <code>header</code> | Link | — |
| <code>link_label</code> | <code>text</code> | Link label | mặc định <code>Read more</code> |
| <code>link_style</code> | <code>select</code> | Link style | mặc định <code>text</code>; giá trị: <code>text</code>, <code>primary</code>, <code>secondary</code> |
| <code>open_in_new_tab</code> | <code>checkbox</code> | Open link in a new tab | mặc định <code>false</code> |

</details>

<details>
<summary><code>sections/blog.liquid</code> — Blog</summary>

Ràng buộc: <code>max_blocks=3</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Theme settings | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>page</code>; giá trị: <code>page</code>, <code>full</code> |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>24</code>; khoảng <code>0</code> → <code>120</code>, bước <code>8</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>header</code> — Blog header

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>eyebrow</code> | <code>text</code> | Eyebrow | mặc định <code>Journal</code> |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Journal</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML tag | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>intro</code> | <code>textarea</code> | Intro | — |

#### Block <code>featured_article</code> — Featured article

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>article</code> | <code>article</code> | Article | — |
| <code>use_latest_article</code> | <code>checkbox</code> | Use newest article when none is selected | mặc định <code>true</code> |
| <code>hero_height</code> | <code>range</code> | Height | mặc định <code>480</code>; khoảng <code>280</code> → <code>760</code>, bước <code>20</code> <code>px</code> |
| <code>show_tag</code> | <code>checkbox</code> | Show tag | mặc định <code>true</code> |
| <code>show_date</code> | <code>checkbox</code> | Show date | mặc định <code>true</code> |
| <code>show_button</code> | <code>checkbox</code> | Show button | mặc định <code>true</code> |
| <code>button_label</code> | <code>text</code> | Button label | mặc định <code>Read story</code> |

#### Block <code>article_grid</code> — Article grid

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>articles_per_page</code> | <code>range</code> | Articles per page | mặc định <code>10</code>; khoảng <code>3</code> → <code>12</code>, bước <code>1</code> |
| <code>card_gap</code> | <code>range</code> | Card gap | mặc định <code>20</code>; khoảng <code>12</code> → <code>48</code>, bước <code>4</code> <code>px</code> |
| <code>show_featured_in_grid</code> | <code>checkbox</code> | Show featured article in grid | mặc định <code>false</code> |
| — | <code>header</code> | Card content | — |
| <code>show_tags</code> | <code>checkbox</code> | Show tags | mặc định <code>true</code> |
| <code>show_date</code> | <code>checkbox</code> | Show date | mặc định <code>true</code> |
| <code>show_author</code> | <code>checkbox</code> | Show author | mặc định <code>false</code> |
| <code>show_excerpt</code> | <code>checkbox</code> | Show excerpts | mặc định <code>true</code> |
| <code>excerpt_words</code> | <code>range</code> | Excerpt length | mặc định <code>18</code>; khoảng <code>8</code> → <code>40</code>, bước <code>2</code> |
| <code>read_more_label</code> | <code>text</code> | Read more label | mặc định <code>Read more</code> |
| — | <code>header</code> | Pagination | — |
| <code>show_pagination</code> | <code>checkbox</code> | Show pagination | mặc định <code>true</code> |

</details>

<details>
<summary><code>sections/breadcrumb.liquid</code> — Breadcrumb</summary>

Ràng buộc: <code>enabled_on={"templates":["collection"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Layout | — |
| <code>alignment</code> | <code>select</code> | Alignment | mặc định <code>flex-start</code>; giá trị: <code>flex-start</code>, <code>center</code>, <code>flex-end</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>contained</code>; giá trị: <code>contained</code>, <code>full</code> |
| <code>text_case</code> | <code>select</code> | Text case | mặc định <code>normal</code>; giá trị: <code>normal</code>, <code>uppercase</code> |
| — | <code>header</code> | Breadcrumb content | — |
| <code>show_home_link</code> | <code>checkbox</code> | Show home link | mặc định <code>true</code> |
| <code>home_label</code> | <code>text</code> | Home label | mặc định <code>Home</code> |
| <code>show_collections_link</code> | <code>checkbox</code> | Show collections link | mặc định <code>true</code> |
| <code>collections_label</code> | <code>text</code> | Collections label | mặc định <code>Collections</code> |
| <code>current_label_source</code> | <code>select</code> | Current page label | mặc định <code>collection</code>; giá trị: <code>collection</code>, <code>custom</code> |
| <code>current_label</code> | <code>text</code> | Custom current page label | — |
| <code>separator_style</code> | <code>select</code> | Separator style | mặc định <code>slash</code>; giá trị: <code>slash</code>, <code>chevron</code>, <code>dot</code> |
| <code>item_gap</code> | <code>range</code> | Item spacing | mặc định <code>8</code>; khoảng <code>4</code> → <code>24</code>, bước <code>2</code> <code>px</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>20</code>; khoảng <code>0</code> → <code>80</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>20</code>; khoảng <code>0</code> → <code>80</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/cart.liquid</code> — Cart</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Bag</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>empty_message</code> | <code>text</code> | Empty message | mặc định <code>Your bag is empty</code> |
| <code>login_label</code> | <code>text</code> | Login button label | mặc định <code>Log in</code> |
| <code>continue_label</code> | <code>text</code> | Continue shopping label | mặc định <code>Continue shopping</code> |
| <code>clear_label</code> | <code>text</code> | Clear bag label | mặc định <code>Clear bag</code> |
| <code>continue_link</code> | <code>url</code> | Continue shopping link | — |
| <code>items_label</code> | <code>text</code> | Items label | mặc định <code>Item</code> |
| <code>price_label</code> | <code>text</code> | Price label | mặc định <code>Price</code> |
| <code>quantity_label</code> | <code>text</code> | Quantity label | mặc định <code>Quantity</code> |
| <code>remove_label</code> | <code>text</code> | Remove label | mặc định <code>Remove</code> |
| <code>update_label</code> | <code>text</code> | Update label | mặc định <code>Update cart</code> |
| <code>summary_heading</code> | <code>text</code> | Summary heading | mặc định <code>Order summary</code> |
| — | <code>header</code> | Layout | — |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>1180</code>; khoảng <code>800</code> → <code>1400</code>, bước <code>20</code> <code>px</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>page</code>; giá trị: <code>page</code>, <code>full</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>40</code>; khoảng <code>0</code> → <code>136</code>, bước <code>8</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>96</code>; khoảng <code>0</code> → <code>176</code>, bước <code>8</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>price</code> — Price

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Subtotal</code> |
| <code>tax_note</code> | <code>text</code> | Tax note | mặc định <code>Taxes and shipping calculated at checkout.</code> |

#### Block <code>checkout_button</code> — Checkout button

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Checkout</code> |

#### Block <code>discount_code</code> — Discount code

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Discount code</code> |
| <code>placeholder</code> | <code>text</code> | Placeholder | mặc định <code>Enter code</code> |
| <code>button_label</code> | <code>text</code> | Button label | mặc định <code>Apply</code> |

#### Block <code>order_note</code> — Order note

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Order note</code> |
| <code>placeholder</code> | <code>text</code> | Placeholder | mặc định <code>Add a note to your order</code> |

#### Block <code>shipping_calculator</code> — Shipping calculator

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Estimate shipping</code> |
| <code>placeholder</code> | <code>text</code> | Postal code placeholder | mặc định <code>Postal code</code> |
| <code>button_label</code> | <code>text</code> | Button label | mặc định <code>Estimate</code> |

</details>

<details>
<summary><code>sections/collapsible-content.liquid</code> — Collapsible content</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |
| — | <code>header</code> | Content | — |
| <code>button_label</code> | <code>text</code> | Button label | mặc định <code>View all FAQs</code> |
| <code>button_link</code> | <code>url</code> | Button link | — |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>contained</code>; giá trị: <code>contained</code>, <code>full</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>More information</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>center</code> |

#### Block <code>item</code> — Item

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Frequently asked question</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h4</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>content</code> | <code>richtext</code> | Content | mặc định <code>&lt;p&gt;Add helpful information for customers.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>open_by_default</code> | <code>checkbox</code> | Open by default | mặc định <code>false</code> |

</details>

<details>
<summary><code>sections/collection-list.liquid</code> — Collection list</summary>

Ràng buộc: <code>max_blocks=7</code>. Preset: <code>2</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>layout</code> | <code>select</code> | Layout | mặc định <code>grid</code>; giá trị: <code>grid</code>, <code>split-promotions</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>page</code> |
| <code>column_gap</code> | <code>range</code> | Column gap | mặc định <code>12</code>; khoảng <code>0</code> → <code>48</code>, bước <code>4</code> <code>px</code> |
| <code>header_gap</code> | <code>range</code> | Header gap | mặc định <code>48</code>; khoảng <code>0</code> → <code>80</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Grid | hiện khi <code>{{ section.settings.layout == 'grid' }}</code> |
| <code>layout_desktop</code> | <code>select</code> | Desktop layout | mặc định <code>slider</code>; giá trị: <code>grid</code>, <code>slider</code>; hiện khi <code>{{ section.settings.layout == 'grid' }}</code> |
| <code>layout_mobile</code> | <code>select</code> | Mobile layout | mặc định <code>slider</code>; giá trị: <code>grid</code>, <code>slider</code>; hiện khi <code>{{ section.settings.layout == 'grid' }}</code> |
| <code>show_pagination</code> | <code>checkbox</code> | Show slider pagination | mặc định <code>true</code>; hiện khi <code>{{ section.settings.layout == 'grid' }}</code> |
| <code>columns_desktop</code> | <code>range</code> | Desktop columns / items | mặc định <code>3</code>; khoảng <code>2</code> → <code>4</code>, bước <code>1</code>; hiện khi <code>{{ section.settings.layout == 'grid' }}</code> |
| <code>columns_mobile</code> | <code>select</code> | Mobile columns / items | mặc định <code>2</code>; giá trị: <code>1</code>, <code>2</code>; hiện khi <code>{{ section.settings.layout == 'grid' }}</code> |
| — | <code>header</code> | Cards | — |
| <code>image_ratio</code> | <code>select</code> | Image ratio | mặc định <code>portrait</code>; giá trị: <code>portrait</code>, <code>square</code>, <code>landscape</code>; hiện khi <code>{{ section.settings.layout == 'grid' }}</code> |
| <code>card_alignment</code> | <code>select</code> | Card text alignment | mặc định <code>left</code>; giá trị: <code>left</code>, <code>center</code>, <code>right</code> |
| <code>card_gap</code> | <code>range</code> | Image to text gap | mặc định <code>20</code>; khoảng <code>8</code> → <code>40</code>, bước <code>4</code> <code>px</code> |
| <code>card_heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>card_heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| — | <code>header</code> | Split promotion heights | hiện khi <code>{{ section.settings.layout == 'split-promotions' }}</code> |
| <code>height_desktop</code> | <code>select</code> | Desktop height | mặc định <code>medium</code>; giá trị: <code>small</code>, <code>medium</code>, <code>large</code>; hiện khi <code>{{ section.settings.layout == 'split-promotions' }}</code> |
| <code>height_mobile</code> | <code>select</code> | Mobile card height | mặc định <code>medium</code>; giá trị: <code>small</code>, <code>medium</code>, <code>large</code>; hiện khi <code>{{ section.settings.layout == 'split-promotions' }}</code> |
| — | <code>header</code> | Spacing | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>10</code>; khoảng <code>0</code> → <code>160</code>, bước <code>2</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Shop By Category</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>center</code> |

#### Block <code>collection_card</code> — Collection card

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Content | — |
| <code>collection</code> | <code>collection</code> | Collection | — |
| <code>title</code> | <code>text</code> | Custom title | — |
| <code>show_product_count</code> | <code>checkbox</code> | Show product count | mặc định <code>true</code>; hiện khi <code>{{ section.settings.layout == 'grid' }}</code>; ghi chú: Uses the selected collection's total product count. |
| <code>eyebrow</code> | <code>text</code> | Eyebrow | hiện khi <code>{{ section.settings.layout == 'split-promotions' }}</code> |
| <code>button_label</code> | <code>text</code> | Button label | hiện khi <code>{{ section.settings.layout == 'split-promotions' }}</code> |
| <code>button_style</code> | <code>select</code> | CTA | mặc định <code>tertiary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code>; hiện khi <code>{{ section.settings.layout == 'split-promotions' }}</code> |
| <code>content_position</code> | <code>select</code> | Text vertical position | mặc định <code>bottom</code>; giá trị: <code>top</code>, <code>center</code>, <code>bottom</code>; hiện khi <code>{{ section.settings.layout == 'split-promotions' }}</code> |
| — | <code>header</code> | Media | — |
| <code>image</code> | <code>image_picker</code> | Custom image | — |
| <code>focal_point</code> | <code>select</code> | Image focal point | mặc định <code>center center</code>; giá trị: <code>left top</code>, <code>center top</code>, <code>right top</code>, <code>left center</code>, <code>center center</code>, <code>right center</code>, <code>left bottom</code>, <code>center bottom</code>, <code>right bottom</code> |
| — | <code>header</code> | Appearance | — |
| <code>override_color_scheme</code> | <code>checkbox</code> | Use custom color scheme | mặc định <code>false</code>; ghi chú: Overrides the Collection list color scheme for this card. |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code>; hiện khi <code>{{ block.settings.override_color_scheme }}</code> |
| — | <code>header</code> | Overlay text on image | — |
| <code>overlay_opacity</code> | <code>range</code> | Overlay opacity | mặc định <code>20</code>; khoảng <code>0</code> → <code>80</code>, bước <code>5</code> <code>%</code> |

</details>

<details>
<summary><code>sections/collection-showcase.liquid</code> — Collection showcase</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>page</code> |
| <code>media_position_desktop</code> | <code>select</code> | Desktop media position | mặc định <code>after</code>; giá trị: <code>before</code>, <code>after</code> |
| <code>media_position_mobile</code> | <code>select</code> | Mobile media position | mặc định <code>after</code>; giá trị: <code>before</code>, <code>after</code> |
| — | <code>header</code> | Section height | — |
| <code>height_desktop</code> | <code>range</code> | Desktop | mặc định <code>812</code>; khoảng <code>640</code> → <code>960</code>, bước <code>4</code> <code>px</code> |
| <code>height_tablet</code> | <code>range</code> | Tablet | mặc định <code>560</code>; khoảng <code>480</code> → <code>800</code>, bước <code>4</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile media | mặc định <code>520</code>; khoảng <code>320</code> → <code>680</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Media display | — |
| <code>media_display</code> | <code>select</code> | Media display | mặc định <code>contained</code>; giá trị: <code>contained</code>, <code>fill</code>; ghi chú: Fill makes media cover its entire column and removes the mobile inset. |
| — | <code>header</code> | Collection link typography | — |
| <code>link_font</code> | <code>select</code> | Font family | mặc định <code>heading</code>; giá trị: <code>heading</code>, <code>body</code>; ghi chú: Uses the fonts selected in Theme settings. |
| <code>link_size</code> | <code>select</code> | Font size | mặc định <code>large</code>; giá trị: <code>small</code>, <code>medium</code>, <code>large</code> |
| — | <code>header</code> | Appearance | — |
| <code>content_color_scheme</code> | <code>color_scheme</code> | Content color scheme | mặc định <code>scheme-3</code> |
| <code>media_color_scheme</code> | <code>color_scheme</code> | Media color scheme | mặc định <code>scheme-2</code> |

### Inline/theme block được section cho phép

#### Block <code>eyebrow</code> — Eyebrow

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>text</code> | Text | mặc định <code>DREAM COME TRUE — AW ‘26 COLLECTION</code> |

#### Block <code>collection_link</code> — Collection link

Giới hạn: <code>6</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>collection</code> | <code>collection</code> | Collection | — |
| <code>image</code> | <code>image_picker</code> | Image for right-hand panel | ghi chú: Choose the image displayed for this collection in the right-hand panel. |
| <code>image_alt</code> | <code>text</code> | Custom image alt text | — |
| <code>focal_point</code> | <code>text</code> | Image focal point | mặc định <code>center center</code>; ghi chú: CSS object-position, for example: 50% 40% |
| <code>title</code> | <code>text</code> | Custom title | — |
| <code>count</code> | <code>text</code> | Custom count (optional) | ghi chú: Leave blank to show the collection's live product count. |
| <code>link</code> | <code>url</code> | Custom link | — |

</details>

<details>
<summary><code>sections/collection.liquid</code> — Collection</summary>

Ràng buộc: <code>limit=1</code>, <code>enabled_on={"templates":["collection"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Collection header | — |
| <code>custom_heading</code> | <code>text</code> | Custom heading | — |
| <code>fallback_description</code> | <code>richtext</code> | Fallback description | mặc định <code>&lt;p&gt;Discover a curated collection where timeless craftsmanship meets modern elegance. Each piece is thoughtfully designed to elevate your everyday style, blending luxurious materials with refined details that shine in every moment.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>show_read_more</code> | <code>checkbox</code> | Show read more control | mặc định <code>true</code> |
| <code>header_padding_top</code> | <code>range</code> | Header top padding | mặc định <code>40</code>; khoảng <code>20</code> → <code>100</code>, bước <code>4</code> <code>px</code> |
| <code>header_padding_bottom</code> | <code>range</code> | Header bottom padding | mặc định <code>40</code>; khoảng <code>20</code> → <code>100</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Product grid | — |
| <code>products_per_page</code> | <code>range</code> | Products per page | mặc định <code>16</code>; khoảng <code>8</code> → <code>40</code>, bước <code>4</code> |
| <code>columns_desktop</code> | <code>range</code> | Desktop columns | mặc định <code>4</code>; khoảng <code>3</code> → <code>5</code>, bước <code>1</code> |
| <code>columns_mobile</code> | <code>select</code> | Mobile columns | mặc định <code>2</code>; giá trị: <code>1</code>, <code>2</code> |
| <code>product_gap</code> | <code>range</code> | Product gap | mặc định <code>4</code>; khoảng <code>0</code> → <code>24</code>, bước <code>4</code> <code>px</code> |
| <code>show_card_actions</code> | <code>checkbox</code> | Show card hover actions | mặc định <code>true</code> |
| <code>enable_quick_view</code> | <code>checkbox</code> | Enable quick view | mặc định <code>true</code> |
| <code>enable_filtering</code> | <code>checkbox</code> | Enable filtering | mặc định <code>true</code> |
| <code>enable_sorting</code> | <code>checkbox</code> | Enable sorting | mặc định <code>true</code> |
| <code>promotion_after</code> | <code>range</code> | Show promotion after product | mặc định <code>4</code>; khoảng <code>2</code> → <code>12</code>, bước <code>1</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_bottom</code> | <code>range</code> | Desktop bottom padding | mặc định <code>56</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>promotion</code> — Promotion

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>eyebrow</code> | <code>text</code> | Eyebrow | — |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>A Curation Of Modern Classics</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>button_label</code> | <code>text</code> | Button label | mặc định <code>Shop now</code> |
| <code>link</code> | <code>url</code> | Link | — |
| <code>content_position</code> | <code>select</code> | Content position | mặc định <code>center</code>; giá trị: <code>top</code>, <code>center</code>, <code>bottom</code> |
| <code>focal_point</code> | <code>select</code> | Image focal point | mặc định <code>center center</code>; giá trị: <code>left top</code>, <code>center top</code>, <code>right top</code>, <code>left center</code>, <code>center center</code>, <code>right center</code>, <code>left bottom</code>, <code>center bottom</code>, <code>right bottom</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>range</code> | Overlay opacity | mặc định <code>20</code>; khoảng <code>0</code> → <code>70</code>, bước <code>5</code> <code>%</code> |

</details>

<details>
<summary><code>sections/collections.liquid</code> — Collection list page</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Collections</code> |
| <code>description</code> | <code>richtext</code> | Description | — |
| — | <code>header</code> | Layout | — |
| <code>text_alignment</code> | <code>select</code> | Header alignment | mặc định <code>center</code>; giá trị: <code>left</code>, <code>center</code>, <code>right</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>page</code>; giá trị: <code>full</code>, <code>page</code> |
| — | <code>header</code> | Collection cards | — |
| <code>image_ratio</code> | <code>select</code> | Image ratio | mặc định <code>portrait</code>; giá trị: <code>portrait</code>, <code>square</code>, <code>landscape</code> |
| <code>card_text_alignment</code> | <code>select</code> | Card text alignment | mặc định <code>left</code>; giá trị: <code>left</code>, <code>center</code>, <code>right</code> |
| <code>show_product_count</code> | <code>checkbox</code> | Show product count | mặc định <code>true</code> |
| <code>columns_desktop</code> | <code>range</code> | Desktop columns | mặc định <code>4</code>; khoảng <code>2</code> → <code>4</code>, bước <code>1</code> |
| <code>columns_mobile</code> | <code>select</code> | Mobile columns | mặc định <code>2</code>; giá trị: <code>1</code>, <code>2</code> |
| <code>grid_gap</code> | <code>range</code> | Grid gap | mặc định <code>16</code>; khoảng <code>4</code> → <code>40</code>, bước <code>2</code> <code>px</code> |
| <code>collections_per_page</code> | <code>range</code> | Collections per page | mặc định <code>12</code>; khoảng <code>4</code> → <code>48</code>, bước <code>4</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Desktop top padding | mặc định <code>72</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Desktop bottom padding | mặc định <code>96</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/contact-form.liquid</code> — Contact form</summary>

Ràng buộc: <code>max_blocks=12</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Media column | — |
| <code>image</code> | <code>image_picker</code> | Studio image | — |
| <code>overlay_opacity</code> | <code>range</code> | Image overlay | mặc định <code>25</code>; khoảng <code>0</code> → <code>80</code>, bước <code>5</code> <code>%</code> |
| <code>height_desktop</code> | <code>range</code> | Desktop height | mặc định <code>620</code>; khoảng <code>420</code> → <code>900</code>, bước <code>10</code> <code>px</code> |
| <code>height_tablet</code> | <code>range</code> | Tablet height | mặc định <code>560</code>; khoảng <code>420</code> → <code>760</code>, bước <code>10</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile image height | mặc định <code>520</code>; khoảng <code>360</code> → <code>760</code>, bước <code>10</code> <code>px</code> |
| <code>media_padding</code> | <code>range</code> | Padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Form column | — |
| <code>submit_label</code> | <code>text</code> | Submit button label | mặc định <code>Submit now</code> |
| <code>success_message</code> | <code>text</code> | Success message | mặc định <code>Thanks for contacting us. We will be in touch shortly.</code> |
| <code>content_padding</code> | <code>range</code> | Padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>page</code>; giá trị: <code>page</code>, <code>full</code> |
| <code>media_width</code> | <code>range</code> | Image width | mặc định <code>50</code>; khoảng <code>35</code> → <code>65</code>, bước <code>1</code> <code>%</code> |
| — | <code>header</code> | Section spacing | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>48</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>media_color_scheme</code> | <code>color_scheme</code> | Media color scheme | mặc định <code>scheme-3</code> |
| <code>content_color_scheme</code> | <code>color_scheme</code> | Form color scheme | mặc định <code>scheme-2</code> |

### Inline/theme block được section cho phép

#### Block <code>studio_details</code> — Studio details

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Studio heading | — |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Sydney Studio</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| — | <code>header</code> | Contact details | — |
| <code>address</code> | <code>text</code> | Address | mặc định <code>123 Sample St, Sydney NSW 2000 AU</code> |
| <code>phone</code> | <code>text</code> | Phone | mặc định <code>+1 555 000 000</code> |
| <code>hours</code> | <code>text</code> | Opening hours | mặc định <code>Mon-Sat: 10:00-20:00</code> |
| — | <code>header</code> | Appointment link | — |
| <code>button_label</code> | <code>text</code> | Appointment button label | mặc định <code>Book appointment</code> |
| <code>button_link</code> | <code>url</code> | Appointment button link | — |

#### Block <code>form_intro</code> — Form introduction

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Content | — |
| <code>eyebrow</code> | <code>text</code> | Eyebrow | mặc định <code>Send a message</code> |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Do You Have Any Question?</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Submit the contact form and our team will be in touch shortly.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |

#### Block <code>form_field</code> — Form field

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>field_type</code> | <code>select</code> | Field type | mặc định <code>name</code>; giá trị: <code>name</code>, <code>email</code>, <code>phone</code>, <code>address</code>, <code>message</code> |
| <code>label</code> | <code>text</code> | Label | mặc định <code>Name</code> |
| <code>placeholder</code> | <code>text</code> | Placeholder | — |
| <code>required</code> | <code>checkbox</code> | Required | mặc định <code>true</code> |

</details>

<details>
<summary><code>sections/countdown-timer.liquid</code> — Countdown timer</summary>

Ràng buộc: <code>max_blocks=4</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>mobile_alignment</code> | <code>select</code> | Mobile alignment | mặc định <code>center</code>; giá trị: <code>left</code>, <code>center</code>, <code>right</code> |
| <code>column_gap</code> | <code>range</code> | Column gap | mặc định <code>64</code>; khoảng <code>24</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>page</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Spring Sale</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>left</code> |

#### Block <code>text</code> — Text

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Get 15% off on all products – limited time only!&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |

#### Block <code>countdown</code> — Countdown

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>end_at</code> | <code>text</code> | End date and time | ghi chú: Use ISO 8601 format, for example 2027-12-31T23:59:59+07:00 |
| <code>days_label</code> | <code>text</code> | Days label | mặc định <code>Days</code> |
| <code>hours_label</code> | <code>text</code> | Hours label | mặc định <code>Hours</code> |
| <code>minutes_label</code> | <code>text</code> | Minutes label | mặc định <code>Minutes</code> |
| <code>seconds_label</code> | <code>text</code> | Seconds label | mặc định <code>Seconds</code> |
| <code>aria_label</code> | <code>text</code> | Accessibility label | mặc định <code>Spring Sale countdown</code> |
| <code>completion_behavior</code> | <code>select</code> | When countdown ends | mặc định <code>message</code>; giá trị: <code>message</code>, <code>hide</code> |
| <code>completion_message</code> | <code>text</code> | Completion message | mặc định <code>Spring Sale ended</code> |

#### Block <code>button</code> — Button

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Shop now</code> |
| <code>link</code> | <code>url</code> | Link | — |
| <code>style</code> | <code>select</code> | Style | mặc định <code>primary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code> |

</details>

<details>
<summary><code>sections/custom-section.liquid</code> — Custom Liquid</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>background_image</code> | <code>image_picker</code> | t:labels.background | — |
| <code>custom_liquid</code> | <code>liquid</code> | Custom Liquid | — |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>page</code>; giá trị: <code>page</code>, <code>full</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>@theme</code>

Giới hạn: không đặt.

_Không có setting._

#### Block <code>@app</code>

Giới hạn: không đặt.

_Không có setting._

</details>

<details>
<summary><code>sections/faq.liquid</code> — FAQ</summary>

Ràng buộc: <code>max_blocks=30</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Content | — |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Order &amp; Shipping</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text</code> | <code>richtext</code> | Text | — |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>page</code>, <code>full</code> |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>96</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>empty_message</code> | <code>text</code> | Empty state message | mặc định <code>Add FAQ questions from the Theme Editor.</code> |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>group_heading</code> — FAQ group heading

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Orders</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text</code> | <code>richtext</code> | Text | — |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>anchor_id</code> | <code>text</code> | Anchor ID | mặc định <code>orders</code> |

#### Block <code>question</code> — FAQ question

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>question</code> | <code>text</code> | Question | mặc định <code>How can I track the status of my order?</code> |
| <code>answer</code> | <code>richtext</code> | Answer | mặc định <code>&lt;p&gt;Once your order ships, you will receive a confirmation email with a tracking link.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>default_open</code> | <code>checkbox</code> | Open by default | mặc định <code>false</code> |

</details>

<details>
<summary><code>sections/featured-collection.liquid</code> — Featured collection</summary>

Ràng buộc: <code>max_blocks=8</code>. Preset: <code>2</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>products_to_show</code> | <code>range</code> | Products to show | mặc định <code>4</code>; khoảng <code>3</code> → <code>12</code>, bước <code>1</code> |
| — | <code>header</code> | Layout | — |
| <code>columns_desktop</code> | <code>range</code> | Desktop columns | mặc định <code>4</code>; khoảng <code>2</code> → <code>5</code>, bước <code>1</code> |
| <code>columns_mobile</code> | <code>select</code> | Mobile columns | mặc định <code>1</code>; giá trị: <code>1</code>, <code>2</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>page</code> |
| <code>product_gap</code> | <code>range</code> | Product gap | mặc định <code>12</code>; khoảng <code>0</code> → <code>24</code>, bước <code>2</code> <code>px</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>A considered edit</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>center</code> |

#### Block <code>text</code> — Text

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Bring together the pieces that best express your latest collection.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |

#### Block <code>promotion</code> — Promotion

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>For Effortless Glow</code> |
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Radiant, versatile designs for everyday moments.&lt;/p&gt;</code> |
| <code>button_label</code> | <code>text</code> | Button label | mặc định <code>Shop now</code> |
| <code>link</code> | <code>url</code> | Link | — |
| <code>position</code> | <code>select</code> | Position | mặc định <code>before</code>; giá trị: <code>before</code>, <code>after</code> |
| <code>media_ratio</code> | <code>select</code> | Image ratio | mặc định <code>portrait</code>; giá trị: <code>portrait</code>, <code>adapt</code> |
| <code>focal_point</code> | <code>text_alignment</code> | Image focal point | mặc định <code>center</code> |
| <code>overlay_opacity</code> | <code>range</code> | Overlay opacity | mặc định <code>40</code>; khoảng <code>0</code> → <code>80</code>, bước <code>5</code> <code>%</code> |

#### Block <code>collection_tab</code> — Collection tab

Giới hạn: <code>5</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Tab label | — |
| <code>source</code> | <code>select</code> | Product source | mặc định <code>collection</code>; giá trị: <code>collection</code>, <code>recently_viewed</code> |
| <code>collection</code> | <code>collection</code> | Collection | — |

</details>

<details>
<summary><code>sections/featured-product.liquid</code> — Featured product</summary>

Ràng buộc: <code>max_blocks=3</code>, <code>enabled_on={"templates":["index"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>product</code> | <code>product</code> | Product | — |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Container width | mặc định <code>page</code>; giá trị: <code>page</code>, <code>full</code> |
| <code>desktop_gap</code> | <code>range</code> | Desktop column gap | mặc định <code>64</code>; khoảng <code>24</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| <code>media_width</code> | <code>range</code> | Desktop media width | mặc định <code>58</code>; khoảng <code>40</code> → <code>70</code>, bước <code>1</code> <code>%</code> |
| <code>mobile_gap</code> | <code>range</code> | Mobile content gap | mặc định <code>16</code>; khoảng <code>8</code> → <code>32</code>, bước <code>2</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |
| — | <code>header</code> | Section spacing | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |

### Inline/theme block được section cho phép

#### Block <code>_product-media-gallery</code>

Giới hạn: không đặt.

_Không có setting._

#### Block <code>_product-details</code>

Giới hạn: không đặt.

_Không có setting._

#### Block <code>product-sticky-add-to-cart</code>

Giới hạn: không đặt.

_Không có setting._

</details>

<details>
<summary><code>sections/footer.liquid</code> — Footer</summary>

Ràng buộc: <code>max_blocks=10</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>column_gap</code> | <code>range</code> | Menu column gap | mặc định <code>48</code>; khoảng <code>16</code> → <code>96</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>page</code>; giá trị: <code>full</code>, <code>page</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>128</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>128</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-2</code> |

### Inline/theme block được section cho phép

#### Block <code>newsletter</code> — Newsletter

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Join Our Community</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Join our newsletter to stay up to date on features and releases.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>placeholder</code> | <code>text</code> | Email placeholder | mặc định <code>Enter your email</code> |
| <code>button_label</code> | <code>text</code> | Submit label | mặc định <code>Subscribe</code> |
| <code>disclaimer</code> | <code>richtext</code> | Disclaimer | mặc định <code>&lt;p&gt;By subscribing, you agree to our Terms of Service and Privacy Policy.&lt;/p&gt;</code> |
| — | <code>header</code> | Social links | — |
| <code>facebook_url</code> | <code>url</code> | Facebook URL | — |
| <code>instagram_url</code> | <code>url</code> | Instagram URL | — |
| <code>pinterest_url</code> | <code>url</code> | Pinterest URL | — |
| <code>tiktok_url</code> | <code>url</code> | TikTok URL | — |

#### Block <code>menu</code> — Menu column

Giới hạn: <code>4</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | — |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h4</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>menu</code> | <code>link_list</code> | Menu | mặc định <code>footer</code> |

#### Block <code>wordmark</code> — Large wordmark

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>text</code> | Text | ghi chú: Uses the shop name when left blank. |
| — | <code>header</code> | Typography | — |
| <code>font_size_desktop</code> | <code>range</code> | Desktop font size | mặc định <code>165</code>; khoảng <code>48</code> → <code>240</code>, bước <code>1</code> <code>px</code> |
| <code>font_size_mobile</code> | <code>range</code> | Mobile font size | mặc định <code>72</code>; khoảng <code>32</code> → <code>160</code>, bước <code>1</code> <code>px</code> |

#### Block <code>copyright</code> — Copyright

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>text</code> | Additional text | mặc định <code>All Rights Reserved</code> |

#### Block <code>localization</code> — Localization

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>show_country_selector</code> | <code>checkbox</code> | Show country/currency selector | mặc định <code>true</code> |
| <code>show_language_selector</code> | <code>checkbox</code> | Show language selector | mặc định <code>true</code> |

#### Block <code>legal_menu</code> — Legal links

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>menu</code> | <code>link_list</code> | Menu | mặc định <code>footer</code> |

#### Block <code>payments</code> — Payment methods

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>show_payment_icons</code> | <code>checkbox</code> | Show payment icons | mặc định <code>true</code> |

</details>

<details>
<summary><code>sections/gallery.liquid</code> — Gallery</summary>

Ràng buộc: <code>max_blocks=13</code>, <code>disabled_on={"groups":["header","footer"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Layout | — |
| <code>columns_desktop</code> | <code>range</code> | Desktop columns | mặc định <code>4</code>; khoảng <code>2</code> → <code>6</code>, bước <code>1</code> |
| <code>columns_mobile</code> | <code>select</code> | Mobile columns | mặc định <code>2</code>; giá trị: <code>1</code>, <code>2</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>contained</code>, <code>full</code> |
| <code>content_gap</code> | <code>range</code> | Header to gallery gap | mặc định <code>40</code>; khoảng <code>16</code> → <code>80</code>, bước <code>4</code> <code>px</code> |
| <code>grid_gap</code> | <code>range</code> | Image gap | mặc định <code>8</code>; khoảng <code>0</code> → <code>32</code>, bước <code>2</code> <code>px</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>20</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>header</code> — Header

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Shop The Latest From Instagram</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Follow us on Instagram for the latest updates and inspirations.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>link_label</code> | <code>text</code> | Link label | mặc định <code>View on Instagram</code> |
| <code>link</code> | <code>url</code> | Link | — |

#### Block <code>image</code> — Image

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>image_alt</code> | <code>text</code> | Image alt text | — |
| <code>link</code> | <code>url</code> | Link | — |

</details>

<details>
<summary><code>sections/gift-spinel.liquid</code> — Gift Spinel</summary>

Ràng buộc: <code>max_blocks=4</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>eyebrow</code> | <code>text</code> | Eyebrow | mặc định <code>Gifting, made simple</code> |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Find their gift.</code> |
| <code>intro</code> | <code>richtext</code> | Intro text | mặc định <code>&lt;p&gt;Choose who you are shopping for and we will show you a ready-to-gift jewelry edit.&lt;/p&gt;</code> |
| <code>concierge_label</code> | <code>text</code> | Interaction label | mặc định <code>Gift finder</code> |
| — | <code>header</code> | Recipient choices | — |
| <code>question_recipient</code> | <code>text</code> | Question | mặc định <code>Who are you shopping for?</code> |
| <code>recipient_partner</code> | <code>text</code> | Partner option | mặc định <code>My partner</code> |
| <code>recipient_mother</code> | <code>text</code> | Mother option | mặc định <code>Mum</code> |
| <code>recipient_friend</code> | <code>text</code> | Friend option | mặc định <code>A friend</code> |
| <code>recipient_myself</code> | <code>text</code> | Myself option | mặc định <code>Myself</code> |
| — | <code>header</code> | Fallback gift edit | — |
| — | <code>paragraph</code> | Shown when no gift edit has been configured for the selected recipient. | — |
| <code>fallback_collection</code> | <code>collection</code> | Fallback collection | ghi chú: Supplies product cards and the primary link when no fallback product list or link is selected. |
| <code>fallback_products</code> | <code>product_list</code> | Fallback products | ghi chú: Takes priority over the fallback collection. |
| <code>fallback_heading</code> | <code>text</code> | Fallback heading | mặc định <code>A thoughtful edit, chosen with care.</code> |
| <code>fallback_copy</code> | <code>richtext</code> | Fallback copy | mặc định <code>&lt;p&gt;Considered pieces selected to make the moment feel personal.&lt;/p&gt;</code> |
| <code>fallback_badge</code> | <code>text</code> | Fallback badge | mặc định <code>Your curated gift edit</code> |
| <code>fallback_primary_label</code> | <code>text</code> | Fallback CTA label | mặc định <code>Explore this gift edit</code> |
| <code>fallback_primary_link</code> | <code>url</code> | Fallback CTA link | ghi chú: Uses the fallback collection when empty. |
| — | <code>header</code> | Product cards | — |
| <code>products_to_show</code> | <code>range</code> | Products to show | mặc định <code>3</code>; khoảng <code>3</code> → <code>6</code>, bước <code>1</code> |
| <code>product_columns</code> | <code>select</code> | Desktop product columns | mặc định <code>3</code>; giá trị: <code>2</code>, <code>3</code> |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>page</code>; giá trị: <code>page</code>, <code>full</code> |
| <code>layout_ratio</code> | <code>select</code> | Desktop panel ratio | mặc định <code>balanced</code>; giá trị: <code>balanced</code>, <code>editorial</code>, <code>finder</code> |
| <code>choice_style</code> | <code>select</code> | Choice style | mặc định <code>outline</code>; giá trị: <code>outline</code>, <code>soft</code>, <code>pill</code> |
| <code>padding_top</code> | <code>range</code> | Desktop top padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Desktop bottom padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>gift_path</code> — Gift path

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>paragraph</code> | Create one focused edit for each recipient option. | — |
| — | <code>header</code> | Recipient | — |
| <code>path_label</code> | <code>text</code> | Internal path label | mặc định <code>Recipient gift edit</code>; ghi chú: Use a clear name such as Mother gift edit. |
| <code>recipient</code> | <code>select</code> | Recipient | mặc định <code>partner</code>; giá trị: <code>partner</code>, <code>mother</code>, <code>friend</code>, <code>myself</code> |
| — | <code>header</code> | Products and destination | — |
| <code>result_collection</code> | <code>collection</code> | Result collection | ghi chú: Supplies product cards and the primary link when no product list or link is selected. |
| <code>result_products</code> | <code>product_list</code> | Result products | ghi chú: Takes priority over the result collection. |
| <code>primary_label</code> | <code>text</code> | Primary CTA label | mặc định <code>Explore this gift edit</code> |
| <code>primary_link</code> | <code>url</code> | Primary CTA link | ghi chú: Uses the result collection when empty. |
| — | <code>header</code> | Result copy | — |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>A thoughtful edit, chosen with care.</code>; ghi chú: Supports {recipient}. |
| <code>copy</code> | <code>richtext</code> | Copy | mặc định <code>&lt;p&gt;Chosen for its quiet symbolism and made to become part of their everyday ritual.&lt;/p&gt;</code>; ghi chú: Supports {recipient}. |
| <code>featured_badge</code> | <code>text</code> | Featured badge | mặc định <code>Your curated gift edit</code> |
| — | <code>header</code> | Personalization CTA | — |
| <code>show_personalization</code> | <code>checkbox</code> | Show personalization CTA | mặc định <code>false</code> |
| <code>personalization_label</code> | <code>text</code> | Personalization CTA label | mặc định <code>Make it personal</code> |
| <code>personalization_link</code> | <code>url</code> | Personalization CTA link | — |

</details>

<details>
<summary><code>sections/header.liquid</code> — Header</summary>

Ràng buộc: <code>max_blocks=16</code>, <code>enabled_on={"groups":["header"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>menu</code> | <code>link_list</code> | Menu | mặc định <code>main-menu</code> |
| <code>gift_spinel_menu_item</code> | <code>text</code> | Gift Spinel menu item title | mặc định <code>Gifts</code>; ghi chú: A matching top-level menu item links to the Gift Spinel section on the home page. |
| <code>sticky_behavior</code> | <code>select</code> | Sticky behavior | mặc định <code>none</code>; giá trị: <code>none</code>, <code>always</code> |
| <code>enable_transparent_header</code> | <code>checkbox</code> | Enable transparent header | mặc định <code>false</code>; ghi chú: Overlays the header on the first section. Use a first section with a strong image or video background. |
| <code>show_border</code> | <code>checkbox</code> | Show bottom border | mặc định <code>false</code> |
| <code>height_desktop</code> | <code>range</code> | Desktop height | mặc định <code>84</code>; khoảng <code>64</code> → <code>112</code>, bước <code>2</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Tablet and mobile height | mặc định <code>60</code>; khoảng <code>52</code> → <code>84</code>, bước <code>2</code> <code>px</code> |
| — | <code>header</code> | Mega menu animation | — |
| <code>mega_menu_animation</code> | <code>select</code> | Animation style | mặc định <code>slide_down</code>; giá trị: <code>none</code>, <code>fade</code>, <code>slide_down</code>, <code>scale</code> |
| <code>mega_menu_animation_duration</code> | <code>range</code> | Animation speed | mặc định <code>250</code>; khoảng <code>100</code> → <code>500</code>, bước <code>50</code> <code>ms</code> |
| — | <code>header</code> | Actions | — |
| <code>show_search</code> | <code>checkbox</code> | Show search | mặc định <code>true</code> |
| <code>show_localization</code> | <code>checkbox</code> | Show country and currency | mặc định <code>true</code> |
| <code>show_country_flag</code> | <code>checkbox</code> | Show country flag | mặc định <code>true</code> |
| <code>show_account</code> | <code>checkbox</code> | Show account | mặc định <code>true</code> |
| <code>show_cart</code> | <code>checkbox</code> | Show cart | mặc định <code>true</code> |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>page</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |
| <code>transparent_color_scheme</code> | <code>color_scheme</code> | Transparent header color scheme | mặc định <code>scheme-3</code>; hiện khi <code>{{ section.settings.enable_transparent_header }}</code> |

### Inline/theme block được section cho phép

#### Block <code>logo</code> — Logo

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>text</code> | Logo text | ghi chú: Used when Theme settings → Brand → Default logo is blank. |
| <code>width_desktop</code> | <code>range</code> | Desktop width | mặc định <code>170</code>; khoảng <code>80</code> → <code>280</code>, bước <code>10</code> <code>px</code> |
| <code>width_mobile</code> | <code>range</code> | Tablet and mobile width | mặc định <code>120</code>; khoảng <code>70</code> → <code>180</code>, bước <code>10</code> <code>px</code> |

#### Block <code>menu_badge</code> — Menu badge

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>menu_item</code> | <code>text</code> | Menu item title | ghi chú: Must exactly match a top-level menu item. |
| <code>text</code> | <code>text</code> | Badge text | mặc định <code>New</code> |

#### Block <code>mega_menu</code> — Mega menu

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>menu_item</code> | <code>text</code> | Top-level menu item | ghi chú: Enter one or more top-level menu item titles, separated by semicolons (for example: Collection;Shop). Each item must have child links. |
| <code>menu</code> | <code>link_list</code> | Mega menu links | ghi chú: Optional. Uses the top-level item's child links when empty. |
| <code>column_heading</code> | <code>text</code> | Column heading | mặc định <code>Product categories</code> |
| <code>columns</code> | <code>select</code> | Desktop columns | mặc định <code>3</code>; giá trị: <code>2</code>, <code>3</code>, <code>4</code> |

#### Block <code>mega_menu_promo</code> — Mega menu promotion

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>menu_item</code> | <code>text</code> | Top-level menu item | ghi chú: Enter one or more matching top-level menu item titles, separated by semicolons (for example: Collection;Shop). |
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Featured collection</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h4</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text</code> | <code>textarea</code> | Text | mặc định <code>Explore our latest pieces.</code> |
| <code>link_label</code> | <code>text</code> | Link label | mặc định <code>Shop now</code> |
| <code>link</code> | <code>url</code> | Link | — |

</details>

<details>
<summary><code>sections/hero-banner.liquid</code> — Hero banner</summary>

Ràng buộc: <code>max_blocks=6</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Layout | — |
| <code>content_position</code> | <code>select</code> | Content position | mặc định <code>bottom-left</code>; giá trị: <code>bottom-left</code>, <code>bottom-center</code>, <code>bottom-right</code>, <code>center-left</code>, <code>center</code>, <code>center-right</code>, <code>top-left</code>, <code>top-center</code>, <code>top-right</code> |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>600</code>; khoảng <code>280</code> → <code>720</code>, bước <code>20</code> <code>px</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>page</code> |
| — | <code>header</code> | Section height | — |
| <code>height_desktop</code> | <code>range</code> | Desktop | mặc định <code>800</code>; khoảng <code>480</code> → <code>1000</code>, bước <code>20</code> <code>px</code> |
| <code>height_tablet</code> | <code>range</code> | Tablet | mặc định <code>480</code>; khoảng <code>360</code> → <code>800</code>, bước <code>20</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile | mặc định <code>440</code>; khoảng <code>320</code> → <code>720</code>, bước <code>20</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>overlay_color</code> | <code>color</code> | Overlay color | mặc định <code>#181818</code> |
| <code>overlay_opacity</code> | <code>range</code> | Overlay opacity | mặc định <code>20</code>; khoảng <code>0</code> → <code>100</code>, bước <code>5</code> <code>%</code> |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-3</code> |

### Inline/theme block được section cho phép

#### Block <code>media</code> — Media

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>alt_text</code> | <code>text</code> | Alt text | ghi chú: Leave blank to use the image alt text. |
| <code>focal_point</code> | <code>select</code> | Focal point | mặc định <code>center center</code>; giá trị: <code>center center</code>, <code>center top</code>, <code>center bottom</code>, <code>left center</code>, <code>right center</code> |

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Designed for every day</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>left</code> |

#### Block <code>text</code> — Text

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Find the perfect gift to honor someone special this festive season.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>small</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |

#### Block <code>button</code> — Button

Giới hạn: <code>3</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Shop all</code> |
| <code>link</code> | <code>url</code> | Link | — |
| <code>style</code> | <code>select</code> | Style | mặc định <code>primary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>text</code> |

</details>

<details>
<summary><code>sections/horizontal-banners.liquid</code> — Horizontal scroll banners</summary>

Ràng buộc: <code>max_blocks=8</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>accessibility_label</code> | <code>text</code> | Accessibility label | mặc định <code>Featured stories</code> |
| <code>desktop_height</code> | <code>range</code> | Desktop height | mặc định <code>100</code>; khoảng <code>50</code> → <code>100</code>, bước <code>5</code> <code>%</code> |
| <code>mobile_height</code> | <code>range</code> | Mobile height | mặc định <code>70</code>; khoảng <code>50</code> → <code>100</code>, bước <code>5</code> <code>%</code> |
| <code>show_scroll_text</code> | <code>checkbox</code> | Show ‘Scroll down’ text on desktop | mặc định <code>true</code> |
| <code>scroll_text</code> | <code>text</code> | Text | mặc định <code>Scroll down</code> |
| <code>scroll_text_size</code> | <code>select</code> | Text size | mặc định <code>large</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>scroll_text_position</code> | <code>text_alignment</code> | Position | mặc định <code>left</code> |
| <code>animate</code> | <code>checkbox</code> | Animate | mặc định <code>true</code> |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>contained</code> |
| — | <code>header</code> | Appearance | — |
| <code>scroll_text_color</code> | <code>color</code> | Color | mặc định <code>#000000</code> |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>media</code> — Media

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>desktop_size</code> | <code>select</code> | Desktop size | mặc định <code>big</code>; giá trị: <code>big</code>, <code>medium</code>, <code>small</code> |
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>video</code> | <code>video</code> | Video | — |
| <code>image_alt</code> | <code>text</code> | Image alt text | — |
| <code>video_focal_point</code> | <code>select</code> | Video focal point | mặc định <code>center center</code>; giá trị: <code>left top</code>, <code>center top</code>, <code>right top</code>, <code>left center</code>, <code>center center</code>, <code>right center</code>, <code>left bottom</code>, <code>center bottom</code>, <code>right bottom</code> |

#### Block <code>text</code> — Text

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>desktop_size</code> | <code>select</code> | Desktop size | mặc định <code>small</code>; giá trị: <code>big</code>, <code>medium</code>, <code>small</code> |
| <code>center_text</code> | <code>checkbox</code> | Center text | mặc định <code>false</code> |
| <code>vertical_position</code> | <code>select</code> | Vertical content position | mặc định <code>center</code>; giá trị: <code>top</code>, <code>center</code>, <code>bottom</code> |
| <code>horizontal_position</code> | <code>text_alignment</code> | Horizontal content position | mặc định <code>left</code> |
| <code>narrow_content_width</code> | <code>checkbox</code> | Narrow content width | mặc định <code>true</code> |
| <code>context_image</code> | <code>image_picker</code> | Context image | — |
| <code>context_image_width</code> | <code>range</code> | Width | mặc định <code>120</code>; khoảng <code>40</code> → <code>240</code>, bước <code>10</code> <code>px</code> |
| <code>context_image_ratio</code> | <code>select</code> | Image ratio | mặc định <code>original</code>; giá trị: <code>original</code>, <code>square</code>, <code>portrait</code>, <code>narrow_portrait</code>, <code>traditional</code>, <code>landscape</code>, <code>wide</code> |
| <code>context_corner_radius</code> | <code>select</code> | Corner radius | mặc định <code>default</code>; giá trị: <code>default</code>, <code>disabled</code>, <code>small</code>, <code>medium</code>, <code>large</code>, <code>xlarge</code>, <code>xxlarge</code>, <code>round</code>, <code>arc</code> |
| <code>block_link</code> | <code>url</code> | Link | — |
| <code>open_in_new_tab</code> | <code>checkbox</code> | Open link in a new tab | mặc định <code>false</code> |
| <code>number</code> | <code>text</code> | Number | — |
| <code>subheading</code> | <code>text</code> | Subheading | mặc định <code>Sculpted with intention</code> |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Designed for effortless everyday styling</code> |
| <code>text</code> | <code>richtext</code> | Text | — |
| <code>dim_text</code> | <code>checkbox</code> | Dim text | mặc định <code>false</code> |
| <code>button_label</code> | <code>text</code> | Button label | — |
| <code>button_link</code> | <code>url</code> | Button link | — |
| <code>button_open_in_new_tab</code> | <code>checkbox</code> | Open button link in a new tab | mặc định <code>false</code> |
| <code>button_style</code> | <code>select</code> | Button style | mặc định <code>primary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code> |
| — | <code>header</code> | Number | — |
| <code>number_size</code> | <code>select</code> | Number size | mặc định <code>default</code>; giá trị: <code>default</code>, <code>heading_xl</code>, <code>heading_xl_uppercase</code>, <code>heading_l</code>, <code>heading_l_uppercase</code>, <code>heading_m</code>, <code>heading_m_uppercase</code>, <code>heading_s</code>, <code>heading_s_uppercase</code>, <code>heading_xs</code>, <code>heading_xs_uppercase</code>, <code>body_l</code>, <code>body_l_uppercase</code>, <code>body_m</code>, <code>body_m_uppercase</code>, <code>body_s</code>, <code>body_s_uppercase</code>, <code>label</code>, <code>label_uppercase</code> |
| — | <code>header</code> | Subheading | — |
| <code>subheading_size</code> | <code>select</code> | Subheading size | mặc định <code>default</code>; giá trị: <code>default</code>, <code>heading_s</code>, <code>heading_s_uppercase</code>, <code>heading_xs</code>, <code>heading_xs_uppercase</code>, <code>body_l</code>, <code>body_l_uppercase</code>, <code>body_m</code>, <code>body_m_uppercase</code>, <code>body_s</code>, <code>body_s_uppercase</code>, <code>label</code>, <code>label_uppercase</code> |
| <code>subheading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| — | <code>header</code> | Heading | — |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_color_style</code> | <code>select</code> | Heading color | mặc định <code>solid</code>; giá trị: <code>solid</code>, <code>gradient</code> |
| <code>heading_color</code> | <code>color</code> | Solid heading color | mặc định <code>#1B1B1B</code> |
| <code>heading_gradient</code> | <code>color_background</code> | Heading gradient | — |
| — | <code>header</code> | Text | — |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-3</code> |

#### Block <code>media_with_text</code> — Media with text

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>desktop_size</code> | <code>select</code> | Desktop size | mặc định <code>medium</code>; giá trị: <code>big</code>, <code>medium</code>, <code>small</code> |
| <code>content_position</code> | <code>select</code> | Content position | mặc định <code>bottom</code>; giá trị: <code>overlay</code>, <code>top</code>, <code>bottom</code> |
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>video</code> | <code>video</code> | Video | — |
| <code>image_alt</code> | <code>text</code> | Image alt text | — |
| <code>video_focal_point</code> | <code>select</code> | Video focal point | mặc định <code>center center</code>; giá trị: <code>left top</code>, <code>center top</code>, <code>right top</code>, <code>left center</code>, <code>center center</code>, <code>right center</code>, <code>left bottom</code>, <code>center bottom</code>, <code>right bottom</code> |
| <code>image_overlay</code> | <code>color</code> | Image overlay | mặc định <code>#000000</code> |
| <code>image_overlay_gradient</code> | <code>color_background</code> | Image overlay gradient | — |
| <code>image_overlay_opacity</code> | <code>range</code> | Image overlay opacity | mặc định <code>0</code>; khoảng <code>0</code> → <code>100</code>, bước <code>5</code> <code>%</code> |
| <code>fit_media</code> | <code>checkbox</code> | Fit media inside container | mặc định <code>false</code> |
| — | <code>header</code> | Content | — |
| <code>center_text</code> | <code>checkbox</code> | Center text | mặc định <code>true</code> |
| <code>vertical_position</code> | <code>select</code> | Vertical content position | mặc định <code>center</code>; giá trị: <code>top</code>, <code>center</code>, <code>bottom</code> |
| <code>horizontal_position</code> | <code>text_alignment</code> | Horizontal content position | mặc định <code>center</code> |
| <code>narrow_content_width</code> | <code>checkbox</code> | Narrow content width | mặc định <code>true</code> |
| <code>context_image</code> | <code>image_picker</code> | Context image | — |
| <code>context_image_width</code> | <code>range</code> | Width | mặc định <code>120</code>; khoảng <code>40</code> → <code>240</code>, bước <code>10</code> <code>px</code> |
| <code>context_image_ratio</code> | <code>select</code> | Image ratio | mặc định <code>original</code>; giá trị: <code>original</code>, <code>square</code>, <code>portrait</code>, <code>narrow_portrait</code>, <code>traditional</code>, <code>landscape</code>, <code>wide</code> |
| <code>context_corner_radius</code> | <code>select</code> | Corner radius | mặc định <code>default</code>; giá trị: <code>default</code>, <code>disabled</code>, <code>small</code>, <code>medium</code>, <code>large</code>, <code>xlarge</code>, <code>xxlarge</code>, <code>round</code>, <code>arc</code> |
| <code>block_link</code> | <code>url</code> | Link | — |
| <code>open_in_new_tab</code> | <code>checkbox</code> | Open link in a new tab | mặc định <code>false</code> |
| <code>number</code> | <code>text</code> | Number | mặc định <code>1</code> |
| <code>subheading</code> | <code>text</code> | Subheading | — |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Balanced Formulas</code> |
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Balanced proportions and precious details bring effortless rhythm to everyday styling.&lt;/p&gt;</code> |
| <code>dim_text</code> | <code>checkbox</code> | Dim text | mặc định <code>false</code> |
| <code>button_label</code> | <code>text</code> | Button label | mặc định <code>Shop by type</code> |
| <code>button_link</code> | <code>url</code> | Button link | — |
| <code>button_open_in_new_tab</code> | <code>checkbox</code> | Open button link in a new tab | mặc định <code>false</code> |
| <code>button_style</code> | <code>select</code> | Button style | mặc định <code>primary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code> |
| — | <code>header</code> | Number | — |
| <code>number_size</code> | <code>select</code> | Number size | mặc định <code>heading_s</code>; giá trị: <code>default</code>, <code>heading_xl</code>, <code>heading_xl_uppercase</code>, <code>heading_l</code>, <code>heading_l_uppercase</code>, <code>heading_m</code>, <code>heading_m_uppercase</code>, <code>heading_s</code>, <code>heading_s_uppercase</code>, <code>heading_xs</code>, <code>heading_xs_uppercase</code>, <code>body_l</code>, <code>body_l_uppercase</code>, <code>body_m</code>, <code>body_m_uppercase</code>, <code>body_s</code>, <code>body_s_uppercase</code>, <code>label</code>, <code>label_uppercase</code> |
| — | <code>header</code> | Subheading | — |
| <code>subheading_size</code> | <code>select</code> | Subheading size | mặc định <code>default</code>; giá trị: <code>default</code>, <code>heading_s</code>, <code>heading_s_uppercase</code>, <code>heading_xs</code>, <code>heading_xs_uppercase</code>, <code>body_l</code>, <code>body_l_uppercase</code>, <code>body_m</code>, <code>body_m_uppercase</code>, <code>body_s</code>, <code>body_s_uppercase</code>, <code>label</code>, <code>label_uppercase</code> |
| <code>subheading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| — | <code>header</code> | Heading | — |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_color_style</code> | <code>select</code> | Heading color | mặc định <code>solid</code>; giá trị: <code>solid</code>, <code>gradient</code> |
| <code>heading_color</code> | <code>color</code> | Solid heading color | mặc định <code>#1B1B1B</code> |
| <code>heading_gradient</code> | <code>color_background</code> | Heading gradient | — |
| — | <code>header</code> | Text | — |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>large</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| — | <code>header</code> | Appearance | — |
| <code>media_background</code> | <code>color</code> | Media background | mặc định <code>#FFFFFF</code> |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-3</code> |
| <code>background_color</code> | <code>color_background</code> | Background | mặc định <code>#50543B</code> |
| <code>text_color</code> | <code>color</code> | Text | mặc định <code>#FAF6E9</code> |

</details>

<details>
<summary><code>sections/icon-with-text.liquid</code> — Icon with text</summary>

Ràng buộc: <code>max_blocks=9</code>, <code>disabled_on={"groups":["header","footer"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Content | — |
| <code>heading</code> | <code>text</code> | Heading | — |
| — | <code>header</code> | Grid layout | — |
| <code>columns_desktop</code> | <code>range</code> | Desktop columns / items | mặc định <code>4</code>; khoảng <code>2</code> → <code>6</code>, bước <code>1</code> |
| <code>columns_mobile</code> | <code>select</code> | Mobile columns / items | mặc định <code>1</code>; giá trị: <code>1</code>, <code>2</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>contained</code>; giá trị: <code>contained</code>, <code>full</code> |
| <code>item_style</code> | <code>select</code> | Item style | mặc định <code>default</code>; giá trị: <code>with-border</code>, <code>with-background</code>, <code>default</code> |
| <code>icon_size</code> | <code>select</code> | Icon size | mặc định <code>small</code>; giá trị: <code>small</code>, <code>medium</code>, <code>large</code> |
| <code>content_gap</code> | <code>range</code> | Icon to text gap | mặc định <code>24</code>; khoảng <code>8</code> → <code>48</code>, bước <code>4</code> <code>px</code> |
| <code>column_gap</code> | <code>range</code> | Column gap | mặc định <code>28</code>; khoảng <code>0</code> → <code>64</code>, bước <code>4</code> <code>px</code> |
| <code>row_gap</code> | <code>range</code> | Row gap | mặc định <code>40</code>; khoảng <code>16</code> → <code>80</code>, bước <code>4</code> <code>px</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h5</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>10</code>; khoảng <code>0</code> → <code>160</code>, bước <code>2</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>background_color</code> | <code>color</code> | Background color | ghi chú: Optional. Overrides the color scheme background. Clear it to use the color scheme. |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-2</code> |

### Inline/theme block được section cho phép

#### Block <code>header</code> — Header

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Why Choose Us</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Thoughtfully made pieces, designed to be treasured every day.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |

#### Block <code>item</code> — Item

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>icon</code> | <code>image_picker</code> | Icon | — |
| <code>icon_name</code> | <code>select</code> | Default icon | mặc định <code>sparkles</code>; giá trị: <code>sparkles</code>, <code>shield</code>, <code>heart</code>, <code>box</code>; ghi chú: Shown when no custom icon image is selected. |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Quality That Lasts</code> |
| <code>title</code> | <code>text</code> | Title | ghi chú: Overrides the heading when set. |
| <code>anchor_id</code> | <code>text</code> | FAQ anchor ID | ghi chú: Links this item to a matching FAQ group anchor. |
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;For extra peace of mind, every piece is covered by our two-year warranty.&lt;/p&gt;</code> |

</details>

<details>
<summary><code>sections/image-comparison.liquid</code> — Image comparison</summary>

Ràng buộc: <code>max_blocks=2</code>, <code>disabled_on={"groups":["header","footer"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Layout | — |
| <code>layout</code> | <code>select</code> | Layout | mặc định <code>horizontal</code>; giá trị: <code>horizontal</code>, <code>vertical</code> |
| <code>desktop_height</code> | <code>select</code> | Desktop height | mặc định <code>adapt</code>; giá trị: <code>adapt</code>, <code>small</code>, <code>medium</code>, <code>large</code> |
| <code>layout_gap</code> | <code>range</code> | Heading to image gap | mặc định <code>44</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Mobile layout | — |
| <code>mobile_height</code> | <code>select</code> | Mobile height | mặc định <code>adapt</code>; giá trị: <code>adapt</code>, <code>small</code>, <code>medium</code>, <code>large</code> |
| — | <code>header</code> | Heading | — |
| <code>heading</code> | <code>inline_richtext</code> | Heading | mặc định <code>Image comparison</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h4</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>content_alignment</code> | <code>text_alignment</code> | Heading alignment | mặc định <code>center</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>subheading</code> | <code>inline_richtext</code> | Subheading | — |
| <code>description</code> | <code>richtext</code> | Description | — |
| <code>button_label</code> | <code>text</code> | Button label | ghi chú: Leave the label blank to hide the button. |
| <code>button_link</code> | <code>url</code> | Button link | — |
| <code>heading_gap</code> | <code>range</code> | Heading content gap | mặc định <code>16</code>; khoảng <code>0</code> → <code>64</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |
| — | <code>header</code> | Section | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>72</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>72</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |

### Inline/theme block được section cho phép

#### Block <code>image</code> — Image

Giới hạn: <code>2</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>paragraph</code> | Add two image blocks. The first is Before; the second is After. | — |
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>mobile_image</code> | <code>image_picker</code> | Mobile image | — |
| <code>image_alt</code> | <code>text</code> | Image alt text | — |
| <code>subheading</code> | <code>inline_richtext</code> | Subheading | — |
| <code>heading</code> | <code>inline_richtext</code> | Heading | — |
| <code>button_label</code> | <code>text</code> | Button label | ghi chú: Leave the label blank to hide the button. |
| <code>button_link</code> | <code>url</code> | Button link | — |
| <code>content_position</code> | <code>select</code> | Content position | mặc định <code>end</code>; giá trị: <code>start</code>, <code>center</code>, <code>end</code> |
| <code>text_color</code> | <code>color</code> | Text | mặc định <code>#FFFFFF</code> |

</details>

<details>
<summary><code>sections/image-with-text.liquid</code> — Image with text</summary>

Ràng buộc: <code>max_blocks=7</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Layout | — |
| <code>media_position</code> | <code>select</code> | Media position | mặc định <code>left</code>; giá trị: <code>left</code>, <code>right</code> |
| <code>content_alignment</code> | <code>text_alignment</code> | Content alignment | mặc định <code>left</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>page</code>; giá trị: <code>page</code>, <code>full</code> |
| <code>column_gap</code> | <code>range</code> | Column gap | mặc định <code>40</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>96</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>96</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>media</code> — Media

Giới hạn: <code>2</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>alt</code> | <code>text</code> | Image alt text | — |
| <code>desktop_image_ratio</code> | <code>select</code> | Desktop image ratio | mặc định <code>portrait</code>; giá trị: <code>auto</code>, <code>square</code>, <code>portrait</code>, <code>landscape</code> |
| <code>mobile_image_ratio</code> | <code>select</code> | Mobile image ratio | mặc định <code>portrait</code>; giá trị: <code>auto</code>, <code>square</code>, <code>portrait</code>, <code>landscape</code> |
| <code>focal_point</code> | <code>text</code> | Focal point | mặc định <code>center center</code>; ghi chú: Use CSS object-position, for example: 50% 40%. |

#### Block <code>eyebrow</code> — Eyebrow

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>text</code> | Text | mặc định <code>Our mission</code> |

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>More Than Beauty, A Philosophy</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>left</code> |

#### Block <code>text</code> — Text

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;We select materials for their character and durability, creating pieces designed to be used every day.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |

#### Block <code>button</code> — Button

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Read more</code> |
| <code>link</code> | <code>url</code> | Link | — |
| <code>style</code> | <code>select</code> | Style | mặc định <code>tertiary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code> |

</details>

<details>
<summary><code>sections/newsletter.liquid</code> — Newsletter</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Media | — |
| <code>image</code> | <code>image_picker</code> | Image | ghi chú: Landscape (3:2) and wide (16:9) images work best. |
| <code>mobile_image</code> | <code>image_picker</code> | Mobile image | ghi chú: Uses the desktop image when empty. |
| <code>overlay_opacity</code> | <code>range</code> | Image overlay opacity | mặc định <code>0</code>; khoảng <code>0</code> → <code>80</code>, bước <code>5</code> <code>%</code> |
| <code>height_mode</code> | <code>select</code> | Height mode | mặc định <code>percent</code>; giá trị: <code>percent</code>, <code>fixed</code>, <code>adapt</code> |
| <code>height_percent</code> | <code>range</code> | Height | mặc định <code>95</code>; khoảng <code>40</code> → <code>100</code>, bước <code>5</code> <code>%</code>; hiện khi <code>{{ section.settings.height_mode == 'percent' }}</code> |
| <code>height_desktop</code> | <code>range</code> | Desktop height | mặc định <code>720</code>; khoảng <code>400</code> → <code>1000</code>, bước <code>20</code> <code>px</code>; hiện khi <code>{{ section.settings.height_mode == 'fixed' }}</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile height | mặc định <code>620</code>; khoảng <code>360</code> → <code>900</code>, bước <code>20</code> <code>px</code>; hiện khi <code>{{ section.settings.height_mode == 'fixed' }}</code> |
| <code>center_text</code> | <code>checkbox</code> | Center text | mặc định <code>false</code> |
| — | <code>header</code> | Layout | — |
| <code>content_vertical</code> | <code>select</code> | Vertical content position | mặc định <code>center</code>; giá trị: <code>top</code>, <code>center</code>, <code>bottom</code> |
| <code>content_horizontal</code> | <code>select</code> | Horizontal content position | mặc định <code>center</code>; giá trị: <code>left</code>, <code>center</code>, <code>right</code> |
| <code>fill_content_container</code> | <code>checkbox</code> | Fill content container | mặc định <code>true</code> |
| <code>container_width</code> | <code>range</code> | Content container width | mặc định <code>720</code>; khoảng <code>420</code> → <code>1200</code>, bước <code>20</code> <code>px</code> |
| <code>container_width_mobile</code> | <code>range</code> | Mobile content container width | mặc định <code>240</code>; khoảng <code>240</code> → <code>420</code>, bước <code>10</code> <code>px</code> |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>480</code>; khoảng <code>280</code> → <code>720</code>, bước <code>20</code> <code>px</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>wide</code> |
| <code>container_padding</code> | <code>range</code> | Content container padding | mặc định <code>64</code>; khoảng <code>16</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| <code>container_padding_mobile</code> | <code>range</code> | Mobile content container padding | mặc định <code>24</code>; khoảng <code>16</code> → <code>48</code>, bước <code>4</code> <code>px</code> |
| <code>block_gap</code> | <code>range</code> | Space between blocks | mặc định <code>24</code>; khoảng <code>8</code> → <code>48</code>, bước <code>4</code> <code>px</code> |
| <code>show_password_message</code> | <code>checkbox</code> | Show store password message | mặc định <code>true</code>; ghi chú: Only appears on the password page. |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>48</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>48</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>content_color_scheme</code> | <code>color_scheme</code> | Content color scheme | mặc định <code>scheme-1</code>; hiện khi <code>{{ section.settings.fill_content_container }}</code> |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-4</code> |

### Inline/theme block được section cho phép

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Opening soon</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>left</code> |

#### Block <code>line</code> — Line

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>width</code> | <code>select</code> | Width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>half</code>, <code>short</code> |
| <code>thickness</code> | <code>range</code> | Thickness | mặc định <code>1</code>; khoảng <code>1</code> → <code>4</code>, bước <code>1</code> <code>px</code> |
| <code>opacity</code> | <code>range</code> | Opacity | mặc định <code>30</code>; khoảng <code>10</code> → <code>100</code>, bước <code>10</code> <code>%</code> |

#### Block <code>text</code> — Text

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Be the first to know when we launch.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>small</code>; giá trị: <code>small</code>, <code>body</code>, <code>large</code> |

#### Block <code>newsletter_form</code> — Newsletter form

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>email_label</code> | <code>text</code> | Email label | mặc định <code>Email</code> |
| <code>email_placeholder</code> | <code>text</code> | Email placeholder | — |
| <code>hide_label</code> | <code>checkbox</code> | Hide email label | mặc định <code>false</code> |
| <code>show_required_marker</code> | <code>checkbox</code> | Show required marker | mặc định <code>true</code> |
| <code>button_label</code> | <code>text</code> | Button label | mặc định <code>Subscribe</code> |
| <code>button_style</code> | <code>select</code> | Button style | mặc định <code>primary</code>; giá trị: <code>primary</code>, <code>secondary</code> |
| <code>form_layout</code> | <code>select</code> | Form layout | mặc định <code>stacked</code>; giá trị: <code>stacked</code>, <code>inline</code> |
| <code>success_message</code> | <code>text</code> | Success message | mặc định <code>Thank you for subscribing.</code> |

</details>

<details>
<summary><code>sections/offer-flyout.liquid</code> — Newsletter popup</summary>

Ràng buộc: <code>enabled_on={"groups":["footer"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Audience | — |
| <code>hide_for_customers</code> | <code>checkbox</code> | Disable for registered customers | mặc định <code>true</code> |
| — | <code>header</code> | Content | — |
| <code>badge</code> | <code>text</code> | Badge | mặc định <code>Newsletter</code> |
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Get 20% off your first order</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>preference_heading</code> | <code>text</code> | Preference heading | mặc định <code>What styles are you looking for?</code> |
| <code>description</code> | <code>richtext</code> | Description | mặc định <code>&lt;p&gt;Subscribe for updates and exclusive offers. Unsubscribe anytime.&lt;/p&gt;</code> |
| <code>description_size</code> | <code>select</code> | Description size | mặc định <code>small</code>; giá trị: <code>small</code>, <code>base</code>, <code>large</code> |
| <code>center_text</code> | <code>checkbox</code> | Center text | mặc định <code>true</code> |
| — | <code>header</code> | Image | — |
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>show_image_mobile</code> | <code>checkbox</code> | Show image on mobile | mặc định <code>false</code>; hiện khi <code>{{ section.settings.image != blank }}</code> |
| <code>image_ratio</code> | <code>select</code> | Image ratio | mặc định <code>original</code>; giá trị: <code>original</code>, <code>square</code>, <code>landscape</code>, <code>wide</code>, <code>super-wide</code>; hiện khi <code>{{ section.settings.image != blank }}</code> |
| <code>image_link</code> | <code>url</code> | Image link | hiện khi <code>{{ section.settings.image != blank }}</code> |
| <code>image_new_tab</code> | <code>checkbox</code> | Open image link in a new tab | mặc định <code>false</code>; hiện khi <code>{{ section.settings.image_link != blank }}</code> |
| — | <code>header</code> | Reopen tab | — |
| — | <code>paragraph</code> | This tab appears after the customer closes the popup. | — |
| <code>tab_label</code> | <code>text</code> | Label | mặc định <code>Newsletter</code> |
| <code>invert_tab_colors</code> | <code>checkbox</code> | Invert tab colors | mặc định <code>true</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-2</code> |
| — | <code>header</code> | Behavior | — |
| <code>show_delay</code> | <code>range</code> | Popup display delay | mặc định <code>10</code>; khoảng <code>0</code> → <code>60</code>, bước <code>1</code> <code>s</code>; ghi chú: Time a visitor spends on the homepage before the popup opens automatically. |
| <code>frequency</code> | <code>select</code> | Frequency | mặc định <code>1_day</code>; giá trị: <code>once</code>, <code>6_hours</code>, <code>1_day</code>, <code>3_days</code>, <code>1_week</code>, <code>always</code>; ghi chú: Controls when the popup can open automatically again after a customer closes it. |

### Inline/theme block được section cho phép

#### Block <code>preference</code> — Style preference

Giới hạn: <code>6</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Rings</code> |
| <code>customer_tag</code> | <code>text</code> | Customer tag | mặc định <code>Preference: Rings</code>; ghi chú: Added to the customer profile when this option is selected. |

#### Block <code>newsletter</code> — Newsletter

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>email_label</code> | <code>text</code> | Email label | mặc định <code>Email address</code> |
| <code>email_placeholder</code> | <code>text</code> | Email placeholder | mặc định <code>Email address</code> |
| <code>button_label</code> | <code>text</code> | Button label | mặc định <code>Unlock 20% off</code> |

</details>

<details>
<summary><code>sections/page-content.liquid</code> — Page content</summary>

Ràng buộc: <code>enabled_on={"templates":["page"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>800</code>; khoảng <code>480</code> → <code>1400</code>, bước <code>20</code> <code>px</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>contained</code>; giá trị: <code>contained</code>, <code>full</code> |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>0</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_top_mobile</code> | <code>range</code> | Mobile top padding | mặc định <code>0</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom_mobile</code> | <code>range</code> | Mobile bottom padding | mặc định <code>40</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/page-header.liquid</code> — Page header</summary>

Ràng buộc: <code>enabled_on={"templates":["page"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Background image | — |
| <code>mobile_image</code> | <code>image_picker</code> | Mobile background image | — |
| <code>image_overlay_opacity</code> | <code>range</code> | Image overlay opacity | mặc định <code>20</code>; khoảng <code>0</code> → <code>75</code>, bước <code>5</code> <code>%</code> |
| <code>show_breadcrumbs</code> | <code>checkbox</code> | Show breadcrumbs | mặc định <code>true</code> |
| <code>home_label</code> | <code>text</code> | Home label | mặc định <code>Home</code> |
| <code>show_title</code> | <code>checkbox</code> | Show page title | mặc định <code>true</code> |
| <code>title_size</code> | <code>select</code> | Title size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code> |
| <code>content_alignment</code> | <code>select</code> | Content alignment | mặc định <code>left</code>; giá trị: <code>left</code>, <code>center</code>, <code>right</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>contained</code>; giá trị: <code>contained</code>, <code>full</code> |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>40</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>40</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_top_mobile</code> | <code>range</code> | Mobile top padding | mặc định <code>24</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom_mobile</code> | <code>range</code> | Mobile bottom padding | mặc định <code>24</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/page.liquid</code> — Page</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>0</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Background image | — |
| <code>mobile_image</code> | <code>image_picker</code> | Mobile background image | — |
| <code>overlay_opacity</code> | <code>range</code> | Image overlay opacity | mặc định <code>20</code>; khoảng <code>0</code> → <code>75</code>, bước <code>5</code> <code>%</code> |
| <code>height_desktop</code> | <code>range</code> | Desktop height | mặc định <code>640</code>; khoảng <code>400</code> → <code>1000</code>, bước <code>20</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile height | mặc định <code>520</code>; khoảng <code>360</code> → <code>900</code>, bước <code>20</code> <code>px</code> |
| — | <code>header</code> | Layout | — |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>600</code>; khoảng <code>280</code> → <code>880</code>, bước <code>20</code> <code>px</code> |
| <code>content_horizontal</code> | <code>select</code> | Horizontal content position | mặc định <code>center</code>; giá trị: <code>left</code>, <code>center</code>, <code>right</code> |
| <code>content_vertical</code> | <code>select</code> | Vertical content position | mặc định <code>center</code>; giá trị: <code>top</code>, <code>center</code>, <code>bottom</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>contained</code> |
| <code>show_page_title</code> | <code>checkbox</code> | Show page title | mặc định <code>true</code> |
| <code>content_surface</code> | <code>checkbox</code> | Show content surface | mặc định <code>false</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>eyebrow</code> — Eyebrow

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>text</code> | Text | mặc định <code>Our story</code> |

#### Block <code>button</code> — Button

Giới hạn: <code>2</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Discover the collection</code> |
| <code>url</code> | <code>url</code> | Link | — |

</details>

<details>
<summary><code>sections/password-footer.liquid</code> — Password footer</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>0</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>menu</code> | <code>link_list</code> | Footer menu | — |
| <code>menu_label</code> | <code>text</code> | Footer menu label | mặc định <code>Footer navigation</code> |
| <code>copyright_text</code> | <code>text</code> | Copyright text | ghi chú: Uses the shop name and current year when empty. |
| <code>padding</code> | <code>range</code> | Vertical padding | mặc định <code>20</code>; khoảng <code>12</code> → <code>48</code>, bước <code>4</code> <code>px</code> |
| <code>show_border</code> | <code>checkbox</code> | Show top border | mặc định <code>true</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/password-header.liquid</code> — Password header</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>0</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>logo</code> | <code>image_picker</code> | Logo image | — |
| <code>logo_text</code> | <code>text</code> | Logo text | ghi chú: Used when no logo image is selected. |
| <code>padding</code> | <code>range</code> | Vertical padding | mặc định <code>16</code>; khoảng <code>8</code> → <code>40</code>, bước <code>4</code> <code>px</code> |
| <code>show_border</code> | <code>checkbox</code> | Show bottom border | mặc định <code>false</code> |
| <code>show_password_access</code> | <code>checkbox</code> | Show password access | mặc định <code>true</code> |
| <code>password_link_label</code> | <code>text</code> | Password link label | mặc định <code>Enter with password</code> |
| <code>password_heading</code> | <code>text</code> | Password form heading | mặc định <code>Enter password</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/password.liquid</code> — Password</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>0</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Background image | — |
| <code>mobile_image</code> | <code>image_picker</code> | Mobile background image | — |
| <code>overlay_opacity</code> | <code>range</code> | Image overlay opacity | mặc định <code>20</code>; khoảng <code>0</code> → <code>75</code>, bước <code>5</code> <code>%</code> |
| <code>height_desktop</code> | <code>range</code> | Desktop height | mặc định <code>720</code>; khoảng <code>480</code> → <code>1000</code>, bước <code>20</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile height | mặc định <code>620</code>; khoảng <code>440</code> → <code>900</code>, bước <code>20</code> <code>px</code> |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>480</code>; khoảng <code>320</code> → <code>680</code>, bước <code>20</code> <code>px</code> |
| <code>content_horizontal</code> | <code>select</code> | Horizontal content position | mặc định <code>center</code>; giá trị: <code>left</code>, <code>center</code>, <code>right</code> |
| <code>content_vertical</code> | <code>select</code> | Vertical content position | mặc định <code>center</code>; giá trị: <code>top</code>, <code>center</code>, <code>bottom</code> |
| <code>content_surface</code> | <code>checkbox</code> | Show content surface | mặc định <code>false</code> |
| <code>show_store_message</code> | <code>checkbox</code> | Show store password message | mặc định <code>true</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Opening soon</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>center</code> |

#### Block <code>text</code> — Text

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Be the first to know when we launch.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |

#### Block <code>newsletter</code> — Newsletter

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>email_label</code> | <code>text</code> | Email label | mặc định <code>Email address</code> |
| <code>email_placeholder</code> | <code>text</code> | Email placeholder | mặc định <code>Enter your email</code> |
| <code>button_label</code> | <code>text</code> | Button label | mặc định <code>Notify me</code> |

</details>

<details>
<summary><code>sections/pickup-availability.liquid</code> — Pickup availability</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>0</code>.

### Section settings

_Không có setting._

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/product-featured-collection.liquid</code> — Product collection</summary>

Ràng buộc: <code>max_blocks=3</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>products_to_show</code> | <code>range</code> | Products to show | mặc định <code>6</code>; khoảng <code>3</code> → <code>12</code>, bước <code>1</code> |
| — | <code>header</code> | Layout | — |
| <code>header_alignment</code> | <code>text_alignment</code> | Header alignment | mặc định <code>center</code> |
| <code>columns_desktop</code> | <code>range</code> | Desktop columns | mặc định <code>4</code>; khoảng <code>2</code> → <code>5</code>, bước <code>1</code> |
| <code>columns_mobile</code> | <code>select</code> | Mobile columns | mặc định <code>1</code>; giá trị: <code>1</code>, <code>2</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>page</code> |
| <code>product_gap</code> | <code>range</code> | Product gap | mặc định <code>20</code>; khoảng <code>0</code> → <code>24</code>, bước <code>2</code> <code>px</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>80</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>eyebrow</code> — Eyebrow

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>text</code> | Text | mặc định <code>Curated for your style</code> |

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Featured collection</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |

#### Block <code>collection</code> — Collection

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>source</code> | <code>select</code> | Product source | mặc định <code>collection</code>; giá trị: <code>collection</code>, <code>complementary</code>, <code>related</code> |
| <code>collection</code> | <code>collection</code> | Collection | ghi chú: Used when Product source is Collection. |

</details>

<details>
<summary><code>sections/product-main.liquid</code> — Product main</summary>

Ràng buộc: <code>disabled_on={"groups":["header","footer"]}</code>. Preset: <code>0</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>desktop_gap</code> | <code>range</code> | Desktop column gap | mặc định <code>64</code>; khoảng <code>24</code> → <code>120</code>, bước <code>4</code> <code>px</code> |
| <code>media_width</code> | <code>range</code> | Desktop media width | mặc định <code>58</code>; khoảng <code>50</code> → <code>70</code>, bước <code>1</code> <code>%</code> |
| <code>mobile_gap</code> | <code>range</code> | Mobile content gap | mặc định <code>16</code>; khoảng <code>8</code> → <code>32</code>, bước <code>2</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |
| — | <code>header</code> | Spacing | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>96</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>96</code>; khoảng <code>0</code> → <code>160</code>, bước <code>8</code> <code>px</code> |

### Inline/theme block được section cho phép

#### Block <code>product-breadcrumbs</code>

Giới hạn: không đặt.

_Không có setting._

#### Block <code>_product-media-gallery</code>

Giới hạn: không đặt.

_Không có setting._

#### Block <code>_product-details</code>

Giới hạn: không đặt.

_Không có setting._

#### Block <code>product-usp-list</code>

Giới hạn: không đặt.

_Không có setting._

#### Block <code>product-sticky-add-to-cart</code>

Giới hạn: không đặt.

_Không có setting._

</details>

<details>
<summary><code>sections/product-recommendations.liquid</code> — Product recommendations</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>inline_richtext</code> | Heading | mặc định <code>Complete the set</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>html_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/quick-view.liquid</code> — Quick view</summary>

Ràng buộc: <code>enabled_on={"templates":["product"]}</code>. Preset: <code>0</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Appearance | — |
| <code>background_color</code> | <code>color</code> | Background color | ghi chú: Optional. Clear it to use the theme color scheme. |
| — | <code>header</code> | Layout | — |
| <code>modal_width</code> | <code>select</code> | Modal width | mặc định <code>standard</code>; giá trị: <code>compact</code>, <code>standard</code>, <code>wide</code> |
| <code>corner_radius</code> | <code>select</code> | Corner radius | mặc định <code>square</code>; giá trị: <code>square</code>, <code>rounded</code>, <code>theme</code> |
| <code>media_position</code> | <code>select</code> | Media position | mặc định <code>left</code>; giá trị: <code>left</code>, <code>right</code> |
| <code>media_width</code> | <code>range</code> | Desktop media width | mặc định <code>50</code>; khoảng <code>40</code> → <code>65</code>, bước <code>1</code> <code>%</code> |
| <code>desktop_gap</code> | <code>range</code> | Desktop column gap | mặc định <code>0</code>; khoảng <code>0</code> → <code>48</code>, bước <code>4</code> <code>px</code> |
| <code>mobile_gap</code> | <code>range</code> | Mobile content gap | mặc định <code>16</code>; khoảng <code>0</code> → <code>32</code>, bước <code>2</code> <code>px</code> |
| — | <code>header</code> | Media | — |
| <code>image_zoom</code> | <code>select</code> | Image zoom | mặc định <code>open_lightbox</code>; giá trị: <code>open_lightbox</code>, <code>click_hover</code>, <code>none</code> |
| <code>media_ratio</code> | <code>select</code> | Desktop media ratio | mặc định <code>portrait</code>; giá trị: <code>auto</code>, <code>narrow-portrait</code>, <code>square</code>, <code>portrait</code>, <code>landscape</code>, <code>wide-landscape</code>, <code>wide</code>, <code>super-wide</code> |
| <code>mobile_media_ratio</code> | <code>select</code> | Mobile media ratio | mặc định <code>portrait</code>; giá trị: <code>auto</code>, <code>square</code>, <code>portrait</code>, <code>landscape</code> |
| <code>media_fit</code> | <code>select</code> | Image fit | mặc định <code>cover</code>; giá trị: <code>cover</code>, <code>contain</code> |
| <code>show_mobile_pagination</code> | <code>checkbox</code> | Show pagination | mặc định <code>true</code> |
| <code>show_mobile_thumbnails</code> | <code>checkbox</code> | Show thumbnails | mặc định <code>false</code> |
| <code>thumbnail_size</code> | <code>range</code> | Thumbnail size | mặc định <code>64</code>; khoảng <code>48</code> → <code>96</code>, bước <code>4</code> <code>px</code> |
| <code>thumbnail_gap</code> | <code>range</code> | Thumbnail gap | mặc định <code>8</code>; khoảng <code>4</code> → <code>16</code>, bước <code>2</code> <code>px</code> |
| <code>show_media</code> | <code>checkbox</code> | Show product media | mặc định <code>true</code> |
| <code>show_close_button</code> | <code>checkbox</code> | Show close button | mặc định <code>true</code> |
| — | <code>header</code> | Content | — |
| <code>content_padding</code> | <code>range</code> | Content padding | mặc định <code>40</code>; khoảng <code>20</code> → <code>64</code>, bước <code>2</code> <code>px</code> |

### Inline/theme block được section cho phép

#### Block <code>_product-details</code>

Giới hạn: không đặt.

_Không có setting._

</details>

<details>
<summary><code>sections/recently-viewed-products.liquid</code> — Recently viewed products</summary>

Ràng buộc: không giới hạn riêng. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Recently viewed</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>limit</code> | <code>range</code> | Product limit | mặc định <code>4</code>; khoảng <code>2</code> → <code>6</code>, bước <code>1</code> |

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/scrolling-text.liquid</code> — Scrolling text</summary>

Ràng buộc: <code>max_blocks=12</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>behavior</code> | <code>select</code> | Behavior | mặc định <code>marquee</code>; giá trị: <code>marquee</code>, <code>static</code> |
| <code>direction</code> | <code>select</code> | Direction | mặc định <code>left</code>; giá trị: <code>left</code>, <code>right</code> |
| <code>pause_on_hover</code> | <code>checkbox</code> | Pause on hover or focus | mặc định <code>true</code> |
| <code>speed</code> | <code>range</code> | Scrolling duration | mặc định <code>35</code>; khoảng <code>10</code> → <code>80</code>, bước <code>5</code> <code>s</code> |
| <code>item_gap</code> | <code>range</code> | Item gap | mặc định <code>24</code>; khoảng <code>12</code> → <code>64</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Typography | — |
| <code>font_role</code> | <code>select</code> | Text font | mặc định <code>heading</code>; giá trị: <code>heading</code>, <code>body</code> |
| <code>font_size</code> | <code>range</code> | Desktop font size | mặc định <code>16</code>; khoảng <code>12</code> → <code>20</code>, bước <code>1</code> <code>px</code> |
| <code>font_size_mobile</code> | <code>range</code> | Mobile font size | mặc định <code>16</code>; khoảng <code>10</code> → <code>18</code>, bước <code>1</code> <code>px</code> |
| — | <code>header</code> | Separator icon | — |
| <code>separator_icon</code> | <code>image_picker</code> | Icon image or SVG | — |
| <code>icon_size</code> | <code>select</code> | Icon size | mặc định <code>small</code>; giá trị: <code>small</code>, <code>medium</code>, <code>large</code> |
| — | <code>header</code> | Section height | — |
| <code>height_desktop</code> | <code>range</code> | Desktop | mặc định <code>64</code>; khoảng <code>40</code> → <code>96</code>, bước <code>4</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile | mặc định <code>48</code>; khoảng <code>36</code> → <code>72</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Layout | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>page</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-2</code> |

### Inline/theme block được section cho phép

#### Block <code>text_item</code> — Text item

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>text</code> | Text | mặc định <code>Sustainable manufacturing</code> |
| <code>link</code> | <code>url</code> | Link | — |

</details>

<details>
<summary><code>sections/search.liquid</code> — Search results</summary>

Ràng buộc: <code>limit=1</code>, <code>enabled_on={"templates":["search"]}</code>. Preset: <code>0</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>enable_prefix_search</code> | <code>checkbox</code> | Include word prefixes in search | mặc định <code>true</code> |
| — | <code>header</code> | Filter and sort | — |
| <code>enable_filtering</code> | <code>checkbox</code> | Enable filtering | mặc định <code>true</code> |
| <code>enable_sorting</code> | <code>checkbox</code> | Enable sorting | mặc định <code>true</code> |
| <code>filter_button_style</code> | <code>select</code> | Filter button style | mặc định <code>primary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>link</code> |
| <code>open_filter_groups</code> | <code>text</code> | Filter groups open by default | mặc định <code>Price, Material</code>; ghi chú: Enter filter labels separated by commas. |
| — | <code>header</code> | Article and page results | — |
| <code>show_article_image</code> | <code>checkbox</code> | Show result image | mặc định <code>true</code> |
| <code>article_image_ratio</code> | <code>select</code> | Image ratio | mặc định <code>portrait</code>; giá trị: <code>square</code>, <code>portrait</code> |
| <code>show_article_date</code> | <code>checkbox</code> | Show article date | mặc định <code>true</code> |
| <code>show_article_author</code> | <code>checkbox</code> | Show article author | mặc định <code>false</code> |
| — | <code>header</code> | Results grid | — |
| <code>columns_desktop</code> | <code>range</code> | Desktop columns | mặc định <code>4</code>; khoảng <code>3</code> → <code>5</code>, bước <code>1</code> |
| <code>columns_mobile</code> | <code>select</code> | Mobile columns | mặc định <code>2</code>; giá trị: <code>1</code>, <code>2</code> |
| <code>column_gap</code> | <code>range</code> | Column gap | mặc định <code>12</code>; khoảng <code>4</code> → <code>40</code>, bước <code>2</code> <code>px</code> |
| <code>row_gap</code> | <code>range</code> | Row gap | mặc định <code>56</code>; khoảng <code>16</code> → <code>96</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Desktop top padding | mặc định <code>88</code>; khoảng <code>32</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Desktop bottom padding | mặc định <code>96</code>; khoảng <code>32</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/shop-the-look.liquid</code> — Shop the look</summary>

Ràng buộc: <code>max_blocks=8</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>media_position</code> | <code>select</code> | Desktop media position | mặc định <code>left</code>; giá trị: <code>left</code>, <code>right</code> |
| <code>product_image_size</code> | <code>range</code> | Product image size | mặc định <code>240</code>; khoảng <code>160</code> → <code>360</code>, bước <code>20</code> <code>px</code> |
| <code>content_padding</code> | <code>range</code> | Content padding | mặc định <code>48</code>; khoảng <code>24</code> → <code>96</code>, bước <code>8</code> <code>px</code> |
| — | <code>header</code> | Section height | — |
| <code>height_desktop</code> | <code>range</code> | Desktop | mặc định <code>960</code>; khoảng <code>640</code> → <code>1200</code>, bước <code>40</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile content | mặc định <code>440</code>; khoảng <code>360</code> → <code>560</code>, bước <code>40</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-4</code> |

### Inline/theme block được section cho phép

#### Block <code>media</code> — Editorial image

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>mobile_image</code> | <code>image_picker</code> | Mobile image | ghi chú: Recommended when the desktop crop does not fit the mobile layout. Uses the main image when left blank. |
| <code>focal_point</code> | <code>text</code> | Focal point | mặc định <code>center center</code>; ghi chú: CSS object-position, for example: 50% 40% |
| <code>mobile_focal_point</code> | <code>text</code> | Mobile focal point | mặc định <code>center center</code>; ghi chú: Applied only when a mobile image is selected. |

#### Block <code>eyebrow</code> — Eyebrow

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>text</code> | Text | mặc định <code>Shop the look</code> |

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Statement Stacks</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>center</code> |

#### Block <code>product_hotspot</code> — Product hotspot

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>product</code> | <code>product</code> | Product | — |
| <code>horizontal_position</code> | <code>range</code> | Horizontal position | mặc định <code>60</code>; khoảng <code>0</code> → <code>100</code>, bước <code>1</code> <code>%</code> |
| <code>vertical_position</code> | <code>range</code> | Vertical position | mặc định <code>58</code>; khoảng <code>0</code> → <code>100</code>, bước <code>1</code> <code>%</code> |
| <code>enable_mobile_position</code> | <code>checkbox</code> | Use a separate mobile position | mặc định <code>false</code> |
| <code>mobile_horizontal_position</code> | <code>range</code> | Mobile horizontal position | mặc định <code>60</code>; khoảng <code>0</code> → <code>100</code>, bước <code>1</code> <code>%</code> |
| <code>mobile_vertical_position</code> | <code>range</code> | Mobile vertical position | mặc định <code>58</code>; khoảng <code>0</code> → <code>100</code>, bước <code>1</code> <code>%</code> |

</details>

<details>
<summary><code>sections/size-chart.liquid</code> — Size chart</summary>

Ràng buộc: <code>enabled_on={"templates":["page"]}</code>. Preset: <code>1</code>.

### Section settings

_Không có setting._

### Inline/theme block được section cho phép

_Không khai báo block._

</details>

<details>
<summary><code>sections/slideshow-with-video.liquid</code> — Slideshow with video</summary>

Ràng buộc: <code>max_blocks=8</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Layout | — |
| <code>slideshow_style</code> | <code>select</code> | Slideshow style | mặc định <code>single</code>; giá trị: <code>single</code>, <code>double</code> |
| <code>height_desktop</code> | <code>select</code> | Slide height desktop | mặc định <code>large</code>; giá trị: <code>adapt</code>, <code>small</code>, <code>medium</code>, <code>large</code>, <code>xlarge</code>, <code>full</code> |
| <code>height_mobile</code> | <code>select</code> | Slide height mobile | mặc định <code>large</code>; giá trị: <code>adapt</code>, <code>small</code>, <code>medium</code>, <code>large</code>, <code>xlarge</code>, <code>full</code> |
| <code>autoplay</code> | <code>checkbox</code> | Enable autoplay | mặc định <code>true</code> |
| <code>autoplay_delay</code> | <code>range</code> | Time between slides | mặc định <code>5</code>; khoảng <code>1</code> → <code>10</code>, bước <code>1</code> <code>s</code> |
| <code>enable_image_zoom</code> | <code>checkbox</code> | Enable image zoom animation | mặc định <code>true</code>; ghi chú: Inactive images are enlarged and smoothly return to their original size when active. |
| <code>slide_gap</code> | <code>range</code> | Slide gap | mặc định <code>0</code>; khoảng <code>0</code> → <code>40</code>, bước <code>1</code> <code>px</code> |
| — | <code>header</code> | Pagination | — |
| <code>progress_color</code> | <code>color</code> | Pagination color | mặc định <code>#FFFFFF</code> |
| — | <code>header</code> | Theme settings | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>page</code>, <code>full</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>image_slide</code> — Image slide

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Images | — |
| <code>image</code> | <code>image_picker</code> | Image | ghi chú: 1920 x 1080px recommended for desktop. |
| <code>mobile_image</code> | <code>image_picker</code> | Image (mobile) | ghi chú: 1280 x 1780px recommended for mobile. |
| <code>video</code> | <code>video</code> | Background video | ghi chú: When selected, the video replaces the images. It plays muted and advances to the next slide when it ends. |
| — | <code>header</code> | Content | — |
| <code>show_collection_list</code> | <code>checkbox</code> | Show collection list | mặc định <code>false</code> |
| <code>collection</code> | <code>collection</code> | Collection | — |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>520</code>; khoảng <code>280</code> → <code>720</code>, bước <code>20</code> <code>px</code> |
| <code>content_alignment</code> | <code>text_alignment</code> | Content alignment | mặc định <code>left</code> |
| <code>content_position</code> | <code>select</code> | Content position | mặc định <code>bottom-left</code>; giá trị: <code>top-left</code>, <code>top-center</code>, <code>top-right</code>, <code>middle-left</code>, <code>middle-center</code>, <code>middle-right</code>, <code>bottom-left</code>, <code>bottom-center</code>, <code>bottom-right</code> |
| <code>content_position_mobile</code> | <code>select</code> | Content position mobile | mặc định <code>bottom-left</code>; giá trị: <code>top-left</code>, <code>top-center</code>, <code>top-right</code>, <code>middle-left</code>, <code>middle-center</code>, <code>middle-right</code>, <code>bottom-left</code>, <code>bottom-center</code>, <code>bottom-right</code> |
| <code>heading</code> | <code>inline_richtext</code> | Heading | mặc định <code>Designed for every day</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | Heading SEO | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code>; ghi chú: Heading tags affect SEO only and do not change visual styling. |
| <code>description</code> | <code>richtext</code> | Description | mặc định <code>&lt;p&gt;Discover pieces designed to bring a refined finish to every day.&lt;/p&gt;</code> |
| <code>description_size</code> | <code>select</code> | Description size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| — | <code>header</code> | Button 1 | — |
| <code>button_1_label</code> | <code>text</code> | Text | mặc định <code>Shop all</code> |
| <code>button_1_link</code> | <code>url</code> | Link | — |
| <code>button_1_size</code> | <code>select</code> | Size | mặc định <code>medium</code>; giá trị: <code>xsmall</code>, <code>small</code>, <code>medium</code>, <code>large</code> |
| <code>button_1_style</code> | <code>select</code> | Button style | mặc định <code>primary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code> |
| <code>button_1_hover</code> | <code>select</code> | Hover effect | mặc định <code>standard</code>; giá trị: <code>standard</code>, <code>none</code> |
| — | <code>header</code> | Button 2 | — |
| <code>button_2_label</code> | <code>text</code> | Text | — |
| <code>button_2_link</code> | <code>url</code> | Link | — |
| <code>button_2_size</code> | <code>select</code> | Size | mặc định <code>medium</code>; giá trị: <code>xsmall</code>, <code>small</code>, <code>medium</code>, <code>large</code> |
| <code>button_2_style</code> | <code>select</code> | Button style | mặc định <code>secondary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code> |
| <code>button_2_hover</code> | <code>select</code> | Hover effect | mặc định <code>standard</code>; giá trị: <code>standard</code>, <code>none</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-3</code> |
| <code>overlay_color</code> | <code>color</code> | Overlay | mặc định <code>#000000</code> |
| <code>overlay_opacity</code> | <code>range</code> | Opacity | mặc định <code>30</code>; khoảng <code>0</code> → <code>80</code>, bước <code>5</code> <code>%</code> |

</details>

<details>
<summary><code>sections/slideshow.liquid</code> — Slideshow</summary>

Ràng buộc: <code>max_blocks=8</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Layout | — |
| <code>slideshow_style</code> | <code>select</code> | Slideshow style | mặc định <code>single</code>; giá trị: <code>single</code>, <code>double</code> |
| <code>height_desktop</code> | <code>select</code> | Slide height desktop | mặc định <code>large</code>; giá trị: <code>adapt</code>, <code>small</code>, <code>medium</code>, <code>large</code>, <code>xlarge</code>, <code>full</code> |
| <code>height_mobile</code> | <code>select</code> | Slide height mobile | mặc định <code>large</code>; giá trị: <code>adapt</code>, <code>small</code>, <code>medium</code>, <code>large</code>, <code>xlarge</code>, <code>full</code> |
| <code>autoplay</code> | <code>checkbox</code> | Enable autoplay | mặc định <code>true</code> |
| <code>autoplay_delay</code> | <code>range</code> | Time between slides | mặc định <code>5</code>; khoảng <code>1</code> → <code>10</code>, bước <code>1</code> <code>s</code> |
| <code>enable_image_zoom</code> | <code>checkbox</code> | Enable image zoom animation | mặc định <code>true</code>; ghi chú: Inactive images are enlarged and smoothly return to their original size when active. |
| <code>slide_gap</code> | <code>range</code> | Slide gap | mặc định <code>0</code>; khoảng <code>0</code> → <code>40</code>, bước <code>1</code> <code>px</code> |
| — | <code>header</code> | Arrow icon color | — |
| <code>arrow_color</code> | <code>color</code> | Icon color | mặc định <code>#FFFFFF</code> |
| <code>arrow_background</code> | <code>color</code> | Background | mặc định <code>#000000</code> |
| — | <code>header</code> | Slide progress | — |
| <code>progress_color</code> | <code>color</code> | Text and progress color | mặc định <code>#FFFFFF</code> |
| <code>progress_track_color</code> | <code>color</code> | Progress track color | mặc định <code>#FFFFFF</code> |
| — | <code>header</code> | Theme settings | — |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>page</code>, <code>full</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-1</code> |

### Inline/theme block được section cho phép

#### Block <code>image_slide</code> — Image slide

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Images | — |
| <code>image</code> | <code>image_picker</code> | Image | ghi chú: 1920 x 1080px recommended for desktop. |
| <code>mobile_image</code> | <code>image_picker</code> | Image (mobile) | ghi chú: 1280 x 1780px recommended for mobile. |
| — | <code>header</code> | Content | — |
| <code>show_collection_list</code> | <code>checkbox</code> | Show collection list | mặc định <code>false</code> |
| <code>collection</code> | <code>collection</code> | Collection | — |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>520</code>; khoảng <code>280</code> → <code>720</code>, bước <code>20</code> <code>px</code> |
| <code>content_alignment</code> | <code>text_alignment</code> | Content alignment | mặc định <code>left</code> |
| <code>content_position</code> | <code>select</code> | Content position | mặc định <code>bottom-left</code>; giá trị: <code>top-left</code>, <code>top-center</code>, <code>top-right</code>, <code>middle-left</code>, <code>middle-center</code>, <code>middle-right</code>, <code>bottom-left</code>, <code>bottom-center</code>, <code>bottom-right</code> |
| <code>content_position_mobile</code> | <code>select</code> | Content position mobile | mặc định <code>bottom-left</code>; giá trị: <code>top-left</code>, <code>top-center</code>, <code>top-right</code>, <code>middle-left</code>, <code>middle-center</code>, <code>middle-right</code>, <code>bottom-left</code>, <code>bottom-center</code>, <code>bottom-right</code> |
| <code>heading</code> | <code>inline_richtext</code> | Heading | mặc định <code>Designed for every day</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | Heading SEO | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code>; ghi chú: Heading tags affect SEO only and do not change visual styling. |
| <code>description</code> | <code>richtext</code> | Description | mặc định <code>&lt;p&gt;Discover pieces designed to bring a refined finish to every day.&lt;/p&gt;</code> |
| <code>description_size</code> | <code>select</code> | Description size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| — | <code>header</code> | Button 1 | — |
| <code>button_1_label</code> | <code>text</code> | Text | mặc định <code>Shop all</code> |
| <code>button_1_link</code> | <code>url</code> | Link | — |
| <code>button_1_size</code> | <code>select</code> | Size | mặc định <code>medium</code>; giá trị: <code>xsmall</code>, <code>small</code>, <code>medium</code>, <code>large</code> |
| <code>button_1_style</code> | <code>select</code> | Button style | mặc định <code>primary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code> |
| <code>button_1_hover</code> | <code>select</code> | Hover effect | mặc định <code>standard</code>; giá trị: <code>standard</code>, <code>none</code> |
| — | <code>header</code> | Button 2 | — |
| <code>button_2_label</code> | <code>text</code> | Text | — |
| <code>button_2_link</code> | <code>url</code> | Link | — |
| <code>button_2_size</code> | <code>select</code> | Size | mặc định <code>medium</code>; giá trị: <code>xsmall</code>, <code>small</code>, <code>medium</code>, <code>large</code> |
| <code>button_2_style</code> | <code>select</code> | Button style | mặc định <code>secondary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code> |
| <code>button_2_hover</code> | <code>select</code> | Hover effect | mặc định <code>standard</code>; giá trị: <code>standard</code>, <code>none</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-3</code> |
| <code>overlay_color</code> | <code>color</code> | Overlay | mặc định <code>#000000</code> |
| <code>overlay_opacity</code> | <code>range</code> | Opacity | mặc định <code>30</code>; khoảng <code>0</code> → <code>80</code>, bước <code>5</code> <code>%</code> |

</details>

<details>
<summary><code>sections/testimonials.liquid</code> — Testimonials</summary>

Ràng buộc: <code>max_blocks=6</code>, <code>disabled_on={"groups":["header","footer"]}</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Layout | — |
| <code>layout_desktop</code> | <code>select</code> | Desktop layout | mặc định <code>slider</code>; giá trị: <code>grid</code>, <code>slider</code> |
| <code>layout_mobile</code> | <code>select</code> | Mobile layout | mặc định <code>slider</code>; giá trị: <code>grid</code>, <code>slider</code> |
| <code>show_pagination</code> | <code>checkbox</code> | Show slider pagination | mặc định <code>false</code> |
| <code>pagination_bottom_spacing_mobile</code> | <code>range</code> | Mobile space below dots | mặc định <code>32</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code>; hiện khi <code>{{ section.settings.show_pagination }}</code> |
| <code>columns_desktop</code> | <code>range</code> | Desktop columns / items | mặc định <code>1</code>; khoảng <code>1</code> → <code>6</code>, bước <code>1</code> |
| <code>columns_mobile</code> | <code>select</code> | Mobile columns / items | mặc định <code>1</code>; giá trị: <code>1</code>, <code>2</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>custom</code>; giá trị: <code>contained</code>, <code>full</code>, <code>custom</code> |
| <code>container_width</code> | <code>range</code> | Container width | mặc định <code>1280</code>; khoảng <code>640</code> → <code>1920</code>, bước <code>20</code> <code>px</code>; hiện khi <code>{{ section.settings.section_width == 'custom' }}</code> |
| <code>content_gap</code> | <code>range</code> | Icon to text gap | mặc định <code>24</code>; khoảng <code>8</code> → <code>48</code>, bước <code>4</code> <code>px</code> |
| <code>column_gap</code> | <code>range</code> | Column gap | mặc định <code>28</code>; khoảng <code>0</code> → <code>64</code>, bước <code>4</code> <code>px</code> |
| <code>row_gap</code> | <code>range</code> | Row gap | mặc định <code>40</code>; khoảng <code>16</code> → <code>80</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Section padding | — |
| <code>padding_top</code> | <code>range</code> | Top padding | mặc định <code>10</code>; khoảng <code>0</code> → <code>160</code>, bước <code>2</code> <code>px</code> |
| <code>padding_bottom</code> | <code>range</code> | Bottom padding | mặc định <code>64</code>; khoảng <code>0</code> → <code>160</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-2</code> |

### Inline/theme block được section cho phép

#### Block <code>testimonial</code> — Testimonial

Giới hạn: không đặt.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>icon</code> | <code>image_picker</code> | Icon | — |
| <code>icon_size</code> | <code>select</code> | Icon size | mặc định <code>small</code>; giá trị: <code>small</code>, <code>medium</code>, <code>large</code> |
| <code>quote</code> | <code>textarea</code> | Quote | mặc định <code>When designing this collection, we wanted to strike a balance between bold silhouettes and timeless proportions. The result is a series of rings that feel effortless, yet striking</code> |
| <code>quote_size</code> | <code>select</code> | Quote size | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>author</code> | <code>text</code> | Author | mặc định <code>Clara</code> |
| <code>role</code> | <code>text</code> | Role | mặc định <code>Founder of MALANDRA</code> |
| <code>attribution_size</code> | <code>select</code> | Author and role size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |

</details>

<details>
<summary><code>sections/video-banner.liquid</code> — Video banner</summary>

Ràng buộc: <code>max_blocks=4</code>. Preset: <code>1</code>.

### Section settings

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| — | <code>header</code> | Layout | — |
| <code>content_position</code> | <code>select</code> | Content position | mặc định <code>center</code>; giá trị: <code>center</code>, <code>bottom-left</code>, <code>bottom-center</code>, <code>bottom-right</code> |
| <code>autoplay</code> | <code>checkbox</code> | Autoplay video | mặc định <code>false</code> |
| <code>loop</code> | <code>checkbox</code> | Loop video | mặc định <code>true</code> |
| <code>overlay_opacity</code> | <code>range</code> | Overlay opacity | mặc định <code>20</code>; khoảng <code>0</code> → <code>60</code>, bước <code>5</code> <code>%</code> |
| <code>content_width</code> | <code>range</code> | Content width | mặc định <code>560</code>; khoảng <code>320</code> → <code>800</code>, bước <code>20</code> <code>px</code> |
| <code>section_width</code> | <code>select</code> | Section width | mặc định <code>full</code>; giá trị: <code>full</code>, <code>page</code> |
| <code>content_padding</code> | <code>range</code> | Content padding | mặc định <code>40</code>; khoảng <code>16</code> → <code>80</code>, bước <code>4</code> <code>px</code> |
| <code>height_desktop</code> | <code>range</code> | Desktop height | mặc định <code>720</code>; khoảng <code>400</code> → <code>900</code>, bước <code>5</code> <code>px</code> |
| <code>height_tablet</code> | <code>range</code> | Tablet height | mặc định <code>480</code>; khoảng <code>320</code> → <code>720</code>, bước <code>4</code> <code>px</code> |
| <code>height_mobile</code> | <code>range</code> | Mobile height | mặc định <code>480</code>; khoảng <code>280</code> → <code>600</code>, bước <code>4</code> <code>px</code> |
| — | <code>header</code> | Appearance | — |
| <code>color_scheme</code> | <code>color_scheme</code> | Color scheme | mặc định <code>scheme-3</code> |

### Inline/theme block được section cho phép

#### Block <code>video</code> — Video

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>video</code> | <code>video</code> | Video | — |
| <code>poster</code> | <code>image_picker</code> | Custom poster image | — |
| <code>focal_point</code> | <code>select</code> | Focal point | mặc định <code>center center</code>; giá trị: <code>left top</code>, <code>center top</code>, <code>right top</code>, <code>left center</code>, <code>center center</code>, <code>right center</code>, <code>left bottom</code>, <code>center bottom</code>, <code>right bottom</code> |
| <code>muted</code> | <code>checkbox</code> | Mute video | mặc định <code>false</code> |
| <code>accessibility_label</code> | <code>text</code> | Accessibility label | mặc định <code>Campaign video</code> |
| <code>play_label</code> | <code>text</code> | Play button label | mặc định <code>Play video</code> |

#### Block <code>eyebrow</code> — Eyebrow

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>text</code> | Text | mặc định <code>Introducing</code> |

#### Block <code>heading</code> — Heading

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Love, Always</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>center</code> |

#### Block <code>button</code> — Button

Giới hạn: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Shop now</code> |
| <code>link</code> | <code>url</code> | Link | — |
| <code>style</code> | <code>select</code> | Style | mặc định <code>primary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code> |

</details>

## 6. Danh mục theme block

Nguồn: <code>blocks/*.liquid</code>. Dấu gạch dưới ở đầu tên file biểu thị block nội bộ trong kiến trúc hiện tại; <code>@theme</code> cho phép lồng theme block, <code>@app</code> cho phép app block.

| File | Tên | Input | Block con cho phép | Preset |
|---|---|---:|---|---:|
| <code>blocks/_product-details.liquid</code> | Product details | 2 | <code>@theme</code> | 0 |
| <code>blocks/_product-media-gallery.liquid</code> | Product media gallery | 13 | — | 0 |
| <code>blocks/button.liquid</code> | Button | 5 | — | 1 |
| <code>blocks/collapsible-content-item.liquid</code> | Collapsible item | 6 | — | 0 |
| <code>blocks/group.liquid</code> | t:general.group | 3 | <code>@theme</code> | 2 |
| <code>blocks/heading.liquid</code> | Heading | 4 | — | 1 |
| <code>blocks/media.liquid</code> | Media | 4 | — | 1 |
| <code>blocks/product-accordion-group.liquid</code> | Accordion group | 1 | <code>product-accordion</code> | 0 |
| <code>blocks/product-accordion.liquid</code> | Product accordion | 11 | — | 0 |
| <code>blocks/product-apps.liquid</code> | Product apps | 0 | <code>@app</code> | 0 |
| <code>blocks/product-back-in-stock.liquid</code> | Back in stock | 1 | — | 0 |
| <code>blocks/product-badge.liquid</code> | Product badge | 1 | — | 0 |
| <code>blocks/product-badges.liquid</code> | Product badges | 0 | — | 0 |
| <code>blocks/product-benefit-item.liquid</code> | Benefit item | 4 | — | 1 |
| <code>blocks/product-breadcrumbs.liquid</code> | Product breadcrumbs | 0 | — | 0 |
| <code>blocks/product-buy-buttons.liquid</code> | Product buy buttons | 3 | — | 0 |
| <code>blocks/product-compare-at-price.liquid</code> | Compare-at price | 0 | — | 0 |
| <code>blocks/product-custom-liquid.liquid</code> | Custom Liquid | 1 | — | 0 |
| <code>blocks/product-description.liquid</code> | Product description | 3 | — | 0 |
| <code>blocks/product-faq.liquid</code> | Product FAQ | 5 | — | 0 |
| <code>blocks/product-inventory.liquid</code> | Product inventory | 0 | — | 0 |
| <code>blocks/product-material-care.liquid</code> | Material and care | 5 | — | 0 |
| <code>blocks/product-metafield.liquid</code> | Product metafield | 3 | — | 0 |
| <code>blocks/product-option-picker.liquid</code> | Variant picker | 9 | — | 0 |
| <code>blocks/product-payment.liquid</code> | Product payment | 5 | — | 0 |
| <code>blocks/product-pickup-availability.liquid</code> | Pickup availability | 0 | — | 0 |
| <code>blocks/product-popup.liquid</code> | Product popup | 0 | — | 0 |
| <code>blocks/product-price.liquid</code> | Product price | 2 | — | 0 |
| <code>blocks/product-quantity.liquid</code> | Product quantity | 0 | — | 0 |
| <code>blocks/product-rating.liquid</code> | Product rating | 2 | — | 0 |
| <code>blocks/product-recommendations.liquid</code> | Product recommendations | 5 | — | 0 |
| <code>blocks/product-share.liquid</code> | Product share | 1 | — | 0 |
| <code>blocks/product-shipping-returns.liquid</code> | Shipping and returns | 5 | — | 0 |
| <code>blocks/product-size-guide.liquid</code> | Size guide | 2 | — | 0 |
| <code>blocks/product-sku.liquid</code> | Product SKU | 0 | — | 0 |
| <code>blocks/product-sticky-add-to-cart.liquid</code> | Sticky add to cart | 0 | — | 0 |
| <code>blocks/product-title.liquid</code> | Product title | 2 | — | 0 |
| <code>blocks/product-trust-badges.liquid</code> | Trust badges | 2 | — | 0 |
| <code>blocks/product-usp-list.liquid</code> | Product benefits | 4 | <code>product-benefit-item</code> | 1 |
| <code>blocks/product-variant-status.liquid</code> | Variant status | 0 | — | 0 |
| <code>blocks/product-vendor.liquid</code> | Product vendor | 0 | — | 0 |
| <code>blocks/text.liquid</code> | t:general.text | 3 | — | 1 |

<details>
<summary><code>blocks/_product-details.liquid</code> — Product details</summary>

Block con cho phép: <code>@theme</code>. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>enable_sticky</code> | <code>checkbox</code> | Keep details sticky on desktop | mặc định <code>true</code> |
| <code>desktop_top_offset</code> | <code>range</code> | Desktop sticky offset | mặc định <code>24</code>; khoảng <code>0</code> → <code>120</code>, bước <code>4</code> <code>px</code> |

</details>

<details>
<summary><code>blocks/_product-media-gallery.liquid</code> — Product media gallery</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>desktop_layout</code> | <code>select</code> | Desktop layout | mặc định <code>grid</code>; giá trị: <code>grid</code>, <code>carousel</code> |
| <code>image_zoom</code> | <code>select</code> | Image zoom | mặc định <code>open_lightbox</code>; giá trị: <code>open_lightbox</code>, <code>click_hover</code>, <code>none</code> |
| <code>grid_columns</code> | <code>select</code> | Grid columns | mặc định <code>2</code>; giá trị: <code>1</code>, <code>2</code>; hiện khi <code>{{ block.settings.desktop_layout == 'grid' }}</code> |
| <code>grid_layout</code> | <code>select</code> | Grid layout | mặc định <code>editorial</code>; giá trị: <code>editorial</code>, <code>uniform</code>; hiện khi <code>{{ block.settings.desktop_layout == 'grid' }}</code> |
| <code>carousel_thumbnails</code> | <code>select</code> | Carousel thumbnails | mặc định <code>left</code>; giá trị: <code>left</code>, <code>bottom</code>; hiện khi <code>{{ block.settings.desktop_layout == 'carousel' }}</code> |
| <code>gap</code> | <code>range</code> | Media gap | mặc định <code>12</code>; khoảng <code>0</code> → <code>32</code>, bước <code>2</code> <code>px</code> |
| <code>media_ratio</code> | <code>select</code> | Desktop media ratio | mặc định <code>portrait</code>; giá trị: <code>auto</code>, <code>square</code>, <code>portrait</code>, <code>landscape</code> |
| <code>mobile_media_ratio</code> | <code>select</code> | Mobile media ratio | mặc định <code>portrait</code>; giá trị: <code>auto</code>, <code>square</code>, <code>portrait</code>, <code>landscape</code> |
| <code>media_fit</code> | <code>select</code> | Image fit | mặc định <code>cover</code>; giá trị: <code>cover</code>, <code>contain</code> |
| <code>show_mobile_pagination</code> | <code>checkbox</code> | Show mobile pagination | mặc định <code>true</code> |
| <code>show_mobile_thumbnails</code> | <code>checkbox</code> | Show mobile thumbnails | mặc định <code>true</code> |
| <code>thumbnail_size</code> | <code>range</code> | Thumbnail size | mặc định <code>64</code>; khoảng <code>48</code> → <code>96</code>, bước <code>4</code> <code>px</code> |
| <code>thumbnail_gap</code> | <code>range</code> | Thumbnail gap | mặc định <code>8</code>; khoảng <code>4</code> → <code>16</code>, bước <code>2</code> <code>px</code> |

</details>

<details>
<summary><code>blocks/button.liquid</code> — Button</summary>

Block con cho phép: không. Preset: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Learn more</code> |
| <code>link</code> | <code>url</code> | Link | — |
| <code>style</code> | <code>select</code> | Style | mặc định <code>primary</code>; giá trị: <code>primary</code>, <code>secondary</code>, <code>tertiary</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>left</code> |
| <code>open_in_new_tab</code> | <code>checkbox</code> | Open in a new tab | mặc định <code>false</code> |

</details>

<details>
<summary><code>blocks/collapsible-content-item.liquid</code> — Collapsible item</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Frequently asked question</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h4</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>content</code> | <code>richtext</code> | Content | mặc định <code>&lt;p&gt;Add helpful information for customers.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>open_by_default</code> | <code>checkbox</code> | Open by default | mặc định <code>false</code> |

</details>

<details>
<summary><code>blocks/group.liquid</code> — t:general.group</summary>

Block con cho phép: <code>@theme</code>. Preset: <code>2</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>layout_direction</code> | <code>select</code> | t:labels.layout_direction | mặc định <code>group--vertical</code>; giá trị: <code>group--horizontal</code>, <code>group--vertical</code> |
| <code>alignment</code> | <code>select</code> | t:labels.alignment | mặc định <code>flex-start</code>; giá trị: <code>flex-start</code>, <code>center</code>, <code>flex-end</code>; hiện khi <code>{{ block.settings.layout_direction == 'group--vertical' }}</code> |
| <code>padding</code> | <code>range</code> | t:labels.padding | mặc định <code>0</code>; khoảng <code>0</code> → <code>200</code>, bước <code>2</code> <code>px</code> |

</details>

<details>
<summary><code>blocks/heading.liquid</code> — Heading</summary>

Block con cho phép: không. Preset: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>inline_richtext</code> | Heading | mặc định <code>Tell your story</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>alignment</code> | <code>text_alignment</code> | Alignment | mặc định <code>left</code> |

</details>

<details>
<summary><code>blocks/media.liquid</code> — Media</summary>

Block con cho phép: không. Preset: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>image</code> | <code>image_picker</code> | Image | — |
| <code>alt</code> | <code>text</code> | Image alt text | — |
| <code>ratio</code> | <code>select</code> | Image ratio | mặc định <code>adapt</code>; giá trị: <code>adapt</code>, <code>landscape</code>, <code>square</code>, <code>portrait</code> |
| <code>focal_point</code> | <code>select</code> | Image focal point | mặc định <code>center center</code>; giá trị: <code>center center</code>, <code>center top</code>, <code>center bottom</code>, <code>left center</code>, <code>right center</code> |

</details>

<details>
<summary><code>blocks/product-accordion-group.liquid</code> — Accordion group</summary>

Block con cho phép: <code>product-accordion</code>. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>icon</code> | <code>select</code> | Expand icon | mặc định <code>plus</code>; giá trị: <code>plus</code>, <code>caret</code> |

</details>

<details>
<summary><code>blocks/product-accordion.liquid</code> — Product accordion</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Details</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h5</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>html_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>content_source</code> | <code>select</code> | Content source | mặc định <code>description</code>; giá trị: <code>description</code>, <code>metafield</code>, <code>manual</code> |
| <code>metafield_namespace</code> | <code>text</code> | Metafield namespace | mặc định <code>custom</code>; hiện khi <code>{{ block.settings.content_source == 'metafield' }}</code> |
| <code>metafield_key</code> | <code>text</code> | Metafield key | mặc định <code>summary</code>; hiện khi <code>{{ block.settings.content_source == 'metafield' }}</code> |
| <code>content</code> | <code>richtext</code> | Content | hiện khi <code>{{ block.settings.content_source == 'manual' }}</code> |
| <code>show_divider</code> | <code>checkbox</code> | Show divider | mặc định <code>true</code> |
| <code>open_by_default</code> | <code>checkbox</code> | Open by default | mặc định <code>false</code> |
| <code>show_view_more</code> | <code>checkbox</code> | Show View more/Less | mặc định <code>true</code> |
| <code>content_max_height</code> | <code>range</code> | Content height before View more | mặc định <code>240</code>; khoảng <code>120</code> → <code>600</code>, bước <code>20</code> <code>px</code>; hiện khi <code>{{ block.settings.show_view_more }}</code> |

</details>

<details>
<summary><code>blocks/product-apps.liquid</code> — Product apps</summary>

Block con cho phép: <code>@app</code>. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-back-in-stock.liquid</code> — Back in stock</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>message</code> | <code>text</code> | Message | mặc định <code>Notify me when available</code> |

</details>

<details>
<summary><code>blocks/product-badge.liquid</code> — Product badge</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Badge label | mặc định <code>Bestseller</code> |

</details>

<details>
<summary><code>blocks/product-badges.liquid</code> — Product badges</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-benefit-item.liquid</code> — Benefit item</summary>

Block con cho phép: không. Preset: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>icon</code> | <code>select</code> | Icon | mặc định <code>truck</code>; giá trị: <code>truck</code>, <code>return</code>, <code>heart</code>, <code>box</code>, <code>shield</code>, <code>sparkles</code>, <code>none</code> |
| <code>text</code> | <code>richtext</code> | Text | mặc định <code>&lt;p&gt;Complimentary shipping&lt;br&gt;On every order&lt;/p&gt;</code> |
| <code>page</code> | <code>page</code> | Page | — |
| <code>show_page_popup</code> | <code>checkbox</code> | Show page content in pop-up | mặc định <code>false</code> |

</details>

<details>
<summary><code>blocks/product-breadcrumbs.liquid</code> — Product breadcrumbs</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-buy-buttons.liquid</code> — Product buy buttons</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>button_layout</code> | <code>select</code> | Button layout | mặc định <code>inline</code>; giá trị: <code>inline</code>, <code>stacked</code> |
| <code>show_quantity</code> | <code>checkbox</code> | Show quantity selector | mặc định <code>true</code> |
| <code>show_dynamic_checkout</code> | <code>checkbox</code> | Show dynamic checkout buttons | mặc định <code>true</code> |

</details>

<details>
<summary><code>blocks/product-compare-at-price.liquid</code> — Compare-at price</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-custom-liquid.liquid</code> — Custom Liquid</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>custom_liquid</code> | <code>liquid</code> | Custom Liquid | — |

</details>

<details>
<summary><code>blocks/product-description.liquid</code> — Product description</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>style</code> | <code>select</code> | Description style | mặc định <code>full</code>; giá trị: <code>full</code>, <code>compact</code> |
| <code>show_view_more</code> | <code>checkbox</code> | Show View more/Less | mặc định <code>false</code> |
| <code>content_max_height</code> | <code>range</code> | Content height before View more | mặc định <code>240</code>; khoảng <code>120</code> → <code>600</code>, bước <code>20</code> <code>px</code>; hiện khi <code>{{ block.settings.show_view_more }}</code> |

</details>

<details>
<summary><code>blocks/product-faq.liquid</code> — Product FAQ</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>question</code> | <code>text</code> | Question | mặc định <code>Question</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h4</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>heading_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>answer</code> | <code>richtext</code> | Answer | — |

</details>

<details>
<summary><code>blocks/product-inventory.liquid</code> — Product inventory</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-material-care.liquid</code> — Material and care</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Material and care</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h4</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>html_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>content</code> | <code>richtext</code> | Content | — |

</details>

<details>
<summary><code>blocks/product-metafield.liquid</code> — Product metafield</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>namespace</code> | <code>text</code> | Metafield namespace | mặc định <code>custom</code> |
| <code>key</code> | <code>text</code> | Metafield key | mặc định <code>summary</code> |
| <code>style</code> | <code>select</code> | Text style | mặc định <code>full</code>; giá trị: <code>full</code>, <code>compact</code> |

</details>

<details>
<summary><code>blocks/product-option-picker.liquid</code> — Variant picker</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>show_variant_labels</code> | <code>checkbox</code> | Show variant labels | mặc định <code>true</code> |
| <code>picker_type</code> | <code>select</code> | Variant picker type | mặc định <code>button</code>; giá trị: <code>dropdown</code>, <code>button</code> |
| — | <code>header</code> | Color swatches | — |
| <code>enable_color_swatches</code> | <code>checkbox</code> | Enable color swatches | mặc định <code>true</code>; ghi chú: Requires variant picker type to be Button. |
| <code>swatch_type</code> | <code>select</code> | Swatch type | mặc định <code>color</code>; giá trị: <code>color</code>, <code>variant_image</code>; ghi chú: Variant image mode requires variants to have associated images. |
| <code>swatch_corner_radius</code> | <code>select</code> | Corner radius | mặc định <code>pill</code>; giá trị: <code>square</code>, <code>rounded</code>, <code>pill</code>; hiện khi <code>{{ block.settings.enable_color_swatches }}</code> |
| — | <code>header</code> | Size chart | — |
| <code>enable_size_chart</code> | <code>checkbox</code> | Enable size chart | mặc định <code>false</code> |
| <code>size_guide</code> | <code>text</code> | Size guide | mặc định <code>Size guide</code> |
| <code>size_chart</code> | <code>text</code> | Size chart | mặc định <code>Size chart</code> |
| <code>size_chart_page</code> | <code>page</code> | Select size chart | ghi chú: Used only when the size chart is enabled. |

</details>

<details>
<summary><code>blocks/product-payment.liquid</code> — Product payment</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Pay With</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h5</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>html_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>small</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>note</code> | <code>text</code> | Note | mặc định <code>Your transaction is protected with advanced security measures to keep your information confidential.</code> |

</details>

<details>
<summary><code>blocks/product-pickup-availability.liquid</code> — Pickup availability</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-popup.liquid</code> — Product popup</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-price.liquid</code> — Product price</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>price_size</code> | <code>select</code> | Price size | mặc định <code>medium</code>; giá trị: <code>small</code>, <code>medium</code>, <code>large</code> |
| <code>show_discount_percentage</code> | <code>checkbox</code> | Show discount percentage | mặc định <code>false</code> |

</details>

<details>
<summary><code>blocks/product-quantity.liquid</code> — Product quantity</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-rating.liquid</code> — Product rating</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>show_when_empty</code> | <code>checkbox</code> | Show when no rating exists | mặc định <code>false</code> |
| <code>empty_label</code> | <code>text</code> | Empty-state label | mặc định <code>No reviews yet</code> |

</details>

<details>
<summary><code>blocks/product-recommendations.liquid</code> — Product recommendations</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Complete the set</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h5</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>html_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>source</code> | <code>select</code> | Recommendation source | mặc định <code>complementary</code>; giá trị: <code>complementary</code>, <code>related</code> |
| <code>limit</code> | <code>range</code> | Product limit | mặc định <code>4</code>; khoảng <code>1</code> → <code>5</code>, bước <code>1</code> |

</details>

<details>
<summary><code>blocks/product-share.liquid</code> — Product share</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>label</code> | <code>text</code> | Label | mặc định <code>Share</code> |

</details>

<details>
<summary><code>blocks/product-shipping-returns.liquid</code> — Shipping and returns</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading</code> | <code>text</code> | Heading | mặc định <code>Shipping and returns</code> |
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h4</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>html_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h3</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>content</code> | <code>richtext</code> | Content | — |

</details>

<details>
<summary><code>blocks/product-size-guide.liquid</code> — Size guide</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>page</code> | <code>page</code> | Size guide page | — |
| <code>label</code> | <code>text</code> | Label | mặc định <code>Size guide</code> |

</details>

<details>
<summary><code>blocks/product-sku.liquid</code> — Product SKU</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-sticky-add-to-cart.liquid</code> — Sticky add to cart</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-title.liquid</code> — Product title</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>heading_size</code> | <code>select</code> | Heading size | mặc định <code>h2</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |
| <code>html_tag</code> | <code>select</code> | HTML Tag | mặc định <code>h1</code>; giá trị: <code>h1</code>, <code>h2</code>, <code>h3</code>, <code>h4</code>, <code>h5</code>, <code>h6</code> |

</details>

<details>
<summary><code>blocks/product-trust-badges.liquid</code> — Trust badges</summary>

Block con cho phép: không. Preset: <code>0</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>content</code> | <code>richtext</code> | Content | — |

</details>

<details>
<summary><code>blocks/product-usp-list.liquid</code> — Product benefits</summary>

Block con cho phép: <code>product-benefit-item</code>. Preset: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>columns_desktop</code> | <code>select</code> | Desktop columns | mặc định <code>4</code>; giá trị: <code>1</code>, <code>2</code>, <code>3</code>, <code>4</code> |
| <code>columns_mobile</code> | <code>select</code> | Mobile columns | mặc định <code>2</code>; giá trị: <code>1</code>, <code>2</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>small</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>icon_size</code> | <code>select</code> | Icon size | mặc định <code>small</code>; giá trị: <code>small</code>, <code>medium</code>, <code>large</code> |

</details>

<details>
<summary><code>blocks/product-variant-status.liquid</code> — Variant status</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/product-vendor.liquid</code> — Product vendor</summary>

Block con cho phép: không. Preset: <code>0</code>.

_Không có setting._

</details>

<details>
<summary><code>blocks/text.liquid</code> — t:general.text</summary>

Block con cho phép: không. Preset: <code>1</code>.

| ID / thành phần | Type | Nhãn / nội dung | Cấu hình |
|---|---|---|---|
| <code>text</code> | <code>richtext</code> | t:labels.text | mặc định <code>&lt;p&gt;Use this text to share information about your brand with your customers.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>select</code> | Text size | mặc định <code>medium</code>; giá trị: <code>x-large</code>, <code>large</code>, <code>medium</code>, <code>small</code>, <code>x-small</code> |
| <code>alignment</code> | <code>text_alignment</code> | t:labels.alignment | mặc định <code>left</code> |

</details>

## 7. Page template và page settings đã lưu

Các file JSON ở <code>templates/</code> là snapshot bố cục/preset trang. Chúng chỉ ghi các giá trị đã lưu; setting bị bỏ qua dùng default trong schema section/block. <code>templates/gift_card.liquid</code> là Liquid template riêng, không có JSON section settings.

Quy tắc layout hiện tại:

- Mọi JSON template không khai báo `layout` dùng `layout/theme.liquid`; layout này gắn `header-group`, nội dung page và `footer-group`.
- `templates/password.json` khai báo `layout: "password"` và dùng `layout/password.liquid`.
- `templates/gift_card.liquid` khai báo `layout none`, tự dựng HTML độc lập và chỉ tái sử dụng global `settings.logo`; không có section/block option.

<details>
<summary><code>templates/404.json</code> — 1 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>main</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>main</code> | <code>404</code> | Bật | 9 | 3 |

<details>
<summary><code>main</code> → <code>404</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>overlay_opacity</code> | <code>20</code> |
| <code>height_desktop</code> | <code>560</code> |
| <code>height_mobile</code> | <code>480</code> |
| <code>content_width</code> | <code>480</code> |
| <code>content_horizontal</code> | <code>center</code> |
| <code>content_vertical</code> | <code>center</code> |
| <code>section_width</code> | <code>full</code> |
| <code>content_surface</code> | <code>false</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>404 page not found</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h1</code> |
| <code>alignment</code> | <code>center</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;The page you requested does not exist.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |

- <code>button</code> → <code>button</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Return home</code> |
| <code>url</code> | <code>/</code> |

</details>

</details>

<details>
<summary><code>templates/article.json</code> — 1 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>main</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>main</code> | <code>article</code> | Bật | 0 | 5 |

<details>
<summary><code>main</code> → <code>article</code></summary>

**Section settings đã lưu**

_Không lưu giá trị riêng; dùng default từ schema._

**Block instances**

- <code>header</code> → <code>article_header</code>

  _Không lưu setting riêng._

- <code>content</code> → <code>article_content</code>

  _Không lưu setting riêng._

- <code>share</code> → <code>share_links</code>

  _Không lưu setting riêng._

- <code>related</code> → <code>related_articles</code>

  _Không lưu setting riêng._

- <code>comments</code> → <code>comments</code>

  _Không lưu setting riêng._

</details>

</details>

<details>
<summary><code>templates/blog.json</code> — 1 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>main</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>main</code> | <code>blog</code> | Bật | 4 | 3 |

<details>
<summary><code>main</code> → <code>blog</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>section_width</code> | <code>page</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |
| <code>padding_top</code> | <code>24</code> |
| <code>padding_bottom</code> | <code>80</code> |

**Block instances**

- <code>header</code> → <code>header</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>eyebrow</code> | <code>Journal</code> |
| <code>heading</code> | <code>Journal</code> |
| <code>heading_size</code> | <code>h1</code> |
| <code>heading_tag</code> | <code>h1</code> |
| <code>intro</code> | — |

- <code>featured_article</code> → <code>featured_article</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>use_latest_article</code> | <code>true</code> |
| <code>hero_height</code> | <code>480</code> |
| <code>show_tag</code> | <code>true</code> |
| <code>show_date</code> | <code>true</code> |
| <code>show_button</code> | <code>true</code> |
| <code>button_label</code> | <code>Read story</code> |

- <code>article_grid</code> → <code>article_grid</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>articles_per_page</code> | <code>10</code> |
| <code>card_gap</code> | <code>20</code> |
| <code>show_featured_in_grid</code> | <code>false</code> |
| <code>show_tags</code> | <code>true</code> |
| <code>show_date</code> | <code>true</code> |
| <code>show_author</code> | <code>false</code> |
| <code>show_excerpt</code> | <code>true</code> |
| <code>excerpt_words</code> | <code>18</code> |
| <code>read_more_label</code> | <code>Read more</code> |
| <code>show_pagination</code> | <code>true</code> |

</details>

</details>

<details>
<summary><code>templates/cart.json</code> — 1 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>main</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>main</code> | <code>cart</code> | Bật | 0 | 4 |

<details>
<summary><code>main</code> → <code>cart</code></summary>

**Section settings đã lưu**

_Không lưu giá trị riêng; dùng default từ schema._

**Block instances**

- <code>price</code> → <code>price</code>

  _Không lưu setting riêng._

- <code>checkout</code> → <code>checkout_button</code>

  _Không lưu setting riêng._

- <code>discount</code> → <code>discount_code</code>

  _Không lưu setting riêng._

- <code>note</code> → <code>order_note</code>

  _Không lưu setting riêng._

</details>

</details>

<details>
<summary><code>templates/collection.json</code> — 3 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>collection_list_argTGR</code> → <code>collection_breadcrumb</code> → <code>main</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>collection_list_argTGR</code> | <code>collection-list</code> | Bật | 19 | 4 |
| 2 | <code>collection_breadcrumb</code> | <code>breadcrumb</code> | Bật | 14 | 0 |
| 3 | <code>main</code> | <code>collection</code> | Bật | 17 | 1 |

<details>
<summary><code>collection_list_argTGR</code> → <code>collection-list</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>layout</code> | <code>grid</code> |
| <code>section_width</code> | <code>full</code> |
| <code>column_gap</code> | <code>16</code> |
| <code>header_gap</code> | <code>48</code> |
| <code>layout_desktop</code> | <code>slider</code> |
| <code>layout_mobile</code> | <code>slider</code> |
| <code>show_pagination</code> | <code>true</code> |
| <code>columns_desktop</code> | <code>4</code> |
| <code>columns_mobile</code> | <code>2</code> |
| <code>image_ratio</code> | <code>portrait</code> |
| <code>card_alignment</code> | <code>center</code> |
| <code>card_gap</code> | <code>20</code> |
| <code>card_heading_size</code> | <code>h4</code> |
| <code>card_heading_tag</code> | <code>h3</code> |
| <code>height_desktop</code> | <code>medium</code> |
| <code>height_mobile</code> | <code>medium</code> |
| <code>padding_top</code> | <code>10</code> |
| <code>padding_bottom</code> | <code>12</code> |
| <code>color_scheme</code> | — |

**Block instances**

- <code>collection_card_Bem9Hi</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>puzzle-collection</code> |
| <code>title</code> | <code>Puzzle Collection</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>20</code> |

- <code>collection_card_cmVa8G</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>dome-collection</code> |
| <code>title</code> | <code>Dôme Collection</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>20</code> |

- <code>collection_card_TXYgm4</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>charlotte-collection</code> |
| <code>title</code> | <code>Charlotte Collection</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>20</code> |

- <code>collection_card_hFAJVc</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>stevie-collection</code> |
| <code>title</code> | <code>Stevie Collection</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>20</code> |

</details>

<details>
<summary><code>collection_breadcrumb</code> → <code>breadcrumb</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>alignment</code> | <code>flex-start</code> |
| <code>section_width</code> | <code>full</code> |
| <code>text_case</code> | <code>normal</code> |
| <code>show_home_link</code> | <code>true</code> |
| <code>home_label</code> | <code>Home</code> |
| <code>show_collections_link</code> | <code>true</code> |
| <code>collections_label</code> | <code>Collections</code> |
| <code>current_label_source</code> | <code>collection</code> |
| <code>current_label</code> | — |
| <code>separator_style</code> | <code>slash</code> |
| <code>item_gap</code> | <code>8</code> |
| <code>padding_top</code> | <code>20</code> |
| <code>padding_bottom</code> | <code>20</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

_Không có block instance._

</details>

<details>
<summary><code>main</code> → <code>collection</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>custom_heading</code> | — |
| <code>fallback_description</code> | <code>&lt;p&gt;Explore our complete collection of thoughtfully crafted jewelry, from timeless everyday essentials to statement pieces designed to celebrate life's most meaningful moments. Discover necklaces, rings, earrings, bracelets, and more in one place.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>show_read_more</code> | <code>true</code> |
| <code>header_padding_top</code> | <code>20</code> |
| <code>header_padding_bottom</code> | <code>20</code> |
| <code>products_per_page</code> | <code>24</code> |
| <code>columns_desktop</code> | <code>4</code> |
| <code>columns_mobile</code> | <code>2</code> |
| <code>product_gap</code> | <code>8</code> |
| <code>show_card_actions</code> | <code>true</code> |
| <code>enable_quick_view</code> | <code>true</code> |
| <code>enable_filtering</code> | <code>true</code> |
| <code>enable_sorting</code> | <code>true</code> |
| <code>promotion_after</code> | <code>4</code> |
| <code>padding_bottom</code> | <code>56</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>promotion</code> → <code>promotion</code> (disabled)

| Key | Giá trị đang lưu |
|---|---|
| <code>eyebrow</code> | — |
| <code>heading</code> | <code>A Curation Of Modern Classics</code> |
| <code>heading_size</code> | <code>lg</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>button_label</code> | <code>Shop now</code> |
| <code>link</code> | — |
| <code>content_position</code> | <code>center</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>20</code> |

</details>

</details>

<details>
<summary><code>templates/index.json</code> — 16 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>slideshow</code> → <code>scrolling_text</code> → <code>gift_spinel</code> → <code>featured_collection</code> → <code>collection_list</code> → <code>shop_the_look</code> → <code>featured_collection_birthstones</code> → <code>collection_showcase</code> → <code>image_with_text</code> → <code>countdown_timer</code> → <code>collection_list_promotions_secondary</code> → <code>featured_product</code> → <code>image_comparison</code> → <code>testimonials</code> → <code>blog_posts</code> → <code>gallery</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>slideshow</code> | <code>slideshow</code> | Bật | 13 | 3 |
| 2 | <code>scrolling_text</code> | <code>scrolling-text</code> | Bật | 14 | 5 |
| 3 | <code>gift_spinel</code> | <code>gift-spinel</code> | Bật | 24 | 4 |
| 4 | <code>featured_collection</code> | <code>featured-collection</code> | Bật | 8 | 3 |
| 5 | <code>collection_list</code> | <code>collection-list</code> | Bật | 19 | 4 |
| 6 | <code>shop_the_look</code> | <code>shop-the-look</code> | Bật | 6 | 6 |
| 7 | <code>featured_collection_birthstones</code> | <code>featured-collection</code> | Bật | 8 | 7 |
| 8 | <code>collection_showcase</code> | <code>collection-showcase</code> | Bật | 11 | 5 |
| 9 | <code>image_with_text</code> | <code>image-with-text</code> | Bật | 7 | 6 |
| 10 | <code>countdown_timer</code> | <code>countdown-timer</code> | Bật | 6 | 4 |
| 11 | <code>collection_list_promotions_secondary</code> | <code>collection-list</code> | Bật | 19 | 2 |
| 12 | <code>featured_product</code> | <code>featured-product</code> | Bật | 8 | 2 |
| 13 | <code>image_comparison</code> | <code>image-comparison</code> | Bật | 16 | 2 |
| 14 | <code>testimonials</code> | <code>testimonials</code> | Bật | 14 | 1 |
| 15 | <code>blog_posts</code> | <code>blog-posts</code> | Bật | 10 | 4 |
| 16 | <code>gallery</code> | <code>gallery</code> | Bật | 8 | 9 |

<details>
<summary><code>slideshow</code> → <code>slideshow</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>slideshow_style</code> | <code>single</code> |
| <code>height_desktop</code> | <code>full</code> |
| <code>height_mobile</code> | <code>large</code> |
| <code>autoplay</code> | <code>true</code> |
| <code>autoplay_delay</code> | <code>8</code> |
| <code>enable_image_zoom</code> | <code>true</code> |
| <code>slide_gap</code> | <code>0</code> |
| <code>arrow_color</code> | <code>#000000</code> |
| <code>arrow_background</code> | <code>#ffffff</code> |
| <code>progress_color</code> | <code>#ffffff</code> |
| <code>progress_track_color</code> | <code>#ffffff</code> |
| <code>section_width</code> | <code>full</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>image_slide_EEpRHg</code> → <code>image_slide</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/slideshow_1_de.webp</code> |
| <code>mobile_image</code> | <code>shopify://shop_images/slideshow_1_mb.webp</code> |
| <code>show_collection_list</code> | <code>false</code> |
| <code>collection</code> | — |
| <code>content_width</code> | <code>520</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>content_position</code> | <code>bottom-left</code> |
| <code>content_position_mobile</code> | <code>bottom-left</code> |
| <code>heading</code> | <code>Elegance That Lives With You</code> |
| <code>heading_size</code> | <code>h1</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>description</code> | <code>&lt;p&gt;Minimal, enduring pieces that become part of your everyday story.&lt;/p&gt;</code> |
| <code>description_size</code> | <code>medium</code> |
| <code>button_1_label</code> | <code>Explore Jewelry</code> |
| <code>button_1_link</code> | — |
| <code>button_1_size</code> | <code>medium</code> |
| <code>button_1_style</code> | <code>primary</code> |
| <code>button_1_hover</code> | <code>standard</code> |
| <code>button_2_label</code> | — |
| <code>button_2_link</code> | — |
| <code>button_2_size</code> | <code>medium</code> |
| <code>button_2_style</code> | <code>secondary</code> |
| <code>button_2_hover</code> | <code>standard</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_color</code> | <code>#000000</code> |
| <code>overlay_opacity</code> | <code>15</code> |

- <code>slide_elegant_jewelry</code> → <code>image_slide</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/slideshow_2_de.webp</code> |
| <code>mobile_image</code> | <code>shopify://shop_images/slideshow_2_mb.webp</code> |
| <code>show_collection_list</code> | <code>false</code> |
| <code>collection</code> | — |
| <code>content_width</code> | <code>720</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>content_position</code> | <code>bottom-left</code> |
| <code>content_position_mobile</code> | <code>bottom-center</code> |
| <code>heading</code> | <code>Elegant Jewelry Pieces</code> |
| <code>heading_size</code> | <code>h1</code> |
| <code>heading_tag</code> | <code>h1</code> |
| <code>description</code> | <code>&lt;p&gt;Find the perfect gift to honor someone special this festive season.&lt;/p&gt;</code> |
| <code>description_size</code> | <code>small</code> |
| <code>button_1_label</code> | <code>Shop all</code> |
| <code>button_1_link</code> | — |
| <code>button_1_size</code> | <code>medium</code> |
| <code>button_1_style</code> | <code>primary</code> |
| <code>button_1_hover</code> | <code>standard</code> |
| <code>button_2_label</code> | — |
| <code>button_2_link</code> | — |
| <code>button_2_size</code> | <code>medium</code> |
| <code>button_2_style</code> | <code>secondary</code> |
| <code>button_2_hover</code> | <code>standard</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_color</code> | <code>#181818</code> |
| <code>overlay_opacity</code> | <code>20</code> |

- <code>slide_new_collection</code> → <code>image_slide</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/slideshow_3_de.webp</code> |
| <code>mobile_image</code> | <code>shopify://shop_images/slideshow_3_mb.webp</code> |
| <code>show_collection_list</code> | <code>false</code> |
| <code>collection</code> | — |
| <code>content_width</code> | <code>660</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>content_position</code> | <code>bottom-left</code> |
| <code>content_position_mobile</code> | <code>bottom-left</code> |
| <code>heading</code> | <code>Made for every moment</code> |
| <code>heading_size</code> | <code>h1</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>description</code> | <code>&lt;p&gt;Timeless forms, thoughtful details, and a finish made to be worn your way.&lt;/p&gt;</code> |
| <code>description_size</code> | <code>small</code> |
| <code>button_1_label</code> | <code>Discover more</code> |
| <code>button_1_link</code> | — |
| <code>button_1_size</code> | <code>medium</code> |
| <code>button_1_style</code> | <code>primary</code> |
| <code>button_1_hover</code> | <code>standard</code> |
| <code>button_2_label</code> | — |
| <code>button_2_link</code> | — |
| <code>button_2_size</code> | <code>medium</code> |
| <code>button_2_style</code> | <code>secondary</code> |
| <code>button_2_hover</code> | <code>standard</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_color</code> | <code>#181818</code> |
| <code>overlay_opacity</code> | <code>10</code> |

</details>

<details>
<summary><code>scrolling_text</code> → <code>scrolling-text</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>behavior</code> | <code>marquee</code> |
| <code>direction</code> | <code>left</code> |
| <code>pause_on_hover</code> | <code>true</code> |
| <code>speed</code> | <code>35</code> |
| <code>item_gap</code> | <code>24</code> |
| <code>font_role</code> | <code>heading</code> |
| <code>font_size</code> | <code>16</code> |
| <code>font_size_mobile</code> | <code>16</code> |
| <code>separator_icon</code> | <code>shopify://shop_images/about-icon2.png</code> |
| <code>icon_size</code> | <code>medium</code> |
| <code>height_desktop</code> | <code>64</code> |
| <code>height_mobile</code> | <code>48</code> |
| <code>section_width</code> | <code>full</code> |
| <code>color_scheme</code> | <code>scheme-2</code> |

**Block instances**

- <code>sustainable</code> → <code>text_item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Sustainable manufacturing</code> |
| <code>link</code> | — |

- <code>solid_gold</code> → <code>text_item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Always 14k solid gold</code> |
| <code>link</code> | — |

- <code>recycled</code> → <code>text_item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Recycled gold and silver</code> |
| <code>link</code> | — |

- <code>love</code> → <code>text_item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Made with love</code> |
| <code>link</code> | — |

- <code>tarnish_free</code> → <code>text_item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Tarnish-free</code> |
| <code>link</code> | — |

</details>

<details>
<summary><code>gift_spinel</code> → <code>gift-spinel</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>eyebrow</code> | <code>Gifting, made simple</code> |
| <code>heading</code> | <code>Find their gift.</code> |
| <code>intro</code> | <code>&lt;p&gt;Choose who you are shopping for and we will show you a ready-to-gift jewelry edit.&lt;/p&gt;</code> |
| <code>concierge_label</code> | <code>Gift finder</code> |
| <code>question_recipient</code> | <code>Who are you shopping for?</code> |
| <code>recipient_partner</code> | <code>My partner</code> |
| <code>recipient_mother</code> | <code>Mum</code> |
| <code>recipient_friend</code> | <code>A friend</code> |
| <code>recipient_myself</code> | <code>Myself</code> |
| <code>fallback_collection</code> | <code>best-sellers</code> |
| <code>fallback_products</code> | <code>["bold-pearl-drop-earring","charlotte-step-cut-ring","drop-shot-tennis-earrings"]</code> |
| <code>fallback_heading</code> | <code>A thoughtful edit, chosen for you.</code> |
| <code>fallback_copy</code> | <code>&lt;p&gt;Considered pieces selected to make the moment feel personal.&lt;/p&gt;</code> |
| <code>fallback_badge</code> | <code>Your curated gift edit</code> |
| <code>fallback_primary_label</code> | <code>Explore this gift edit</code> |
| <code>fallback_primary_link</code> | — |
| <code>products_to_show</code> | <code>3</code> |
| <code>product_columns</code> | <code>3</code> |
| <code>section_width</code> | <code>full</code> |
| <code>layout_ratio</code> | <code>finder</code> |
| <code>choice_style</code> | <code>outline</code> |
| <code>padding_top</code> | <code>60</code> |
| <code>padding_bottom</code> | <code>60</code> |
| <code>color_scheme</code> | <code>scheme-2</code> |

**Block instances**

- <code>mother_birthday_birthstone</code> → <code>gift_path</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>path_label</code> | <code>Mother gift edit</code> |
| <code>recipient</code> | <code>mother</code> |
| <code>result_collection</code> | <code>best-sellers</code> |
| <code>result_products</code> | <code>["birthstone-charm","sia-birthstone-bracelet","september-birthstone-chain-bracelet"]</code> |
| <code>primary_label</code> | <code>Explore this gift edit</code> |
| <code>primary_link</code> | — |
| <code>heading</code> | <code>A piece made for Mum.</code> |
| <code>copy</code> | <code>&lt;p&gt;Chosen for its quiet symbolism and made to become part of her everyday ritual.&lt;/p&gt;</code> |
| <code>featured_badge</code> | <code>Made for birthdays</code> |
| <code>show_personalization</code> | <code>false</code> |
| <code>personalization_label</code> | <code>Make it personal</code> |
| <code>personalization_link</code> | — |

- <code>partner_anniversary_engraving</code> → <code>gift_path</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>path_label</code> | <code>Partner gift edit</code> |
| <code>recipient</code> | <code>partner</code> |
| <code>result_collection</code> | <code>wedding-1</code> |
| <code>result_products</code> | <code>["charlotte-step-cut-ring","round-lab-grown-sapphire-necklace","pearl-oversized-studs"]</code> |
| <code>primary_label</code> | <code>Explore this gift edit</code> |
| <code>primary_link</code> | — |
| <code>heading</code> | <code>A keepsake for your shared story.</code> |
| <code>copy</code> | <code>&lt;p&gt;A considered piece for marking the moments, words, and promises only the two of you share.&lt;/p&gt;</code> |
| <code>featured_badge</code> | <code>Made to remember</code> |
| <code>show_personalization</code> | <code>true</code> |
| <code>personalization_label</code> | <code>Make it personal</code> |
| <code>personalization_link</code> | — |

- <code>friend_new_beginning_set</code> → <code>gift_path</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>path_label</code> | <code>Friend gift edit</code> |
| <code>recipient</code> | <code>friend</code> |
| <code>result_collection</code> | <code>puzzle-collection</code> |
| <code>result_products</code> | <code>["pave-puzzle-stacking-ring","puzzle-sliding-charm-18k-gold-vermeil","puzzle-stacking-ring-sterling-silver"]</code> |
| <code>primary_label</code> | <code>Explore this gift edit</code> |
| <code>primary_link</code> | — |
| <code>heading</code> | <code>A new chapter, made to layer.</code> |
| <code>copy</code> | <code>&lt;p&gt;A bright reminder of everything ahead, selected to wear alone or build into a story.&lt;/p&gt;</code> |
| <code>featured_badge</code> | <code>For new beginnings</code> |
| <code>show_personalization</code> | <code>false</code> |
| <code>personalization_label</code> | <code>Make it personal</code> |
| <code>personalization_link</code> | — |

- <code>myself_just_because_gold</code> → <code>gift_path</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>path_label</code> | <code>Myself gift edit</code> |
| <code>recipient</code> | <code>myself</code> |
| <code>result_collection</code> | <code>dome-collection</code> |
| <code>result_products</code> | <code>["dome-cuff-bracelet","dome-huggies","organic-dome-curve-gemstone-necklace"]</code> |
| <code>primary_label</code> | <code>Explore this gift edit</code> |
| <code>primary_link</code> | — |
| <code>heading</code> | <code>A piece to keep close.</code> |
| <code>copy</code> | <code>&lt;p&gt;Timeless gold, chosen for no reason other than it feels unmistakably yours.&lt;/p&gt;</code> |
| <code>featured_badge</code> | <code>A gift to yourself</code> |
| <code>show_personalization</code> | <code>false</code> |
| <code>personalization_label</code> | <code>Make it personal</code> |
| <code>personalization_link</code> | — |

</details>

<details>
<summary><code>featured_collection</code> → <code>featured-collection</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>products_to_show</code> | <code>4</code> |
| <code>columns_desktop</code> | <code>4</code> |
| <code>columns_mobile</code> | <code>1</code> |
| <code>section_width</code> | <code>full</code> |
| <code>product_gap</code> | <code>12</code> |
| <code>padding_top</code> | <code>96</code> |
| <code>padding_bottom</code> | <code>48</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>new_in</code> → <code>collection_tab</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>New arrivals</code> |
| <code>source</code> | <code>collection</code> |
| <code>collection</code> | <code>new-arrivals</code> |

- <code>necklaces</code> → <code>collection_tab</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Best Sellers</code> |
| <code>source</code> | <code>collection</code> |
| <code>collection</code> | <code>best-sellers</code> |

- <code>bracelets</code> → <code>collection_tab</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>All Personalized</code> |
| <code>source</code> | <code>collection</code> |
| <code>collection</code> | <code>all-personalized</code> |

</details>

<details>
<summary><code>collection_list</code> → <code>collection-list</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>layout</code> | <code>grid</code> |
| <code>section_width</code> | <code>full</code> |
| <code>column_gap</code> | <code>12</code> |
| <code>header_gap</code> | <code>48</code> |
| <code>layout_desktop</code> | <code>slider</code> |
| <code>layout_mobile</code> | <code>slider</code> |
| <code>show_pagination</code> | <code>true</code> |
| <code>columns_desktop</code> | <code>3</code> |
| <code>columns_mobile</code> | <code>2</code> |
| <code>image_ratio</code> | <code>portrait</code> |
| <code>card_alignment</code> | <code>left</code> |
| <code>card_gap</code> | <code>20</code> |
| <code>card_heading_size</code> | <code>h3</code> |
| <code>card_heading_tag</code> | <code>h3</code> |
| <code>height_desktop</code> | <code>medium</code> |
| <code>height_mobile</code> | <code>medium</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>96</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Shop By Category</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>center</code> |

- <code>necklace</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>necklaces</code> |
| <code>title</code> | <code>Necklaces</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>20</code> |

- <code>earrings</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>bracelets</code> |
| <code>title</code> | <code>Bracelets</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>20</code> |

- <code>bracelet</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>rings</code> |
| <code>title</code> | <code>Rings</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>20</code> |

</details>

<details>
<summary><code>shop_the_look</code> → <code>shop-the-look</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>media_position</code> | <code>left</code> |
| <code>product_image_size</code> | <code>320</code> |
| <code>content_padding</code> | <code>48</code> |
| <code>height_desktop</code> | <code>720</code> |
| <code>height_mobile</code> | <code>440</code> |
| <code>color_scheme</code> | <code>scheme-4</code> |

**Block instances**

- <code>media</code> → <code>media</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/lookbook.webp</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>mobile_focal_point</code> | <code>center center</code> |

- <code>eyebrow</code> → <code>eyebrow</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Shop the look</code> |

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Statement Stacks</code> |
| <code>heading_size</code> | <code>h3</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>center</code> |

- <code>product_one</code> → <code>product_hotspot</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>product</code> | <code>pave-puzzle-stacking-ring</code> |
| <code>horizontal_position</code> | <code>52</code> |
| <code>vertical_position</code> | <code>38</code> |
| <code>enable_mobile_position</code> | <code>false</code> |
| <code>mobile_horizontal_position</code> | <code>60</code> |
| <code>mobile_vertical_position</code> | <code>58</code> |

- <code>product_two</code> → <code>product_hotspot</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>product</code> | <code>dome-cuff-bracelet</code> |
| <code>horizontal_position</code> | <code>67</code> |
| <code>vertical_position</code> | <code>85</code> |
| <code>enable_mobile_position</code> | <code>false</code> |
| <code>mobile_horizontal_position</code> | <code>60</code> |
| <code>mobile_vertical_position</code> | <code>58</code> |

- <code>product_three</code> → <code>product_hotspot</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>product</code> | <code>floating-lab-grown-sapphire-necklace</code> |
| <code>horizontal_position</code> | <code>49</code> |
| <code>vertical_position</code> | <code>76</code> |
| <code>enable_mobile_position</code> | <code>false</code> |
| <code>mobile_horizontal_position</code> | <code>60</code> |
| <code>mobile_vertical_position</code> | <code>58</code> |

</details>

<details>
<summary><code>featured_collection_birthstones</code> → <code>featured-collection</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>products_to_show</code> | <code>6</code> |
| <code>columns_desktop</code> | <code>3</code> |
| <code>columns_mobile</code> | <code>1</code> |
| <code>section_width</code> | <code>full</code> |
| <code>product_gap</code> | <code>12</code> |
| <code>padding_top</code> | <code>96</code> |
| <code>padding_bottom</code> | <code>96</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Semi-Precious Birthstones</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>left</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;The ultimate sentimental souvenir, made from 14k gold and semi-precious stones.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |

- <code>promotion</code> → <code>promotion</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/promotion1.webp</code> |
| <code>heading</code> | <code>For Effortless Glow</code> |
| <code>text</code> | <code>&lt;p&gt;Radiant, versatile designs for everyday moments.&lt;/p&gt;</code> |
| <code>button_label</code> | <code>Shop now</code> |
| <code>link</code> | — |
| <code>position</code> | <code>before</code> |
| <code>media_ratio</code> | <code>portrait</code> |
| <code>focal_point</code> | <code>center</code> |
| <code>overlay_opacity</code> | <code>40</code> |

- <code>necklaces</code> → <code>collection_tab</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Necklaces</code> |
| <code>source</code> | <code>collection</code> |
| <code>collection</code> | <code>new-arrivals</code> |

- <code>rings</code> → <code>collection_tab</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Earrings</code> |
| <code>source</code> | <code>collection</code> |
| <code>collection</code> | <code>earrings</code> |

- <code>earrings</code> → <code>collection_tab</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Bracelets</code> |
| <code>source</code> | <code>collection</code> |
| <code>collection</code> | <code>bracelets</code> |

- <code>collection_tab_YJRPE6</code> → <code>collection_tab</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Rings</code> |
| <code>source</code> | <code>collection</code> |
| <code>collection</code> | <code>rings</code> |

</details>

<details>
<summary><code>collection_showcase</code> → <code>collection-showcase</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>section_width</code> | <code>full</code> |
| <code>media_position_desktop</code> | <code>after</code> |
| <code>media_position_mobile</code> | <code>after</code> |
| <code>height_desktop</code> | <code>732</code> |
| <code>height_tablet</code> | <code>560</code> |
| <code>height_mobile</code> | <code>520</code> |
| <code>media_display</code> | <code>fill</code> |
| <code>link_font</code> | <code>heading</code> |
| <code>link_size</code> | <code>medium</code> |
| <code>content_color_scheme</code> | <code>scheme-3</code> |
| <code>media_color_scheme</code> | <code>scheme-2</code> |

**Block instances**

- <code>eyebrow</code> → <code>eyebrow</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>DREAM COME TRUE — AW ‘26 COLLECTION</code> |

- <code>lucy_williams</code> → <code>collection_link</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>puzzle-collection</code> |
| <code>image_alt</code> | — |
| <code>focal_point</code> | <code>center center</code> |
| <code>title</code> | <code>Golden Edit</code> |
| <code>count</code> | — |
| <code>link</code> | — |

- <code>casablanca_edit</code> → <code>collection_link</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>dome-collection</code> |
| <code>image_alt</code> | — |
| <code>focal_point</code> | <code>center center</code> |
| <code>title</code> | <code>Modern Muse</code> |
| <code>count</code> | — |
| <code>link</code> | — |

- <code>charms_sets</code> → <code>collection_link</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>all-personalized</code> |
| <code>image_alt</code> | — |
| <code>focal_point</code> | <code>center center</code> |
| <code>title</code> | <code>Personal Touch</code> |
| <code>count</code> | — |
| <code>link</code> | — |

- <code>pearls_gemstones</code> → <code>collection_link</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>wedding-1</code> |
| <code>image_alt</code> | — |
| <code>focal_point</code> | <code>center center</code> |
| <code>title</code> | <code>Bridal Edit</code> |
| <code>count</code> | — |
| <code>link</code> | — |

</details>

<details>
<summary><code>image_with_text</code> → <code>image-with-text</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>media_position</code> | <code>left</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>section_width</code> | <code>page</code> |
| <code>column_gap</code> | <code>40</code> |
| <code>padding_top</code> | <code>96</code> |
| <code>padding_bottom</code> | <code>96</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>media_base</code> → <code>media</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/iwt1.webp</code> |
| <code>alt</code> | — |
| <code>desktop_image_ratio</code> | <code>portrait</code> |
| <code>mobile_image_ratio</code> | <code>portrait</code> |
| <code>focal_point</code> | <code>center center</code> |

- <code>media_foreground</code> → <code>media</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/iwt2.webp</code> |
| <code>alt</code> | — |
| <code>desktop_image_ratio</code> | <code>square</code> |
| <code>mobile_image_ratio</code> | <code>square</code> |
| <code>focal_point</code> | <code>center center</code> |

- <code>eyebrow</code> → <code>eyebrow</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Our mission</code> |

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>More Than Beauty, A Philosophy</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>left</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;We use recycled materials selected for their beauty and durability, creating jewellery designed to be worn every day.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |

- <code>button</code> → <code>button</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Read more</code> |
| <code>link</code> | — |
| <code>style</code> | <code>tertiary</code> |

</details>

<details>
<summary><code>countdown_timer</code> → <code>countdown-timer</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>mobile_alignment</code> | <code>center</code> |
| <code>column_gap</code> | <code>64</code> |
| <code>section_width</code> | <code>full</code> |
| <code>padding_top</code> | <code>64</code> |
| <code>padding_bottom</code> | <code>64</code> |
| <code>color_scheme</code> | <code>scheme-2</code> |

**Block instances**

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Spring Sale</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>left</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;Get 15% off on all products – limited time only!&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |

- <code>countdown</code> → <code>countdown</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>end_at</code> | <code>2026-08-31T23:59:59+07:00</code> |
| <code>days_label</code> | <code>Days</code> |
| <code>hours_label</code> | <code>Hours</code> |
| <code>minutes_label</code> | <code>Minutes</code> |
| <code>seconds_label</code> | <code>Seconds</code> |
| <code>aria_label</code> | <code>Spring Sale countdown</code> |
| <code>completion_behavior</code> | <code>message</code> |
| <code>completion_message</code> | <code>Spring Sale ended</code> |

- <code>button</code> → <code>button</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Shop now</code> |
| <code>link</code> | <code>shopify://collections</code> |
| <code>style</code> | <code>primary</code> |

</details>

<details>
<summary><code>collection_list_promotions_secondary</code> → <code>collection-list</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>layout</code> | <code>split-promotions</code> |
| <code>section_width</code> | <code>full</code> |
| <code>column_gap</code> | <code>0</code> |
| <code>header_gap</code> | <code>0</code> |
| <code>layout_desktop</code> | <code>slider</code> |
| <code>layout_mobile</code> | <code>slider</code> |
| <code>show_pagination</code> | <code>true</code> |
| <code>columns_desktop</code> | <code>2</code> |
| <code>columns_mobile</code> | <code>2</code> |
| <code>image_ratio</code> | <code>landscape</code> |
| <code>card_alignment</code> | <code>center</code> |
| <code>card_gap</code> | <code>16</code> |
| <code>card_heading_size</code> | <code>h3</code> |
| <code>card_heading_tag</code> | <code>h3</code> |
| <code>height_desktop</code> | <code>medium</code> |
| <code>height_mobile</code> | <code>medium</code> |
| <code>padding_top</code> | <code>0</code> |
| <code>padding_bottom</code> | <code>0</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |

**Block instances**

- <code>arrow_drop_earrings</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>earrings</code> |
| <code>title</code> | <code>Arrow Drop Earrings</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | <code>Sale up to 20%</code> |
| <code>button_label</code> | <code>Shop sale</code> |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>false</code> |
| <code>color_scheme</code> | — |
| <code>overlay_opacity</code> | <code>0</code> |

- <code>lighting_ridge_opals</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>rings</code> |
| <code>title</code> | <code>Lighting Ridge Opals</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | <code>New collection 2026</code> |
| <code>button_label</code> | <code>Shop now</code> |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>false</code> |
| <code>color_scheme</code> | — |
| <code>overlay_opacity</code> | <code>0</code> |

</details>

<details>
<summary><code>featured_product</code> → <code>featured-product</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>product</code> | <code>floating-lab-grown-sapphire-necklace</code> |
| <code>section_width</code> | <code>page</code> |
| <code>desktop_gap</code> | <code>64</code> |
| <code>media_width</code> | <code>58</code> |
| <code>mobile_gap</code> | <code>16</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |
| <code>padding_top</code> | <code>96</code> |
| <code>padding_bottom</code> | <code>48</code> |

**Block instances**

- <code>gallery</code> → <code>_product-media-gallery</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>desktop_layout</code> | <code>carousel</code> |
| <code>image_zoom</code> | <code>open_lightbox</code> |
| <code>grid_columns</code> | <code>2</code> |
| <code>grid_layout</code> | <code>editorial</code> |
| <code>carousel_thumbnails</code> | <code>left</code> |
| <code>gap</code> | <code>12</code> |
| <code>media_ratio</code> | <code>portrait</code> |
| <code>mobile_media_ratio</code> | <code>portrait</code> |
| <code>media_fit</code> | <code>cover</code> |
| <code>show_mobile_pagination</code> | <code>true</code> |
| <code>show_mobile_thumbnails</code> | <code>true</code> |
| <code>thumbnail_size</code> | <code>64</code> |
| <code>thumbnail_gap</code> | <code>8</code> |

- <code>details</code> → <code>_product-details</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>enable_sticky</code> | <code>true</code> |
| <code>desktop_top_offset</code> | <code>24</code> |

  Block lồng nhau:

    - <code>title</code> → <code>product-title</code>; settings: <code>{"heading_size":"h2","html_tag":"h2"}</code>
    - <code>price</code> → <code>product-price</code>; settings: <code>{"price_size":"medium","show_discount_percentage":false}</code>
    - <code>rating</code> → <code>product-rating</code>; settings: <code>{"show_when_empty":false,"empty_label":"No reviews yet"}</code>
    - <code>description</code> → <code>product-metafield</code>; settings: <code>{"namespace":"custom","key":"summary","style":"full"}</code>
    - <code>options</code> → <code>product-option-picker</code>; settings: <code>{"show_variant_labels":true,"picker_type":"button","enable_color_swatches":true,"swatch_type":"color","swatch_corner_radius":"pill","enable_size_chart":false,"size_guide":"Size guide","size_chart":"Size chart","size_chart_page":""}</code>
    - <code>inventory</code> → <code>product-inventory</code>; settings: <code>{}</code>
    - <code>buttons</code> → <code>product-buy-buttons</code>; settings: <code>{"button_layout":"inline","show_quantity":true,"show_dynamic_checkout":true}</code>
    - <code>benefits</code> → <code>product-usp-list</code>; settings: <code>{"columns_desktop":"4","columns_mobile":"2","text_size":"small","icon_size":"small"}</code>
      - <code>benefit_1</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"truck","text":"&lt;p&gt;Free Shipping $49+&lt;/p&gt;","page":"","show_page_popup":false}</code>
      - <code>benefit_2</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"return","text":"&lt;p&gt;Free Returns&lt;/p&gt;","page":"","show_page_popup":false}</code>
      - <code>benefit_3</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"shield","text":"&lt;p&gt;Lifetime Warranty&lt;/p&gt;","page":"","show_page_popup":false}</code>
      - <code>benefit_4</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"sparkles","text":"&lt;p&gt;Sustainably Made&lt;/p&gt;","page":"","show_page_popup":false}</code>
    - <code>accordion_group</code> → <code>product-accordion-group</code>; settings: <code>{"icon":"plus"}</code>
      - <code>description_accordion</code> → <code>product-accordion</code>; settings: <code>{"heading":"Description","heading_size":"h5","html_tag":"h3","content_source":"description","metafield_namespace":"custom","metafield_key":"summary","content":"","show_divider":true,"open_by_default":false,"show_view_more":true,"content_max_height":240}</code>
      - <code>care_accordion</code> → <code>product-accordion</code>; settings: <code>{"heading":"Care guide","heading_size":"h5","html_tag":"h3","content_source":"manual","metafield_namespace":"custom","metafield_key":"summary","content":"&lt;p&gt;Store each piece separately, avoid contact with water and chemicals, and gently wipe it with a soft dry cloth after wear.&lt;/p&gt;","show_divider":true,"open_by_default":false,"show_view_more":true,"content_max_height":240}</code>
      - <code>shipping_accordion</code> → <code>product-accordion</code>; settings: <code>{"heading":"Shipping &amp; returns","heading_size":"h5","html_tag":"h3","content_source":"manual","metafield_namespace":"custom","metafield_key":"summary","content":"&lt;p&gt;Available delivery methods and estimated times are shown at checkout. Eligible unworn items may be returned in their original condition and packaging.&lt;/p&gt;","show_divider":true,"open_by_default":false,"show_view_more":true,"content_max_height":240}</code>

</details>

<details>
<summary><code>image_comparison</code> → <code>image-comparison</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>layout</code> | <code>horizontal</code> |
| <code>desktop_height</code> | <code>medium</code> |
| <code>layout_gap</code> | <code>44</code> |
| <code>mobile_height</code> | <code>medium</code> |
| <code>heading</code> | <code>The Making of Timeless Beauty</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>content_alignment</code> | <code>center</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>subheading</code> | — |
| <code>description</code> | <code>&lt;p&gt;Discover the precision behind every handcrafted piece.v&lt;/p&gt;</code> |
| <code>button_label</code> | — |
| <code>button_link</code> | — |
| <code>heading_gap</code> | <code>16</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>96</code> |

**Block instances**

- <code>before</code> → <code>image</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/Image_before.jpg</code> |
| <code>image_alt</code> | — |
| <code>subheading</code> | <code>EVERYDAY</code> |
| <code>heading</code> | <code>Beautiful in Simplicity</code> |
| <code>button_label</code> | — |
| <code>button_link</code> | — |
| <code>content_position</code> | <code>end</code> |
| <code>text_color</code> | <code>#ffffff</code> |

- <code>after</code> → <code>image</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/Image_after.jpg</code> |
| <code>image_alt</code> | — |
| <code>subheading</code> | <code>ELEVATED</code> |
| <code>heading</code> | <code>Refined by Every Detail</code> |
| <code>button_label</code> | — |
| <code>button_link</code> | — |
| <code>content_position</code> | <code>end</code> |
| <code>text_color</code> | <code>#ffffff</code> |

</details>

<details>
<summary><code>testimonials</code> → <code>testimonials</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>layout_desktop</code> | <code>slider</code> |
| <code>layout_mobile</code> | <code>slider</code> |
| <code>show_pagination</code> | <code>false</code> |
| <code>pagination_bottom_spacing_mobile</code> | <code>32</code> |
| <code>columns_desktop</code> | <code>1</code> |
| <code>columns_mobile</code> | <code>1</code> |
| <code>section_width</code> | <code>custom</code> |
| <code>container_width</code> | <code>980</code> |
| <code>content_gap</code> | <code>24</code> |
| <code>column_gap</code> | <code>28</code> |
| <code>row_gap</code> | <code>40</code> |
| <code>padding_top</code> | <code>64</code> |
| <code>padding_bottom</code> | <code>64</code> |
| <code>color_scheme</code> | <code>scheme-4</code> |

**Block instances**

- <code>founder_quote</code> → <code>testimonial</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>icon</code> | <code>shopify://shop_images/about-icon1.png</code> |
| <code>icon_size</code> | <code>small</code> |
| <code>quote</code> | <code>When designing this collection, we wanted to strike a balance between bold silhouettes and timeless proportions. The result is a series of rings that feel effortless, yet striking</code> |
| <code>quote_size</code> | <code>h3</code> |
| <code>author</code> | <code>Ruby</code> |
| <code>role</code> | <code>Founder of SPINEL</code> |
| <code>attribution_size</code> | <code>medium</code> |

</details>

<details>
<summary><code>blog_posts</code> → <code>blog-posts</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>media_ratio</code> | <code>landscape</code> |
| <code>show_tags</code> | <code>true</code> |
| <code>show_date</code> | <code>true</code> |
| <code>show_author</code> | <code>true</code> |
| <code>excerpt_words</code> | <code>28</code> |
| <code>card_gap</code> | <code>16</code> |
| <code>section_width</code> | <code>full</code> |
| <code>padding_top</code> | <code>96</code> |
| <code>padding_bottom</code> | <code>48</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>header</code> → <code>header</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Enjoy Our Articles</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>text</code> | <code>&lt;p&gt;Discover the latest updates, insights, and inspirations.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>link_label</code> | <code>View all</code> |
| <code>link</code> | — |

- <code>article_one</code> → <code>article</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>article</code> | <code>news/how-to-choose-timeless-jewelry-pieces</code> |
| <code>tag</code> | — |
| <code>title</code> | — |
| <code>excerpt</code> | — |
| <code>link</code> | — |
| <code>tag_visibility</code> | <code>inherit</code> |
| <code>date_visibility</code> | <code>inherit</code> |
| <code>author_visibility</code> | <code>inherit</code> |
| <code>excerpt_visibility</code> | <code>show</code> |
| <code>excerpt_words</code> | <code>0</code> |
| <code>title_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>excerpt_size</code> | <code>small</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>vertical_alignment</code> | <code>center</code> |
| <code>content_width</code> | <code>736</code> |
| <code>show_image</code> | <code>true</code> |
| <code>image_alt</code> | <code>Jewelry styling inspiration</code> |
| <code>media_ratio</code> | <code>inherit</code> |
| <code>image_position</code> | <code>center center</code> |
| <code>media_position</code> | <code>right</code> |
| <code>mobile_media_position</code> | <code>top</code> |
| <code>media_width</code> | <code>40</code> |
| <code>link_label</code> | <code>Read more</code> |
| <code>link_style</code> | <code>text</code> |
| <code>open_in_new_tab</code> | <code>false</code> |

- <code>article_two</code> → <code>article</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>article</code> | <code>news/how-to-style-jewelry-for-your-summer-outfits</code> |
| <code>tag</code> | — |
| <code>title</code> | — |
| <code>excerpt</code> | — |
| <code>link</code> | — |
| <code>tag_visibility</code> | <code>inherit</code> |
| <code>date_visibility</code> | <code>inherit</code> |
| <code>author_visibility</code> | <code>inherit</code> |
| <code>excerpt_visibility</code> | <code>show</code> |
| <code>excerpt_words</code> | <code>0</code> |
| <code>title_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>excerpt_size</code> | <code>small</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>vertical_alignment</code> | <code>center</code> |
| <code>content_width</code> | <code>736</code> |
| <code>show_image</code> | <code>true</code> |
| <code>image_alt</code> | <code>The art of jewelry making</code> |
| <code>media_ratio</code> | <code>inherit</code> |
| <code>image_position</code> | <code>center center</code> |
| <code>media_position</code> | <code>right</code> |
| <code>mobile_media_position</code> | <code>top</code> |
| <code>media_width</code> | <code>40</code> |
| <code>link_label</code> | <code>Read more</code> |
| <code>link_style</code> | <code>text</code> |
| <code>open_in_new_tab</code> | <code>false</code> |

- <code>article_three</code> → <code>article</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>article</code> | <code>news/how-to-choose-the-perfect-engagement-ring</code> |
| <code>tag</code> | — |
| <code>title</code> | — |
| <code>excerpt</code> | — |
| <code>link</code> | — |
| <code>tag_visibility</code> | <code>inherit</code> |
| <code>date_visibility</code> | <code>inherit</code> |
| <code>author_visibility</code> | <code>inherit</code> |
| <code>excerpt_visibility</code> | <code>show</code> |
| <code>excerpt_words</code> | <code>0</code> |
| <code>title_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>excerpt_size</code> | <code>small</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>vertical_alignment</code> | <code>center</code> |
| <code>content_width</code> | <code>736</code> |
| <code>show_image</code> | <code>true</code> |
| <code>image_alt</code> | <code>Jewelry for every occasion</code> |
| <code>media_ratio</code> | <code>inherit</code> |
| <code>image_position</code> | <code>center center</code> |
| <code>media_position</code> | <code>right</code> |
| <code>mobile_media_position</code> | <code>top</code> |
| <code>media_width</code> | <code>40</code> |
| <code>link_label</code> | <code>Read more</code> |
| <code>link_style</code> | <code>text</code> |
| <code>open_in_new_tab</code> | <code>false</code> |

</details>

<details>
<summary><code>gallery</code> → <code>gallery</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>columns_desktop</code> | <code>4</code> |
| <code>columns_mobile</code> | <code>2</code> |
| <code>section_width</code> | <code>full</code> |
| <code>content_gap</code> | <code>40</code> |
| <code>grid_gap</code> | <code>8</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>96</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>header</code> → <code>header</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Shop The Latest From Instagram</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>text</code> | <code>&lt;p&gt;&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>link_label</code> | — |
| <code>link</code> | — |

- <code>image_one</code> → <code>image</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/gall1.jpg</code> |
| <code>image_alt</code> | <code>Gold ring stack</code> |
| <code>link</code> | — |

- <code>image_two</code> → <code>image</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/gall2.webp</code> |
| <code>image_alt</code> | <code>Diamond necklace</code> |
| <code>link</code> | — |

- <code>image_three</code> → <code>image</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/gall3.webp</code> |
| <code>image_alt</code> | <code>Statement earrings</code> |
| <code>link</code> | — |

- <code>image_four</code> → <code>image</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/gall4.jpg</code> |
| <code>image_alt</code> | <code>Gold rings</code> |
| <code>link</code> | — |

- <code>image_five</code> → <code>image</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/gall5.jpg</code> |
| <code>image_alt</code> | <code>Charm bracelet</code> |
| <code>link</code> | — |

- <code>image_six</code> → <code>image</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/gall6.webp</code> |
| <code>image_alt</code> | <code>Tennis bracelet</code> |
| <code>link</code> | — |

- <code>image_seven</code> → <code>image</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/gall7.png</code> |
| <code>image_alt</code> | <code>Jewelry set</code> |
| <code>link</code> | — |

- <code>image_eight</code> → <code>image</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/gall8.webp</code> |
| <code>image_alt</code> | <code>Pearl earring</code> |
| <code>link</code> | — |

</details>

</details>

<details>
<summary><code>templates/list-collections.json</code> — 1 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>main</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>main</code> | <code>collections</code> | Bật | 14 | 0 |

<details>
<summary><code>main</code> → <code>collections</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Collections</code> |
| <code>description</code> | — |
| <code>text_alignment</code> | <code>center</code> |
| <code>section_width</code> | <code>page</code> |
| <code>image_ratio</code> | <code>portrait</code> |
| <code>card_text_alignment</code> | <code>left</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>columns_desktop</code> | <code>4</code> |
| <code>columns_mobile</code> | <code>2</code> |
| <code>grid_gap</code> | <code>16</code> |
| <code>collections_per_page</code> | <code>8</code> |
| <code>padding_top</code> | <code>72</code> |
| <code>padding_bottom</code> | <code>96</code> |
| <code>color_scheme</code> | — |

_Không có block instance._

</details>

</details>

<details>
<summary><code>templates/page.about.json</code> — 7 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>about_intro</code> → <code>collection_quote</code> → <code>sustainability</code> → <code>founder_story</code> → <code>design_vision</code> → <code>benefits</code> → <code>newsletter</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>about_intro</code> | <code>image-with-text</code> | Bật | 7 | 5 |
| 2 | <code>collection_quote</code> | <code>testimonials</code> | Bật | 14 | 1 |
| 3 | <code>sustainability</code> | <code>video-banner</code> | Bật | 11 | 4 |
| 4 | <code>founder_story</code> | <code>image-with-text</code> | Bật | 7 | 4 |
| 5 | <code>design_vision</code> | <code>image-with-text</code> | Bật | 7 | 5 |
| 6 | <code>benefits</code> | <code>icon-with-text</code> | Bật | 16 | 4 |
| 7 | <code>newsletter</code> | <code>newsletter</code> | Bật | 22 | 3 |

<details>
<summary><code>about_intro</code> → <code>image-with-text</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>media_position</code> | <code>left</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>section_width</code> | <code>page</code> |
| <code>column_gap</code> | <code>96</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>96</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>media</code> → <code>media</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/about1.jpg</code> |
| <code>alt</code> | <code>Jewellery collection</code> |
| <code>desktop_image_ratio</code> | <code>landscape</code> |
| <code>mobile_image_ratio</code> | <code>landscape</code> |
| <code>focal_point</code> | <code>center</code> |

- <code>eyebrow</code> → <code>eyebrow</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Our story</code> |

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>About Us</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h1</code> |
| <code>alignment</code> | <code>left</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;We are endlessly inspired and moved by the earth and all of her magic. Our fascination with the natural world informs jewellery that will be a reminder of her beauty to others who wear them.&lt;/p&gt;&lt;p&gt;In 2022, we chose to extend our narrative, which began in Toronto, to Bangkok, a city where rich culture intertwines with historical expertise of jewellery artisans.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |

- <code>button</code> → <code>button</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Discover more</code> |
| <code>link</code> | — |
| <code>style</code> | <code>tertiary</code> |

</details>

<details>
<summary><code>collection_quote</code> → <code>testimonials</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>layout_desktop</code> | <code>grid</code> |
| <code>layout_mobile</code> | <code>grid</code> |
| <code>show_pagination</code> | <code>false</code> |
| <code>pagination_bottom_spacing_mobile</code> | <code>32</code> |
| <code>columns_desktop</code> | <code>1</code> |
| <code>columns_mobile</code> | <code>1</code> |
| <code>section_width</code> | <code>custom</code> |
| <code>container_width</code> | <code>980</code> |
| <code>content_gap</code> | <code>20</code> |
| <code>column_gap</code> | <code>28</code> |
| <code>row_gap</code> | <code>40</code> |
| <code>padding_top</code> | <code>96</code> |
| <code>padding_bottom</code> | <code>96</code> |
| <code>color_scheme</code> | <code>scheme-2</code> |

**Block instances**

- <code>quote</code> → <code>testimonial</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>icon_size</code> | <code>small</code> |
| <code>quote</code> | <code>When designing this collection, we wanted to strike a balance between bold silhouettes and timeless proportions. The result is a series of rings that feel effortless, yet striking.</code> |
| <code>quote_size</code> | <code>h3</code> |
| <code>author</code> | <code>Clem</code> |
| <code>role</code> | <code>Founder of Omniselle</code> |
| <code>attribution_size</code> | <code>small</code> |

</details>

<details>
<summary><code>sustainability</code> → <code>video-banner</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>content_position</code> | <code>center</code> |
| <code>autoplay</code> | <code>true</code> |
| <code>loop</code> | <code>true</code> |
| <code>overlay_opacity</code> | <code>30</code> |
| <code>content_width</code> | <code>680</code> |
| <code>section_width</code> | <code>full</code> |
| <code>content_padding</code> | <code>40</code> |
| <code>height_desktop</code> | <code>560</code> |
| <code>height_tablet</code> | <code>480</code> |
| <code>height_mobile</code> | <code>420</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |

**Block instances**

- <code>media</code> → <code>video</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>focal_point</code> | <code>center center</code> |
| <code>muted</code> | <code>true</code> |
| <code>accessibility_label</code> | <code>Jewellery craft process</code> |
| <code>play_label</code> | <code>Play sustainability video</code> |

- <code>eyebrow</code> → <code>eyebrow</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Introducing</code> |

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Sustainability &amp; Ethics</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>center</code> |

- <code>button</code> → <code>button</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Our sustainability</code> |
| <code>link</code> | — |
| <code>style</code> | <code>secondary</code> |

</details>

<details>
<summary><code>founder_story</code> → <code>image-with-text</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>media_position</code> | <code>right</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>section_width</code> | <code>page</code> |
| <code>column_gap</code> | <code>96</code> |
| <code>padding_top</code> | <code>96</code> |
| <code>padding_bottom</code> | <code>48</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>media</code> → <code>media</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/about3.jpg</code> |
| <code>alt</code> | <code>Founder portrait</code> |
| <code>desktop_image_ratio</code> | <code>landscape</code> |
| <code>mobile_image_ratio</code> | <code>landscape</code> |
| <code>focal_point</code> | <code>center</code> |

- <code>eyebrow</code> → <code>eyebrow</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Invest now, wear forever</code> |

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>An Interview With Our Founder</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>left</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;Our founder's vision is to create thoughtfully designed jewellery that becomes part of your everyday story.&lt;/p&gt;&lt;p&gt;&lt;strong&gt;OMNISELLE FOUNDER &amp;amp; CREATIVE DIRECTOR&lt;/strong&gt;&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |

</details>

<details>
<summary><code>design_vision</code> → <code>image-with-text</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>media_position</code> | <code>left</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>section_width</code> | <code>page</code> |
| <code>column_gap</code> | <code>96</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>48</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>media</code> → <code>media</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/about4.jpg</code> |
| <code>alt</code> | <code>Jewellery craft detail</code> |
| <code>desktop_image_ratio</code> | <code>landscape</code> |
| <code>mobile_image_ratio</code> | <code>landscape</code> |
| <code>focal_point</code> | <code>center</code> |

- <code>eyebrow</code> → <code>eyebrow</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Our vision</code> |

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Our Design &amp; Vision</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>left</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;We pair enduring craftsmanship with a modern point of view, creating expressive pieces designed to be worn, treasured and passed on.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |

- <code>button</code> → <code>button</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Discover more</code> |
| <code>link</code> | — |
| <code>style</code> | <code>tertiary</code> |

</details>

<details>
<summary><code>benefits</code> → <code>icon-with-text</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | — |
| <code>columns_desktop</code> | <code>4</code> |
| <code>columns_mobile</code> | <code>2</code> |
| <code>section_width</code> | <code>contained</code> |
| <code>item_style</code> | <code>default</code> |
| <code>icon_size</code> | <code>small</code> |
| <code>content_gap</code> | <code>12</code> |
| <code>column_gap</code> | <code>32</code> |
| <code>row_gap</code> | <code>32</code> |
| <code>heading_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>text_size</code> | <code>small</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>96</code> |
| <code>background_color</code> | — |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>quality</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>icon</code> | <code>shopify://shop_images/about-icon2.png</code> |
| <code>icon_name</code> | <code>sparkles</code> |
| <code>heading</code> | <code>Quality That Lasts</code> |
| <code>title</code> | — |
| <code>anchor_id</code> | — |
| <code>text</code> | <code>&lt;p&gt;Every piece is covered by our two-year warranty.&lt;/p&gt;</code> |

- <code>sustainable</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>icon</code> | <code>shopify://shop_images/about-icon3.png</code> |
| <code>icon_name</code> | <code>sparkles</code> |
| <code>heading</code> | <code>Sustainably Made</code> |
| <code>title</code> | — |
| <code>anchor_id</code> | — |
| <code>text</code> | <code>&lt;p&gt;Handcrafted from responsibly sourced materials.&lt;/p&gt;</code> |

- <code>service</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>icon</code> | <code>shopify://shop_images/about-icon4.png</code> |
| <code>icon_name</code> | <code>sparkles</code> |
| <code>heading</code> | <code>Premium Service</code> |
| <code>title</code> | — |
| <code>anchor_id</code> | — |
| <code>text</code> | <code>&lt;p&gt;Thoughtful service from discovery to delivery.&lt;/p&gt;</code> |

- <code>gift</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>icon</code> | <code>shopify://shop_images/about-icon5.png</code> |
| <code>icon_name</code> | <code>sparkles</code> |
| <code>heading</code> | <code>Gift Wrapping</code> |
| <code>title</code> | — |
| <code>anchor_id</code> | — |
| <code>text</code> | <code>&lt;p&gt;Complimentary gift wrap for every special moment.&lt;/p&gt;</code> |

</details>

<details>
<summary><code>newsletter</code> → <code>newsletter</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/about5.jpg</code> |
| <code>overlay_opacity</code> | <code>0</code> |
| <code>height_mode</code> | <code>fixed</code> |
| <code>height_percent</code> | <code>95</code> |
| <code>height_desktop</code> | <code>420</code> |
| <code>height_mobile</code> | <code>420</code> |
| <code>center_text</code> | <code>true</code> |
| <code>content_vertical</code> | <code>center</code> |
| <code>content_horizontal</code> | <code>center</code> |
| <code>fill_content_container</code> | <code>false</code> |
| <code>container_width</code> | <code>720</code> |
| <code>container_width_mobile</code> | <code>320</code> |
| <code>content_width</code> | <code>520</code> |
| <code>section_width</code> | <code>full</code> |
| <code>container_padding</code> | <code>64</code> |
| <code>container_padding_mobile</code> | <code>24</code> |
| <code>block_gap</code> | <code>20</code> |
| <code>show_password_message</code> | <code>true</code> |
| <code>padding_top</code> | <code>0</code> |
| <code>padding_bottom</code> | <code>0</code> |
| <code>content_color_scheme</code> | — |
| <code>color_scheme</code> | <code>scheme-3</code> |

**Block instances**

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Join Our Community</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>center</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;Sign up for our newsletter to receive stories, new collections and private offers.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>body</code> |

- <code>form</code> → <code>newsletter_form</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>email_label</code> | <code>Email address</code> |
| <code>email_placeholder</code> | <code>Enter your email</code> |
| <code>hide_label</code> | <code>true</code> |
| <code>show_required_marker</code> | <code>false</code> |
| <code>button_label</code> | <code>Subscribe</code> |
| <code>button_style</code> | <code>primary</code> |
| <code>form_layout</code> | <code>inline</code> |
| <code>success_message</code> | <code>Thank you for subscribing.</code> |

</details>

</details>

<details>
<summary><code>templates/page.contact.json</code> — 2 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>breadcrumb</code> → <code>main</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>breadcrumb</code> | <code>page-header</code> | Bật | 12 | 0 |
| 2 | <code>main</code> | <code>contact-form</code> | Bật | 15 | 7 |

<details>
<summary><code>breadcrumb</code> → <code>page-header</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>image_overlay_opacity</code> | <code>0</code> |
| <code>show_breadcrumbs</code> | <code>true</code> |
| <code>home_label</code> | <code>Home</code> |
| <code>show_title</code> | <code>false</code> |
| <code>title_size</code> | <code>h2</code> |
| <code>content_alignment</code> | <code>center</code> |
| <code>section_width</code> | <code>full</code> |
| <code>padding_top</code> | <code>20</code> |
| <code>padding_bottom</code> | <code>0</code> |
| <code>padding_top_mobile</code> | <code>16</code> |
| <code>padding_bottom_mobile</code> | <code>0</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

_Không có block instance._

</details>

<details>
<summary><code>main</code> → <code>contact-form</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/omniselle-home-promotion-gemstone-collections.png</code> |
| <code>overlay_opacity</code> | <code>25</code> |
| <code>height_desktop</code> | <code>620</code> |
| <code>height_tablet</code> | <code>560</code> |
| <code>height_mobile</code> | <code>520</code> |
| <code>media_color_scheme</code> | <code>scheme-3</code> |
| <code>media_padding</code> | <code>40</code> |
| <code>submit_label</code> | <code>Submit now</code> |
| <code>success_message</code> | <code>Thanks for contacting us. We will be in touch shortly.</code> |
| <code>content_color_scheme</code> | <code>scheme-2</code> |
| <code>content_padding</code> | <code>80</code> |
| <code>section_width</code> | <code>page</code> |
| <code>media_width</code> | <code>50</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>64</code> |

**Block instances**

- <code>studio_details</code> → <code>studio_details</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Sydney Studio</code> |
| <code>heading_size</code> | <code>h3</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>address</code> | <code>123 Sample St, Sydney NSW 2000 AU</code> |
| <code>phone</code> | <code>+1 555 000 000</code> |
| <code>hours</code> | <code>Mon-Sat: 10:00-20:00</code> |
| <code>button_label</code> | <code>Book appointment</code> |
| <code>button_link</code> | — |

- <code>form_intro</code> → <code>form_intro</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>eyebrow</code> | <code>Send a message</code> |
| <code>heading</code> | <code>Do You Have Any Question?</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h1</code> |
| <code>text</code> | <code>&lt;p&gt;Submit the contact form and our team will be in touch shortly.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |

- <code>name</code> → <code>form_field</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>field_type</code> | <code>name</code> |
| <code>label</code> | <code>Name</code> |
| <code>placeholder</code> | <code>Name</code> |
| <code>required</code> | <code>true</code> |

- <code>email</code> → <code>form_field</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>field_type</code> | <code>email</code> |
| <code>label</code> | <code>Email</code> |
| <code>placeholder</code> | <code>Email</code> |
| <code>required</code> | <code>true</code> |

- <code>phone</code> → <code>form_field</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>field_type</code> | <code>phone</code> |
| <code>label</code> | <code>Phone number</code> |
| <code>placeholder</code> | <code>Phone number</code> |
| <code>required</code> | <code>false</code> |

- <code>address</code> → <code>form_field</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>field_type</code> | <code>address</code> |
| <code>label</code> | <code>Address</code> |
| <code>placeholder</code> | <code>Address</code> |
| <code>required</code> | <code>false</code> |

- <code>message</code> → <code>form_field</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>field_type</code> | <code>message</code> |
| <code>label</code> | <code>Message</code> |
| <code>placeholder</code> | <code>Message</code> |
| <code>required</code> | <code>true</code> |

</details>

</details>

<details>
<summary><code>templates/page.faq.json</code> — 3 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>hero</code> → <code>icon_with_text</code> → <code>faq</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>hero</code> | <code>hero-banner</code> | Bật | 9 | 3 |
| 2 | <code>icon_with_text</code> | <code>icon-with-text</code> | Bật | 16 | 4 |
| 3 | <code>faq</code> | <code>faq</code> | Bật | 10 | 7 |

<details>
<summary><code>hero</code> → <code>hero-banner</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>content_position</code> | <code>center</code> |
| <code>content_width</code> | <code>680</code> |
| <code>section_width</code> | <code>full</code> |
| <code>height_desktop</code> | <code>480</code> |
| <code>height_tablet</code> | <code>360</code> |
| <code>height_mobile</code> | <code>320</code> |
| <code>overlay_color</code> | <code>#181818</code> |
| <code>overlay_opacity</code> | <code>0</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |

**Block instances**

- <code>media_hinwXk</code> → <code>media</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/image_11zon_1.webp</code> |
| <code>alt_text</code> | — |
| <code>focal_point</code> | <code>center center</code> |

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>FAQs</code> |
| <code>heading_size</code> | <code>h1</code> |
| <code>heading_tag</code> | <code>h1</code> |
| <code>alignment</code> | <code>center</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;Find answers to our most common questions.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>small</code> |

</details>

<details>
<summary><code>icon_with_text</code> → <code>icon-with-text</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Browse By Category</code> |
| <code>columns_desktop</code> | <code>4</code> |
| <code>columns_mobile</code> | <code>1</code> |
| <code>section_width</code> | <code>full</code> |
| <code>item_style</code> | <code>default</code> |
| <code>icon_size</code> | <code>small</code> |
| <code>content_gap</code> | <code>24</code> |
| <code>column_gap</code> | <code>28</code> |
| <code>row_gap</code> | <code>40</code> |
| <code>heading_size</code> | <code>h5</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>padding_top</code> | <code>96</code> |
| <code>padding_bottom</code> | <code>48</code> |
| <code>background_color</code> | — |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>category_orders</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>icon</code> | <code>shopify://shop_images/faq-icon1.png</code> |
| <code>icon_name</code> | <code>sparkles</code> |
| <code>heading</code> | <code>Quality That Lasts</code> |
| <code>title</code> | <code>Order &amp; Shipping</code> |
| <code>anchor_id</code> | <code>orders</code> |
| <code>text</code> | <code>&lt;p&gt;For extra peace of mind, every piece is covered by our two-year warranty.&lt;/p&gt;</code> |

- <code>category_returns</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>icon</code> | <code>shopify://shop_images/faq-icon2.png</code> |
| <code>icon_name</code> | <code>sparkles</code> |
| <code>heading</code> | <code>Quality That Lasts</code> |
| <code>title</code> | <code>Account &amp; Returns</code> |
| <code>anchor_id</code> | <code>returns</code> |
| <code>text</code> | <code>&lt;p&gt;For extra peace of mind, every piece is covered by our two-year warranty.&lt;/p&gt;</code> |

- <code>category_products</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>icon</code> | <code>shopify://shop_images/faq-icon3.png</code> |
| <code>icon_name</code> | <code>sparkles</code> |
| <code>heading</code> | <code>Quality That Lasts</code> |
| <code>title</code> | <code>Product Information</code> |
| <code>anchor_id</code> | <code>products</code> |
| <code>text</code> | <code>&lt;p&gt;For extra peace of mind, every piece is covered by our two-year warranty.&lt;/p&gt;</code> |

- <code>category_gifts</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>icon</code> | <code>shopify://shop_images/faq-icon4.png</code> |
| <code>icon_name</code> | <code>sparkles</code> |
| <code>heading</code> | <code>Quality That Lasts</code> |
| <code>title</code> | <code>Gift Cards</code> |
| <code>anchor_id</code> | <code>gifts</code> |
| <code>text</code> | <code>&lt;p&gt;For extra peace of mind, every piece is covered by our two-year warranty.&lt;/p&gt;</code> |

</details>

<details>
<summary><code>faq</code> → <code>faq</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | — |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>text</code> | — |
| <code>text_size</code> | <code>medium</code> |
| <code>section_width</code> | <code>full</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>96</code> |
| <code>empty_message</code> | <code>Add FAQ questions from the Theme Editor.</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>group_orders</code> → <code>group_heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Order &amp; Shipping</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>text</code> | <code>&lt;p&gt;Everything you need to know about placing and receiving your order.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>x-large</code> |
| <code>anchor_id</code> | <code>orders</code> |

- <code>question_track</code> → <code>question</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>question</code> | <code>How can I track my order?</code> |
| <code>answer</code> | <code>&lt;p&gt;Once your order ships, we will email you a tracking link.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>default_open</code> | <code>false</code> |

- <code>question_ship</code> → <code>question</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>question</code> | <code>When will my order ship?</code> |
| <code>answer</code> | <code>&lt;p&gt;Orders are prepared within 1–2 business days. Tracking details are sent as soon as your parcel leaves our studio.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>default_open</code> | <code>false</code> |

- <code>question_international</code> → <code>question</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>question</code> | <code>Do you ship internationally?</code> |
| <code>answer</code> | <code>&lt;p&gt;Yes. Available destinations and delivery estimates are shown at checkout.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>default_open</code> | <code>false</code> |

- <code>group_shipping</code> → <code>group_heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Shipping</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>text</code> | <code>&lt;p&gt;Delivery information for every destination.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>anchor_id</code> | <code>shipping</code> |

- <code>question_cost</code> → <code>question</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>question</code> | <code>How much does shipping cost?</code> |
| <code>answer</code> | <code>&lt;p&gt;Shipping options and pricing are calculated at checkout.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>default_open</code> | <code>false</code> |

- <code>question_address</code> → <code>question</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>question</code> | <code>Can I change my delivery address?</code> |
| <code>answer</code> | <code>&lt;p&gt;Contact us as soon as possible and we will do our best to help before dispatch.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>default_open</code> | <code>false</code> |

</details>

</details>

<details>
<summary><code>templates/page.json</code> — 2 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>page_header</code> → <code>page_content</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>page_header</code> | <code>page-header</code> | Bật | 12 | 0 |
| 2 | <code>page_content</code> | <code>page-content</code> | Bật | 7 | 0 |

<details>
<summary><code>page_header</code> → <code>page-header</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>image_overlay_opacity</code> | <code>20</code> |
| <code>show_breadcrumbs</code> | <code>true</code> |
| <code>home_label</code> | <code>Home</code> |
| <code>show_title</code> | <code>true</code> |
| <code>title_size</code> | <code>h2</code> |
| <code>content_alignment</code> | <code>center</code> |
| <code>section_width</code> | <code>contained</code> |
| <code>padding_top</code> | <code>40</code> |
| <code>padding_bottom</code> | <code>40</code> |
| <code>padding_top_mobile</code> | <code>24</code> |
| <code>padding_bottom_mobile</code> | <code>24</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |

_Không có block instance._

</details>

<details>
<summary><code>page_content</code> → <code>page-content</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>content_width</code> | <code>800</code> |
| <code>section_width</code> | <code>contained</code> |
| <code>padding_top</code> | <code>40</code> |
| <code>padding_bottom</code> | <code>64</code> |
| <code>padding_top_mobile</code> | <code>0</code> |
| <code>padding_bottom_mobile</code> | <code>40</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

_Không có block instance._

</details>

</details>

<details>
<summary><code>templates/page.size-chart.json</code> — 1 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>main</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>main</code> | <code>size-chart</code> | Bật | 0 | 0 |

<details>
<summary><code>main</code> → <code>size-chart</code></summary>

**Section settings đã lưu**

_Không lưu giá trị riêng; dùng default từ schema._

_Không có block instance._

</details>

</details>

<details>
<summary><code>templates/password.json</code> — 3 section instance</summary>

Layout: <code>password</code>. Thứ tự section: <code>password_header</code> → <code>main</code> → <code>password_footer</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>password_header</code> | <code>password-header</code> | Bật | 7 | 0 |
| 2 | <code>main</code> | <code>newsletter</code> | Bật | 21 | 4 |
| 3 | <code>password_footer</code> | <code>password-footer</code> | Bật | 6 | 0 |

<details>
<summary><code>password_header</code> → <code>password-header</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>logo_text</code> | — |
| <code>padding</code> | <code>16</code> |
| <code>show_border</code> | <code>false</code> |
| <code>show_password_access</code> | <code>true</code> |
| <code>password_link_label</code> | <code>Enter with password</code> |
| <code>password_heading</code> | <code>Enter password</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

_Không có block instance._

</details>

<details>
<summary><code>main</code> → <code>newsletter</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>overlay_opacity</code> | <code>0</code> |
| <code>height_mode</code> | <code>percent</code> |
| <code>height_percent</code> | <code>95</code> |
| <code>height_desktop</code> | <code>720</code> |
| <code>height_mobile</code> | <code>620</code> |
| <code>center_text</code> | <code>false</code> |
| <code>content_vertical</code> | <code>center</code> |
| <code>content_horizontal</code> | <code>center</code> |
| <code>fill_content_container</code> | <code>true</code> |
| <code>container_width</code> | <code>720</code> |
| <code>container_width_mobile</code> | <code>240</code> |
| <code>content_width</code> | <code>480</code> |
| <code>section_width</code> | <code>full</code> |
| <code>container_padding</code> | <code>64</code> |
| <code>container_padding_mobile</code> | <code>24</code> |
| <code>block_gap</code> | <code>24</code> |
| <code>show_password_message</code> | <code>true</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>48</code> |
| <code>content_color_scheme</code> | <code>scheme-1</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |

**Block instances**

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Opening soon</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h1</code> |
| <code>alignment</code> | <code>left</code> |

- <code>line</code> → <code>line</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>width</code> | <code>full</code> |
| <code>thickness</code> | <code>1</code> |
| <code>opacity</code> | <code>30</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;Be the first to know when we launch.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>small</code> |

- <code>newsletter</code> → <code>newsletter_form</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>email_label</code> | <code>Email</code> |
| <code>email_placeholder</code> | — |
| <code>hide_label</code> | <code>false</code> |
| <code>show_required_marker</code> | <code>true</code> |
| <code>button_label</code> | <code>Subscribe</code> |
| <code>button_style</code> | <code>primary</code> |
| <code>form_layout</code> | <code>stacked</code> |
| <code>success_message</code> | <code>Thank you for subscribing.</code> |

</details>

<details>
<summary><code>password_footer</code> → <code>password-footer</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>menu</code> | — |
| <code>menu_label</code> | <code>Footer navigation</code> |
| <code>copyright_text</code> | — |
| <code>padding</code> | <code>20</code> |
| <code>show_border</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

_Không có block instance._

</details>

</details>

<details>
<summary><code>templates/product.json</code> — 5 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>main</code> → <code>image-with-text-01</code> → <code>featured-collection-14</code> → <code>collapsible-content</code> → <code>collection-list</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>main</code> | <code>product-main</code> | Bật | 6 | 4 |
| 2 | <code>image-with-text-01</code> | <code>image-with-text</code> | Bật | 7 | 5 |
| 3 | <code>featured-collection-14</code> | <code>product-featured-collection</code> | Bật | 9 | 2 |
| 4 | <code>collapsible-content</code> | <code>collapsible-content</code> | Bật | 6 | 5 |
| 5 | <code>collection-list</code> | <code>collection-list</code> | Bật | 19 | 5 |

<details>
<summary><code>main</code> → <code>product-main</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>desktop_gap</code> | <code>64</code> |
| <code>media_width</code> | <code>58</code> |
| <code>mobile_gap</code> | <code>16</code> |
| <code>color_scheme</code> | — |
| <code>padding_top</code> | <code>40</code> |
| <code>padding_bottom</code> | <code>48</code> |

**Block instances**

- <code>breadcrumbs</code> → <code>product-breadcrumbs</code>

  _Không lưu setting riêng._

- <code>gallery</code> → <code>_product-media-gallery</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>desktop_layout</code> | <code>grid</code> |
| <code>image_zoom</code> | <code>open_lightbox</code> |
| <code>grid_columns</code> | <code>2</code> |
| <code>grid_layout</code> | <code>uniform</code> |
| <code>carousel_thumbnails</code> | <code>left</code> |
| <code>gap</code> | <code>12</code> |
| <code>media_ratio</code> | <code>portrait</code> |
| <code>mobile_media_ratio</code> | <code>portrait</code> |
| <code>media_fit</code> | <code>cover</code> |
| <code>show_mobile_pagination</code> | <code>true</code> |
| <code>show_mobile_thumbnails</code> | <code>true</code> |
| <code>thumbnail_size</code> | <code>64</code> |
| <code>thumbnail_gap</code> | <code>8</code> |

- <code>details</code> → <code>_product-details</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>enable_sticky</code> | <code>true</code> |
| <code>desktop_top_offset</code> | <code>24</code> |

  Block lồng nhau:

    - <code>title</code> → <code>product-title</code>; settings: <code>{"heading_size":"h2","html_tag":"h1"}</code>
    - <code>price</code> → <code>product-price</code>; settings: <code>{"price_size":"medium","show_discount_percentage":false}</code>
    - <code>rating</code> → <code>product-rating</code>; settings: <code>{"show_when_empty":false,"empty_label":"No reviews yet"}</code>
    - <code>description</code> → <code>product-metafield</code>; settings: <code>{"namespace":"custom","key":"summary","style":"full"}</code>
    - <code>options</code> → <code>product-option-picker</code>; settings: <code>{"show_variant_labels":true,"picker_type":"button","enable_color_swatches":true,"swatch_type":"color","swatch_corner_radius":"pill","enable_size_chart":false,"size_guide":"Size guide","size_chart":"Size chart","size_chart_page":""}</code>
    - <code>inventory</code> → <code>product-inventory</code>; settings: <code>{}</code>
    - <code>buttons</code> → <code>product-buy-buttons</code>; settings: <code>{"button_layout":"inline","show_quantity":true,"show_dynamic_checkout":true}</code>
    - <code>benefits</code> → <code>product-usp-list</code>; settings: <code>{"columns_desktop":"4","columns_mobile":"2","text_size":"small","icon_size":"small"}</code>
      - <code>benefit_1</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"truck","text":"&lt;p&gt;Free Shipping $49+&lt;/p&gt;","page":"","show_page_popup":false}</code>
      - <code>benefit_2</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"return","text":"&lt;p&gt;Free Returns&lt;/p&gt;","page":"","show_page_popup":false}</code>
      - <code>benefit_3</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"shield","text":"&lt;p&gt;Lifetime Warranty&lt;/p&gt;","page":"","show_page_popup":false}</code>
      - <code>benefit_4</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"sparkles","text":"&lt;p&gt;Sustainably Made&lt;/p&gt;","page":"","show_page_popup":false}</code>
    - <code>accordion_group</code> → <code>product-accordion-group</code>; settings: <code>{"icon":"plus"}</code>
      - <code>description_accordion</code> → <code>product-accordion</code>; settings: <code>{"heading":"Description","heading_size":"h5","html_tag":"h3","content_source":"description","metafield_namespace":"custom","metafield_key":"summary","content":"","show_divider":true,"open_by_default":false,"show_view_more":true,"content_max_height":240}</code>
      - <code>care_accordion</code> → <code>product-accordion</code>; settings: <code>{"heading":"Care guide","heading_size":"h5","html_tag":"h3","content_source":"manual","metafield_namespace":"custom","metafield_key":"summary","content":"&lt;p&gt;To keep your jewellery looking its best:&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Store each piece separately in a soft pouch or lined jewellery box.&lt;/li&gt;&lt;li&gt;Avoid contact with water, perfume, lotions and household chemicals.&lt;/li&gt;&lt;li&gt;Remove before showering, swimming, exercising or sleeping.&lt;/li&gt;&lt;li&gt;After wear, gently wipe with a clean, soft, dry cloth.&lt;/li&gt;&lt;/ul&gt;","show_divider":true,"open_by_default":false,"show_view_more":true,"content_max_height":240}</code>
      - <code>shipping_accordion</code> → <code>product-accordion</code>; settings: <code>{"heading":"Shipping &amp; returns","heading_size":"h5","html_tag":"h3","content_source":"manual","metafield_namespace":"custom","metafield_key":"summary","content":"&lt;p&gt;Orders are carefully packed and dispatched as quickly as possible. Available delivery methods and estimated times are shown at checkout.&lt;/p&gt;&lt;p&gt;If you change your mind, eligible unworn items may be returned in their original condition and packaging. Personalized, engraved and final-sale pieces may be excluded. Review the store’s Shipping &amp;amp; Returns policy for full terms.&lt;/p&gt;","show_divider":true,"open_by_default":false,"show_view_more":true,"content_max_height":240}</code>
    - <code>recommendations</code> → <code>product-recommendations</code>; settings: <code>{"heading":"Complete the set","heading_size":"h5","html_tag":"h2","source":"complementary","limit":4}</code>
    - <code>pickup</code> → <code>product-pickup-availability</code>; settings: <code>{}</code>
    - <code>payment</code> → <code>product-payment</code>; settings: <code>{"heading":"Pay With","heading_size":"h5","html_tag":"h2","text_size":"small","note":"Your transaction is protected with advanced security measures to keep your information confidential."}</code>
    - <code>share</code> → <code>product-share</code>; settings: <code>{"label":"Share"}</code>

- <code>sticky_cart</code> → <code>product-sticky-add-to-cart</code>

  _Không lưu setting riêng._

</details>

<details>
<summary><code>image-with-text-01</code> → <code>image-with-text</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>media_position</code> | <code>right</code> |
| <code>content_alignment</code> | <code>left</code> |
| <code>section_width</code> | <code>page</code> |
| <code>column_gap</code> | <code>40</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>48</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>media</code> → <code>media</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>image</code> | <code>shopify://shop_images/image-with-text-ring-hands.jpg</code> |
| <code>alt</code> | — |
| <code>desktop_image_ratio</code> | <code>landscape</code> |
| <code>mobile_image_ratio</code> | <code>portrait</code> |
| <code>focal_point</code> | <code>center center</code> |

- <code>eyebrow</code> → <code>eyebrow</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>INVEST NOW, WEAR FOREVER</code> |

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>9K Gold For Lasting Elegance</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>left</code> |

- <code>text</code> → <code>text</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>&lt;p&gt;Crafted with precision and timeless beauty, each piece shines with exceptional detail and enduring quality. Crafted in premium 9K gold with timeless shine.&lt;/p&gt;&lt;p&gt;Whether you're reimagining a treasured piece or creating something entirely new, our bespoke service brings your story to every detail — shaped by your vision and guided by our expertise, from gemstone selection to design refinement.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |

- <code>button</code> → <code>button</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Discover more</code> |
| <code>link</code> | <code>/collections/all</code> |
| <code>style</code> | <code>tertiary</code> |

</details>

<details>
<summary><code>featured-collection-14</code> → <code>product-featured-collection</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>products_to_show</code> | <code>6</code> |
| <code>header_alignment</code> | <code>center</code> |
| <code>columns_desktop</code> | <code>4</code> |
| <code>columns_mobile</code> | <code>1</code> |
| <code>section_width</code> | <code>full</code> |
| <code>product_gap</code> | <code>20</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>48</code> |
| <code>color_scheme</code> | — |

**Block instances**

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>You May Also Like</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |

- <code>collection</code> → <code>collection</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>source</code> | <code>complementary</code> |
| <code>collection</code> | — |

</details>

<details>
<summary><code>collapsible-content</code> → <code>collapsible-content</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>48</code> |
| <code>button_label</code> | <code>View all FAQs</code> |
| <code>button_link</code> | <code>/pages/faq</code> |
| <code>section_width</code> | <code>contained</code> |
| <code>color_scheme</code> | — |

**Block instances**

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Frequently Asked Questions</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>center</code> |

- <code>item-1</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Can I Wear Your Jewelry Daily?</code> |
| <code>heading_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>content</code> | <code>&lt;p&gt;Absolutely. Our jewelry is crafted for durability and comfort, allowing you to enjoy your favorite pieces from day to night.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>open_by_default</code> | <code>true</code> |

- <code>item-2</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Do You Offer Warranty Or Repairs?</code> |
| <code>heading_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>content</code> | <code>&lt;p&gt;Yes. Every piece is supported by our care and repair service. Contact us if you need help with your jewelry.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>open_by_default</code> | <code>false</code> |

- <code>item-3</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Is Your Jewelry Hypoallergenic And Safe For Sensitive Skin?</code> |
| <code>heading_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>content</code> | <code>&lt;p&gt;Our materials are selected with comfort in mind. Please review each product’s material details if you have sensitivities.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>open_by_default</code> | <code>false</code> |

- <code>item-4</code> → <code>item</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>How Do I Care For My Jewelry To Keep It Shining?</code> |
| <code>heading_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>content</code> | <code>&lt;p&gt;Remove jewelry before showering, swimming or exercising. Keep each piece away from perfume and household chemicals, then gently wipe it with a soft, dry cloth after wear.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>open_by_default</code> | <code>false</code> |

</details>

<details>
<summary><code>collection-list</code> → <code>collection-list</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>layout</code> | <code>grid</code> |
| <code>section_width</code> | <code>full</code> |
| <code>column_gap</code> | <code>16</code> |
| <code>header_gap</code> | <code>48</code> |
| <code>layout_desktop</code> | <code>slider</code> |
| <code>layout_mobile</code> | <code>slider</code> |
| <code>show_pagination</code> | <code>true</code> |
| <code>columns_desktop</code> | <code>4</code> |
| <code>columns_mobile</code> | <code>2</code> |
| <code>image_ratio</code> | <code>portrait</code> |
| <code>card_alignment</code> | <code>center</code> |
| <code>card_gap</code> | <code>20</code> |
| <code>card_heading_size</code> | <code>h4</code> |
| <code>card_heading_tag</code> | <code>h3</code> |
| <code>height_desktop</code> | <code>medium</code> |
| <code>height_mobile</code> | <code>medium</code> |
| <code>padding_top</code> | <code>48</code> |
| <code>padding_bottom</code> | <code>48</code> |
| <code>color_scheme</code> | — |

**Block instances**

- <code>heading</code> → <code>heading</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Explore our collections</code> |
| <code>heading_size</code> | <code>h2</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>alignment</code> | <code>center</code> |

- <code>collection-3</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>earrings</code> |
| <code>title</code> | <code>Earrings</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>30</code> |

- <code>collection-4</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>bracelets</code> |
| <code>title</code> | <code>Bracelets</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>30</code> |

- <code>collection-1</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>necklaces</code> |
| <code>title</code> | <code>Necklaces</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>30</code> |

- <code>collection-2</code> → <code>collection_card</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>collection</code> | <code>rings</code> |
| <code>title</code> | <code>Rings</code> |
| <code>show_product_count</code> | <code>true</code> |
| <code>eyebrow</code> | — |
| <code>button_label</code> | — |
| <code>button_style</code> | <code>tertiary</code> |
| <code>content_position</code> | <code>bottom</code> |
| <code>focal_point</code> | <code>center center</code> |
| <code>override_color_scheme</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |
| <code>overlay_opacity</code> | <code>30</code> |

</details>

</details>

<details>
<summary><code>templates/product.quick-view.json</code> — 1 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>main</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>main</code> | <code>quick-view</code> | Bật | 17 | 1 |

<details>
<summary><code>main</code> → <code>quick-view</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>modal_width</code> | <code>standard</code> |
| <code>corner_radius</code> | <code>square</code> |
| <code>media_position</code> | <code>left</code> |
| <code>media_width</code> | <code>50</code> |
| <code>desktop_gap</code> | <code>0</code> |
| <code>mobile_gap</code> | <code>16</code> |
| <code>image_zoom</code> | <code>open_lightbox</code> |
| <code>media_ratio</code> | <code>portrait</code> |
| <code>mobile_media_ratio</code> | <code>portrait</code> |
| <code>media_fit</code> | <code>cover</code> |
| <code>show_mobile_pagination</code> | <code>true</code> |
| <code>show_mobile_thumbnails</code> | <code>false</code> |
| <code>thumbnail_size</code> | <code>64</code> |
| <code>thumbnail_gap</code> | <code>8</code> |
| <code>show_media</code> | <code>true</code> |
| <code>show_close_button</code> | <code>true</code> |
| <code>content_padding</code> | <code>40</code> |

**Block instances**

- <code>details</code> → <code>_product-details</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>enable_sticky</code> | <code>false</code> |
| <code>desktop_top_offset</code> | <code>0</code> |

  Block lồng nhau:

    - <code>title</code> → <code>product-title</code>; settings: <code>{"heading_size":"h3","html_tag":"h2"}</code>
    - <code>price</code> → <code>product-price</code>; settings: <code>{"price_size":"medium","show_discount_percentage":false}</code>
    - <code>rating</code> → <code>product-rating</code>; settings: <code>{"show_when_empty":false,"empty_label":"No reviews yet"}</code>
    - <code>description</code> → <code>product-metafield</code>; settings: <code>{"namespace":"custom","key":"summary","style":"compact"}</code>
    - <code>options</code> → <code>product-option-picker</code>; settings: <code>{"show_variant_labels":true,"picker_type":"button","enable_color_swatches":true,"swatch_type":"color","enable_size_chart":false,"size_guide":"Size guide","size_chart":"Size chart","size_chart_page":""}</code>
    - <code>inventory</code> → <code>product-inventory</code>; settings: <code>{}</code>
    - <code>buttons</code> → <code>product-buy-buttons</code>; settings: <code>{"button_layout":"inline","show_quantity":true,"show_dynamic_checkout":true}</code>
    - <code>benefits</code> → <code>product-usp-list</code>; settings: <code>{"columns_desktop":"4","columns_mobile":"2","text_size":"small","icon_size":"small"}</code>
      - <code>benefit_1</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"truck","text":"&lt;p&gt;Free Shipping $49+&lt;/p&gt;","page":"","show_page_popup":false}</code>
      - <code>benefit_2</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"return","text":"&lt;p&gt;Free Returns&lt;/p&gt;","page":"","show_page_popup":false}</code>
      - <code>benefit_3</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"shield","text":"&lt;p&gt;Lifetime Warranty&lt;/p&gt;","page":"","show_page_popup":false}</code>
      - <code>benefit_4</code> → <code>product-benefit-item</code>; settings: <code>{"icon":"sparkles","text":"&lt;p&gt;Sustainably Made&lt;/p&gt;","page":"","show_page_popup":false}</code>
    - <code>payment</code> → <code>product-payment</code>; settings: <code>{"heading":"Pay With","heading_size":"h5","html_tag":"h2","text_size":"small","note":"Your transaction is protected with advanced security measures to keep your information confidential."}</code>
    - <code>share</code> → <code>product-share</code>; settings: <code>{"label":"Share"}</code>

</details>

</details>

<details>
<summary><code>templates/search.json</code> — 1 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>main</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>main</code> | <code>search</code> | Bật | 16 | 0 |

<details>
<summary><code>main</code> → <code>search</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>enable_prefix_search</code> | <code>true</code> |
| <code>enable_filtering</code> | <code>true</code> |
| <code>enable_sorting</code> | <code>true</code> |
| <code>filter_button_style</code> | <code>primary</code> |
| <code>open_filter_groups</code> | <code>Price, Material</code> |
| <code>show_article_image</code> | <code>true</code> |
| <code>article_image_ratio</code> | <code>portrait</code> |
| <code>show_article_date</code> | <code>true</code> |
| <code>show_article_author</code> | <code>false</code> |
| <code>columns_desktop</code> | <code>4</code> |
| <code>columns_mobile</code> | <code>1</code> |
| <code>column_gap</code> | <code>12</code> |
| <code>row_gap</code> | <code>56</code> |
| <code>padding_top</code> | <code>88</code> |
| <code>padding_bottom</code> | <code>96</code> |
| <code>color_scheme</code> | — |

_Không có block instance._

</details>

</details>

## 8. Header/Footer section group

Section group là template đặc biệt dùng ở layout toàn site. Nó có cùng cơ chế instance/settings/block/order như JSON template.

<details>
<summary><code>sections/footer-group.json</code> — 2 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>footer</code> → <code>offer_flyout</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>footer</code> | <code>footer</code> | Bật | 5 | 9 |
| 2 | <code>offer_flyout</code> | <code>offer-flyout</code> | Bật | 18 | 5 |

<details>
<summary><code>footer</code> → <code>footer</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>column_gap</code> | <code>48</code> |
| <code>section_width</code> | <code>page</code> |
| <code>padding_top</code> | <code>64</code> |
| <code>padding_bottom</code> | <code>64</code> |
| <code>color_scheme</code> | <code>scheme-2</code> |

**Block instances**

- <code>newsletter</code> → <code>newsletter</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Join Our Community</code> |
| <code>heading_size</code> | <code>h3</code> |
| <code>heading_tag</code> | <code>h2</code> |
| <code>text</code> | <code>&lt;p&gt;Join our newsletter to stay up to date on features and releases.&lt;/p&gt;</code> |
| <code>text_size</code> | <code>medium</code> |
| <code>placeholder</code> | <code>Enter your email</code> |
| <code>button_label</code> | <code>Subscribe</code> |
| <code>disclaimer</code> | <code>&lt;p&gt;By subscribing, you agree to our Terms of Service and Privacy Policy.&lt;/p&gt;</code> |
| <code>facebook_url</code> | — |
| <code>instagram_url</code> | — |
| <code>pinterest_url</code> | — |
| <code>tiktok_url</code> | — |

- <code>about</code> → <code>menu</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>About Us</code> |
| <code>heading_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>menu</code> | <code>footer-about</code> |

- <code>help</code> → <code>menu</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Help</code> |
| <code>heading_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>menu</code> | <code>footer-help</code> |

- <code>shop</code> → <code>menu</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>heading</code> | <code>Shop</code> |
| <code>heading_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>menu</code> | <code>footer-shop</code> |

- <code>wordmark</code> → <code>wordmark</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Spinel Theme</code> |

- <code>copyright</code> → <code>copyright</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Powered by Shopify</code> |

- <code>localization</code> → <code>localization</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>show_country_selector</code> | <code>true</code> |
| <code>show_language_selector</code> | <code>true</code> |

- <code>legal</code> → <code>legal_menu</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>menu</code> | — |

- <code>payments</code> → <code>payments</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>show_payment_icons</code> | <code>true</code> |

</details>

<details>
<summary><code>offer_flyout</code> → <code>offer-flyout</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>hide_for_customers</code> | <code>true</code> |
| <code>badge</code> | <code>Newsletter</code> |
| <code>heading</code> | <code>Get 20% off your first order</code> |
| <code>heading_size</code> | <code>h3</code> |
| <code>preference_heading</code> | <code>Which pieces are you drawn to?</code> |
| <code>description</code> | <code>&lt;p&gt;Subscribe for updates and exclusive offers. Unsubscribe anytime.&lt;/p&gt;</code> |
| <code>description_size</code> | <code>small</code> |
| <code>center_text</code> | <code>true</code> |
| <code>image</code> | <code>shopify://shop_images/omniselle-home-hero-primary.png</code> |
| <code>show_image_mobile</code> | <code>false</code> |
| <code>image_ratio</code> | <code>original</code> |
| <code>image_link</code> | — |
| <code>image_new_tab</code> | <code>false</code> |
| <code>tab_label</code> | <code>Newsletter</code> |
| <code>invert_tab_colors</code> | <code>true</code> |
| <code>color_scheme</code> | <code>scheme-2</code> |
| <code>show_delay</code> | <code>10</code> |
| <code>frequency</code> | <code>1_day</code> |

**Block instances**

- <code>preference_rings</code> → <code>preference</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Rings</code> |
| <code>customer_tag</code> | <code>Preference: Rings</code> |

- <code>preference_earrings</code> → <code>preference</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Earrings</code> |
| <code>customer_tag</code> | <code>Preference: Earrings</code> |

- <code>preference_necklaces</code> → <code>preference</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Necklaces</code> |
| <code>customer_tag</code> | <code>Preference: Necklaces</code> |

- <code>preference_bracelets</code> → <code>preference</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Bracelets</code> |
| <code>customer_tag</code> | <code>Preference: Bracelets</code> |

- <code>newsletter</code> → <code>newsletter</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>email_label</code> | <code>Email address</code> |
| <code>email_placeholder</code> | <code>Email address</code> |
| <code>button_label</code> | <code>Unlock 20% off</code> |

</details>

</details>

<details>
<summary><code>sections/header-group.json</code> — 2 section instance</summary>

Layout: <code>theme</code>. Thứ tự section: <code>announcement_bar</code> → <code>header</code>.

| # | Section ID | Type | Trạng thái | Setting lưu | Block trực tiếp |
|---:|---|---|---|---:|---:|
| 1 | <code>announcement_bar</code> | <code>announcement-bar</code> | Bật | 8 | 2 |
| 2 | <code>header</code> | <code>header</code> | Bật | 17 | 4 |

<details>
<summary><code>announcement_bar</code> → <code>announcement-bar</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>text_behavior</code> | <code>rotate</code> |
| <code>autoplay_interval</code> | <code>5</code> |
| <code>navigator_style</code> | <code>arrows</code> |
| <code>font_weight</code> | <code>400</code> |
| <code>height_desktop</code> | <code>41</code> |
| <code>height_mobile</code> | <code>37</code> |
| <code>section_width</code> | <code>full</code> |
| <code>color_scheme</code> | <code>scheme-3</code> |

**Block instances**

- <code>text_slide</code> → <code>text_slide</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Free shipping worldwide on orders over $150 USD</code> |

- <code>countdown_timer_EJFhFA</code> → <code>countdown_timer</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>label</code> | <code>Offer ends in</code> |
| <code>end_at</code> | <code>2026-08-31T23:59:59Z</code> |

</details>

<details>
<summary><code>header</code> → <code>header</code></summary>

**Section settings đã lưu**

| Key | Giá trị đang lưu |
|---|---|
| <code>menu</code> | <code>main-menu</code> |
| <code>gift_spinel_menu_item</code> | <code>Gifts</code> |
| <code>sticky_behavior</code> | <code>none</code> |
| <code>enable_transparent_header</code> | <code>true</code> |
| <code>transparent_color_scheme</code> | — |
| <code>show_border</code> | <code>false</code> |
| <code>height_desktop</code> | <code>84</code> |
| <code>height_mobile</code> | <code>60</code> |
| <code>mega_menu_animation</code> | <code>slide_down</code> |
| <code>mega_menu_animation_duration</code> | <code>250</code> |
| <code>show_search</code> | <code>true</code> |
| <code>show_localization</code> | <code>true</code> |
| <code>show_country_flag</code> | <code>true</code> |
| <code>show_account</code> | <code>true</code> |
| <code>show_cart</code> | <code>true</code> |
| <code>section_width</code> | <code>full</code> |
| <code>color_scheme</code> | <code>scheme-1</code> |

**Block instances**

- <code>logo</code> → <code>logo</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>text</code> | <code>Spinel</code> |
| <code>width_desktop</code> | <code>170</code> |
| <code>width_mobile</code> | <code>120</code> |

- <code>collection_mega_menu</code> → <code>mega_menu</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>menu_item</code> | <code>Collections;All Jewelry</code> |
| <code>menu</code> | — |
| <code>column_heading</code> | — |
| <code>columns</code> | <code>3</code> |

- <code>collection_promo_necklaces</code> → <code>mega_menu_promo</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>menu_item</code> | <code>Collections;All Jewelry</code> |
| <code>image</code> | <code>shopify://shop_images/home-category-necklaces.webp</code> |
| <code>heading</code> | <code>New Arrivals</code> |
| <code>heading_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>text</code> | <code>Discover our latest jewelry designs crafted for everyday elegance and timeless style.</code> |
| <code>link_label</code> | <code>SHOP NEW ARRIVALS</code> |
| <code>link</code> | — |

- <code>collection_promo_earrings</code> → <code>mega_menu_promo</code>

| Key | Giá trị đang lưu |
|---|---|
| <code>menu_item</code> | <code>Collections;All Jewelry</code> |
| <code>image</code> | <code>shopify://shop_images/category-earrings.webp</code> |
| <code>heading</code> | <code>Best Sellers</code> |
| <code>heading_size</code> | <code>h4</code> |
| <code>heading_tag</code> | <code>h3</code> |
| <code>text</code> | <code>Explore customer favorites loved for their exceptional craftsmanship and lasting beauty.</code> |
| <code>link_label</code> | <code>SHOP BEST SELLERS</code> |
| <code>link</code> | — |

</details>

</details>

## 9. Công thức tái sử dụng đề xuất

### Section nội dung/marketing

Nên tổ chức option theo các cụm sau:

1. Nội dung: eyebrow, heading, heading size/tag, text, CTA.
2. Media: desktop image/video, mobile override, alt text, focal point, overlay.
3. Layout: section width, content width, columns, gap, position/alignment.
4. Responsive: chỉ thêm option mobile khi thật sự khác desktop.
5. Behavior: autoplay, loop, transition, filtering, sorting.
6. Style: color scheme, component radius/ratio; ưu tiên lấy token global.
7. Spacing: padding top/bottom đặt cuối schema.

### Section danh sách/card

- Section giữ data source, grid/slider behavior, số cột, gap và giới hạn item.
- Block giữ nội dung từng item nếu merchant tự nhập; không tạo block nếu dữ liệu đã đến trực tiếp từ collection/product resource.
- Style card dùng global settings; section chỉ override khi có use case rõ.

### Product page

- Dùng `product-main` làm shell và theme block cho từng chức năng: title, price, picker, quantity, buy buttons, accordion, metafield, app block.
- Nhóm block lồng nhau (`_product-details`, `product-accordion-group`, `product-usp-list`) tạo composition linh hoạt hơn schema block cứng.
- Các block không có setting vẫn có giá trị vì chúng kiểm soát thứ tự và khả năng bật/tắt trong editor.

### Preset và template

- Preset section: nhỏ, độc lập, có nội dung mẫu và block tối thiểu.
- Template page: mô tả câu chuyện hoàn chỉnh của một loại trang, gồm thứ tự section và giá trị instance.
- Header/footer group: quản lý riêng, không sao chép vào từng template.
- Khi fork theme, ưu tiên sao chép schema trước, sau đó preset, cuối cùng template. Không sao chép `settings_data.current` như nguồn chuẩn duy nhất vì đó là trạng thái merchant đang chỉnh.

## 10. Checklist trước khi đưa vào theme/preset mới

- [ ] Mỗi ID có một type và một vocabulary thống nhất trên toàn theme.
- [ ] Mọi `select.default` tồn tại trong `options`; mọi `range.default` nằm trong min/max.
- [ ] Option mobile có fallback rõ ràng về desktop.
- [ ] `color_scheme`, typography, button, card, form ưu tiên dùng global token.
- [ ] Inline block chỉ dùng cho section-specific content; thành phần dùng lại chuyển sang theme block.
- [ ] Block wrapper có `block.shopify_attributes` và block lồng nhau có thứ tự rõ.
- [ ] Section preset có nội dung nhìn thấy được ngay sau khi Add section.
- [ ] Template JSON chỉ lưu instance value, không được xem là nơi định nghĩa schema.
- [ ] Header/footer nằm trong section group, không lặp lại trong page template.
- [ ] Theme Check chạy sạch; đặc biệt loại bỏ trailing comma trong schema.

---

_Tài liệu được sinh từ mã nguồn hiện tại. Khi schema hoặc template thay đổi, cần quét lại để snapshot không bị lệch._
