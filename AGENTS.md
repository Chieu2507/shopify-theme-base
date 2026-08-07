# Spinel Theme — Quy trình bắt buộc

## 1. Bắt đầu và nguồn chuẩn

1. Đọc toàn bộ `AGENTS.md` trước mỗi tác vụ, kể cả tác vụ tiếp nối.
2. Luôn dùng và tham khảo plugin `@shopify`
   (`shopify@openai-curated-remote`) trước khi quyết định về Liquid, schema,
   section/block, Theme Editor, Storefront, Shopify CLI/API hoặc Theme Store.
   Ưu tiên capability tra cứu tài liệu; chỉ thao tác dữ liệu store khi user yêu
   cầu rõ ràng. Nếu capability phù hợp không khả dụng, phải nêu giới hạn và dùng
   Shopify Dev Docs chính thức cùng code Spinel hiện tại.
3. Trước khi sửa file, chạy `git status --short --branch`, xác nhận branch/target,
   fetch `origin/main` và kiểm tra divergence. Giữ nguyên mọi thay đổi ngoài task;
   không tự stash hoặc thao tác chúng.
4. Áp dụng nguồn chuẩn theo vai trò:

   - Requirement hiện tại của user ưu tiên; demo bổ sung hình ảnh, responsive và
     interaction chưa được requirement ghi rõ.
   - Code Spinel hiện tại là chuẩn cho convention, setting và tương thích ngược.
   - Shopify Dev Docs hiện hành, truy cập qua `@shopify`, là chuẩn nền tảng.
   - `AGENTS.md` quyết định workflow QA và delivery.

5. Chỉ hỏi lại khi điểm mơ hồ có thể làm đổi kiến trúc, dữ liệu hoặc merchant
   UX. Với phần còn lại, suy luận từ demo và convention hiện có, rồi ghi giả
   định vào checklist nghiệm thu.

### Responsive convention của Spinel (theo Horizon)

- Dùng CSS viewport và mobile-first cho layout cấp trang theo các mốc Horizon:
  - Mobile: `0–749px` — layout mặc định, không cần media query.
  - Tablet/medium: `750–989px` — bắt đầu tại
    `@media screen and (min-width: 750px)`.
  - Desktop: `≥990px` — bắt đầu tại
    `@media screen and (min-width: 990px)`.
- Dùng viewport breakpoint cho thay đổi cấu trúc cấp trang. Kiểm tra các mốc
  biên `749px`, `750px`, `989px` và `990px` khi sửa layout.
- Không dùng `max-width: 990px` để định nghĩa tablet vì sẽ chồng lấn breakpoint
  desktop; nếu cần giới hạn tablet, dùng `min-width: 750px` và
  `max-width: 989px`.
- Với component tái sử dụng có thể nằm trong nhiều container, ưu tiên
  container query thay vì thêm viewport breakpoint. Parent phải khai báo
  `container-type: inline-size` hoặc shorthand `container`, đặt
  `container-name` ổn định, rồi dùng `@container` theo chiều rộng thực tế của
  component. Ngưỡng container là contract nội bộ của component, không mặc định
  là `750px` hoặc `990px`.
- Dùng layout fluid/container và hai viewport breakpoint hiện có trước khi thêm
  breakpoint mới. Chỉ thêm breakpoint hoặc container threshold khác khi có lý do
  kỹ thuật rõ ràng và ghi lại ngoại lệ.
- Đây là convention viewport của Horizon dành cho storefront, không phải giới
  hạn viewport bắt buộc của Shopify. Shopify yêu cầu theme mobile responsive
  nhưng không quy định min/max cố định cho mobile, tablet hoặc desktop; desktop
  cũng không có max-width viewport bắt buộc.
- Không áp dụng các mốc storefront này cho `checkout.liquid`; checkout có phạm
  vi CSS riêng.

## 2. Requirement và phạm vi

Trước khi code, chuyển requirement/demo thành checklist có thể quan sát được,
bao gồm cấu trúc/nội dung, trạng thái dữ liệu, desktop/mobile, interaction,
animation, merchant settings, Theme Editor, accessibility, performance, khác
biệt được phép và phần ngoài phạm vi.

- Chỉ sửa phần cần thiết để đạt checklist; không refactor, format hoặc đổi API
  ngoài phạm vi.
- Với bug, tái hiện khi có thể và xác định nguyên nhân gốc trước khi sửa. Nếu
  không thể tái hiện, ghi bằng chứng/giả thuyết và phần runtime chưa xác minh.
- Với demo storefront Spinel bị khóa, dùng password `1`; không dùng password này
  cho Shopify Admin, GitHub, API hoặc hệ thống khác.
- Khi sửa block, snippet, asset hoặc setting dùng chung, dùng `rg` tìm toàn bộ
  call site, xác định blast radius và regression-test các nhóm usage bị ảnh hưởng.

## 3. Kiến trúc section và block

Trước tiên xác định section đang dùng local blocks hay theme blocks. Section
local hiện hữu phải giữ local blocks. Trước khi tạo mới, đọc component tương
đương và template/preset đang dùng nó.

