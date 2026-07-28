# Omnise — Quy ước phát triển đa-preset

> Bắt buộc: mọi thành viên và AI phải đọc toàn bộ file này trước khi sửa code, Theme Editor hoặc cấu hình Shopify.

## 1. Mục tiêu và cấu trúc

Repository `Omnise` có một codebase dùng cho hai preset:

| Preset | Ngành hàng | Store demo | Branch deployment |
| --- | --- | --- | --- |
| Jovie | Jewelry / gifting | `omnise-themes-omniselle` | `demo-jovie` |
| Noryvelle | Luxury bags / fashion | `noryvelle-fashion` | `demo-noryvelle` |

- `main` là source of truth và branch phát hành. Không kết nối trực tiếp với store.
- `demo-jovie` và `demo-noryvelle` là branch triển khai cho từng store. Shopify có thể tự commit vào hai branch này khi sửa trong Admin.
- Repository cũ `jovie-jewelry` và theme đã submit không thuộc workflow này. Không sửa chúng khi phát triển preset mới.

## 2. Phân loại thay đổi trước khi làm

Trước khi viết code, bắt buộc gắn một trong ba nhãn dưới đây vào task, branch và commit.

| Nhãn | Khi dùng | Nơi thay đổi chính |
| --- | --- | --- |
| `shared` | Cả hai preset đều nên nhận thay đổi | `sections/`, `snippets/`, `assets/`, `blocks/`, `layout/`, logic schema chung |
| `jovie` | Chỉ phục vụ Jewelry/Gifting | `listings/jovie/` hoặc section có prefix `jovie-` |
| `noryvelle` | Chỉ phục vụ Luxury Bags/Fashion | `listings/noryvelle/` hoặc section có prefix `noryvelle-` |

Quy tắc quyết định:

1. Nếu thay đổi Liquid, CSS hoặc JS làm preset còn lại cũng hưởng lợi mà không sai trải nghiệm: chọn `shared`.
2. Nếu thay đổi chỉ là layout, text, ảnh, thứ tự section, menu, collection hoặc template của một preset: chọn preset đó.
3. Nếu cần section Liquid chỉ cho một preset, file vẫn đặt ở `sections/` nhưng phải đặt tên rõ: `noryvelle-editorial-carry.liquid`, `jovie-gift-atelier.liquid`. Chỉ template JSON của preset tương ứng được gọi section này.
4. Không tạo section chung chỉ để dùng một lần cho một preset. Không sửa section đang dùng chung nếu yêu cầu thật ra chỉ thuộc một preset.

## 3. Vị trí đúng cho từng loại dữ liệu

| Nội dung | Vị trí chuẩn |
| --- | --- |
| Logic, markup, CSS/JS dùng chung | root theme folders: `sections/`, `snippets/`, `assets/`, `blocks/`, `layout/` |
| Homepage/page/product/collection JSON của Jovie | `listings/jovie/templates/` |
| Homepage/page/product/collection JSON của Noryvelle | `listings/noryvelle/templates/` |
| Header/footer group JSON riêng preset (nếu thực sự khác) | `listings/<preset>/sections/` |
| Font, màu, setting riêng preset | named preset tương ứng trong `config/settings_data.json` — không dùng `current` làm source |
| Tư liệu thiết kế lớn, ảnh tham chiếu, video tham chiếu | `docs/noryvelle-assets/` chỉ local; tuyệt đối không commit lại |

`/listings` chỉ chứa install-state JSON. Không đặt file `.liquid`, CSS hoặc JS vào `/listings`.

## 4. Branch và pull request

Không code trực tiếp trên `main`, `demo-jovie`, hoặc `demo-noryvelle` từ local.

Tạo branch từ `main` theo đúng mẫu:

```text
feature/shared-<muc-tieu>
feature/jovie-<muc-tieu>
feature/noryvelle-<muc-tieu>
fix/shared-<muc-tieu>
fix/jovie-<muc-tieu>
fix/noryvelle-<muc-tieu>
```

Mọi thay đổi local đi qua PR vào `main`. Một người được chỉ định làm **release owner** có trách nhiệm merge, hydrate đúng preset và deploy từ `main` sang hai demo branch.

## 5. Khi sửa trực tiếp trong Shopify Admin

### Sửa Theme Editor (JSON/settings/content)

Shopify sẽ tự commit vào branch demo đang kết nối. Sau đó release owner phải đưa thay đổi về `main`:

```bash
# Jovie
node scripts/preset-state.mjs capture jovie templates/index.json
node scripts/preset-state.mjs capture-settings jovie

# Noryvelle
node scripts/preset-state.mjs capture noryvelle templates/index.json
node scripts/preset-state.mjs capture-settings noryvelle
```

Chỉ capture những file JSON thực sự đã chỉnh. Không copy nguyên cả preset khi không cần thiết.

### Sửa code trong Edit code (Liquid/CSS/JS)

Thay đổi sẽ tự commit vào branch demo nhưng **chưa trở thành source chung**.

1. Xác định nó là `shared`, `jovie` hay `noryvelle`.
2. Chuyển thay đổi vào branch feature đúng loại từ `main`.
3. Mở PR vào `main`.
4. Release owner deploy commit `main` sang các demo branch cần nhận thay đổi.

Không lấy một commit Shopify tự tạo từ `demo-*` rồi merge thẳng vào `main` nếu chưa phân loại phạm vi thay đổi.

## 6. Hydrate và deploy

Sau khi `main` có install-state đúng, hydrate branch demo trước khi deploy:

```bash
# Trên branch demo-jovie
node scripts/preset-state.mjs hydrate jovie

# Trên branch demo-noryvelle
node scripts/preset-state.mjs hydrate noryvelle
```

Sau đó kiểm tra `git diff`, commit và push đúng branch demo. Không hydrate nhầm preset.

## 7. Quy ước commit

```text
shared: improve product card sale badge
jovie: refine Gift Atelier selection state
noryvelle: add editorial carry story section
fix(shared): prevent cart drawer focus loss
fix(noryvelle): correct bag material labels
```

Mỗi commit chỉ nên thuộc một phạm vi. Nếu một task vừa có shared code vừa có JSON riêng preset, tách thành hai commit.

## 8. Checklist trước khi tạo PR hoặc push

- [ ] Đã đọc file này.
- [ ] Đã kiểm tra `git status` và branch hiện tại.
- [ ] Đã gắn nhãn `shared`, `jovie` hoặc `noryvelle`.
- [ ] Không đụng repository cũ hoặc theme đang submit.
- [ ] JSON đã vào đúng `listings/<preset>/`.
- [ ] Section riêng có prefix preset rõ ràng.
- [ ] Không commit `docs/noryvelle-assets/`, `.shopify/`, `shopify.theme.toml`, ZIP hoặc file tạm.
- [ ] Đã kiểm tra theme source dưới giới hạn Shopify 50 MB.

## 9. Prompt bắt buộc khi giao việc cho AI

Gửi nguyên văn phần dưới đây trước mỗi task có sửa file:

```text
Trước khi làm bất kỳ thay đổi nào, hãy đọc toàn bộ file
docs/TEAM_PRESET_WORKFLOW.md và tuân thủ tuyệt đối.

Trước khi sửa, hãy báo lại:
1. Thay đổi này thuộc shared, jovie hay noryvelle.
2. Các file dự kiến sửa.
3. Branch phù hợp.

Không sửa repository/theme cũ đang submit. Không commit docs/noryvelle-assets.
Không merge hoặc push vào main/demo branch nếu chưa được yêu cầu rõ.
```
