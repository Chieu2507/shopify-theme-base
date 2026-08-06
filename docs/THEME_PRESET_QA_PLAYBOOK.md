# Cẩm nang QA cho Shopify Theme & Preset

Phiên bản: 1.0  
Cập nhật: 2026-07-29  
Áp dụng cho: Shopify Online Store 2.0 theme và preset

## 1. Mục đích

Cẩm nang này ngăn các regression nhìn có vẻ đúng trên Git nhưng hỏng trên storefront. Dùng để:

- audit theme hoặc preset hiện có;
- review theme hoặc preset mới;
- sửa lỗi mà không làm thay đổi layout hoặc performance tải trang không liên quan;
- tạo release gate có thể lặp lại.

Không được coi việc “code có trong file” là bằng chứng runtime. Dynamic checkout, selling plan, discount code, theme block và preset setting phải có bằng chứng đúng như quy định bên dưới.

## 2. Cách yêu cầu check trong tương lai

Dùng prompt sau:

```text
Đọc toàn bộ THEME_PRESET_QA_PLAYBOOK.md và CHECK theme/preset này theo mọi check ID áp dụng.
Dùng CHECK mode. Giữ nguyên layout và performance hiện tại. Không chạy Lighthouse hoặc Theme Check nếu tôi không yêu cầu rõ.
Trả về PASS, FAIL, NOT VERIFIED, N/A hoặc EXCLUDED cho từng check, kèm bằng chứng file/line và storefront khi check yêu cầu.
Không sửa file, upload theme, commit, push hoặc thay đổi store.
```

Để cho phép test có thay đổi tạm thời trong buyer session, thêm đoạn này:

```text
Bạn được dùng một browser session preview mới, tách biệt để thêm test item, áp test discount code và kiểm tra checkout state.
Không dùng cart hiện có của tôi, không thanh toán, không tạo order, không liên hệ customer, không sửa Admin/catalog/discount configuration.
```

Dùng prompt sau khi đã cho phép sửa:

```text
Đọc toàn bộ THEME_PRESET_QA_PLAYBOOK.md và FIX mọi FAIL trong audit được cung cấp.
Dùng FIX mode. Giữ nguyên layout và performance tải trang. Không chạy Lighthouse hoặc Theme Check nếu tôi không yêu cầu rõ.
Retest mọi check ID đã thay đổi. Không upload, publish, commit, push hoặc thay đổi live-store state nếu tôi không yêu cầu rõ.
```

Khi chỉ cần một phần, nêu rõ ID, ví dụ: `CHECK DYN-01, SUB-01 đến SUB-04, DIS-01 đến DIS-04`.

## 3. Quy ước vận hành

### CHECK mode

CHECK là read-only đối với source và persistent store state.

- Được inspect file, DOM render, network response và preview khi có quyền truy cập.
- Không sửa file.
- Không upload hoặc publish theme.
- Không commit, push, merge hoặc sửa store data.
- Không thay đổi Admin, catalog, discount, customer data hoặc cart hiện có của người dùng.
- Add-to-cart, discount và checkout-flow test chỉ được thực hiện khi người dùng cho phép rõ một preview session disposable, tách biệt.
- Dừng trước payment, order creation, customer communication hoặc bất kỳ Admin mutation lâu dài nào.
- Nếu không có hoặc không được phép dùng isolated runtime session, đánh dấu runtime check liên quan là `NOT VERIFIED`.
- Báo bằng chứng và remediation an toàn cho từng lỗi.

### FIX mode

FIX chỉ cho phép sửa các failure nằm trong phạm vi được yêu cầu.

- Giữ nguyên hành vi, markup contract, layout, setting và style không liên quan.
- Không thêm request lúc page load khi JSON đã serialize sẵn đủ dữ liệu.
- Retest từng check đã sửa.
- Không upload, publish, commit, push hoặc merge nếu không được yêu cầu riêng.

### Tool profile mặc định

- Không chạy Lighthouse mặc định.
- Không chạy Theme Check mặc định.
- Được dùng parser cú pháp có mục tiêu, JSON validation, `node --check`, focused behavior test và `git diff --check`.
- Upload Shopify preview là external mutation và phải có quyền rõ ràng.

