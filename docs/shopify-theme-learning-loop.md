# Shopify Theme Learning Loop

Tài liệu này lưu các bài học có thể tái sử dụng từ quá trình build, tối ưu và QA
Omniselle. Đây không phải lịch sử thay đổi của một theme cụ thể. Mục tiêu là giúp
Codex build theme hoặc preset tiếp theo nhanh hơn, ít regression hơn và không phải
khám phá lại các quyết định đã được kiểm chứng.

## Cách sử dụng

- Đọc phần **Core loop** trước khi bắt đầu một theme, preset hoặc page family mới.
- Chỉ đọc playbook liên quan khi task chạm đúng lĩnh vực đó.
- Ưu tiên profile, design system và code hiện tại của project hơn ví dụ Omniselle.
- Không copy cứng theme ID, product handle, collection handle hoặc nội dung demo.
- Sau mỗi milestone, chỉ bổ sung bài học đã có bằng chứng từ code, storefront,
  Theme Editor, thiết bị thật hoặc audit hợp lệ.
- Không biến một workaround cục bộ thành quy tắc toàn theme nếu chưa kiểm tra các
  consumer khác.

## Core loop

```text
Capture → Normalize → Architect → Build → Populate → Verify → Deploy → Learn
```

| Bước | Đầu ra bắt buộc | Điều kiện chuyển bước |
|---|---|---|
| Capture | Scope, nguồn tham chiếu, theme/store/branch, quyền mutation | Không còn mơ hồ về source of truth và target |
| Normalize | Design tokens, breakpoint, primitive, content/data contract | Theme Settings và CSS variables có thể dùng thật |
| Architect | Inventory section/block/snippet, responsive và empty states | Merchant ownership được xác định trước khi code |
| Build | Section nhỏ nhất, binding đầy đủ, JS idempotent | Local behavior đúng với placeholder và dữ liệu thật |
| Populate | Shopify Files, product/collection/menu/demo settings | Không còn dữ liệu hard-code hoặc asset sai nguồn |
| Verify | Responsive, Editor, accessibility, browser, scoped performance | Không có regression thuộc phạm vi task |
| Deploy | Commit nhỏ, rebase an toàn, readback/deploy đúng target | Remote chứa đúng source state |
| Learn | Root cause, rule tái sử dụng, ngoại lệ và evidence | Bài học đủ cụ thể để dùng ở project sau |

## 1. Capture — khóa phạm vi và source of truth

Trước khi sửa:

1. Đọc `AGENTS.md`, `.codex/shopify-theme-profile.json` và workflow của project.
2. Xác định task là build, fix, review, audit hay store operation.
3. Kiểm tra `git status`, branch, remote divergence và file chưa commit.
4. Xác định deployment path:
   - Git integration;
   - Shopify CLI;
   - local-only.
5. Xác định theme/store tham chiếu và theme/store được phép ghi.
6. Tạo checkpoint trước khi pivot thiết kế hoặc thay base.
7. Không dùng Theme Editor URL thay cho source code local.
8. Không ghi vào theme tham chiếu hoặc Figma tham chiếu khi task chỉ yêu cầu đọc.

### Quy tắc Git/Shopify

- Không force-push.
- Không ghi đè thay đổi từ Shopify Git integration hoặc đồng nghiệp.
- Fetch/rebase trước push khi `main` thay đổi.
- Chỉ stage file thuộc task hiện tại.
- Không đưa secret, storefront password hoặc Theme Access token vào Git/log.
- Nếu Shopify trực tiếp tạo commit mới, tích hợp commit đó trước khi push tiếp.
- Một commit nên tương ứng một thay đổi hoàn chỉnh và có thể giải thích độc lập.

## 2. Normalize — dựng nền tảng trước section

### Design system trước composition

Trích xuất và chuẩn hóa:

