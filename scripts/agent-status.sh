#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

run_dir="${1:-}"
if [ -z "$run_dir" ]; then
  run_dir="$(ls -td .agents/runs/*/ 2>/dev/null | head -1 || true)"
fi

if [ -z "$run_dir" ] || [ ! -d "$run_dir" ]; then
  echo "no run directory found" >&2
  exit 66
fi

echo "Run: $run_dir"

if [ -f "$run_dir/state.txt" ]; then
  echo
  echo "State:"
  sed 's/^/  /' "$run_dir/state.txt"
else
  echo
  echo "State: not written yet"
fi

echo
echo "Latest artifacts:"
find "$run_dir" -maxdepth 1 -type f \
  \( -name 'assignment-*.md' \
  -o -name 'executor-prompt-*.md' \
  -o -name 'executor-report-*.md' \
  -o -name 'executor-status-*.txt' \
  -o -name 'reviewer-prompt-*.md' \
  -o -name 'reviewer-result-*.json' \) \
  | sort \
  | tail -20 \
  | sed 's/^/  /'

if [ -f "$run_dir/run.log" ]; then
  echo
  echo "Recent log:"
  tail -40 "$run_dir/run.log" | sed 's/^/  /'
fi
