# Section header architecture

Tài liệu này là nguồn tham chiếu khi xây mới hoặc chỉnh sửa `Section header` trong Spinel Theme.
Đọc file này trước khi triển khai header cho một section mới.

## Mục tiêu

- Mọi header trong Theme Editor có thể cùng hiển thị tên `Section header`.
- Header mặc định là static block: luôn tồn tại, không thể xóa và không thể thêm trùng.
- Từng section có thể dùng chung hoặc có bộ option riêng.
- Nội dung header có thể gồm `Subheading`, `Heading` và `Text`.
- Style riêng của một section không được ảnh hưởng header của section khác.

## Phân biệt tên hiển thị và block type

`name` trong schema là tên merchant nhìn thấy trong Theme Editor. Nhiều block có thể cùng dùng:

```json
{
  "name": "Section header"
}
```

Tên file là block type nội bộ và phải thể hiện phạm vi sử dụng:

| Trường hợp | File/type đề xuất | Tên hiển thị |
| --- | --- | --- |
| Dùng chung cùng markup và option | `_section-header` | `Section header` |
| Chỉ dành cho Review | `_review-section-header` | `Section header` |
| Chỉ dành cho Gallery | `_gallery-section-header` | `Section header` |
| Chỉ dành cho Collection | `_collection-section-header` | `Section header` |

Không tạo nhiều block cùng type rồi kỳ vọng schema thay đổi theo section. Một block type chỉ có một schema option.

## Khi nào dùng block chung

Dùng `blocks/_section-header.liquid` khi section mới cần:

- Cùng cấu trúc nested blocks.
- Cùng bộ option cấp header.
- Khác biệt chỉ nằm ở CSS hoặc cách bố trí của section.

CSS riêng phải được scope bằng class của section, ví dụ:

```css
.review-parallax .section-header-block {
  /* Review-only layout */
}
```

Không đặt style riêng của Review trực tiếp lên `.section-header` hoặc `.section-header-block` mà không có parent scope.

## Khi nào tạo block riêng

Tạo block type riêng nếu một section cần một trong các điểm sau:

- Bộ option khác đáng kể.
- Markup hoặc semantic HTML khác.
- Animation hoặc hành vi riêng.
- Nested block type hoặc thứ tự nội dung khác.
- Layout không thể xử lý sạch bằng CSS scope.

Block riêng vẫn đặt `"name": "Section header"` để giao diện Theme Editor nhất quán.

Nếu nhiều block riêng dùng chung markup, tách markup lặp lại thành snippet. Mỗi block giữ schema riêng và render cùng snippet đó.

## Cấu trúc nội dung

Section header hỗ trợ ba vai trò nội dung:

1. `Subheading`: nhãn nhỏ hoặc eyebrow phía trên heading.
2. `Heading`: tiêu đề chính của section.
3. `Text`: mô tả hoặc nội dung phụ.

Thứ tự mặc định:

```text
Subheading
Heading
Text
```

Không bắt buộc phải có đủ cả ba. Preset chỉ thêm những block cần thiết cho layout thiết kế.

### Quy tắc Subheading

Implementation Subheading hiện có nằm trực tiếp trong `sections/shop-the-look.liquid`. Đây không phải một file block riêng:

- Block type nội bộ: `eyebrow`.
- Tên hiển thị: `Subheading`.
- Nội dung: `block.settings.text`.
- Render qua snippet `typography-block`.
- `kind`: `text`.
- `default_preset`: `subheading`.
- `default_font`: `subheading`.

Shop the look render block này theo contract:

```liquid
{% render 'typography-block',
  block: block,
  content: block.settings.text,
  kind: 'text',
  default_preset: 'subheading',
  default_font: 'subheading'
%}
```

Trong section schema, block dùng:

```json
{
  "type": "eyebrow",
  "name": "Subheading",
  "limit": 1
}
```

Nếu đang chỉnh riêng Shop the look, tiếp tục dùng type `eyebrow` hiện tại để bảo toàn dữ liệu.

`eyebrow` hiện là section-local block nên không thể dùng trực tiếp làm nested theme block bên trong `_section-header`. Khi cần Subheading có tên riêng và tái sử dụng ở nhiều Section header, hãy:

1. Tạo `blocks/subheading.liquid` từ implementation của Shop the look.
2. Giữ `"name": "Subheading"`.
3. Render qua `typography-block` với `default_preset` và `default_font` là `subheading`.
4. Cho phép `{ "type": "subheading" }` trong schema của Section header cần sử dụng.
5. Không sao chép toàn bộ schema Subheading vào nhiều section mới.

Trong thời gian chưa tách thành theme block riêng, có thể dùng block `text` với typography preset `subheading` nếu không bắt buộc Theme Editor hiển thị nhãn `Subheading`:

