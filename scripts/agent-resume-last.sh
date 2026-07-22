#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

run_dir="${1:-}"
if [ -z "$run_dir" ]; then
  run_dir="$(ls -td .agents/runs/*/ 2>/dev/null | head -1 || true)"
fi

if [ -z "$run_dir" ]; then
  echo "no run directories found under .agents/runs/" >&2
  exit 66
fi

export AGENT_MAX_ROUNDS="${AGENT_MAX_ROUNDS:-until-pass}"
export AGENT_STALL_LIMIT="${AGENT_STALL_LIMIT:-3}"
export AGENT_PUSH_ON_PASS="${AGENT_PUSH_ON_PASS:-1}"
export GITHUB_TARGET_REPO="${GITHUB_TARGET_REPO:-vivekjm/mobigent}"
export CLAUDE_BASE_URL="${CLAUDE_BASE_URL:-https://api.deepseek.com/anthropic}"

if [ "$AGENT_PUSH_ON_PASS" = "1" ] && [ -z "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]; then
  echo "GH_TOKEN or GITHUB_TOKEN must be exported when AGENT_PUSH_ON_PASS=1." >&2
  echo "Run: export GH_TOKEN=<your-token>" >&2
  exit 78
fi

echo "[agent-resume] run directory: $run_dir"
echo "[agent-resume] target repo: $GITHUB_TARGET_REPO"
echo "[agent-resume] rounds: $AGENT_MAX_ROUNDS"
echo "[agent-resume] stall limit: $AGENT_STALL_LIMIT"
echo "[agent-resume] push on pass: $AGENT_PUSH_ON_PASS"
echo "[agent-resume] monitor: npm run agent:status -- $run_dir"
echo "[agent-resume] live log: npm run agent:tail -- $run_dir"

exec scripts/agent-loop.sh --resume "$run_dir"
