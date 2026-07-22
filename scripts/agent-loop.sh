#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: scripts/agent-loop.sh <assignment-file>" >&2
  echo "       scripts/agent-loop.sh --resume <run-dir>" >&2
}

resume_mode=0
assignment_file=""
run_dir=""

if [ "$#" -eq 1 ]; then
  assignment_file="$1"
elif [ "$#" -eq 2 ] && [ "$1" = "--resume" ]; then
  resume_mode=1
  run_dir="$2"
else
  usage
  exit 64
fi

if [ "$resume_mode" = "0" ] && [ ! -f "$assignment_file" ]; then
  echo "assignment file not found: $assignment_file" >&2
  exit 66
fi

if [ "$resume_mode" = "1" ] && [ ! -d "$run_dir" ]; then
  echo "run directory not found: $run_dir" >&2
  exit 66
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

max_rounds="${AGENT_MAX_ROUNDS:-3}"
max_minutes="${AGENT_MAX_MINUTES:-0}"
stall_limit="${AGENT_STALL_LIMIT:-2}"
timestamp="$(date +%Y%m%d-%H%M%S)"

if [ "$resume_mode" = "0" ]; then
  run_dir="${AGENT_RUN_DIR:-.agents/runs/$timestamp}"
  mkdir -p "$run_dir"
  cp "$assignment_file" "$run_dir/assignment-1.md"
  {
    printf "started_at=%s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf "assignment_file=%s\n" "$assignment_file"
    printf "repo_root=%s\n" "$repo_root"
  } > "$run_dir/run-meta.txt"
else
  if [ ! -f "$run_dir/assignment-1.md" ]; then
    echo "run directory is missing assignment-1.md: $run_dir" >&2
    exit 66
  fi
fi

run_log="$run_dir/run.log"
touch "$run_log"

timestamp_utc() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

timestamp_local() {
  date '+%H:%M:%S'
}

log() {
  printf '[%s] %s\n' "$(timestamp_local)" "$*" | tee -a "$run_log"
}

section() {
  printf '\n[%s] == %s ==\n' "$(timestamp_local)" "$*" | tee -a "$run_log"
}

write_state() {
  local phase="$1"
  local round_value="$2"
  local detail="${3:-}"

  {
    printf "updated_at=%s\n" "$(timestamp_utc)"
    printf "phase=%s\n" "$phase"
    printf "round=%s\n" "$round_value"
    printf "detail=%s\n" "$detail"
    printf "run_dir=%s\n" "$run_dir"
    printf "run_log=%s\n" "$run_log"
  } > "$run_dir/state.txt"
}

run_with_heartbeat() {
  local label="$1"
  local output_file="$2"
  shift 2

  local heartbeat_seconds="${AGENT_HEARTBEAT_SECONDS:-15}"
  if ! [[ "$heartbeat_seconds" =~ ^[1-9][0-9]*$ ]]; then
    heartbeat_seconds=15
  fi

  : > "$output_file"
  log "$label started"
  log "$label output: $output_file"

  "$@" > >(tee -a "$output_file" "$run_log") 2>&1 &
  local child_pid="$!"
  local started_at
  started_at="$(date +%s)"

  while kill -0 "$child_pid" 2>/dev/null; do
    sleep "$heartbeat_seconds" &
    local sleep_pid="$!"
    wait "$sleep_pid" 2>/dev/null || true
    if kill -0 "$child_pid" 2>/dev/null; then
      local elapsed
      elapsed="$(($(date +%s) - started_at))"
      log "$label still running (${elapsed}s elapsed, pid $child_pid)"
      log "watch live log with: npm run agent:tail -- $run_dir"
    fi
  done

  local status
  if wait "$child_pid"; then
    status=0
  else
    status="$?"
  fi
  log "$label finished with exit code $status"
  return "$status"
}

case "$max_rounds" in
  0 | until-pass | unlimited | forever)
    unbounded_rounds=1
    ;;
  *)
    unbounded_rounds=0
    if ! [[ "$max_rounds" =~ ^[1-9][0-9]*$ ]]; then
      echo "AGENT_MAX_ROUNDS must be a positive integer, 0, until-pass, unlimited, or forever" >&2
      exit 64
    fi
    ;;
esac

if ! [[ "$max_minutes" =~ ^[0-9]+$ ]]; then
  echo "AGENT_MAX_MINUTES must be a non-negative integer" >&2
  exit 64