- font family, weight thực sự cần dùng và font-display;
- responsive type scale;
- color schemes và commerce colors;
- spacing scale, page width, section spacing;
- radius cho media, card, button, badge, swatch và form;
- button, form, media và accessibility primitives;
- breakpoint và behavior, không chỉ kích thước frame.

Theme Settings chỉ expose lựa chọn merchant có ý nghĩa. Token kỹ thuật chi tiết có
thể được ghi trong docs/CSS variables thay vì biến Theme Editor thành bảng điều
khiển quá dài.

Mọi global setting phải có đường binding đầy đủ:

```text
settings_schema → settings_data/default → Liquid/CSS variable/class → UI thực tế
```

Không giữ setting chỉ hiện trong Editor nhưng không có tác dụng. Không hard-code
màu/font/radius làm vô hiệu color scheme hoặc typography setting.

### CSS ownership

Đưa vào `assets/base.css` khi là:

- reset, token hoặc accessibility helper;
- primitive trung lập có ít nhất hai consumer độc lập;
- button, form, page width, media, typography hoặc layout utility dùng chung.

Giữ trong section stylesheet khi là:

- grid/composition riêng;
- overlay, animation, responsive state riêng;
- selector phụ thuộc section setting hoặc block structure;
- abstraction mới chỉ là giả định.

Không duplicate cùng contract ở `base.css` và section. Khi sửa primitive dùng
chung, kiểm tra regression mọi consumer hiện có.

### Fast foundation cho theme/preset mới

Trước khi build homepage:

- khởi tạo Skeleton hoặc base đủ điều kiện;
- tạo profile target/branch/deployment;
- áp design tokens vào schema, data và CSS variables;
- hoàn thiện `base.css` primitives;
- chuẩn hóa placeholder library;
- có helper responsive image, section stylesheet và conditional module loading;
- có product card, icon, button và empty-state contract;
- xác định cách Git/Shopify đồng bộ.

Làm foundation một lần giúp các section sau chỉ ghép composition, không khai báo
lại font, button, media và spacing.

## 3. Architect — section, block và Theme Editor

### Block-first contract

- Section settings chỉ giữ presentation/behavior dùng chung.
- Block giữ nội dung merchant quản lý độc lập.
- Snippet giữ render logic dùng lại nhưng không cần xuất hiện trong Editor.
- Template JSON giữ composition/preset của page.

Trước khi code một section, ghi inventory:

- DOM và reading order;
- section settings;
- block types và block settings;
- block add/remove/reorder/duplicate;
- desktop/tablet/mobile;
- hover, focus, keyboard, reduced motion;
- empty, loading, missing-resource và Editor states;
- dynamic Shopify sources;
- asset ownership;
- CTA behavior.

### Quy tắc merchant UX

- Dùng resource picker thay cho hard-code product, collection, menu và article.
- Blank link phải ẩn CTA; không render “button giả” không điều hướng.
- Social URL trống phải ẩn icon.
- Tách semantic heading tag khỏi visual heading size.
- Text block tối thiểu có content và text size nếu thiết kế cần merchant chỉnh.
- Logo image thuộc Theme Settings Brand; Header chỉ giữ text fallback/size nếu có.
- Không lặp cùng một global setting ở nhiều section.
- Dùng layout variant trong cùng section khi cấu trúc dữ liệu giống nhau; không tạo
  section type trùng chỉ vì composition khác.
- Block label/internal label phải giúp merchant nhận biết path/item khi số block lớn.

### Reuse trước khi tạo mới

Ưu tiên:

1. CSS token/primitive hiện có.
2. Snippet hiện có.
3. Section hiện có với layout variant.
4. Mở rộng schema tương thích ngược.
5. Chỉ tạo abstraction mới khi consumer thứ hai đã rõ.

## 4. Build — implementation an toàn

### Liquid/schema