## 4. Định nghĩa verdict và severity

Mỗi check phải có đúng một verdict.

| Verdict | Ý nghĩa |
| --- | --- |
| `PASS` | Hành vi mong đợi đã được xác minh bằng bằng chứng bắt buộc của check đó. |
| `FAIL` | Có defect cụ thể đã được reproduce hoặc chứng minh từ implementation. |
| `NOT VERIFIED` | Thiếu environment, fixture, wallet eligibility, store access hoặc preview cần thiết. Đây không phải pass. |
| `N/A` | Tính năng thực sự không thể áp dụng theo requirement của target. Phải nêu lý do. Thiếu feature bắt buộc không phải N/A. |
| `EXCLUDED` | Người dùng hoặc merchant chủ động miễn kiểm tra surface/check này. Phải ghi ai chấp nhận risk và lý do. Đây không phải pass. Một feature có chủ đích và đạt requirement là `PASS`, không phải `EXCLUDED`. |

Dùng severity sau:

| Severity | Ý nghĩa |
| --- | --- |
| `Critical` | Checkout, payment, cart integrity hoặc purchase completion bị hỏng. |
| `High` | Khách có thể thấy sai giá, đi vào purchase path không hợp lệ, gặp cart 4xx hoặc lỗi accessibility lớn. |
| `Medium` | Feature hoạt động thiếu, báo thành công giả, hỏng locale hoặc tạo responsive regression đáng kể. |
| `Low` | Lỗi visual, copy, maintainability hoặc edge case nhỏ. |

“Code tồn tại”, “file validate được” và “trông đúng trên Git” không phải storefront evidence.

## 5. Định dạng report bắt buộc

Ghi target theme, branch/commit, preset, store/preview URL, ngày, người test và các exclusion được chấp nhận.

Mọi check ID trong cẩm nang phải xuất hiện trong report. Check có nhiều surface phải có một dòng cho mỗi surface, ví dụ `ROT-01:announcement` và `ROT-01:slideshow`.

