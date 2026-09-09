# Repository instructions

## Branch policy

- Chỉ tạo và chỉnh sửa code/theme trên branch `dev`.
- Trước khi làm việc, kiểm tra branch và trạng thái bằng `git status --short --branch`.
- `main` là branch release/production; không code, commit trực tiếp hoặc force-push trên `main`.
- Mọi thay đổi đưa lên `main` qua pull request từ `dev` sau khi kiểm tra và review.

## Store and theme mapping

- Store: `omnise-theme-base.myshopify.com`.
- Theme development: Git branch `dev`.
- Theme production: Git branch `main`.
- Không hard-code theme ID hoặc thông tin xác thực vào source; kiểm tra mapping trong Shopify Admin khi cần.

## Secrets

- Không commit Shopify access token, Admin API token, client secret, private key, mật khẩu, cookie phiên, file `.env` hoặc dữ liệu xác thực CLI.
- Dùng Shopify CLI auth local hoặc biến môi trường bên ngoài repository.
- Trước khi commit, kiểm tra `git diff --cached` và `git status --short`; nếu phát hiện secret, dừng lại, gỡ khỏi index và revoke/rotate credential trước khi tiếp tục.

## Checks

Chạy trên `dev` trước khi push:

```bash
git diff --check
shopify theme check --path .
```

Preview theme development:

```bash
shopify theme dev --store omnise-theme-base.myshopify.com
```

Xác nhận Shopify CLI đã đăng nhập:

```bash
shopify theme info --store omnise-theme-base.myshopify.com --json
```

## Promote to main

1. Hoàn tất code và chạy toàn bộ checks trên `dev`.
2. Push `dev` lên remote và mở pull request `dev` → `main`.
3. Review diff, Theme Check và preview trước khi merge.
4. Merge pull request vào `main`; không force-push hoặc bỏ qua review.
5. Xác nhận Git connection của Shopify đã đồng bộ branch `main` vào production theme và kiểm tra storefront sau deploy.
