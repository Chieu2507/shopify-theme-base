# Quy trình build và fix theme Jovie

Tài liệu này mô tả workflow mặc định hiện tại khi có yêu cầu build mới hoặc sửa giao diện. Có thể chỉnh trực tiếp các quy định dưới đây để thay đổi cách Codex thực hiện những task tiếp theo.

## 1. Cấu hình mặc định

| Hạng mục | Quy định hiện tại |
|---|---|
| Repository | `cassharper/jovie-jewelry` |
| Nhánh triển khai | `main` |
| Source of truth | Code mới nhất trên `origin/main` |
| Theme đích | `191354634612` — Jovie Jewelry |
| Cách triển khai | Commit và push lên `main`; Shopify Git integration tự đồng bộ theme |
| Shopify CLI push | Không sử dụng, trừ khi được yêu cầu lại rõ ràng |
| Theme hoặc Figma tham chiếu | Chỉ đọc để phân tích; không ghi thay đổi vào nguồn tham chiếu |
| Ảnh | Không tự tạo hoặc thay ảnh nếu task không yêu cầu |
| CSS | Primitive dùng chung đặt trong `assets/base.css`; CSS riêng của section giữ trong section |
| Validation | Shopify Liquid validator, Theme Check và kiểm tra cú pháp liên quan |
| Commit | Một commit có phạm vi rõ ràng cho mỗi thay đổi đã hoàn thành |

## 2. Bắt đầu mọi task

1. Đọc yêu cầu mới nhất và xác định đây là **build**, **fix**, **review** hay **store operation**.
2. Với theme/preset mới, multi-section page, performance program hoặc submission cycle,
   đọc [Shopify Theme Learning Loop](shopify-theme-learning-loop.md) và chỉ nạp playbook liên quan.
3. Kiểm tra `git status` để phát hiện file chưa commit.
4. Chạy `git fetch origin main` và so sánh local với remote.
5. Nếu local sạch và đang chậm hơn remote, chỉ dùng fast-forward để đồng bộ.
6. Nếu có file chưa commit hoặc thay đổi từ một nguồn khác, không ghi đè; phải xác định rõ phần nào thuộc task hiện tại.
7. Kiểm tra các file liên quan trước khi viết code để tránh tạo component, token hoặc CSS trùng lặp.

## 3. Chọn kỹ năng và nguồn tham chiếu

### Thay đổi storefront/theme

- Dùng skill **Build Shopify Themes + Shopify Liquid** cho thay đổi Liquid, section, block, snippet, schema, template, CSS hoặc JavaScript.
- Với một section cụ thể có URL Figma hoặc Theme Editor, có thể dùng workflow section nằm trong Shopify Theme Builder.
- Dùng **Shopify Liquid** để tra cứu cú pháp hiện hành và validate artifact đã sửa.

### Figma

1. Dùng Figma connector khi cần lấy design context có cấu trúc.
2. Nếu connector không đọc được nhưng người dùng đã cung cấp URL hợp lệ, dùng phiên đăng nhập trong in-app browser để kiểm tra đúng frame.
3. Chỉ phân tích frame được yêu cầu và các node con cần thiết.
4. Ghi nhận desktop, tablet, mobile, spacing, typography, content, state và interaction.

### Shopify Theme Editor tham chiếu

1. URL của theme khác theme đích chỉ được dùng read-only.
2. Kiểm tra cả giao diện và toàn bộ option trong sidebar Theme Editor.
3. Xác định section settings, block types, block settings, trạng thái rỗng và responsive behavior.
4. Không copy source code, asset hoặc nội dung bảo hộ từ theme tham chiếu.

## 4. Quy trình khi build mới

1. Lập inventory của section/page:
   - Cấu trúc DOM và thứ tự đọc.
   - Section settings.
   - Các block có thể thêm, xóa, sắp xếp hoặc duplicate.
   - Media, typography, color scheme và spacing.
   - Desktop, tablet và mobile behavior.
   - Hover, focus, keyboard, animation và reduced motion.
2. Chọn kiến trúc nhỏ nhất đáp ứng yêu cầu:
   - Section giữ layout và behavior cấp section.
   - Block giữ nội dung merchant cần quản lý độc lập.
   - Snippet giữ phần render tái sử dụng nhưng không cần hiện trong Theme Editor.
3. Tái sử dụng primitive, snippet và token đang có trước khi thêm code mới.
4. Tách semantic heading tag khỏi visual heading size.
5. Typography và màu mặc định phải kế thừa Theme Settings.
6. Mọi setting mới phải có đường liên kết hoàn chỉnh:
   - Schema setting.
   - Liquid markup, class hoặc CSS variable.
   - CSS/JavaScript tạo ra thay đổi nhìn thấy được.
7. Component có JavaScript phải:
   - Khởi tạo idempotent.
   - Hoạt động với nhiều instance.
   - Cleanup listener, observer và timer.
   - Hoạt động trong Theme Editor khi section được load, unload hoặc chọn block.
8. Nếu section cần xuất hiện mặc định, thêm composition vào JSON template hoặc section group phù hợp.

## 5. Quy trình khi fix lỗi

1. Đồng bộ code mới nhất trước khi sửa, đặc biệt khi người dùng vừa chỉnh trực tiếp trên Shopify.
2. Xác định lỗi thuộc markup, schema binding, CSS cascade, responsive layout, JavaScript state hay dữ liệu Shopify.
3. Kiểm tra nguyên nhân gốc trước khi thay đổi kích thước hoặc thêm override.
4. Chỉ sửa phạm vi nhỏ nhất có thể; không refactor phần không liên quan trong cùng task.
5. Nếu lỗi xuất hiện khi zoom hoặc trên màn hình rộng:
   - Kiểm tra fixed height, viewport unit, overflow, absolute positioning và breakpoint.
   - Không coi browser zoom là một breakpoint riêng.
   - Đảm bảo nội dung không bị cắt ở 320px, desktop rộng và mức zoom phổ biến.