fi

if ! [[ "$stall_limit" =~ ^[0-9]+$ ]]; then
  echo "AGENT_STALL_LIMIT must be a non-negative integer" >&2
  exit 64
fi

deadline_epoch=0
if [ "$max_minutes" -gt 0 ]; then
  deadline_epoch=$(($(date +%s) + max_minutes * 60))
fi

write_executor_prompt() {
  local round="$1"
  local assignment="$2"
  local review_result="${3:-}"
  local prompt_file="$run_dir/executor-prompt-$round.md"

  {
    cat ".agents/prompts/executor.md"
    printf "\n---\n\n"
    printf "## Current Assignment\n\n"
    cat "$assignment"
    if [ -n "$review_result" ]; then
      printf "\n\n---\n\n"
      printf "## Previous Reviewer Result\n\n"
      cat "$review_result"
    fi
  } > "$prompt_file"

  printf "%s\n" "$prompt_file"
}

write_reviewer_prompt() {
  local round="$1"
  local assignment="$2"
  local executor_report="$3"
  local executor_status="$4"
  local prompt_file="$run_dir/reviewer-prompt-$round.md"

  {
    cat ".agents/prompts/reviewer.md"
    printf "\n---\n\n"
    printf "## Original Assignment\n\n"
    cat "$run_dir/assignment-1.md"
    printf "\n\n---\n\n"
    printf "## Current Round Assignment\n\n"
    cat "$assignment"
    printf "\n\n---\n\n"
    printf "## Executor Exit Status\n\n"
    printf "%s\n" "$executor_status"
    printf "\n---\n\n"
    printf "## Executor Report\n\n"
    cat "$executor_report"
  } > "$prompt_file"

  printf "%s\n" "$prompt_file"
}

normalize_review_json() {
  local raw_file="$1"
  local json_file="$2"

  node - "$raw_file" "$json_file" <<'NODE'
const fs = require('node:fs');

const rawPath = process.argv[2];
const outPath = process.argv[3];
const raw = fs.readFileSync(rawPath, 'utf8').trim();

function fail(message) {
  console.error(message);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    fail(`reviewer output is not JSON: ${rawPath}`);
  }
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch (error) {
    fail(`reviewer output contains invalid JSON: ${error.message}`);
  }
}

const required = [
  'status',
  'summary',
  'blocking_findings',
  'checks_run',
  'next_executor_prompt',
];
for (const key of required) {
  if (!(key in parsed)) {
    fail(`reviewer output is missing required key: ${key}`);
  }
}
if (!['pass', 'fail'].includes(parsed.status)) {
  fail(`reviewer status must be pass or fail, got: ${parsed.status}`);
}
if (!Array.isArray(parsed.blocking_findings)) {
  fail('reviewer blocking_findings must be an array');
}
if (!Array.isArray(parsed.checks_run)) {
  fail('reviewer checks_run must be an array');
}
if (parsed.status === 'fail' && !parsed.next_executor_prompt.trim()) {
  fail('reviewer failed the pass but did not provide next_executor_prompt');
}

fs.writeFileSync(outPath, `${JSON.stringify(parsed, null, 2)}\n`);
NODE
}

json_value() {
  local json_file="$1"
  local expr="$2"
  node - "$json_file" "$expr" <<'NODE'
const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const expr = process.argv[3];
if (expr === 'status') {
  process.stdout.write(data.status);
} else if (expr === 'next_executor_prompt') {
  process.stdout.write(data.next_executor_prompt);
} else {
  process.exit(2);
}
NODE
}

review_fingerprint() {
  local json_file="$1"

  node - "$json_file" <<'NODE'
const crypto = require('node:crypto');
const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const payload = {
  status: data.status,
  summary: data.summary,
  blocking_findings: data.blocking_findings,
};
process.stdout.write(
  crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
);
NODE
}

worktree_fingerprint() {
  {
    git status --porcelain=v1 --untracked-files=all
    git diff --no-ext-diff --binary
    git diff --cached --no-ext-diff --binary
  } | shasum -a 256 | awk '{print $1}'
}

round_limit_reached() {
  local round="$1"
  if [ "$unbounded_rounds" = "1" ]; then
    return 1
  fi
  [ "$round" -ge "$max_rounds" ]
}

deadline_reached() {
  if [ "$deadline_epoch" -eq 0 ]; then
    return 1
  fi
  [ "$(date +%s)" -ge "$deadline_epoch" ]
}

