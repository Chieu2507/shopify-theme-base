# Hướng dẫn trong workspace

## Xây dựng section và theme block

Các quy tắc này là bắt buộc đối với mọi tác vụ tạo mới hoặc chỉnh sửa Shopify
section, theme block, block nội bộ của section, schema, preset hoặc hành vi
storefront có liên quan.

### Kỹ năng Shopify bắt buộc

- Khi tạo mới hoặc chỉnh sửa theme, section hay block, phải nạp và áp dụng cả
  bốn kỹ năng sau nếu chúng khả dụng trong phiên làm việc:
  `shopify:shopify-liquid` (Shopify Liquid),
  `shopify:shopify-use-shopify-cli` (Shopify CLI),
  `shopify:shopify-dev` (Shopify Dev) và
  `shopify:shopify-custom-data` (Shopify Custom Data).
- `shopify:shopify-liquid` là kỹ năng chính để quyết định kiến trúc theme,
  Liquid, schema, section, block, nested block, snippet và cách render trong
  Theme Editor.
- `shopify:shopify-use-shopify-cli` được dùng cho quy trình phát triển, preview,
  kiểm tra và các thao tác Shopify CLI phù hợp với tác vụ.
- `shopify:shopify-dev` được dùng để tra cứu tài liệu Shopify chính thức cho
  các vấn đề liên quan nhiều phần hoặc chưa được kỹ năng chuyên biệt bao phủ;
  không dùng nó để thay thế hướng dẫn chuyên biệt của Shopify Liquid.
- `shopify:shopify-custom-data` được dùng để kiểm tra và triển khai đúng
  metafield, metaobject, dynamic source hoặc dữ liệu tùy chỉnh nếu section/block
  có liên quan. Không tự thêm custom data khi yêu cầu không cần tới nó. Nếu tác
  vụ đề cập metafield hoặc metaobject, phải nạp kỹ năng này trước các kỹ năng
  Shopify còn lại.
- Nếu giới hạn của phiên làm việc chỉ cho phép chọn hoặc sử dụng một kỹ năng,
  bắt buộc chọn `shopify:shopify-liquid` (Shopify Liquid).

### Nguồn chuẩn

- Sử dụng file `AGENTS.md` này và phần triển khai Liquid hiện tại làm nguồn chuẩn
  cho kiến trúc section/block. Không phụ thuộc vào các tài liệu Markdown khác,
  trừ khi người dùng yêu cầu rõ ràng một tài liệu cụ thể.
- Trước khi thêm một option, hãy tìm trong các file hiện có ở `blocks/`,
  `sections/` và các snippet render liên quan để xác định thành phần tương
  đương gần nhất. Không tự tạo setting ID, kiểu setting, giá trị option, giá trị
  mặc định, cách đặt label hoặc hành vi render mới khi Spinel đã có thành phần
  tương đương.
- Trong quá trình thực hiện tác vụ, phải đọc lại các file block chuẩn có liên
  quan. Không tái tạo bộ option dựa trên trí nhớ từ cuộc trò chuyện hoặc từ một
  danh sách đã sao chép có thể không còn cập nhật.
- Demo được cung cấp quyết định kết quả hình ảnh, hành vi responsive và tương
  tác cần đạt được. Code hiện có của Spinel quyết định kiến trúc component và
  quy ước option trong Theme Editor. Khi bắt đầu tác vụ, phải lập một checklist
  nghiệm thu ngắn gọn bao gồm cấu trúc, thứ bậc nội dung, hành vi desktop/mobile,
  animation, các tùy chỉnh dành cho merchant và những khác biệt được phép. Trong
  bước QA cuối cùng, phải đối chiếu lại demo theo checklist đó.

### Thứ tự ưu tiên bắt buộc khi xây dựng cấu trúc

Chọn phương án phù hợp về kỹ thuật đầu tiên theo đúng thứ tự sau:

1. Tái sử dụng theme block hiện có.
2. Kết hợp các block hiện có dưới dạng nested block khi merchant cần có khả
   năng thêm, xóa hoặc sắp xếp lại nội dung.
3. Chỉ tạo theme block dùng chung mới khi không có block phù hợp và thành phần
   đó có khả năng được tái sử dụng.
4. Chỉ khai báo content setting trực tiếp trong section hoặc block nội bộ của
   section khi cơ chế của section, markup cố định, mối quan hệ dữ liệu hoặc
   tương tác khiến theme block độc lập không phù hợp.

Không đưa toàn bộ nội dung trực tiếp vào section chỉ vì cách đó code nhanh hơn.
Nếu bắt buộc phải dùng phương án thứ tư, phải nêu rõ lý do kỹ thuật trong phần
bàn giao cuối cùng.

### Tái sử dụng bộ option chuẩn

- `blocks/heading.liquid` là nguồn chuẩn cho bộ option của heading.
- `blocks/text.liquid` là nguồn chuẩn cho bộ option của body text.
- Subheading là một preset của `blocks/heading.liquid`. Không tạo block
  subheading riêng.
- Áp dụng cùng quy tắc tái sử dụng cho các thành phần cơ bản hiện có khác như
  button, media và group: phải kiểm tra file block hiện tại trước khi triển khai
  một thành phần tương đương.
- Khi không thể sử dụng block độc lập, phải sao chép chính xác phần bộ option
  chuẩn có liên quan vào section hoặc block nội bộ. Giữ nguyên các nhóm setting,
  semantic ID, kiểu setting, giá trị và thứ tự option, giá trị mặc định, giới
  hạn, điều kiện hiển thị và hành vi render.
