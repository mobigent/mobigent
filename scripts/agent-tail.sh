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

log_file="$run_dir/run.log"
touch "$log_file"
echo "Tailing $log_file"
tail -f "$log_file"