- Giữ schema trong giới hạn Shopify, đặc biệt range steps và block limits.
- Upload section/schema trước template JSON khi store chưa biết section type mới.
- Dùng locale cho text hệ thống; content demo thuộc template/settings.
- Giữ alt, width, height, aspect ratio và focal point.
- Decorative media dùng `alt=""`; content media dùng alt Shopify hoặc fallback có
  nghĩa.
- Empty state phải có branded placeholder phù hợp với loại nội dung.

### JavaScript component

Mọi component có JS phải:

- idempotent;
- hỗ trợ nhiều instance;
- cleanup listener, observer, timer;
- phản ứng với section load/unload và block select trong Theme Editor;
- tạm dừng animation/timer khi offscreen hoặc tab hidden;
- tôn trọng reduced motion;
- không phụ thuộc timing ngẫu nhiên giữa CSS và DOM.

### Responsive

Kiểm tra:

- 320–375px;
- tablet;
- desktop chuẩn;
- desktop rộng và zoom-out;
- content dài, menu dài và localization dài;
- iOS Safari thật khi component dùng dialog, sticky, scroll hoặc transform.

Không coi browser zoom là breakpoint. Tránh grid/intrinsic row hoặc absolute layer
có thể đẩy overlay ra ngoài khi viewport rộng/zoom thay đổi.

## 5. Populate — ảnh, Files và commerce data

### Hai-pass media workflow

Pass 1 — build:

- tạo image picker, focal point, ratio, responsive markup và placeholder;
- chưa mất thời gian chọn/tạo ảnh khi section structure còn thay đổi.

Pass 2 — populate:

- lấy đúng bitmap/image fill, không export cả frame/container có text và button;
- upload ảnh dùng cho content vào Shopify **Content → Files**;
- lưu manifest:

```text
Figma node/fill → local source → Shopify File GID/CDN → section/block/resource
```

- gắn CDN/File vào section, product hoặc collection;
- kiểm tra crop desktop/tablet/mobile;
- tránh upload trùng.

Không nhúng screenshot có text/button vào section nếu copy vẫn phải editable.

### Placeholder contract

- Dùng theme asset nhẹ, không dùng inline SVG quá lớn làm phình HTML/DOM.
- Dùng placeholder đúng ngữ cảnh: product, editorial, video, hero, collection.
- Xen kẽ product placeholder ổn định để grid tự nhiên hơn.
- Không tự thêm placeholder vào vùng thiết kế vốn chủ ý để trống.
- Placeholder của LCP đầu tiên phải nhận cùng loading priority contract như ảnh thật.

### Product/collection data

- Inventory dữ liệu hiện có trước khi tạo mới.
- Tránh product/collection trùng.
- Collection image có thể fallback về ảnh sản phẩm đầu tiên, sau đó mới placeholder.
- Curated flow phải chọn sản phẩm cụ thể; collection chỉ là fallback/CTA khi thứ tự
  collection không đảm bảo trải nghiệm.
- Không hard-code fake count, urgency hoặc countdown hết hạn.

## 6. Verify — QA theo rủi ro, không theo thói quen

### Ma trận tối thiểu cho một section

| Mặt kiểm tra | Trạng thái |
|---|---|
| Storefront desktop | layout, hover, keyboard |
| Storefront mobile | touch, stack/rail, overflow |
| Theme Editor | setting, add/remove/reorder, block select |
| Empty data | placeholder và hidden CTA |
| Real data | product/collection/article/media |
| Accessibility | semantic, alt, focus, reduced motion |
| Browser risk | iOS Safari nếu có dialog/sticky/slider |

Chỉ chạy validator/audit phù hợp với phạm vi task. Full-theme Theme Check,
Lighthouse matrix hoặc submission audit chỉ chạy khi được yêu cầu.

### Theme submission loop

1. Submission blockers:
   - missing asset;
   - Skeleton/demo leftovers;
   - missing H1/alt;
   - broken empty states;
   - Custom Liquid và metadata/docs bắt buộc.