- Chỉ điều chỉnh những gì bối cảnh mới thực sự yêu cầu về mặt kỹ thuật. Có thể
  thêm prefix hoặc sử dụng ID khác để tránh trùng lặp hoặc phân biệt nhiều phần
  tử cố định. Biểu thức `visible_if` dành cho block phải được đổi sang đúng
  ngữ cảnh section hoặc block nội bộ. Không được âm thầm loại bỏ tính năng khỏi
  bộ option được sao chép.
- Nếu demo yêu cầu một tính năng mà bộ option chuẩn chưa hỗ trợ, hãy mở rộng
  nguồn dùng chung khi phần mở rộng đó có ích rộng rãi. Nếu không, chỉ thêm
  option riêng nhỏ nhất cần thiết cho bối cảnh và báo cáo rõ ngoại lệ.

### Phạm vi trách nhiệm

- Section chủ yếu quản lý layout của container, chiều rộng, spacing, background,
  hành vi áp dụng cho toàn section và cách sắp xếp các block con.
- Block chủ yếu quản lý nội dung, cách hiển thị và hành vi ở cấp phần tử của
  chính block đó.
- Ưu tiên nested composition cho card, slide, column hoặc các cấu trúc lặp lại
  có chứa heading, text, button, media hay các nội dung con tương tự. Giữ cấu
  trúc lồng nhau gọn và dễ hiểu đối với merchant.
- Duy trì các thao tác cần thiết trong Shopify Theme Editor: thêm, xóa, sắp xếp
  lại, nhân bản, chọn và render nhiều instance mà không bị trùng ID.

### Chất lượng option dành cho merchant

- Chỉ cung cấp các tùy chỉnh thực sự hoạt động và hữu ích cho merchant. Mỗi
  setting được hiển thị phải tác động lên storefront đúng như label mô tả.
- Tuân theo quy ước hiện có của Spinel về cách đặt tên, bản dịch, nhóm, thứ tự,
  phạm vi, giá trị option và giá trị mặc định. Tái sử dụng tùy chỉnh hiện có
  thay vì tạo các tùy chỉnh trùng chức năng.
- Sắp xếp các tùy chỉnh theo thứ tự: nội dung, giao diện, layout rồi đến hành
  vi. Sử dụng điều kiện hiển thị để ẩn các setting phụ thuộc khi chúng không
  liên quan.
- Cung cấp giá trị mặc định an toàn và nội dung placeholder có ý nghĩa để
  merchant có thể hiểu section mới ngay cả trước khi cấu hình.
- Chỉ thêm tùy chỉnh desktop/mobile riêng biệt khi thiết kế thực sự có nhu cầu
  responsive. Tránh các switch không cần thiết và các tùy chỉnh quá vụn.
- Không hard-code nội dung mà merchant cần chỉnh sửa chỉ để khớp với demo.

### Quy trình triển khai và QA

1. Kiểm tra demo hoặc yêu cầu và lập checklist nghiệm thu.
2. Tìm kiếm và kiểm tra các section, block và snippet hiện có có liên quan.
3. Xác định cây section/block dự kiến và quyết định bộ option nào sẽ được tái
   sử dụng, lồng nhau, sao chép, mở rộng hoặc tạo mới.
4. Triển khai kiến trúc nhỏ gọn nhất đáp ứng yêu cầu và thứ tự ưu tiên xây dựng
   cấu trúc ở trên.
5. Kiểm tra tính hợp lệ của schema, render mặc định, các tùy chỉnh trong Theme
   Editor, nhiều instance, thao tác thêm/xóa/sắp xếp block, layout
   desktop/mobile và các tương tác.
6. Chạy quy trình validation của repository được quy định bên dưới cho mọi file
   theme đã thay đổi.
7. Trong phần bàn giao cuối cùng, tóm tắt các thành phần đã tái sử dụng, mọi
   ngoại lệ so với bộ option chuẩn và kết quả validation.

## Kiểm tra tính hợp lệ của Shopify theme

- Không tự động chạy Validator hoặc Theme Check trừ khi tôi yêu cầu. Nếu được yêu cầu thì làm theo các phần ở dưới.
- Chạy validator dùng chung bằng `scripts/validate-theme-8gb.sh` từ thư mục
  gốc của workspace.
- Validator phải chạy với Node.js heap 8 GB
  (`--max-old-space-size=8192`). Không chạy Shopify Liquid validator nếu
  thiếu thiết lập heap này.
- Khi không truyền tham số, script sẽ kiểm tra mọi file trong tám thư mục của
  Shopify theme: `assets`, `blocks`, `config`, `layout`, `locales`,
  `sections`, `snippets` và `templates`.
- Để chỉ kiểm tra các file được chọn, hãy truyền một danh sách đường dẫn được
  phân tách bằng dấu phẩy và tính từ thư mục gốc của workspace. Ví dụ:
  `scripts/validate-theme-8gb.sh 'sections/header.liquid,templates/index.json'`.
- Output đầy đủ mới nhất và exit status được lưu lần lượt tại
  `validation-results/latest.log` và
  `validation-results/latest.status` để các tác vụ sau có thể kiểm tra.

  ## Merge/Deploy

- Tự động merge/deploy code lên main không cần hỏi lại. Chú ý cần kiểm tra conflict trước khi thực hiện. Nếu bị conflict thì không được làm ảnh hưởng tới các code khác.