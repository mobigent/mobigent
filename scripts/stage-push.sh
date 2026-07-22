#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh is required for stage pushes. Install GitHub CLI first." >&2
  exit 69
fi

if [ -z "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]; then
  echo "GH_TOKEN or GITHUB_TOKEN must be exported for stage pushes." >&2
  exit 78
fi

branch="$(git branch --show-current)"
if [ -z "$branch" ]; then
  echo "stage push requires a named branch; detached HEAD is not supported." >&2
  exit 65
fi

target_owner="${GITHUB_OWNER:-vivekjm}"
default_repo_name="$(basename "$repo_root")"
origin_url="$(git remote get-url origin 2>/dev/null || true)"
if [ -n "$origin_url" ]; then
  origin_without_suffix="${origin_url%.git}"
  default_repo_name="$(basename "$origin_without_suffix")"
fi
repo_name="${GITHUB_REPO_NAME:-$default_repo_name}"
target_repo="${GITHUB_TARGET_REPO:-$target_owner/$repo_name}"
push_branch="${GITHUB_PUSH_BRANCH:-$branch}"
push_url="${GITHUB_PUSH_URL:-https://github.com/$target_repo.git}"

echo "[stage-push] target: $target_repo"
echo "[stage-push] branch: $push_branch"

gh auth status -h github.com >/dev/null
gh auth setup-git -h github.com >/dev/null

has_worktree_changes=0
if ! git diff --quiet ||
  ! git diff --cached --quiet ||
  [ -n "$(git ls-files --others --exclude-standard)" ]; then
  has_worktree_changes=1
fi

commit_on_pass="${AGENT_COMMIT_ON_PASS:-1}"
if [ "$has_worktree_changes" = "1" ]; then
  if [ "$commit_on_pass" != "1" ]; then
    echo "worktree has uncommitted changes and AGENT_COMMIT_ON_PASS is not 1." >&2
    exit 70
  fi

  git add -A
  commit_message="${AGENT_STAGE_COMMIT_MESSAGE:-chore: save approved stage}"
  git commit -m "$commit_message"
else
  echo "[stage-push] no uncommitted changes to commit"
fi

git push "$push_url" "HEAD:$push_branch"
echo "[stage-push] pushed HEAD to $target_repo:$push_branch"