| ID | Verdict | Severity | Surface | Evidence | Mong đợi và thực tế | Safe remediation | Retest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SUB-01` | `FAIL` | `High` | Product page | File/line, DOM, request hoặc screenshot | Repro ngắn gọn | Sửa đúng phạm vi | Pending |

Với runtime failure, evidence phải có:

1. fixture và trạng thái ban đầu;
2. thao tác của khách;
3. hành vi mong đợi;
4. hành vi thực tế;
5. DOM, request/response, console, screenshot hoặc recording liên quan;
6. file và line liên quan.

Quy tắc tổng hợp matrix:

- bất kỳ cell bắt buộc nào reproduce được lỗi thì matrix là `FAIL`;
- cell bắt buộc không chạy được thì matrix là `NOT VERIFIED`, trừ khi cell khác đã chứng minh `FAIL`;
- matrix chỉ `PASS` khi mọi cell bắt buộc pass;
- `N/A` và `EXCLUDED` phải gán theo cell hoặc surface, kèm lý do;
- agent không được tự chấp nhận release risk của `NOT VERIFIED` hoặc `EXCLUDED`.

## 6. Guardrail cho mọi release

### EVID-01 — Source được inspect phải trùng storefront artifact

Severity: `Critical`

Pass criteria:

- Source revision đang inspect được ghi lại, bao gồm cả trạng thái dirty worktree.
- Source chưa commit có diff hoặc artifact fingerprint tái lập được.
- Storefront evidence có preview theme ID, deployment/upload identity và URL.
- Tester chứng minh preview artifact được build từ đúng source đã inspect.

Không được ghép file evidence của một revision với storefront evidence của theme khác hoặc live deployment cũ. Nếu không bind được identity, static check vẫn có thể có verdict, nhưng runtime check là `NOT VERIFIED`.

### LAYOUT-01 — Layout parity

Severity: `High`

Pass criteria:

- Product không có selling plan giữ nguyên buy-button grid và spacing hiện tại.
- Wrapper mới giữ row, column, width và stacking behavior của grid cũ.
- Element có `[hidden]` thực sự không chiếm layout.
- Control overlay bằng absolute positioning có không gian message được reserve đủ.
- So sánh desktop và mobile, long label, long currency string, sold-out state, sticky control và quick view.
- Không claim layout parity nếu chưa so sánh render thực tế.
- So sánh responsive bắt buộc không có shift, overlap, clipping hoặc stacking regression không liên quan.
- Row riêng cho feature chỉ xuất hiện khi feature đó áp dụng.

### PERF-01 — Performance tải trang

Severity: `High`

Pass criteria:

- Không fetch selling-plan data khi page load nếu variant JSON đã có allocation.
- Discount API chỉ chạy sau khi khách submit code.
- Không có duplicate listener sau section reload, quick-view opening hoặc custom-element reconnection.
- Không tạo full DOM rebuild lặp lại, forced synchronous layout loop hoặc duplicate font request.
- Ưu tiên một serialized data source hiện có và một request path do người dùng kích hoạt.
- Network inspection không có request reconcile hoặc discount mới ở page load.
- Changed path không thêm duplicate script/font request.

Lighthouse là optional, không bắt buộc trong cẩm nang này.

### Storefront truth

- Git inspection có thể chứng minh scope và static defect.
- Nó không thể chứng minh wallet button đã render, discount được chấp nhận hoặc subscription product vào cart đúng.
- Không mở được preview cần thiết thì dùng `NOT VERIFIED`.

## 7. Dynamic checkout

### DYN-00 — Có support theo requirement

Severity: `Critical`

Áp dụng khi product requirement, theme setting, preset documentation hoặc reference baseline hứa accelerated checkout.

Pass criteria:

- Product buy-button surface có dynamic-checkout setting và output đúng như đã hứa.
- Merchant-controlled visibility hoạt động đúng như document.
- Chỉ thiếu feature khi product requirement hoặc merchant decision rõ ràng đưa nó ra ngoài scope.

Thiếu dynamic checkout bắt buộc là `FAIL`, không phải `N/A`. Chỉ dùng `N/A` khi accelerated checkout được xác định rõ là ngoài target requirement.

### DYN-01 — Scope của product form

Severity: `Critical`

Áp dụng khi DYN-00 xác nhận dynamic checkout cần được support hoặc theme render `form | payment_button`.

Failure conditions:

- `payment_button` được evaluate ngoài lifecycle của Shopify product form.
- Theme block render qua `content_for 'blocks'` lại kỳ vọng inherit biến `form` từ parent.
- Snippet kỳ vọng `form` implicit nhưng không được truyền qua `render`.
- Filter nhận `nil`, source có code nhưng output không có accelerated-checkout container.

Pass criteria:

- Owning block mở product form, hoặc filter nằm trong snippet được gọi rõ với `form: form` từ product form đó.
- Variant và selling-plan input nằm trong cùng product form với dynamic checkout.
- Preview render Shopify accelerated-checkout DOM cho product đủ điều kiện.
- Storefront đủ điều kiện hiển thị wallet hoặc accelerated-checkout action phù hợp.

Required checks:

1. Tìm mọi product form.
2. Tìm mọi lệnh `payment_button`.
3. Trace Liquid scope qua `content_for`, theme block và `render`.
4. Xác nhận mọi snippet dependency được truyền explicit.
5. Inspect DOM đã render, không chỉ source Liquid.

Safe remediation:

- Chuyển product-form ownership về block sở hữu buy control.
- Truyền `form` explicit vào mọi snippet evaluate `payment_button`.
- Giữ wallet output trong cùng form với variant, quantity, properties và `selling_plan`.
- Giữ nguyên grid position và width của checkout wrapper cũ.

`payment_terms` render đúng ở nơi khác không chứng minh `payment_button` có form scope hợp lệ.

### DYN-02 — State và eligibility

Severity: `High`

Pass criteria:

- Dynamic checkout unavailable khi selected variant không thể mua.
- Subscription-only variant không được có one-time dynamic-checkout path.
- Đổi variant hoặc selling plan cập nhật dynamic-checkout state.
- Wallet ineligibility do browser, country, gateway hoặc Shopify configuration được phân biệt với Liquid scope failure.

Required fixtures:

- product one-time bình thường;
- product có selling plan optional;
- product subscription-only;
- sold-out variant;
- variant không có allocation hợp lệ.

### DYN-03 — Truyền đúng state vào checkout

Severity: `Critical`

Yêu cầu isolated runtime session đã được cho phép. Dừng trước payment hoặc order creation.

Pass criteria:

- Accelerated-checkout path mang đúng selected variant.
- Khi đã chọn selling plan, checkout nhận đúng `selling_plan` tương ứng.
- Checkout line và amount khớp allocation đã chọn cùng checkout charge của nó.
- Đổi variant hoặc plan trước khi launch không để checkout state cũ.

Wallet button hiện ra một mình chưa đủ để pass. Nếu không thể kiểm tra checkout line an toàn, dùng `NOT VERIFIED`.

## 8. Selling plan

### SUB-01 — Variant allocation và selection

Severity: `High`

Failure conditions:

- Picker render mọi plan của product mà không kiểm tra `selling_plan_allocations` của variant đang chọn.
- Đổi sang variant không support plan hiện chọn nhưng plan vẫn được giữ.
- `requires_selling_plan` vẫn cho phép one-time purchase.
- Subscription-only product submit `selling_plan` rỗng và nhận cart 4xx.

Pass criteria:

- Plan được filter theo allocation của selected variant.
- Plan không hợp lệ disabled và hidden.
- One-time purchase hidden và disabled khi selected variant bắt buộc có plan.
- Tự chọn allocation hợp lệ đầu tiên khi plan bắt buộc.
- Purchase control disabled nếu required plan không có valid allocation.
- Đổi variant reconcile current plan trước khi update purchase state và price.

### SUB-02 — Giá theo allocation

Severity: `High`

Pass criteria:

- Main price dùng `price` của selected allocation.
- Compare-at price, sale state, discount value và sale badge dùng cùng allocation.
- Unit price dùng unit price của allocation nếu có.
- Sticky add-to-cart hiển thị cùng giá và sale state.
- Product card subscription-only hiển thị allocation price hợp lệ.
- Giá hiển thị khớp cart và checkout.

Không chỉ update main price. Phải kiểm tra product page, sticky CTA, badge, card, quick view, cart line và checkout.

### SUB-03 — Add-to-cart payload và chặn bypass

Severity: `Critical`

Pass criteria:

- Selected plan được submit dưới tên `selling_plan` cùng selected variant.
- Required-plan product không thể submit nếu không có valid allocation.
- Required-plan variant luôn mở surface chọn plan hợp lệ trước khi add to cart.
- Optional-plan variant có thể direct-add one-time purchase chỉ khi policy này được xác định rõ và UI không ám chỉ đã chọn plan.
- Khi preset yêu cầu khách chọn giữa one-time và subscription, optional-plan quick add phải mở decision surface.
- Product card, quick view, sticky CTA và cart-drawer recommendation không được bypass picker cho required-plan hoặc decision-required product.
- Optional-plan one-time quick add có policy rõ không được xem là bypass.
- Selling-plan product cần quyết định phải mở quick view hoặc product URL, đồng thời giữ selected variant.

Phải kiểm tra mọi add path, không chỉ main product button.

### SUB-04 — URL, navigation và performance

Severity: `Medium`

Pass criteria:

- Variant và `selling_plan` hợp lệ phản ánh vào URL khi URL update được bật.
- Locale path, query parameter, tracking parameter và hash hiện có được giữ.
- Direct URL, back/forward navigation và swatch change restore valid state.
- Reconciliation dùng variant JSON hiện có và không thêm selling-plan request ở page load.

### SUB-05 — Selling-plan test matrix

Severity: `High`

Audit chưa hoàn thành nếu chưa test mọi cell áp dụng.

| Product fixture | Initial load | Đổi plan | Đổi variant | Add to cart | Sticky | Card/quick view | Cart/checkout |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Không có selling plan | Bắt buộc | N/A | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc |
| Plan optional | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc |
| Subscription-only | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc |
| Allocation khác nhau theo variant | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc |
| Sold out hoặc không có valid allocation | Bắt buộc | Nếu hiển thị | Bắt buộc | Phải chặn | Phải chặn | Không bypass | Không có invalid line |

Dùng quy tắc tổng hợp matrix tại Section 5 cho verdict SUB-05.

### SUB-06 — Cart presentation và checkout charge

Severity: `High`

Pass criteria:

- Cart page và cart drawer nhận diện selected plan bằng selling-plan allocation của line item.
- Tên selected selling plan vẫn hiển thị sau quantity change và drawer rerender.
- Allocation `price`, `per_delivery_price` và `checkout_charge_amount` không bị coi là cùng một giá trị.
- Khi preorder, try-before-you-buy, deposit hoặc deferred-payment plan được support và charge ít hơn allocation price tại checkout, cart page và drawer hiển thị amount due at checkout hoặc disclosure rõ tương đương về charge timing.
- Amount due at checkout hiển thị khớp `checkout_charge_amount`.
- Cart, dynamic checkout và checkout truyền cùng selected plan và charge timing.

Nếu theme chủ đích chỉ support subscription plan có full checkout charge, document product requirement đó. Không được im lặng đánh `PASS` cho deferred-charge scenario; chỉ dùng `N/A` khi chúng thực sự ngoài target requirement.

## 9. Cart và discount code

### DIS-01 — Endpoint được support và locale-aware

Severity: `High`

Failure conditions:

- Form gửi `POST /discount`.
- Ajax cart URL hard-code và hỏng storefront locale subpath.
- HTTP success một mình bị coi là bằng chứng code đã apply.

Pass criteria:

- Cart state được đọc từ locale-aware cart JSON route.
- Code được update qua locale-aware Ajax cart update route.
- Request gửi full code set mong muốn, không chỉ code mới nhất.
- Implementation kiểm tra returned discount state.

Shareable route `/discount/{CODE}` không thay thế được `POST /discount` form.

### DIS-02 — Giữ, validate và rollback code

Severity: `High`

Pass criteria:

- Code hiện có được đọc từ chính xác `discount_codes[].code` khi có.
- Code hiện có được giữ cả khi một code đang `applicable: false`.
- Display title của discount application chỉ là fallback khi exact code array không có hoặc rỗng.
- Không trộn display title vào exact-code array không rỗng.
- Code được deduplicate không phân biệt hoa thường.
- Code mới chỉ thành công khi response có matching code và code không bị đánh inapplicable.
- Code mới invalid rollback về exact previous code set.
- Rollback lỗi thì UI fetch actual cart state hoặc reload, không báo success giả.

Required scenarios:

- input rỗng;
- code hợp lệ;
- code invalid trả HTTP 200;
- code có sẵn hợp lệ cộng code mới hợp lệ;
- code có sẵn inapplicable cộng code mới invalid;
- rollback request fail;
- locale subpath.

### DIS-03 — Cart drawer trung thực và nhất quán

Severity: `High`

Pass criteria:

- Drawer lưu cart snapshot đã render gần nhất.
- Apply hợp lệ render returned snapshot, không refresh request không cần thiết.
- Apply invalid restore hoặc reconcile actual cart.
- Cart count, total, discount list, checkout total và cart event dùng cùng snapshot.
- Recommendation cần selling-plan selection dẫn tới decision surface thay vì direct add.
- Cart, change, add, update và recommendation URL đều locale-aware.

### DIS-04 — Form isolation và accessibility

Severity: `Medium`

Pass criteria:

- Cart-page discount input không vô tình tham gia Checkout hoặc Update cart submit.
- Discount input có `required` không được block checkout.
- Apply chỉ intercept submitter của chính nó.
- Enter và click cho cùng hành vi.
- Empty hoặc invalid submit đặt `aria-invalid="true"`.
- Sửa input hoặc apply valid code thì bỏ `aria-invalid` hoặc đặt thành `false`.
- Applying, success và error được announce qua live region.
- Loading status không tạo layout shift.
- Không có JavaScript thì control không POST tới endpoint invalid và không block cart action bình thường.

## 10. Nội dung tự xoay

### ROT-01 — Pause control nhìn thấy được

Severity: `High`

Áp dụng cho announcement bar, slideshow, carousel hoặc bất kỳ content nào tự động rotate. Không giới hạn ở video.

Tạo verdict riêng cho từng rotating surface. Announcement bar pass không làm slideshow fail hoặc excluded thành pass.

Failure conditions:

- Pause button có trong markup nhưng CSS ẩn vĩnh viễn.
- Control overlap message hoặc làm usable width của message bị collapse.
- User bật reduced motion vẫn nhận automatic rotation.

Pass criteria:

- Pause/play control hiện khi rotation hoạt động và có hơn một item.
- Control update label, pressed state và icon.
- Reduced-motion preference tắt automatic rotation.
- Hover, focus, visibility change và manual navigation có rotation state dự đoán được.
- Message padding reserve control space đối xứng.
- Mobile dot navigation dày fallback về layout không làm message width collapse.

Quyết định Jovie hiện tại: `ROT-01:announcement` nằm trong scope. `ROT-01:slideshow` được `EXCLUDED` rõ trong audit 2026-07. Exclusion này không phải pass chung cho theme/preset sau.

## 11. Accessibility và visual token

### A11Y-01 — Sold-out badge contrast

Severity: `High`

Pass criteria:

- Badge text kích thước bình thường có WCAG contrast tối thiểu `4.5:1`.
- Tính theo foreground/background token thực tế của active preset.
- Kiểm tra schema default, current setting và mọi preset được ship.

Cặp Jovie đang pass:

- background: `#ADADAD`;
- text: `#181818`;
- contrast: xấp xỉ `7.91:1`.