2. Delivery:
   - conditional JS;
   - section-scoped Swiper;
   - deduped CSS;
   - remove debug/orphaned code.
3. LCP/CLS/image:
   - correct LCP priority;
   - stable critical/final CSS;
   - responsive images;
   - no mobile hover transfers.
4. Accessibility/SEO/release hygiene.
5. Benchmark Home/Collection/Product, desktop/mobile, trên storefront thật.

## 7. Performance playbook

### Đo đúng trước khi sửa

- Xác nhận URL cuối không phải password page hoặc Theme Editor iframe.
- Dùng authenticated storefront session và cold-cache khi cần benchmark.
- Tắt extension hoặc dùng Guest/Incognito.
- Đọc JSON/trace, không kết luận từ một screenshot hoặc một run.
- Phân biệt theme-owned request với Shopify platform request.

`/cdn/wpm`, Shop JS, cart sync và telemetry thường do Shopify chèn qua
`content_for_header`. Không xóa/lọc chúng để làm đẹp điểm nếu không có cấu hình
store hợp lệ. Những request này có thể unscored.

### LCP

1. Xác định element LCP thật của từng page.
2. Chỉ một media LCP nhận:
   - discoverable trong initial HTML;
   - `loading="eager"`;
   - `fetchpriority="high"`;
   - decode strategy phù hợp khi trace chứng minh render delay.
3. Các ảnh còn lại lazy/auto hoặc low.
4. Giữ CSS của section chứa LCP trong critical path.
5. Không preload nếu tạo request duplicate hoặc priority thấp hơn ảnh gốc.
6. LCP có thể là text; khi đó kiểm tra font và stylesheet của section, không tối ưu
   nhầm ảnh.

### CLS

- Critical CSS phải khớp final CSS ở mọi breakpoint.
- Không render content đầy đủ rồi mới clamp bằng JS.
- Giữ width/height/aspect-ratio cho media.
- Không dùng `content-visibility` với intrinsic size sai.
- Nếu Lighthouse gán shift cho wrapper lớn, truy phần tử con thay đổi chiều cao.
- Font face tải muộn có thể gây shift; chỉ ship weight/subset cần thiết.

### CSS

- Critical CSS chỉ giữ header và first viewport thực sự cần.
- CSS dưới fold có thể defer, nhưng không defer section chứa LCP.
- Dedupe cùng section stylesheet khi có nhiều instance.
- Không tải Swiper CSS toàn site.
- Đừng biến một file nhỏ thành nhiều blocking request.
- Inline CSS có chọn lọc; HTML đầu quá lớn cũng làm chậm paint.

### JavaScript

- Load product-card/cart feedback/product-page khi DOM hoặc interaction cần.
- Tách quick view, lightbox và slider khỏi critical bundle khi có thể.
- Secondary hover image không có `src/srcset` trong initial HTML; gắn URL khi
  `hover: hover`/focus thực sự xảy ra.
- Slider above fold không chờ `window.load`.
- Khi dùng Swiper, hiển thị/định kích thước slide trước khi instance đo layout.

### Fonts

- Chỉ ship family/weight/charset cần dùng.
- Ưu tiên Latin subset khi phù hợp.
- Không preload font không nằm trong first viewport.
- Có thể dùng synthetic bold từ 400 khi chất lượng chấp nhận được và weight 700
  không đáng chi phí.
- Đừng bỏ preload hoặc đổi font chỉ dựa vào waterfall; xác nhận element FCP/LCP.

### Regression rule

Mọi tối ưu performance phải giữ hoặc cải thiện:

- FCP/LCP;
- CLS;
- slideshow/carousel;
- Theme Editor;
- iOS Safari;
- UI first paint.

Nếu một tối ưu cải thiện LCP nhưng tăng CLS hoặc làm hỏng interaction, giữ phần có
lợi và hoàn tác đúng nguyên nhân regression; không chồng thêm workaround.