6. Nếu lỗi thuộc font hoặc màu:
   - Kiểm tra Theme Settings và CSS variable trước.
   - Không hard-code font family khi theme đã có typography token.
7. Nếu lỗi thuộc schema:
   - Xác nhận setting thực sự điều khiển UI.
   - Sửa hoặc xóa setting không có binding.
8. Kiểm tra lại đúng trạng thái người dùng đã báo và các breakpoint lân cận.

## 6. Quy tắc CSS

### Đặt trong `assets/base.css` khi

- Là reset, token, accessibility helper hoặc primitive dùng chung.
- Đã có ít nhất hai component độc lập sử dụng cùng một contract.
- Là typography, button, form, page-width, media hoặc layout utility trung lập.

### Giữ trong section khi

- Là grid, composition, animation, overlay hoặc responsive behavior riêng của section.
- Selector phụ thuộc section setting hoặc class riêng của section.
- Khả năng tái sử dụng mới chỉ là giả định.

Không được duplicate cùng một rule trong `base.css` và section stylesheet.

## 7. Validation trước khi commit

Tùy loại file được sửa, thực hiện các bước phù hợp:

1. `git diff --check` để phát hiện whitespace và patch lỗi.
2. Parse JSON cho locale, template, section group hoặc config có thay đổi.
3. Chạy `node --check` với JavaScript mới hoặc JavaScript nhúng trong section.
4. Chạy Shopify Liquid validator cho toàn bộ artifact Liquid/JSON đã sửa.
5. Chạy `shopify theme check --path .`.
6. Kiểm tra visual/interaction ở desktop và mobile khi môi trường preview khả dụng.
7. Không commit nếu validator báo lỗi mới do task tạo ra.

Nếu người dùng yêu cầu bỏ qua một validator cụ thể, vẫn phải giữ tối thiểu các kiểm tra cú pháp an toàn trước khi push.

## 8. Commit và triển khai

1. Chỉ stage các file thuộc task hiện tại.
2. Commit message mô tả đúng thay đổi, ví dụ:
   - `feat: add footer offer flyout`
   - `fix: make offer flyout non-modal`
   - `fix: reduce offer flyout dimensions`
3. Trước khi push, chạy lại `git fetch origin main`.
4. Nếu remote có commit mới:
   - Đồng bộ an toàn.
   - Không force-push.
   - Không ghi đè thay đổi từ Shopify Git integration hoặc đồng nghiệp.
5. Push lên `origin/main`.
6. Không chạy `shopify theme push`; Git integration là deployment path mặc định.

## 9. Báo cáo khi hoàn thành

Phản hồi cuối cần có:

- Kết quả chính đã hoàn thành.
- Những file quan trọng đã thay đổi.
- Behavior hoặc option mới.
- Kết quả validator/Theme Check.
- Commit hash.
- Xác nhận đã push `main` hoặc nêu rõ lý do chưa push được.
- Dependency nội dung còn thiếu, ví dụ ảnh, product, collection hoặc merchant setting.
- Với milestone lớn, ghi lại learning record nếu có root cause và rule tái sử dụng đã được kiểm chứng.

## 10. Các hành động không được tự ý thực hiện

- Không force-push hoặc reset destructive.
- Không xóa thay đổi chưa commit của người dùng.
- Không push trực tiếp bằng Shopify CLI.
- Không sửa theme tham chiếu.
- Không thay đổi product, collection, navigation hoặc Shopify Files nếu task chỉ yêu cầu sửa code.
- Không hard-code dữ liệu storefront khi đã có resource picker hoặc Theme Settings phù hợp.
- Không đưa CSS riêng của section vào `base.css` chỉ để làm file section ngắn hơn.
- Không kết luận đã giống reference nếu chưa kiểm tra đủ layout, option và interaction được yêu cầu.

## 11. Checklist ngắn

### Build

- [ ] Đồng bộ `main`.
- [ ] Đọc skill phù hợp.
- [ ] Phân tích đầy đủ reference và option.
- [ ] Chọn section/block/snippet architecture.
- [ ] Tái sử dụng token và primitive hiện có.
- [ ] Hoàn thiện schema → binding → UI.
- [ ] Kiểm tra responsive và accessibility.
- [ ] Validate.
- [ ] Commit và push `main`.

### Fix

- [ ] Đồng bộ code mới nhất.
- [ ] Tái hiện và xác định nguyên nhân gốc.
- [ ] Sửa phạm vi nhỏ nhất.
- [ ] Kiểm tra breakpoint, zoom và state liên quan.
- [ ] Validate.
- [ ] Commit và push `main`.

## 12. Khu vực người dùng có thể chỉnh nhanh

Có thể thay đổi các dòng dưới đây để cập nhật workflow mặc định:

```yaml
deployment_branch: main
deployment_method: git_integration
direct_shopify_cli_push: false
target_theme_id: 191354634612
auto_commit_after_validation: true
auto_push_after_commit: true
require_shopify_liquid_validator: true
require_theme_check: true
reference_theme_write_access: false
skip_images_unless_requested: true
shared_css_file: assets/base.css
section_specific_css_location: section_stylesheet
```