Không chỉ validate schema default khi preset có override.

### A11Y-02 — Hidden và live state

Severity: `Medium`

Pass criteria:

- CSS không override nhầm native `[hidden]` behavior.
- Purchase path disabled vừa không dùng được bằng mắt vừa không dùng được programmatically.
- Status message không bị giữ visible chỉ để thỏa live region.
- Focus vẫn sử dụng được sau validation error, drawer update và responsive change.

## 12. Preset parity và font

### PRESET-01 — Font parity

Severity: `Medium`

Pass criteria:

- `settings_schema` default khớp fresh-install typography đã định.
- `settings_data.current` khớp active baseline đã định.
- Mọi preset ship đều khai báo heading/body font có chủ đích.
- Sync commit không thể thay font của preset mà label/document lại mô tả font khác.
- Font loading hiện có dùng `font-display: swap` hoặc cơ chế non-blocking tương đương.
- Sửa parity không tạo duplicate font request.

Jovie baseline:

- heading: `oranienbaum_n4`;
- body: `figtree_n4`.

### PRESET-02 — Fresh-install claim và feature default

Severity: `Medium`

Kiểm tra promotional drawer, offer flyout, newsletter promise, free-shipping claim, discount percentage, countdown và mọi merchant-facing default khác.

Pass criteria:

- Fresh preset không hứa promotion nếu promotion đó không chủ đích thuộc preset.
- Mọi deliberate exception được ghi trong audit.

Quyết định Jovie hiện tại: offer flyout mặc định “Get 20% off” là có chủ đích. Không xóa nó khỏi Jovie nếu không có yêu cầu mới. Phải đánh giá lại quyết định này cho mọi theme/preset mới.

Với Jovie, deliberate behavior này là `PASS` khi preset render đúng approved design. Chỉ dùng `EXCLUDED` khi người dùng miễn chính check đó.

### PRESET-03 — Customer account architecture

Severity: `Medium`

Pass criteria:

- Project chọn rõ new customer accounts, legacy customer templates hoặc documented mixed migration.
- Thiếu `templates/customers/` không tự động là defect nếu new customer accounts được dùng.
- Không thêm legacy customer template theo suy đoán.

Trạng thái Jovie hiện tại: customer template chưa được quyết định trong audit 2026-07. Report là `NOT VERIFIED` cho tới khi account architecture được chọn rõ.

## 13. Snippet không dùng

### CODE-01 — Reachability và xóa snippet an toàn

Severity: `Low`, tăng lên `High` nếu removal làm hỏng purchase path.

CHECK criteria:

1. Tạo static render graph từ layout, template, section, block và snippet.
2. Theo mọi nested snippet-to-snippet render.
3. Tìm `render`, static section reference, theme-block reference và mọi reference non-literal/generate.
4. Kiểm tra packaging script, alternate template, app integration point và theme-editor-only surface.
5. Xác nhận candidate unreachable từ mọi root.

