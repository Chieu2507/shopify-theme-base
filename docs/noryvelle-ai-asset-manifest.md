# Noryvelle AI Asset Manifest

## 1. Nguồn và provenance

- Bộ media này được tạo mới bằng AI cho demo store **Noryvelle Bags** vào ngày 25/07/2026.
- Công cụ tạo ảnh: OpenAI built-in image generation.
- Mỗi `master.png` là file nguồn gốc của một thiết kế sản phẩm. Các file `*-front.png` và `*-interior.png` là crop không phá huỷ từ master tương ứng.
- Video editorial và contact sheet trong `editorial/` là media gốc dành riêng cho trải nghiệm Carry Edit của Noryvelle.
- Không sử dụng trực tiếp ảnh sản phẩm của Omniselle. Những ảnh đó có thể chứa logo, nhận diện thương hiệu hoặc provenance chưa phù hợp với preset Bags.
- Mối liên hệ giữa Omniselle và Noryvelle chỉ được giữ ở art direction dùng chung: nền ivory ấm, ánh sáng mềm, bố cục editorial và cảm giác premium. Không sao chép pixel hoặc chuyển ảnh Jewelry thành ảnh Bags.
- AI asset không được xem là bằng chứng về sản phẩm vật lý, nhà cung cấp, chất liệu, kích thước hoặc quyền nhãn hiệu. Những thông tin này phải được quản lý riêng trong dữ liệu demo.

## 2. Cấu trúc thư mục chuẩn

```text
docs/noryvelle-assets/
├── editorial/
│   ├── noryvelle-workday-hero.png
│   ├── noryvelle-after-dark-hero.png
│   ├── noryvelle-commuter-edit-v2.png
│   ├── noryvelle-material-study-v2.png
│   ├── noryvelle-carry-edit-film.mp4
│   └── noryvelle-carry-edit-film-contact-sheet.png
└── products/
    ├── aria-top-handle/
    ├── aster-work-tote/
    ├── atlas-weekender/
    ├── celeste-mini-bag/
    ├── halo-card-wallet/
    ├── lune-shoulder-bag/
    ├── miro-camera-bag/
    ├── nocturne-clutch/
    ├── nomad-convertible-backpack/
    ├── orla-crossbody/
    ├── serein-hobo/
    └── vale-east-west-tote/
```

Mỗi thư mục sản phẩm phải giữ cấu trúc:

```text
<handle>/
├── master.png
├── <color-1>-front.png
├── <color-1>-interior.png
├── <color-2>-front.png
└── <color-2>-interior.png
```

## 3. Inventory sản phẩm và colorway

| Sản phẩm | Handle | Colorway 1 | Colorway 2 |
|---|---|---|---|
| Aria Top Handle | `aria-top-handle` | Espresso | Ivory |
| Aster Work Tote | `aster-work-tote` | Black | Espresso |
| Atlas Weekender | `atlas-weekender` | Black | Tan |
| Celeste Mini Bag | `celeste-mini-bag` | Black | Champagne |
| Halo Card Wallet | `halo-card-wallet` | Burgundy | Taupe |
| Lune Shoulder Bag | `lune-shoulder-bag` | Black | Ivory |
| Miro Camera Bag | `miro-camera-bag` | Camel | Chocolate |
| Nocturne Clutch | `nocturne-clutch` | Black | Oxblood |
| Nomad Convertible Backpack | `nomad-convertible-backpack` | Black | Olive |
| Orla Crossbody | `orla-crossbody` | Black | Burgundy |
| Serein Hobo | `serein-hobo` | Cognac | Olive |
| Vale East-West Tote | `vale-east-west-tote` | Oxblood | Taupe |

## 4. Quy tắc variant và product media

1. Tên option `Color` trong Shopify phải trùng chính xác với tên colorway trong bảng inventory.
2. Gắn `featured_media` của mỗi variant vào file `<color>-front.png` tương ứng.
3. Sắp xếp media của một colorway theo thứ tự:
   - Front three-quarter view
   - Open interior view
4. Mỗi colorway phải có đủ front và interior, kể cả variant sale, hết hàng hoặc tạm hết hàng.
5. Không dùng ảnh của colorway khác làm featured media dự phòng.
6. `master.png` chỉ là nguồn nội bộ để tái tạo/crop; không upload master sheet làm product media.
7. Không đổi tên file sau khi đã map variant nếu chưa cập nhật lại manifest và mapping trên store.

Editorial hero:

