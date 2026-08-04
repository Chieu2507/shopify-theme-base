# Spinel Demo Store Data

Tài liệu này là nguồn dữ liệu chuẩn cho nội dung demo store Spinel. Mọi announcement, product benefit, featured product, quick view, cart message, footer, newsletter và promotion copy phải đối chiếu với file này trước khi được đưa vào preset hoặc storefront.

## Trạng thái tài liệu

- **Phạm vi:** Demo store dùng để kiểm tra và submit Shopify Theme Store.
- **Mục đích:** Đồng bộ claim giữa demo store, preset và theme documentation.
- **Quy tắc:** Giá trị có trạng thái `VERIFY` phải được kiểm tra trong Shopify Admin trước khi dùng như một claim công khai.
- **Cập nhật lần cuối:** 2026-07-31.

## Canonical demo profile

| Trường | Giá trị chuẩn | Trạng thái | Ghi chú |
| --- | --- | --- | --- |
| Brand | Spinel | `APPROVED` | Dùng thống nhất trong demo copy và metadata. |
| Primary industry | Fine jewelry | `APPROVED` | Nội dung, hình ảnh và section phải phù hợp với ngành này. |
| Primary market | Chưa chốt | `VERIFY` | Phải chốt trước khi dùng claim có currency hoặc mùa. |
| Store currency | USD hoặc currency của primary market | `VERIFY` | Không hardcode `USD` nếu demo hỗ trợ market khác. |
| Active promotion | Spinel Summer Edit | `VERIFY` | Chỉ bật campaign sau khi discount và thời hạn được tạo thật trong demo store. |

### Demo-only contact profile

Các thông tin dưới đây là dữ liệu hư cấu dùng để minh họa bố cục theme, không phải địa chỉ hoặc số điện thoại vận hành của doanh nghiệp. Trước khi gửi Theme Store, hãy thay bằng thông tin có quyền sử dụng hoặc xóa block này nếu demo không có studio thật.

| Trường | Giá trị demo | Trạng thái |
| --- | --- | --- |
| Studio name | Spinel Atelier | `DEMO_ONLY` |
| Address | 14 Mercer Lane, Melbourne VIC 3000 AU | `DEMO_ONLY` |
| Phone | +61 3 7018 4826 | `DEMO_ONLY` |
| Opening hours | Tuesday–Saturday: 10:00–18:00 | `DEMO_ONLY` |

## Policy registry

Đây là bộ policy canonical mà mọi preset, section, block, snippet và nội dung demo phải dùng. Một policy chỉ được hiển thị như một claim cụ thể sau khi trạng thái của nó chuyển từ `VERIFY` sang `APPROVED`.

| Policy | Canonical value | Public copy khi đã verify | Safe fallback khi chưa verify |
| --- | --- | --- | --- |
| Shipping | Free shipping over 150 USD in eligible markets | `Free shipping on orders over 150 USD` | `Shipping options and pricing are calculated at checkout.` |
| Delivery scope | Chỉ các market được cấu hình trong shipping rates | `Available delivery methods and estimated times are shown at checkout.` | `Shipping availability is confirmed at checkout.` |
| Returns | 30 ngày cho sản phẩm đủ điều kiện | `30-day returns on eligible items` | `See our returns policy for eligibility and details.` |
| Return eligibility | Sản phẩm chưa sử dụng, còn nguyên điều kiện và bao bì | `Eligible unworn items may be returned in their original condition and packaging.` | `Return eligibility varies by product. See our returns policy for details.` |
| Exclusions | Personalized, engraved và final-sale items có thể bị loại trừ | `Personalized, engraved and final-sale items may be excluded.` | `Some products may have different return conditions.` |
| Refund timing | Chưa chốt | Không hiển thị thời gian hoàn tiền nếu chưa có policy cụ thể. | Không đưa ra claim về thời gian refund. |
| Free returns | Chưa xác nhận | Chỉ dùng `Free returns` khi policy và shipping flow xác nhận. | Không hiển thị claim free returns. |
| Terms of Service | Shopify store policy | Link tới Terms of Service đang hoạt động. | Không hiển thị câu yêu cầu đồng ý Terms nếu chưa có URL. |
| Privacy Policy | Shopify store policy | Link tới Privacy Policy đang hoạt động. | Không hiển thị câu yêu cầu đồng ý Privacy nếu chưa có URL. |
| Shipping Policy | Shopify store policy | Link tới Shipping Policy đang hoạt động. | Dùng safe fallback shipping copy. |
| Refund/Return Policy | Shopify store policy | Link tới Refund/Return Policy đang hoạt động. | Dùng safe fallback returns copy. |

