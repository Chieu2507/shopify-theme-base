# Shopify Theme Base

Base theme được khởi tạo bằng Shopify Skeleton Theme cho store `omnise-theme-base`.

## Store and branches

- Store: [omnise-theme-base](https://admin.shopify.com/store/omnise-theme-base)
- Production theme: Git branch `main`
- Development theme: Git branch `dev`
- Shopify MCP và Shopify CLI đã được xác thực trong môi trường hiện tại.

## Development

Chỉ làm việc trên `dev`:

```bash
git switch dev
git pull --ff-only origin dev
shopify theme dev --store omnise-theme-base.myshopify.com
```

## Checks

```bash
git diff --check
shopify theme check --path .
```

## Theme settings

Phase 2 global Theme Settings contract and acceptance criteria are documented in
[docs/phase-2-theme-settings.md](docs/phase-2-theme-settings.md).

## Promote

Push `dev`, mở pull request `dev` → `main`, review rồi merge. Shopify Git connection sẽ đồng bộ branch `main` theo cấu hình production theme.
