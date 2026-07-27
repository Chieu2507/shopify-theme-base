# Mega menu typography plan

## Mục tiêu

Đồng bộ toàn bộ typography của mega menu trong Header với các font token đang được merchant quản lý ở **Theme settings → Typography**. Không thêm font family hard-code, không tạo setting trùng lặp.

## Nguồn typography hiện có

| Vai trò | Theme setting | Giá trị hiện tại | CSS variable |
| --- | --- | --- | --- |
| Heading | `type_heading_font` | Kaisei Decol | `--font-heading--family` |
| Body / navigation | `type_body_font` | Figtree | `--font-body--family` |

Các token được xuất từ `snippets/css-variables.liquid`, vì vậy khi merchant đổi font trong Theme settings, mega menu phải cập nhật theo ngay.

## Hiện trạng cần sửa

- `header__mega-heading` ở desktop đã dùng heading token.
- `header__mega-link` và `header__mega-link--nested` đang dựa vào inheritance; cần khai báo body token rõ ràng để không bị ảnh hưởng bởi kiểu chữ của container/header.
- `header__mega-heading` trên mobile đang bị ghi đè sang body token. Cần bỏ override font family này để heading trong menu giữ Kaisei Decol nhất quán với desktop.
- Tất cả link cấp 1/cấp 2 và link trong promo cần xác định rõ font family, weight, letter-spacing và text-transform theo role thay vì phụ thuộc CSS mặc định.

## Phạm vi file khi triển khai

1. `sections/header.liquid`
   - Chỉ sửa CSS của lớp mega menu.
   - Áp dụng `var(--font-heading--family)` cho heading/editorial promo title.
   - Áp dụng `var(--font-body--family)` cho navigation link, nested link và promo metadata/body.
   - Dùng các companion token `--font-heading--weight`, `--font-body--weight`, `--font-heading--style`, `--font-body--style` khi cần để không mất weight/style từ Theme settings.
   - Loại bỏ desktop/mobile override làm thay đổi sai role font.

2. `snippets/css-variables.liquid`
   - Không sửa nếu các token trên vẫn được xuất đầy đủ.
   - Chỉ mở rộng khi phát hiện role mới cần một token chưa tồn tại; không thêm font picker riêng cho mega menu.

3. `config/settings_schema.json` và `config/settings_data.json`
   - Không thay đổi trong lượt đầu. Mega menu phải kế thừa trực tiếp từ `type_heading_font` và `type_body_font` hiện có.

## Quy ước role typography

| Thành phần | Font token | Lý do |
| --- | --- | --- |
| Column heading | Heading | Nhãn editorial/cấu trúc cấp cao. |
| Promo heading | Heading | Tương đương heading của section/card. |
| Menu link cấp 1 | Body | Navigation cần độ rõ, đọc nhanh. |
| Menu link lồng nhau | Body | Là metadata điều hướng, không cạnh tranh với heading. |
| Promo eyebrow, copy, CTA | Body | Giữ hierarchy với promo heading. |

## Cách kiểm tra sau khi build

1. Đổi Heading font và Body font trong Theme settings; mở lại mega menu để xác minh font thay đổi tương ứng mà không cần sửa code.
2. Kiểm tra desktop và mobile drawer: column/promo heading vẫn là heading font; tất cả link là body font.
3. Kiểm tra hover, active, keyboard focus không làm thay đổi font family hoặc weight ngoài ý muốn.
4. Kiểm tra mega menu có và không có promo card, menu 1–4 cột, nested links dài và viewport mobile/tablet.
5. Chạy Liquid/Theme Check rồi push riêng `sections/header.liquid` sau khi implementation được duyệt.

## Tiêu chí hoàn thành

- Không còn font family hard-code hoặc inheritance mơ hồ trong mega menu.
- Mega menu phản ứng đầy đủ với hai font picker hiện có của Theme settings.
- Desktop và mobile giữ cùng hierarchy typography.