latest_numbered_file() {
  local prefix="$1"
  local suffix="$2"
  local latest=0
  local file base round

  for file in "$run_dir"/"$prefix"-*"$suffix"; do
    [ -e "$file" ] || continue
    base="${file##*/}"
    round="${base#"$prefix"-}"
    round="${round%"$suffix"}"
    if [[ "$round" =~ ^[0-9]+$ ]] && [ "$round" -gt "$latest" ]; then
      latest="$round"
    fi
  done

  printf "%s\n" "$latest"
}

executor_status_for_round() {
  local round="$1"
  local status_file="$run_dir/executor-status-$round.txt"

  if [ -f "$status_file" ]; then
    tr -d '\n' < "$status_file"
  else
    printf "unknown-resumed"
  fi
}

ensure_next_assignment() {
  local previous_round="$1"
  local next_round="$((previous_round + 1))"
  local previous_json="$run_dir/reviewer-result-$previous_round.json"
  local next_assignment="$run_dir/assignment-$next_round.md"

  if [ ! -f "$next_assignment" ]; then
    json_value "$previous_json" next_executor_prompt > "$next_assignment"
  fi

  printf "%s\n" "$next_assignment"
}

section "agent loop boot"
log "run directory: $run_dir"
log "run log: $run_log"
log "status: npm run agent:status -- $run_dir"
log "tail: npm run agent:tail -- $run_dir"
if [ "$resume_mode" = "1" ]; then
  log "resume mode: enabled"
fi
if [ "$unbounded_rounds" = "1" ]; then
  log "round mode: until reviewer pass"
else
  log "max rounds: $max_rounds"
fi
if [ "$stall_limit" -gt 0 ]; then
  log "stall limit: $stall_limit repeated failed review(s) with no worktree change"
fi
if [ "$max_minutes" -gt 0 ]; then
  log "time limit: $max_minutes minute(s)"
fi
write_state "boot" "0" "run initialized"

current_assignment="$run_dir/assignment-1.md"
previous_review=""
previous_failure_fingerprint=""
previous_worktree_fingerprint=""
stall_count=0
round=1
resume_reviewer_pending=0

if [ "$resume_mode" = "1" ]; then
  latest_review_round="$(latest_numbered_file reviewer-result .json)"
  latest_executor_round="$(latest_numbered_file executor-report .md)"

  if [ "$latest_executor_round" -gt "$latest_review_round" ]; then
    round="$latest_executor_round"
    current_assignment="$run_dir/assignment-$round.md"
    if [ ! -f "$current_assignment" ]; then
      echo "cannot resume reviewer; missing assignment for round $round" >&2
      exit 66
    fi
    if [ "$round" -gt 1 ] && [ -f "$run_dir/reviewer-result-$((round - 1)).json" ]; then
      previous_review="$run_dir/reviewer-result-$((round - 1)).json"
    fi
    resume_reviewer_pending=1
    echo "[agent-loop] resuming at reviewer round $round"
  elif [ "$latest_review_round" -gt 0 ]; then
    previous_review="$run_dir/reviewer-result-$latest_review_round.json"
    status="$(json_value "$previous_review" status)"
    if [ "$status" = "pass" ]; then
      section "already passed"
      log "run already passed at round $latest_review_round"
      log "final result: $previous_review"
      if [ "${AGENT_PUSH_ON_PASS:-0}" = "1" ]; then
        section "push approved stage"
        write_state "push" "$latest_review_round" "retrying push for already-passed run"
        log "pushing approved stage"
        scripts/stage-push.sh
      fi
      write_state "passed" "$latest_review_round" "already passed"
      exit 0
    fi
    previous_failure_fingerprint="$(review_fingerprint "$previous_review")"
    previous_worktree_fingerprint="$(worktree_fingerprint)"
    current_assignment="$(ensure_next_assignment "$latest_review_round")"
    round="$((latest_review_round + 1))"
    log "resuming at executor round $round"
  else
    log "resuming from the first executor round"
  fi
fi

