#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

assignment="${1:-.agents/prompts/production-readiness-verification.md}"
if [ ! -f "$assignment" ]; then
  echo "assignment file not found: $assignment" >&2
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

echo "[agent-start] assignment: $assignment"
echo "[agent-start] target repo: $GITHUB_TARGET_REPO"
echo "[agent-start] rounds: $AGENT_MAX_ROUNDS"
echo "[agent-start] stall limit: $AGENT_STALL_LIMIT"
echo "[agent-start] push on pass: $AGENT_PUSH_ON_PASS"
echo "[agent-start] monitor: npm run agent:status"
echo "[agent-start] live log: npm run agent:tail"

exec scripts/agent-loop.sh "$assignment"