CHECK verdict:

- `PASS`: mọi snippet reachable và không còn removal candidate.
- `FAIL` với severity `Low`: một hay nhiều snippet đã được chứng minh unreachable. Report exact candidate và evidence, nhưng không xóa trong CHECK mode.
- `NOT VERIFIED`: reachability chưa rõ vì dynamic/generated/app/packaging/theme-editor reference.

FIX và retest criteria:

1. Chỉ xóa candidate đã được chứng minh unreachable trong CODE-01 `FAIL`.
2. Sau khi xóa, chạy lại parsing và mọi storefront path liên quan.
3. CODE-01 chỉ thành `PASS` khi authorized deletion và retest thành công khiến không còn removal candidate.
4. Unresolved reference hoặc runtime surface chưa test là `NOT VERIFIED`, không phải quyền để xóa.

Snippet không có direct reference rõ ràng không tự động là unused.

Jovie baseline ngày 2026-07-29: cả 31 snippet reachable; không snippet nào đủ điều kiện xóa.

## 14. Validation có mục tiêu

Chạy check tương xứng với file thay đổi. Theo default profile, không chạy Lighthouse hoặc Theme Check.

Recommended local checks:

1. `git diff --check`;
2. JavaScript syntax check cho asset đã đổi;
3. Shopify Liquid/HTML parse cho Liquid file đã đổi;
4. JSONC parse cho settings file;
5. behavior test có mục tiêu cho plan reconciliation và discount rollback;
6. snippet reachability audit khi snippet thêm, đổi tên hoặc xóa;
7. contrast calculation khi color token đổi;
8. review network call mới ở page load;
9. responsive visual verification trên rendered preview.

