# Reviewer/Executor Loop

This repository includes a local two-agent loop for production-readiness work. The executor implements changes. The reviewer independently verifies the result, writes a pass/fail JSON report, and either ends the run or creates the next focused executor assignment.

## Files

- `.agents/prompts/executor.md`: executor role contract.
- `.agents/prompts/reviewer.md`: reviewer role contract.
- `.agents/prompts/production-readiness-verification.md`: ready-to-run verification assignment.
- `.agents/schemas/review-result.schema.json`: machine-readable reviewer output contract.
- `scripts/executor-run.sh`: executor CLI wrapper.
- `scripts/reviewer-run.sh`: reviewer CLI wrapper.
- `scripts/agent-loop.sh`: round-based baton runner.
- `scripts/stage-push.sh`: optional reviewer-approved commit and push hook.
- `.agents/runs/`: generated reports and prompts, ignored by Git.

## Start The Loop

Simple start:

```bash
export GH_TOKEN=<token>
npm run agent:start
```

Simple resume after restart:

```bash
export GH_TOKEN=<token>
npm run agent:resume:last
```

Watch progress from another terminal:

```bash
npm run agent:status
npm run agent:tail
```

The simple commands default to:

- Until reviewer pass.
- Stall limit of `3`.
- Push approved stages to `vivekjm/mobigent`.
- Executor endpoint `https://api.deepseek.com/anthropic`.
- Assignment `.agents/prompts/production-readiness-verification.md`.
- Live status in `.agents/runs/<run-id>/state.txt`.
- Live transcript in `.agents/runs/<run-id>/run.log`.

Explicit start:

```bash
npm run agent:loop -- .agents/prompts/production-readiness-verification.md
```

Each run creates a timestamped folder under `.agents/runs/` containing:

- `assignment-N.md`
- `executor-prompt-N.md`
- `executor-report-N.md`
- `executor-status-N.txt`
- `reviewer-prompt-N.md`
- `reviewer-result-N.raw`
- `reviewer-result-N.json`
- `run-meta.txt`

The loop exits `0` when the reviewer returns `pass`. It exits `1` if the reviewer still returns `fail` after the configured maximum rounds, if the optional time limit is reached, or if the stall detector sees repeated failed reviews with no worktree progress.

## Resume After Restart

Resume from the saved run directory:

```bash
npm run agent:resume -- .agents/runs/<run-id>
```

Find the latest run directory:

```bash
ls -td .agents/runs/*/ | head -1
```

For an until-pass run with push-on-pass enabled:

```bash
export GH_TOKEN=<token>
AGENT_MAX_ROUNDS=until-pass \
  AGENT_PUSH_ON_PASS=1 \
  GITHUB_TARGET_REPO=vivekjm/mobigent \
  CLAUDE_BASE_URL=https://api.deepseek.com/anthropic \
  npm run agent:resume -- .agents/runs/<run-id>
```

Resume behavior:

- If the last saved step is an executor report, the loop resumes at reviewer verification for that same round.
- If the last saved step is a failed reviewer result, the loop writes or reuses the next executor assignment and continues.
- If the last saved reviewer result is `pass`, the loop exits successfully. With `AGENT_PUSH_ON_PASS=1`, it also retries the approved-stage push.
- If interruption happened during executor execution before a report was saved, the loop reruns that executor round.

## Configuration

Set these environment variables when needed:

```bash
AGENT_MAX_ROUNDS=5 npm run agent:loop -- path/to/assignment.md
AGENT_MAX_ROUNDS=until-pass npm run agent:loop -- path/to/assignment.md
AGENT_MAX_ROUNDS=0 npm run agent:loop -- path/to/assignment.md
AGENT_STALL_LIMIT=3 npm run agent:loop -- path/to/assignment.md
AGENT_MAX_MINUTES=180 npm run agent:loop -- path/to/assignment.md
AGENT_PUSH_ON_PASS=1 GH_TOKEN=<token> GITHUB_TARGET_REPO=vivekjm/mobigent npm run agent:loop -- path/to/assignment.md
AGENT_RUN_DIR=.agents/runs/manual-check npm run agent:loop -- path/to/assignment.md
CLAUDE_BASE_URL=https://api.deepseek.com/anthropic npm run agent:loop -- path/to/assignment.md
EXECUTOR_BIN=claude npm run agent:loop -- path/to/assignment.md
REVIEWER_BIN=<reviewer-cli> npm run agent:loop -- path/to/assignment.md
GH_TOKEN=<token> npm run agent:start
GH_TOKEN=<token> npm run agent:resume:last
```

Use `EXECUTOR_CMD` or `REVIEWER_CMD` for fully custom commands. The command must read the prompt from stdin and write the final report to stdout.

`AGENT_MAX_ROUNDS=until-pass` and `AGENT_MAX_ROUNDS=0` remove the fixed round cap. In that mode, the definition of done is still the reviewer returning `pass`.

`AGENT_STALL_LIMIT` defaults to `2`. It stops the loop when the reviewer returns the same failed result and the worktree has not changed for that many consecutive failed reviews. Set it to `0` only when you deliberately want to disable stall protection.

`AGENT_MAX_MINUTES` defaults to `0`, which means no time limit. Use it for long autonomous runs when cost or wall-clock time matters.

## Push Approved Stages

Set `AGENT_PUSH_ON_PASS=1` when each reviewer-approved stage should be committed and pushed automatically.

```bash
export GH_TOKEN=<token>
AGENT_MAX_ROUNDS=until-pass \
  AGENT_PUSH_ON_PASS=1 \
  GITHUB_TARGET_REPO=vivekjm/mobigent \
  CLAUDE_BASE_URL=https://api.deepseek.com/anthropic \
  npm run agent:loop -- .agents/prompts/production-readiness-verification.md
```

The push hook:

- Requires `gh` and `GH_TOKEN` or `GITHUB_TOKEN`.
- Uses `gh auth setup-git` so the token is not embedded in the Git remote URL.
- Defaults to `GITHUB_OWNER=vivekjm`.
- Infers the repository name from `origin`, so this checkout defaults to `vivekjm/mobigent`.
- Commits pending worktree changes with `chore: save approved stage`.
- Pushes `HEAD` to the current branch name unless `GITHUB_PUSH_BRANCH` is set.

Run push-on-pass from a dedicated worktree or a branch where all uncommitted files belong to the current stage. To push only existing commits and fail when the worktree is dirty, set `AGENT_COMMIT_ON_PASS=0`.

Never write GitHub tokens into prompts, repo files, run artifacts, or commit messages. Keep them in the shell environment or your local credential manager.

To push an already-approved stage manually:

```bash
GH_TOKEN=<token> GITHUB_TARGET_REPO=vivekjm/mobigent npm run agent:push
```

## Safety Model

- The executor wrapper starts in bypass-permissions mode because the executor is expected to edit and run commands.
- The reviewer wrapper runs in read-only sandbox mode by default.
- The reviewer prompt explicitly forbids edits during review.
- The loop validates reviewer JSON before deciding pass/fail.
- The loop never rewrites history. It commits and pushes only when `AGENT_PUSH_ON_PASS=1` is explicitly set.

For sensitive work, run the loop in a disposable worktree, container, or VM.

## Manual Recovery

Prefer `npm run agent:resume -- .agents/runs/<run-id>`. If you need to inspect or recover manually, the prompts and reports are plain Markdown/JSON files:

```bash
npm run agent:executor -- .agents/runs/<run-id>/executor-prompt-N.md
npm run agent:reviewer -- .agents/runs/<run-id>/reviewer-prompt-N.md
```