## 8. Interaction pattern library

### Slideshow

- Slide đầu render ổn định trước JS.
- Swiper không được đo khi các slide còn `display: none`.
- Storefront không trì hoãn hydrate đến `window.load`.
- Editor vẫn init/re-init khi section hoặc block thay đổi.
- Progress bắt đầu từ slide đầu; hover pause/resume không reset.
- Comparison/wipe dùng transform/parallax của media, không đẩy cả image layer sai
  hướng.
- Cho phép tắt image zoom khi thiết kế cần.

### Marquee/scrolling text

- Duplicate item theo kích thước thực cho tới khi mỗi group phủ đủ viewport.
- Remeasure sau font load, resize và zoom.
- Không giả định số item cố định đủ cho mọi độ rộng.

### Shop the look

- Hotspot và active product phải đồng bộ.
- Mobile cần active preview/dock hoặc rail rõ ràng; không phụ thuộc hover.
- Arrows, dots, keyboard và Editor block selection cùng điều khiển một active state.

### Offer flyout

- Dùng non-modal panel; không backdrop hoặc scroll lock nếu UX không yêu cầu.
- Open tab và dismiss button là hai control riêng, không nested button.
- Không dùng native dialog nếu iOS gây auto-scroll.
- Homepage-only setting không được `design_mode` vô tình override.
- Không che mobile menu.

### Guided selling / Gift Atelier

- Nếu hỏi ba câu, cả ba câu phải ảnh hưởng kết quả hoặc flow phải được rút gọn.
- Path key phải dùng đủ các answer dimensions.
- Có fallback rõ ràng cho tổ hợp chưa curate.
- Chọn 3–6 sản phẩm cụ thể cho mỗi path; collection chỉ là fallback và CTA.
- Copy kết quả phải phù hợp tổ hợp, không chỉ hiển thị answer chips.
- Đưa CTA chính trước grid khi result header dài.
- Editor cần internal path label để merchant quản lý nhiều mapping.
- Dùng color-scheme tokens thay vì nền/border hard-code.

### Header và anchor navigation

- Menu dài phải wrap mà không đè logo giữa.
- Anchor scroll phải bù sticky header, đóng drawer/menu và tôn trọng reduced motion.
- Arrival cue nhẹ có thể dùng nhưng không được làm layout shift.

### iOS Safari controls

- Reset native appearance, tap highlight và shadow khi custom control.
- Dùng `:focus-visible`; tránh double border/outline.
- Reuse close-button primitive cho search, filter, quick view, popup và flyout.

## 9. Failure patterns — không lặp lại

- Export cả Figma container nên ảnh chứa luôn text/button.
- Đưa mọi CSS vào `base.css` hoặc ngược lại giữ mọi primitive trong section.
- Defer CSS của section chứa LCP.
- Trì hoãn slideshow tới `window.load`.
- Preload resource nhưng browser nhận priority thấp hoặc tạo tải trùng.
- Dùng critical CSS khác final CSS ở mobile.
- Tối ưu từ report password page, Theme Editor iframe hoặc browser có extension.
- Đổ lỗi theme cho Shopify WPM/telemetry.
- Dùng placeholder sai loại hoặc inline SVG quá lớn.
- Tạo product/collection mới trước khi kiểm tra dữ liệu hiện có.
- Giữ ba câu hỏi guided selling nhưng kết quả chỉ phụ thuộc một câu.
- Retrying Shopify push mù sau partial mutation; phải readback trạng thái trước.
- Đổi schema/template cùng một push khi remote chưa index section type mới.
- Chạy full audit cho một fix nhỏ khi không được yêu cầu.

## 10. Definition of done

Một theme/preset milestone chỉ hoàn tất khi:

- source of truth và target rõ;
- design tokens/settings có binding thật;
- section/block ownership rõ;
- empty và real-data states đều hoạt động;
- desktop/tablet/mobile không overflow;
- Theme Editor add/remove/reorder/select hoạt động;
- accessibility semantics và reduced motion phù hợp;
- media/data không hard-code sai contract;
- performance priority đúng với LCP thực tế;
- không tạo regression iOS/slider/first paint;
- commit chỉ chứa scope task;
- deployment/readback đúng phương thức project;
- dependency content còn thiếu được báo rõ.

## 11. Learning record template

Chỉ thêm record khi bài học có thể tái sử dụng:

```md
### YYYY-MM-DD — Tên bài học

- Context:
- Symptom:
- Root cause:
- Evidence:
- Fix retained:
- Regression/failed attempt:
- Reusable rule:
- Applies when:
- Does not apply when:
```

### Tiêu chuẩn nhận một bài học

Bài học phải trả lời được:

1. Vấn đề nào đã quan sát được?
2. Root cause nằm ở đâu?
3. Thay đổi nào thực sự được giữ lại?
4. Có regression hoặc ngoại lệ nào?
5. Project sau nhận biết lúc nào nên áp dụng?

Không ghi “best practice” chỉ vì nghe hợp lý. Nếu chưa có evidence, ghi thành giả
thuyết cần kiểm chứng, không đưa vào quy tắc mặc định.

### 2026-07-25 — Upload local video vào Shopify Files phải giữ đúng staged-upload contract

- Context: Noryvelle cần một MP4 local làm editorial video trong `video-banner`.
- Symptom: image-upload helper từ chối MP4; lần `fileCreate` đầu báo filename không
  khớp original source, lần tiếp theo báo duplicate mode không hỗ trợ media type Video.
- Root cause: video local không đi qua image-upload flow; staged resource URL không có
  extension và `RAISE_ERROR` không phải duplicate mode hợp lệ cho Video.
- Evidence: `stagedUploadsCreate` và multipart upload thành công; `fileCreate` chỉ thành
  công sau khi bỏ `filename` và `duplicateResolutionMode`; readback Video
  `gid://shopify/Video/41453168623839` chuyển sang `READY` với MP4 480p, MP4 720p và
  HLS.
- Fix retained: tạo staged target với đúng `fileSize`, upload multipart theo parameters
  Shopify trả về, gọi `fileCreate` bằng staged `resourceUrl` và `contentType: VIDEO`,
  rồi poll `fileStatus` trước khi bind `shopify://files/videos/<filename>`.
- Regression/failed attempt: không ép filename khi staged URL không mang extension;
  không dùng image helper hoặc duplicate mode dành cho Image.
- Reusable rule: chỉ ghi video vào template sau khi Files readback trả `READY` và
  filename ổn định.
- Applies when: upload video local vào Shopify Files để dùng trong theme setting loại
  `video`.
- Does not apply when: ảnh dùng image-upload flow hoặc video đã có public source được
  Shopify chấp nhận trực tiếp.

### 2026-07-25 — Product picker trong preset phải đối chiếu handle sau khi tạo catalog

- Context: Carry Edit và Shop The Look được compose trước khi 12 product Noryvelle được
  tạo trên demo store.
- Symptom: template còn các handle thiết kế tạm như `vale-13-work-tote` và
  `compact-zip-wallet`, trong khi catalog thật dùng `aster-work-tote`,
  `vale-east-west-tote`, `halo-card-wallet` và các handle khác.
- Root cause: install-state được viết từ data contract dự kiến nhưng không có bước
  readback catalog trước khi đóng template.
- Evidence: product readback trả đúng 12 live handle; targeted search phát hiện toàn bộ
  reference tạm trong tám Carry Edit paths, fallback và ba Shop The Look hotspots.
- Fix retained: lấy live handle list, map lại từng path theo occasion/silhouette/capacity,
  cập nhật đồng thời root template và `listings/noryvelle/templates/index.json`, rồi
  chạy targeted search để bảo đảm không còn handle tạm.
