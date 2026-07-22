#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: scripts/executor-run.sh <prompt-file>" >&2
  exit 64
fi

prompt_file="$1"
if [ ! -f "$prompt_file" ]; then
  echo "executor prompt not found: $prompt_file" >&2
  exit 66
fi

repo_root="$(git rev-parse --show-toplevel)"

if [ -n "${CLAUDE_BASE_URL:-}" ]; then
  export ANTHROPIC_BASE_URL="$CLAUDE_BASE_URL"
fi

if [ -n "${EXECUTOR_CMD:-}" ]; then
  bash -lc "$EXECUTOR_CMD" < "$prompt_file"
else
  executor_bin="${EXECUTOR_BIN:-claude}"
  "$executor_bin" --print --dangerously-skip-permissions --add-dir "$repo_root" < "$prompt_file"
fi