### Policy source of truth

- **Shipping:** Shopify shipping rates và shipping policy của demo store.
- **Returns/refunds:** Shopify refund/return policy của demo store.
- **Terms và Privacy:** Shopify store policies của demo store.
- **Promotion:** Discount thật trong Shopify Admin, bao gồm code, phạm vi sản phẩm, market và thời hạn.
- **Currency và market:** Market primary đã cấu hình trong demo store; không suy luận từ text cũ trong preset.

### Policy rendering rules

- Không lặp lại cùng một policy bằng nhiều giá trị hardcode khác nhau.
- Không dùng `worldwide`, `USD`, `free`, `30-day`, `cashback` hoặc phần trăm discount nếu policy/campaign không xác nhận claim đó.
- Khi policy thay đổi, cập nhật file này trước, sau đó cập nhật preset và storefront copy.
- Nếu một policy chưa có URL hoặc chưa được xác minh, dùng safe fallback thay vì tạo thông tin giả.
- Nội dung consent phải có link thật đến policy tương ứng; plain text không được xem là link legal.

## Shipping

| Trường | Giá trị chuẩn | Trạng thái | Cách dùng |
| --- | --- | --- | --- |
| Free-shipping threshold | 150 USD | `VERIFY` | Xác nhận lại với shipping rate thật trong Shopify Admin. |
| Shipping scope | Worldwide only if enabled by the demo store | `VERIFY` | Không dùng chữ “worldwide” nếu có giới hạn quốc gia/market. |
| Canonical claim | `Free shipping on orders over 150 USD` | `VERIFY` | Chỉ dùng sau khi threshold và market đã được xác nhận. |
| Safe fallback claim | `Shipping options and pricing are calculated at checkout.` | `APPROVED` | Dùng khi threshold chưa được xác nhận hoặc thay đổi theo market. |

### Shipping data cần xác nhận

- [ ] Free-shipping threshold thực tế là 150 USD.
- [ ] Threshold có áp dụng cho toàn bộ primary market hay chỉ một số market.
- [ ] Có được phép dùng chữ “worldwide” hay không.
- [ ] Shipping rates trong demo khớp với claim trên storefront.
- [ ] Shipping Policy có nội dung và URL hoạt động.

Không được dùng đồng thời các threshold khác nhau như `$49+`, `$100` và `$150` trong cùng một demo store.

## Returns and refunds

| Trường | Giá trị chuẩn | Trạng thái | Cách dùng |
| --- | --- | --- | --- |
| Cashback | Không có cashback mặc định | `APPROVED` | Không dùng claim “Cashback 30-day”. |
| Return window | 30 ngày cho sản phẩm đủ điều kiện | `VERIFY` | Chỉ dùng nếu refund/return policy của demo xác nhận điều này. |
| Return eligibility | Sản phẩm chưa sử dụng, còn nguyên điều kiện và bao bì | `VERIFY` | Phải khớp policy thật; có thể loại trừ sản phẩm cá nhân hóa/engraved/final sale. |
| Canonical claim | `30-day returns on eligible items` | `VERIFY` | Phải gắn với return policy khi hiển thị. |
| Safe fallback claim | `See our returns policy for eligibility and details.` | `APPROVED` | Dùng khi policy chưa được xác nhận. |
| Free returns | Chưa xác nhận | `VERIFY` | Không dùng `Free Returns` hoặc `hassle-free returns` trước khi xác minh. |

### Returns data cần xác nhận

- [ ] Return window thực tế là 30 ngày.
- [ ] Điều kiện “unworn, original condition and packaging” khớp policy.
- [ ] Personalized, engraved và final-sale items có bị loại trừ hay không.
- [ ] Phí return do merchant hay khách hàng chịu.
- [ ] Refund/Return Policy có nội dung và URL hoạt động.

## Promotion and countdown