- Regression/failed attempt: JSON vẫn parse dù product picker trỏ handle không tồn tại,
  nên syntax validation không phát hiện lỗi và storefront có thể render card rỗng.
- Reusable rule: mọi preset dùng product/collection picker phải so sánh template handle
  với readback store ngay trước commit/install-state snapshot.
- Applies when: guided selling, Shop The Look, featured product hoặc bất kỳ setting nào
  lưu resource handle.
- Does not apply when: setting cố ý để trống để merchant chọn sau, và empty state đã
  được chấp nhận rõ trong scope.

### 2026-07-25 — Logo fallback dùng chung không được hard-code asset của một preset

- Context: Header dùng chung cho Omniselle và Noryvelle; Noryvelle để Theme Settings
  logo trống và dùng text `Noryvelle` trong logo block.
- Symptom: storefront hiện biểu tượng ảnh hỏng, trong khi Theme Editor vẫn báo
  `Logo – Noryvelle`; tám top-level link còn làm navigation xuống hai dòng.
- Root cause: nhánh fallback của `header.liquid` gọi hai asset
  `omniselle-wordmark-*.png` không tồn tại và khiến text block không bao giờ được
  render; ba mega-menu block match `Shop` trong khi menu thật dùng `Bags`; hai
  top-level link trùng nội dung child menu cộng với gap 24px/logo width 170px vượt
  phần grid dành cho navigation.
- Evidence: targeted asset search không tìm thấy hai PNG; storefront screenshot hiện
  broken image và menu wrap; sau patch, storefront render wordmark text, sáu link
  nằm một hàng và mega menu hiện đủ năm child link/hai promo; Theme Editor vẫn nhận
  đúng logo/mega-menu blocks.
- Fix retained: `settings.logo` vẫn có ưu tiên cao nhất; khi blank, render
  `logo_block.settings.text | default: shop.name`; bỏ top-level trùng, bind mega menu
  theo đúng live title, dùng responsive menu gap và giảm wordmark container riêng của
  preset khi viewport thực tế chứng minh cần thiết.
- Regression/failed attempt: chỉ bỏ hai link trùng và chỉ giảm gap vẫn chưa đủ ở
  viewport smoke-test; ép `nowrap` có thể làm navigation chồng lên logo.
- Reusable rule: shared section fallback phải trung lập theo preset; mọi block được
  lookup bằng title phải được đối chiếu live menu readback.
- Applies when: một codebase có nhiều preset hoặc merchant chưa upload Brand logo.
- Does not apply when: `settings.logo` đã có image hợp lệ; image picker vẫn là source
  of truth.

### 2026-07-25 — Git-connected demo theme không dùng `/listings` làm runtime source

- Context: cùng commit chứa root template Noryvelle và install-state
  `listings/noryvelle` cho submission package.
- Symptom: GitHub integration log báo
  `listings/noryvelle/templates/blog.json was ignored` dù root
  `templates/blog.json` được cập nhật thành công.
- Root cause: Shopify runtime chỉ nhận các theme directory chuẩn ở root; `/listings`
  là artifact cho multi-preset submission, không phải directory mà connected theme
  tải vào storefront.
- Evidence: sync log mới nhất trả `1 succeeded, 1 warning, 0 failed`; root Journal
  intro đổi trên storefront, còn warning chỉ nhắm bản mirror trong `/listings`.
- Fix retained: root templates là source cho demo store; sau mỗi thay đổi preset, cập
  nhật mirror `/listings`, kiểm tra equality cục bộ và chấp nhận warning ignored nếu
  không có file failed.
- Regression/failed attempt: chỉ sửa `/listings` sẽ không đổi demo storefront; chỉ sửa
  root sẽ làm install-state trong ZIP bị stale.