Required storefront fixtures:

- authorized disposable preview session có empty test cart;
- product one-time;
- product có selling plan optional;
- product subscription-only;
- allocation khác theo variant;
- deferred-charge, deposit, preorder hoặc try-before-you-buy allocation khi được support;
- sold-out hoặc allocation-unavailable variant;
- dynamic-checkout environment đủ điều kiện;
- discount code hợp lệ và invalid;
- existing code set;
- locale subpath;
- desktop và mobile viewport.

Không đánh runtime check là `PASS` khi preview không mở được.

## 15. Reference implementation trong Jovie

Các path này là reference, không phải tên file bắt buộc cho theme mới. Hãy tìm owner tương đương trong architecture của target.

| Concern | Jovie reference |
| --- | --- |
| Product-form ownership và dynamic checkout | `blocks/product-buy-buttons.liquid`, `snippets/buy-buttons.liquid` |
| Selling-plan picker | `snippets/selling-plan-picker.liquid` |
| Product, sticky, badge và unit price | `snippets/product-price.liquid`, `blocks/product-sticky-add-to-cart.liquid`, `blocks/product-badges.liquid` |
| Variant/plan reconciliation | `assets/product-page.js` |
| Selling-plan layout guard | `assets/product-page.css` |
| Card và quick-add guard | `snippets/product-card.liquid`, `assets/product-card.js` |
| Cart-page discount | `sections/cart.liquid` |
| Drawer discount và recommendation | `sections/cart-drawer.liquid`, `assets/cart-drawer.js`, `assets/cart-drawer.css` |
| Announcement pause | `sections/announcement-bar.liquid`, `assets/section-announcement-bar.js` |
| Font và badge default | `config/settings_schema.json`, `config/settings_data.json` |

## 16. Release gate

Theme hoặc preset chỉ sẵn sàng theo cẩm nang này khi:

- không check `Critical` hoặc `High` nào là `FAIL`;
- mọi runtime-critical check áp dụng là `PASS`, hoặc `NOT VERIFIED`/`EXCLUDED` risk đã được người dùng hoặc merchant chấp nhận rõ;
- source-to-preview identity, layout và performance guardrail pass;
- deliberate preset exception được ghi lại;
- mọi fix đã implement có retest hoàn thành;
- audit result không ngầm đồng nghĩa với upload, publish, commit, push hoặc merge.