Với section mới hoặc tương thích theme blocks, ưu tiên theo đúng thứ tự:

1. Tái sử dụng theme block hiện có.
2. Kết hợp các block hiện có bằng nested block khi merchant cần thêm, xóa, nhân
   bản hoặc sắp xếp nội dung.
3. Tạo theme block dùng chung mới khi không có block phù hợp và có khả năng tái
   sử dụng thực tế.
4. Chỉ đặt content setting trực tiếp trong section/local block khi markup, quan
   hệ dữ liệu hoặc interaction khiến theme block không phù hợp; phải nêu lý do
   kỹ thuật trong bàn giao.

Các invariant bắt buộc:

- Một section chỉ dùng một cơ chế: local section blocks hoặc theme blocks. Không
  trộn `section.blocks`/`block_order` với `{% content_for 'blocks' %}`.
- Dùng dynamic theme block cho nội dung merchant được sắp xếp; dùng static theme
  block cho vị trí/quan hệ cố định. Lệnh `content_for "block"` phải có literal
  `id` duy nhất trong parent trực tiếp. Khi khai báo trong preset/JSON, dùng cùng
  `id`, thêm `"static": true` và không đưa vào `block_order`; preset có thể bỏ
  qua static block để Shopify dùng default.
- Mặc định section quản lý container/layout; block quản lý nội dung và layout nội
  bộ. Mọi selector, DOM ID và JS instance phải an toàn khi có nhiều instance.
- Kiểm tra giới hạn nesting, số block/file và schema hiện hành qua `@shopify`
  thay vì dựa vào số liệu nhớ từ task cũ.

## 4. Setting và tương thích ngược

- `blocks/heading.liquid` là nguồn chuẩn cho heading; subheading là preset của
  heading. `blocks/text.liquid` là nguồn chuẩn cho body text. Với button, media,
  group và primitive khác, phải đọc block hiện có trước khi triển khai.
- Nếu không thể tái sử dụng block, sao chép đầy đủ nhóm option liên quan: semantic
  ID, type, option/order, default, limit, condition và render behavior. Chỉ đổi
  ID/prefix hoặc `visible_if` khi ngữ cảnh mới bắt buộc; ghi rõ mọi ngoại lệ.
- Không xóa hoặc đổi persisted setting ID, block/schema type, translation key hay
  stored JSON nếu chưa có migration/chấp thuận. Chỉ đổi default hoặc documented/
  external DOM hook sau khi review call site và tác động tương thích.
- Setting phải thực sự tác động đúng label, theo naming/i18n/order của Spinel:
  nội dung → giao diện → layout → hành vi. Dùng `visible_if` cho setting phụ thuộc.
- Dùng default an toàn và placeholder có nghĩa. Không hard-code nội dung merchant
  cần sửa; chỉ thêm control desktop/mobile riêng khi thiết kế thực sự cần.

## 5. Chất lượng triển khai

- Liquid/schema và HTML render phải hợp lệ, xử lý `blank` an toàn. Local section
  block phải gắn `{{ block.shopify_attributes }}` vào root; với theme block, không
  gắn trùng default wrapper và chỉ xử lý thủ công theo hướng dẫn `@shopify` khi
  dùng wrapper tùy chỉnh/disabled.
- Dùng semantic HTML, đúng button/link, keyboard và visible focus; label/ID duy
  nhất, mọi ảnh có `alt` phù hợp, ARIA state đúng và focus order theo DOM.
  Dialog/drawer phải trap focus, hỗ trợ Esc và trả focus; animation tôn trọng
  reduced motion. Đạt contrast 4.5:1 cho body text, 3:1 cho large text/non-text UI
  và touch target tối thiểu 24×24 CSS px.
- CSS/JS phải scoped theo component, ưu tiên token và primitive sẵn có. Không thêm
  dependency/global bundle cho hành vi cục bộ và không tạo overflow ngoài ý muốn.
- Shopify content image phải dùng `image_url`/`image_tag`, dimensions và `sizes`
  phù hợp. Lazy-load dưới fold; không lazy ảnh above-fold; chỉ preload tài nguyên
  critical đã được đo. Xử lý SVG, CSS background và media khác theo đúng loại.
- JS init phải idempotent theo instance và có teardown đối xứng cho listener,
  observer, timer và component. Không nhân đôi handler trên `document`/`window`.
- Handler `shopify:section:*` và `shopify:block:*` chỉ xử lý đúng target/ID liên
  quan. Mọi scroll lock trên `html`/`body` phải cleanup khi unload, xóa hoặc
  re-render; không chờ một lần load tương lai để unlock.
- Chỉ dùng `request.design_mode`/`Shopify.designMode` để nhận biết editor; không
  dò URL/`content_for_header` và không làm preview khác storefront thật.

## 6. Validation và QA

Sau lần sửa cuối:

1. Chạy `git diff --check -- <task-paths>` và tự review diff, file changed và
   call site; tách rõ lỗi có sẵn ngoài task.