- Reusable rule: với Git integration + multi-preset package, luôn duy trì hai contract:
  runtime root và submission mirror, rồi xác minh từng contract bằng đúng công cụ.
- Applies when: theme có `/listings/<preset>` và demo store nối trực tiếp GitHub.
- Does not apply when: package/install pipeline riêng chủ động copy listing state vào
  root trước deploy.

### 2026-07-25 — Guided selling nhiều chiều cần wildcard có trọng số, không chỉ nearest match

- Context: Carry Edit có 4 chiều, tương ứng 400 tổ hợp, nhưng install-state ban đầu
  chỉ có 8 path fully specific.
- Symptom: 392 tổ hợp phải nhận “closest curated edit”; một route có thể thắng dù
  sai capacity hoặc silhouette quan trọng, và kết quả phụ thuộc cách sort candidate.
- Root cause: route model chỉ phân biệt exact và closest; mọi chiều có điểm bằng nhau,
  không có wildcard merchant-managed và tie-break không được định nghĩa rõ.
- Evidence: enumeration baseline có 8 exact/392 closest; sau khi thêm 5 wildcard theo
  silhouette, 3 wildcard theo capacity và weighted routing, 400/400 tổ hợp có
  compatible result, 8 exact route vẫn thắng đúng tổ hợp và cả 16 route đều reachable.
- Fix retained: ưu tiên exact/wildcard-compatible trước nearest; trọng số mặc định
  capacity 6, silhouette 5, occasion 4, finish 2; tie-break bằng specificity, explicit
  priority và DOM block order ổn định.
- Regression/failed attempt: chỉ thêm wildcard nhưng không gắn product/collection sẽ
  tạo result rỗng; đổi trọng số có thể làm route capacity hoặc silhouette thắng theo
  cách khác nên phải enumeration lại toàn bộ finite answer space.
- Reusable rule: với guided selling hữu hạn, enumerate mọi tổ hợp và chứng minh từng
  route reachable; dùng wildcard có chủ đích cho chiều chưa curate thay vì gọi mọi
  mismatch là “closest”.
- Applies when: quiz/finder có nhiều answer dimension và merchant quản lý curated path
  bằng section blocks.
- Does not apply when: logic filter trực tiếp toàn catalog hoặc ma trận nhỏ đã có exact
  mapping cho mọi tổ hợp.

### 2026-07-25 — Recommendation section cần tách progressive enhancement và fallback có dữ liệu

- Context: PDP Noryvelle dùng hai shelf “Style it with”; cả hai cùng gọi complementary
  recommendations trong khi 12 product chưa có mapping.
- Symptom: hai shelf có thể cùng rỗng; collection fallback được cấu hình nhưng không
  được dùng sau khi recommendations API trả kết quả rỗng.
- Root cause: source intent bị trùng và Liquid chỉ xử lý trạng thái pending/performed,
  không chuyển sang collection đã chọn khi `products_count == 0`.
- Evidence: Admin readback ban đầu trả complementary metafield `null` cho 12/12
  product; sau khi populate standard `list.product_reference`, readback trả 2–3 target
  trên 12/12. Liquid scoped validation đạt sau khi thêm collection fallback; bottom PDP
  shelf dùng collection sáu sản phẩm và loại current product.
- Fix retained: inline PDP shelf dùng complementary products như progressive
  enhancement; shelf dưới dùng curated collection; component chỉ fallback sang
  collection khi recommendation đã performed nhưng rỗng.
- Regression/failed attempt: collection chỉ có current product vẫn tạo section không
  có card sau bước exclude; fallback collection phải có ít nhất một product khác.
- Reusable rule: recommendation UI phải có data owner rõ, source riêng cho từng shelf
  và fallback được kiểm tra sau khi loại current/unavailable product.
- Applies when: product recommendation endpoint, Search & Discovery complementary
  products hoặc curated product shelf.
- Does not apply when: section cố ý biến mất hoàn toàn nếu không có recommendation.