| Trường | Giá trị chuẩn | Trạng thái | Cách dùng |
| --- | --- | --- | --- |
| Campaign name | Spinel Summer Edit | `VERIFY` | Tên campaign phải khớp với campaign trong demo store. |
| Discount code | `SPINEL15` | `VERIFY` | Chỉ dùng nếu code tồn tại và áp dụng đúng phạm vi. |
| Discount | 15% off selected jewelry | `VERIFY` | Không diễn đạt thành “15% off all products” nếu campaign không áp dụng toàn catalog. |
| Eligible products | Selected jewelry collection | `VERIFY` | Ghi rõ collection/product thực tế trong Shopify Admin. |
| Primary market | Chưa chốt | `VERIFY` | Ngày, currency và điều kiện phải khớp market. |
| Start at | 2026-08-01 00:00 +07:00 | `VERIFY` | Chỉ dùng sau khi campaign được tạo và thời gian được xác nhận. |
| End at | 2026-08-31 23:59 +07:00 | `VERIFY` | Countdown phải dùng đúng thời điểm kết thúc thực tế. |
| Countdown | Hiển thị khi campaign active | `VERIFY` | Ẩn khi chưa bắt đầu, hết hạn hoặc chưa cấu hình đủ dữ liệu. |
| Promotion fallback | Không hiển thị promotion | `APPROVED` | Dùng khi campaign chưa được verify hoặc đã hết hạn. |

Nếu demo store chạy một campaign thật, phải bổ sung đầy đủ:

- Tên campaign.
- Discount code hoặc cơ chế discount.
- Sản phẩm/collection áp dụng.
- Giá trước và sau giảm.
- Thị trường áp dụng.
- Thời điểm bắt đầu và kết thúc.
- Link tới collection hoặc điều khoản liên quan.

Phần trăm hiển thị phải được tính từ giá thực tế, không lấy từ một con số quảng cáo hardcode.

## Legal policies

| Trường | Giá trị chuẩn | Trạng thái | Cách dùng |
| --- | --- | --- | --- |
| Terms of Service | Shopify store policy | `VERIFY` | Phải tồn tại và có URL hoạt động trong demo store. |
| Privacy Policy | Shopify store policy | `VERIFY` | Phải tồn tại và có URL hoạt động trong demo store. |
| Shipping Policy | Shopify store policy | `VERIFY` | Dùng để đối chiếu shipping claim. |
| Refund/Return Policy | Shopify store policy | `VERIFY` | Dùng để đối chiếu return/refund claim. |
| Newsletter consent | Có link Terms và Privacy | `APPROVED` | Không hiển thị câu “you agree” dưới dạng plain text không có link. |

### Required legal links

Mọi nơi có nội dung consent hoặc dẫn người dùng tới policy phải kiểm tra được các URL sau trong demo storefront:

- Terms of Service.
- Privacy Policy.
- Shipping Policy.
- Refund/Return Policy.

Footer legal menu có thể dùng `shop.policies` hoặc menu legal đã cấu hình, nhưng newsletter consent vẫn phải liên kết trực tiếp tới Terms và Privacy nếu câu chữ yêu cầu người dùng đồng ý.

## Approved copy rules

### Được dùng sau khi verify

- `Free shipping on orders over 150 USD`
- `30-day returns on eligible items`
- `Shipping options and pricing are calculated at checkout.`
- `See our returns policy for eligibility and details.`

### Không được dùng

- `Cashback 30-day`
- `Free Returns` khi chưa xác minh free-return policy.
- `hassle-free returns` khi policy có điều kiện hoặc loại trừ.
- `Free Shipping $49+`, `$100` và `$150` đồng thời trong cùng demo store.
- `Spring Sale` hoặc `Get 15% off on all products` nếu không có campaign/discount thật.
- `Terms of Service and Privacy Policy` dưới dạng text không có link khi dùng trong consent.

## Required verification before code rollout

- [ ] Xác nhận shipping threshold trong Shopify Admin.
- [ ] Xác nhận primary market và currency.
- [ ] Xác nhận shipping scope, đặc biệt claim “worldwide”.
- [ ] Xác nhận return window và eligibility.
- [ ] Xác nhận có hoặc không có free returns.
- [ ] Xác nhận Terms, Privacy, Shipping và Refund/Return policy đều có URL.
- [ ] Xác nhận demo không có promotion active trước khi bật countdown.
- [ ] Nếu có promotion, ghi campaign details vào mục Promotion and countdown.
