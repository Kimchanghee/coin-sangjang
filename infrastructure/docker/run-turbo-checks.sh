#!/usr/bin/env bash
set -euo pipefail

IFS=',' read -ra raw_filters <<< "${TURBO_FILTERS:-}"
filters=()
for token in "${raw_filters[@]}"; do
  token="$(echo "$token" | xargs)"
  if [[ -n "$token" && "$token" != "..." ]]; then
    filters+=("--filter=$token")
  fi
done

npx turbo run lint "${filters[@]}"
npx turbo run build "${filters[@]}"