while true; do
  if deadline_reached; then
    write_state "failed" "$round" "time limit reached"
    log "time limit reached before round $round; latest review: ${previous_review:-none}" >&2
    exit 1
  fi

  executor_report="$run_dir/executor-report-$round.md"

  if [ "$resume_reviewer_pending" = "1" ]; then
    if [ ! -f "$executor_report" ]; then
      echo "cannot resume reviewer; missing executor report for round $round" >&2
      exit 66
    fi
    executor_status="$(executor_status_for_round "$round")"
    resume_reviewer_pending=0
    section "resume handoff"
    write_state "reviewer" "$round" "using saved executor report"
    log "executor report already exists: $executor_report"
  else
    section "executor round $round"
    write_state "executor" "$round" "building executor prompt"
    executor_prompt="$(write_executor_prompt "$round" "$current_assignment" "$previous_review")"
    log "handoff: assignment -> executor prompt"
    log "assignment: $current_assignment"
    log "executor prompt: $executor_prompt"

    set +e
    write_state "executor" "$round" "executor running"
    run_with_heartbeat "executor round $round" "$executor_report" scripts/executor-run.sh "$executor_prompt"
    executor_status="$?"
    set -e
    printf "%s\n" "$executor_status" > "$run_dir/executor-status-$round.txt"
    log "executor status file: $run_dir/executor-status-$round.txt"
  fi

  section "reviewer round $round"
  write_state "reviewer" "$round" "building reviewer prompt"
  reviewer_prompt="$(write_reviewer_prompt "$round" "$current_assignment" "$executor_report" "$executor_status")"
  reviewer_raw="$run_dir/reviewer-result-$round.raw"
  reviewer_json="$run_dir/reviewer-result-$round.json"
  log "handoff: executor report -> reviewer prompt"
  log "executor report: $executor_report"
  log "reviewer prompt: $reviewer_prompt"

  write_state "reviewer" "$round" "reviewer running"
  set +e
  run_with_heartbeat "reviewer round $round" "$reviewer_raw" scripts/reviewer-run.sh "$reviewer_prompt"
  reviewer_status="$?"
  set -e
  if [ "$reviewer_status" -ne 0 ]; then
    write_state "failed" "$round" "reviewer exited with code $reviewer_status"
    log "reviewer exited with code $reviewer_status"
    log "reviewer raw output: $reviewer_raw"
    exit "$reviewer_status"
  fi
  normalize_review_json "$reviewer_raw" "$reviewer_json"
  log "reviewer normalized result: $reviewer_json"

  status="$(json_value "$reviewer_json" status)"
  if [ "$status" = "pass" ]; then
    section "approved"
    write_state "passed" "$round" "reviewer returned pass"
    log "reviewer passed round $round"
    log "final result: $reviewer_json"
    if [ "${AGENT_PUSH_ON_PASS:-0}" = "1" ]; then
      section "push approved stage"
      write_state "push" "$round" "pushing reviewer-approved stage"
      log "pushing approved stage"
      scripts/stage-push.sh
      write_state "pushed" "$round" "approved stage pushed"
    fi
    exit 0
  fi

  section "needs another executor pass"
  write_state "failed-review" "$round" "reviewer returned fail"
  log "reviewer failed round $round"
  log "reviewer result: $reviewer_json"

  failure_fingerprint="$(review_fingerprint "$reviewer_json")"
  current_worktree_fingerprint="$(worktree_fingerprint)"
  if [ "$stall_limit" -gt 0 ]; then
    if [ "$failure_fingerprint" = "$previous_failure_fingerprint" ] &&
      [ "$current_worktree_fingerprint" = "$previous_worktree_fingerprint" ]; then
      stall_count=$((stall_count + 1))
    else
      stall_count=0
    fi

    if [ "$stall_count" -ge "$stall_limit" ]; then
      write_state "stalled" "$round" "repeated failed review with no worktree change"
      log "stopping: repeated failed review with no worktree change ($stall_count/$stall_limit)" >&2
      log "final failing result: $reviewer_json" >&2
      exit 1
    fi
  fi

  previous_failure_fingerprint="$failure_fingerprint"
  previous_worktree_fingerprint="$current_worktree_fingerprint"

  if round_limit_reached "$round"; then
    write_state "failed" "$round" "max rounds reached"
    log "max rounds reached; final failing result: $reviewer_json" >&2
    exit 1
  fi

  next_assignment="$run_dir/assignment-$((round + 1)).md"
  json_value "$reviewer_json" next_executor_prompt > "$next_assignment"
  log "handoff: reviewer result -> next assignment"
  log "next assignment: $next_assignment"
  current_assignment="$next_assignment"
  previous_review="$reviewer_json"
  round=$((round + 1))
done
