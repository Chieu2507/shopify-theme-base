#!/bin/zsh

set -u
set -o pipefail

workspace_root="${0:A:h:h}"
results_dir="$workspace_root/validation-results"
validator_path="$(find /Users/cassharper/.codex/plugins/cache -path '*/skills/shopify-liquid/scripts/validate.mjs' -type f -print 2>/dev/null | LC_ALL=C sort | tail -n 1)"
shopify_cli="$(command -v shopify || true)"
node_bin="$(command -v node || true)"
node_heap_mb=8192
node_heap_flag="--max-old-space-size=${node_heap_mb}"
node_flags=("$node_heap_flag")

supports_huge_heap_flag() {
  local runtime="$1"
  local v8_options

  [[ -n "$runtime" ]] || return 1
  v8_options="$("$runtime" --v8-options 2>/dev/null || true)"
  [[ "$v8_options" == *"--huge-max-old-generation-size"* ]]
}

if supports_huge_heap_flag "$node_bin"; then
  node_flags+=("--huge-max-old-generation-size")
fi

shopify_node=""
shopify_node_flags=("$node_heap_flag")
if [[ -n "$shopify_cli" ]]; then
  shopify_shebang="$(sed -n '1p' "$shopify_cli" 2>/dev/null || true)"
  if [[ "$shopify_shebang" == '#!/usr/bin/env '* ]]; then
    shopify_node="${shopify_shebang##* }"
  elif [[ "$shopify_shebang" == '#!'* ]]; then
    shopify_node="${shopify_shebang#\#!}"
  fi

  if [[ "$shopify_node" != */* ]]; then
    shopify_node="$(command -v "$shopify_node" 2>/dev/null || true)"
  fi

  if [[ ! -x "$shopify_node" || "$shopify_node" != *node* ]]; then
    shopify_node=""
  fi
fi

if supports_huge_heap_flag "$shopify_node"; then
  shopify_node_flags+=("--huge-max-old-generation-size")
fi

node_options="$node_heap_flag"

if (( $# > 0 )); then
  validation_files="$1"
else
  validation_files="$(
    cd "$workspace_root" || exit 2
    find assets blocks config layout locales sections snippets templates -type f -print | LC_ALL=C sort | paste -sd, -
  )"
fi

mkdir -p "$results_dir"
artifact_id="spinel-theme-$(date -u +%Y%m%dT%H%M%SZ)"

{
  print "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  print "Requested Node heap: ${node_heap_mb} MB"
  print "Node runtime: ${node_bin:-not-found}"
  print "Shopify runtime: ${shopify_node:-not-found}"
  print "Files: $validation_files"
  print

  if [[ -z "$node_bin" ]]; then
    print -u2 'Node.js was not found; cannot enforce the 8 GB heap limit.'
    exit 2
  fi

  effective_heap_mb="$(NODE_OPTIONS="$node_options" "$node_bin" "${node_flags[@]}" -e 'const v8 = require("node:v8"); process.stdout.write(String(Math.floor(v8.getHeapStatistics().heap_size_limit / 1024 / 1024)));' 2>/dev/null || true)"
  if [[ -z "$effective_heap_mb" ]] || (( effective_heap_mb < node_heap_mb )); then
    print -u2 "Node.js did not expose the requested ${node_heap_mb} MB heap (effective: ${effective_heap_mb:-unknown} MB)."
    exit 2
  fi
  print "Effective V8 heap: ${effective_heap_mb} MB"

  if [[ -n "$shopify_node" ]]; then
    effective_shopify_heap_mb="$(NODE_OPTIONS="$node_options" "$shopify_node" "${shopify_node_flags[@]}" -e 'const v8 = require("node:v8"); process.stdout.write(String(Math.floor(v8.getHeapStatistics().heap_size_limit / 1024 / 1024)));' 2>/dev/null || true)"
    if [[ -z "$effective_shopify_heap_mb" ]] || (( effective_shopify_heap_mb < node_heap_mb )); then
      print -u2 "Shopify's Node runtime did not expose the requested ${node_heap_mb} MB heap (effective: ${effective_shopify_heap_mb:-unknown} MB)."
      exit 2
    fi
    print "Effective Shopify V8 heap: ${effective_shopify_heap_mb} MB"
  fi
  print

  if [[ -n "$validator_path" ]]; then
    print "Validator: $validator_path"
    NODE_OPTIONS="$node_options" \
      OPT_OUT_INSTRUMENTATION=true \
      "$node_bin" "${node_flags[@]}" "$validator_path" \
        --theme-path "$workspace_root" \
        --files "$validation_files" \
        --model gpt-5.6 \
        --client-name codex \
        --client-version 5.6 \
        --artifact-id "$artifact_id" \
        --revision 1
  elif [[ -n "$shopify_cli" ]]; then
    print "Validator: $shopify_cli theme check"
    if (( $# > 0 )); then
      print 'Shopify CLI Theme Check does not support file-scoped validation; checking the full theme.'
    fi
    if [[ -n "$shopify_node" ]]; then
      NODE_OPTIONS="$node_options" \
        "$shopify_node" "${shopify_node_flags[@]}" "$shopify_cli" theme check \
          --path "$workspace_root" \
          --no-color \
          --fail-level error
    else
      NODE_OPTIONS="$node_options" \
        "$shopify_cli" theme check \
          --path "$workspace_root" \
          --no-color \
          --fail-level error
    fi
  else
    print -u2 'No Shopify Liquid validator or Shopify CLI was found.'
    exit 2
  fi
} > "$results_dir/latest.log" 2>&1

validation_status=$?
print "$validation_status" > "$results_dir/latest.status"
grep -E 'Theme Check Summary|Overall Status|Total Files|offenses found' "$results_dir/latest.log" || true
print "Full output: $results_dir/latest.log"
exit "$validation_status"
