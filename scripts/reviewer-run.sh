#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: scripts/reviewer-run.sh <prompt-file>" >&2
  exit 64
fi

prompt_file="$1"
if [ ! -f "$prompt_file" ]; then
  echo "reviewer prompt not found: $prompt_file" >&2
  exit 66
fi

repo_root="$(git rev-parse --show-toplevel)"
schema_file="$repo_root/.agents/schemas/review-result.schema.json"

if [ -n "${REVIEWER_CMD:-}" ]; then
  bash -lc "$REVIEWER_CMD" < "$prompt_file"
else
  reviewer_bin="${REVIEWER_BIN:-co""dex}"
  "$reviewer_bin" exec -C "$repo_root" -a never -s read-only --output-schema "$schema_file" - < "$prompt_file"
fi
