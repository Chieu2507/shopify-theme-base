# Quy trình phát triển hai preset

## Vai trò branch

| Branch | Vai trò | Kết nối Shopify |
| --- | --- | --- |
| `main` | Source chuẩn và source để đóng ZIP | Không kết nối store |
| `demo-omniselle` | Runtime Omniselle cho Store A | Draft theme Omniselle |
| `demo-noryvelle` | Runtime Noryvelle cho Store B | Draft theme Noryvelle |

Không merge toàn bộ hai branch `demo-*` vào nhau hoặc vào `main`.

## Khi chỉnh trực tiếp trong Shopify

Shopify sẽ commit tự động vào branch đang kết nối:

- Store A save trong Theme Editor hoặc Code Editor → `demo-omniselle`.
- Store B save trong Theme Editor hoặc Code Editor → `demo-noryvelle`.

Sau mỗi thay đổi:

1. Template/section setting riêng preset: capture đúng file JSON vào `listings/<preset>`.
2. Font, màu, spacing global: capture `config/settings_data.json.current` vào named preset tương ứng.
3. Liquid/CSS/JS dùng chung: đưa đúng file sang `main`, sau đó deploy lại cả hai demo.

## Lệnh trợ giúp

```bash
# Đưa install-state của preset ra root runtime cho branch demo.
node scripts/preset-state.mjs hydrate omniselle
node scripts/preset-state.mjs hydrate noryvelle

# Lưu một thay đổi Theme Editor từ root về install-state của preset.
node scripts/preset-state.mjs capture noryvelle templates/index.json
node scripts/preset-state.mjs capture noryvelle sections/header-group.json

# Lưu font, màu và global settings của preset đang chạy.
node scripts/preset-state.mjs capture-settings noryvelle

# Kiểm tra root runtime có khác install-state hay không.
node scripts/preset-state.mjs diff noryvelle templates/index.json
```

## Font và page settings

`config/settings_data.json` chứa hai named preset:

- `presets.Omniselle`
- `presets.Noryvelle`

`heading_font`, `body_font` và các setting button có thể khác nhau giữa hai preset. Một thay đổi trong Store A chỉ đổi root runtime Omniselle; Store B không tự bị đổi.

Các setting của page/section nằm trong `listings/<preset>/templates/*.json` hoặc `listings/<preset>/sections/*-group.json`. Section Liquid vẫn là code dùng chung trong `/sections`; một section chỉ xuất hiện ở Noryvelle nếu template Noryvelle gọi nó.

## Release

Chỉ đóng ZIP từ `main`. Trước release, hydrate Omniselle vào root, xác nhận hai listing install-state, rồi package một ZIP có cả `listings/omniselle` và `listings/noryvelle`.