```json
{
  "type": "text",
  "settings": {
    "text": "<p>What customers say</p>",
    "type_preset": "subheading",
    "color": "subtext",
    "alignment": "center"
  }
}
```

ID của block nên thể hiện đúng vai trò, ví dụ `review_header_subheading`, dù type vẫn là `text`.

Không dùng heading block để giả lập Subheading.

### Quy tắc Heading

- Dùng theme block `heading`.
- Chọn semantic tag phù hợp với cấu trúc trang.
- Visual preset có thể khác semantic tag.
- Màu mặc định lấy từ `var(--color-heading)`.

### Quy tắc Text

- Dùng theme block `text` với preset `paragraph` hoặc preset phù hợp thiết kế.
- Text và thẻ `<p>` lấy màu từ `var(--color-text)` hoặc color option của typography block.
- Text/Subheading không được ép dùng font family của heading; phải kế thừa typography preset tương ứng.

## Static block contract

Static Section header phải được render trực tiếp trong section:

```liquid
{% content_for 'block', type: '_section-header', id: 'section_header' %}
```

Quy tắc bắt buộc:

- Filename/type bắt đầu bằng `_`.
- Có `{% doc %}` vì được render tĩnh bằng `content_for 'block'`.
- Dùng ID ổn định và duy nhất trong section.
- Preset khai báo `"static": true`.
- Không đưa static header type vào danh sách dynamic `blocks` của section.
- Render header ngoài container `{% content_for 'blocks' %}` dành cho card/item động.

Ví dụ section schema chỉ cho thêm card:

```json
"blocks": [
  {
    "type": "review"
  }
]
```

Ví dụ static header trong preset:

```json
{
  "type": "_section-header",
  "id": "review_header",
  "static": true,
  "blocks": [
    {
      "type": "text",
      "settings": {
        "type_preset": "subheading"
      }
    },
    {
      "type": "heading"
    }
  ]
}
```

Không thêm `_section-header` vào section schema chỉ để Theme Editor nhận diện block. Việc đó làm merchant có thể thêm header thứ hai và gây vỡ layout.

## CSS contract

Block dùng chung hiện tại có:

```text
.section-header
.section-header-block
.section-header-block__content
```

- `.section-header` là contract chung đã có trong theme.
- `.section-header-block` dành riêng cho reusable theme block.
- `.section-header-block__content` bao nội dung nested blocks.
- Option dùng CSS custom properties để cập nhật trực tiếp trong Theme Editor.
- CSS layout riêng phải scope bằng root class của section.

Ví dụ đúng:

```css
.review-parallax .section-header-block { /* ... */ }
.gallery .section-header-block { /* ... */ }
```

Ví dụ không nên dùng trong asset riêng của section:

```css
.section-header-block { /* Review-only styles */ }
```

## An toàn dữ liệu Theme Editor

- Không đổi block ID đã lưu nếu không có kế hoạch migration.
- Khi đổi block type, cập nhật đồng thời section render, section preset và template JSON đang sử dụng.
- Giữ nguyên nested block IDs khi có thể để tránh mất nội dung merchant đã nhập.
- Không bọc static header bằng điều kiện phụ thuộc `section.blocks.size`; dynamic cards có thể bằng 0 nhưng header vẫn là static content.

## Checklist khi xây section mới

1. Xác định section dùng `_section-header` hay cần type riêng.
2. Xác định các vai trò cần có: Subheading, Heading, Text. Nếu cần block Subheading có nhãn riêng, lấy Shop the look làm implementation tham chiếu.
3. Render static header với ID ổn định.
4. Thêm static header vào preset với `"static": true`.
5. Không thêm header type vào danh sách dynamic `blocks`.
6. Scope CSS theo root class của section.
7. Giữ typography và color theo theme variables/presets.
8. Kiểm tra không thể Add hoặc Remove Section header trong Theme Editor.
9. Kiểm tra nested content vẫn có thể chỉnh sửa và sắp xếp theo thiết kế.
10. Kiểm tra desktop/mobile và trạng thái section không có dynamic item.

## Quy ước cho yêu cầu sau này

Khi người dùng yêu cầu “build Section header cho section mới”:

- Đọc tài liệu này trước.
- Mặc định dùng `_section-header` nếu bộ option hiện tại đáp ứng yêu cầu.
- Tạo block type riêng nhưng vẫn đặt tên hiển thị `Section header` nếu option khác đáng kể.
- Cho phép Subheading, Heading và Text theo các quy tắc ở trên.
- Giữ header static, không xóa được và không add thêm được, trừ khi người dùng yêu cầu rõ hành vi khác.
