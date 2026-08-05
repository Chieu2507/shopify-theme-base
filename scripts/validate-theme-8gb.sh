#!/bin/zsh

set -u
set -o pipefail

workspace_root="${0:A:h:h}"
results_dir="$workspace_root/validation-results"
validator_path="$(find /Users/cassharper/.codex/plugins/cache -path '*/skills/shopify-liquid/scripts/validate.mjs' -type f -print 2>/dev/null | LC_ALL=C sort | tail -n 1)"
shopify_cli="$(command -v shopify || true)"

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
  print 'Node heap: 8192 MB'
  print "Files: $validation_files"
  print

  if [[ -n "$validator_path" ]]; then
    print "Validator: $validator_path"
    NODE_OPTIONS='--max-old-space-size=8192' \
      OPT_OUT_INSTRUMENTATION=true \
      node "$validator_path" \
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
    NODE_OPTIONS='--max-old-space-size=8192' \
      "$shopify_cli" theme check \
        --path "$workspace_root" \
        --no-color \
        --fail-level error
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
