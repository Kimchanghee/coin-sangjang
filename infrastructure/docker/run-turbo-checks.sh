#!/usr/bin/env bash
set -euo pipefail

main() {
  local raw_filters_string="${TURBO_FILTERS-}"
  IFS=',' read -ra raw_filters <<< "$raw_filters_string"
  local filters=()
  for token in "${raw_filters[@]}"; do
    token="$(echo "$token" | xargs)"
    if [[ -n "$token" ]]; then
      filters+=("--filter=$token")
    fi
  done

  npx turbo run lint "${filters[@]}"
  npx turbo run build "${filters[@]}"
}

main "$@"