- `noryvelle-workday-hero.png`: 1672×941, Aster Espresso + Atlas Tan, negative
  space bên trái cho nội dung slideshow.
- `noryvelle-after-dark-hero.png`: 1672×941, Celeste Champagne + Nocturne
  Oxblood, negative space bên trái cho nội dung slideshow.
- Cả hai được tạo mới bằng ImageGen từ crop Noryvelle làm reference; không có chữ,
  logo hoặc watermark.

Editorial composition bổ sung:

- `noryvelle-commuter-edit-v2.png`: 1122×1402, composition dọc gồm Aster
  Espresso, Orla Burgundy và Halo Burgundy trong cùng một still life; dùng cho
  Shop The Look và câu chuyện thiết kế. Ảnh được tạo mới từ đúng ba crop sản phẩm
  Noryvelle làm reference, giữ khoảng trống và vị trí đủ rõ cho ba hotspot.
- `noryvelle-material-study-v2.png`: 1122×1402, still life trung tính về bề mặt,
  lining và hardware; dùng cho câu chuyện Materials & Care trên homepage, PDP và
  page template. Ảnh không đại diện cho một colorway hoặc product cụ thể.
- Prompt intent của hai asset: luxury editorial product photography trên nền ivory
  ấm, ánh sáng studio mềm, không người mẫu, không chữ, không logo, không watermark,
  không thêm sản phẩm ngoài reference. Công cụ: OpenAI built-in image generation.
- Shopify Files:
  - `noryvelle-commuter-edit-v2.png` —
    `shopify://shop_images/noryvelle-commuter-edit-v2.png`
  - `noryvelle-material-study-v2.png` —
    `shopify://shop_images/noryvelle-material-study-v2.png`

## 5. Quy tắc alt text

Alt text mô tả những gì nhìn thấy, không chèn từ khoá marketing và không cần ghi “AI-generated”.

Mẫu chuẩn:

```text
<Product name> bag in <Color>, front three-quarter view
<Product name> bag in <Color>, open interior view
```

Ví dụ:

```text
Serein Hobo bag in Cognac, front three-quarter view
Serein Hobo bag in Cognac, open interior view
```

Nguyên tắc:

- Dùng đúng product title và tên variant trên Shopify.
- Không thêm “leather”, “handcrafted”, “sustainable” hoặc claim chất liệu nếu dữ liệu sản phẩm chưa xác nhận.
- Không lặp tên thương hiệu, giá, trạng thái tồn kho hoặc nội dung khuyến mãi trong alt text.
- Với video editorial, dùng mô tả ngắn về chuyển động hoặc nội dung hiển thị; không dùng contact sheet làm alt thay thế cho video.

## 6. Ranh giới sử dụng

Được phép:

- Upload các crop front/interior vào demo store Noryvelle.
- Dùng media trong homepage, collection, search, quick view, PDP, recommendations và Carry Edit.
- Dùng video editorial trong trải nghiệm Noryvelle và tài liệu trình bày preset.
- Dùng screenshot có chứa các asset này cho listing/review của chính preset Noryvelle.

Không được phép:

- Trình bày sản phẩm AI như hàng tồn kho, mẫu vật hoặc sản phẩm của một nhà cung cấp có thật.
- Bán hoặc phát hành các ảnh này như một gói stock image độc lập.
- Dùng master sheet hoặc contact sheet làm product image trên storefront.
- Đưa ảnh demo vào package theme phát hành nếu quy trình submission không cho phép hoặc provenance không được giữ kèm.
- Tái sử dụng trực tiếp ảnh Jewelry của Omniselle cho Noryvelle, hoặc ngược lại, khi chưa kiểm tra logo, quyền sử dụng và sự phù hợp ngành hàng.
- Dùng media cho thương hiệu bên thứ ba mà không thực hiện lại kiểm tra provenance và phạm vi quyền sử dụng.

## 7. Checklist trước khi upload

- [x] Product title, handle và tên Color khớp inventory.
- [x] Mỗi variant được map đúng ảnh front cùng màu.
- [x] Mỗi colorway có đủ front và interior.
- [x] Alt text đúng mẫu và không chứa claim chưa xác nhận.
- [x] Không có logo, chữ, watermark hoặc dấu hiệu nhận diện ngoài ý muốn.
- [x] Master sheet và contact sheet vẫn chỉ nằm trong tài liệu nội bộ.
- [x] Ảnh sold-out vẫn được giữ để kiểm thử trạng thái thương mại của theme.
- [x] Mọi asset mới hoặc bản regenerate được bổ sung provenance trước khi đưa lên store.
