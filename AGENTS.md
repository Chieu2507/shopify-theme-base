# Workspace instructions

## Shopify theme validation

- Run the reusable validator with `scripts/validate-theme-8gb.sh` from the workspace root.
- The validator must run with an 8 GB Node.js heap (`--max-old-space-size=8192`). Do not invoke the Shopify Liquid validator without this heap setting.
- With no arguments, the script validates every file under the eight Shopify theme directories: `assets`, `blocks`, `config`, `layout`, `locales`, `sections`, `snippets`, and `templates`.
- To validate only selected files, pass one comma-separated list of paths relative to the workspace root, for example: `scripts/validate-theme-8gb.sh 'sections/header.liquid,templates/index.json'`.
- The latest complete output and exit status are stored in `validation-results/latest.log` and `validation-results/latest.status` for later tasks to inspect.