2. Với file theme thay đổi, chạy validator chung từ root:
   `scripts/validate-theme-8gb.sh '<file-1>,<file-2>'`.
   Script là entrypoint bắt buộc vì cấu hình Node heap 8 GB. Dùng full-theme
   validation khi thay đổi shared/global, nhiều file liên kết hoặc release.
3. Đọc `validation-results/latest.status` và `validation-results/latest.log` của
   lần chạy mới nhất; không dùng log cũ. Với JS/build script, chạy thêm syntax,
   build hoặc targeted test sẵn có. Docs-only không cần theme validator.
4. Runtime QA là opt-in, không chạy mặc định. Runtime QA bao gồm
   `shopify theme dev`, storefront/browser, Theme Editor, console, responsive,
   interaction và Lighthouse/network. Nếu user không ghi đúng cú pháp
   `QA: ON` trong prompt, không chạy runtime QA; checklist phải ghi
   `NOT TESTED — runtime QA not requested`. Khi có cú pháp này, chạy
   `shopify theme dev --theme 144223469616 --allow-live` và kiểm tra
   desktop/mobile theo các mục bên dưới.
5. Khi `QA: ON`, QA theo phạm vi ảnh hưởng: default/empty/long/missing data,
   nhiều instance, keyboard, interaction, responsive và không có console error.
   Với Theme Editor, kiểm tra add/remove/duplicate/reorder/select/deselect/
   re-render/unload khi liên quan; xác nhận không còn listener trùng hoặc scroll
   lock.
6. Đối chiếu từng mục checklist và ghi `PASS`, `FAIL` hoặc `NOT TESTED` kèm bằng
   chứng. Không báo cáo runtime/audit đã hoàn tất nếu chưa chạy được. Khi không
   có `QA: ON`, `NOT TESTED — runtime QA not requested` là trạng thái hợp lệ và
   không tự nó chặn delivery.
7. Khi `QA: ON` và thay đổi ảnh, asset shared, CSS/JS loading, layout hoặc LCP,
   so sánh Lighthouse/network trước–sau trên surface ảnh hưởng và không chấp
   nhận regression chưa giải thích.

Validation fail hoặc regression quan sát được thì không commit/push. Nếu có
`QA: ON` nhưng runtime QA bắt buộc không thể chạy, ghi `NOT TESTED` và chặn
delivery. Nếu không có cú pháp này, chỉ cần ghi rõ `NOT TESTED — runtime QA not
requested`; docs/non-runtime change vẫn phải qua các gate tĩnh áp dụng.

## 7. Submit và Git delivery

Delivery mặc định là Git vì theme đã kết nối Git; không chạy
`shopify theme push`/`shopify theme publish` và không kiểm tra lại deploy config
trừ khi user yêu cầu.

Sau khi các gate áp dụng đã đạt:

1. Xác nhận current branch là `main`. Nếu không, dừng và reconcile target trước
   khi commit.
2. Stage explicit file/hunk thuộc task; review `git diff --cached`. Không stage
   thay đổi không liên quan, validation log hoặc artifact nếu không được yêu cầu.
3. Commit với message mô tả outcome, fetch lại `origin/main`, rồi kiểm tra
   divergence. Nếu remote advanced, tích hợp task commit an toàn; không tự stash
   unrelated changes, không force-push. Dùng isolated worktree hoặc báo blocker
   khi dirty state làm integration không an toàn.
4. Sau integration/conflict resolution, chạy lại các check bị ảnh hưởng; rồi
   `git push origin main` mà không hỏi lại.
5. Fetch/verify lần cuối để xác nhận `HEAD` và `origin/main` cùng commit; working
   tree không mất thay đổi ngoài task.

Chỉ bỏ commit/push khi user hoặc system nói rõ không push. Nếu delivery bị chặn,
phải báo chính xác command, lỗi và trạng thái repository.

Nếu user yêu cầu rõ ràng package/submit Shopify Theme Store:

- Tra yêu cầu Theme Store hiện hành qua `@shopify`, chạy full validation và QA
  home/product/collection có dữ liệu trên desktop/mobile, accessibility,
  performance, browser support, navigation và product form khi tắt JavaScript.
- Chạy `node scripts/package-theme-store.mjs` (thêm `--output` khi user chỉ định),
  kiểm tra report, SHA-256 và cấu trúc ZIP theo requirement hiện hành. Không sửa
  source để loại demo binding thủ công vì script xử lý trên staging copy.
- Kiểm tra version/release notes và mọi requirement hiện hành trước khi bàn giao.
  Chỉ thực hiện hành động publish/submission bên ngoài khi user yêu cầu rõ ràng.

## 8. Bàn giao cuối

Bàn giao ngắn gọn và chỉ gồm các mục áp dụng: outcome/file đã đổi; checklist cùng
phần chưa test; reuse/ngoại lệ kiến trúc; kết quả validator/runtime QA; commit,
trạng thái push hoặc blocker chính xác.
