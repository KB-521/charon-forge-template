#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[ci-test-codegen] %s\n' "$*"
}

fail() {
  printf '[ci-test-codegen][FAIL] %s\n' "$*" >&2
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

resolve_context_field() {
  python3 "$SCRIPT_DIR/ci_context.py" --field "$1" 2>/dev/null || true
}

TARGET_BRANCH="$(resolve_context_field target_branch)"
SOURCE_BRANCH="$(resolve_context_field source_branch)"
SOURCE_BRANCH="${SOURCE_BRANCH:-HEAD}"
CHANGED_FILES_OUT="${CI_CHANGED_FILES:-/tmp/changed-files.txt}"
ALL_CHANGED_FILES_OUT="${CI_ALL_CHANGED_FILES:-/tmp/all-changed-files.txt}"
MR_DIFF_OUT="${CI_MR_DIFF:-/tmp/mr.diff}"
REMOTE_NAME="${CI_GIT_REMOTE:-origin}"

if [ -z "$TARGET_BRANCH" ]; then
  fail "target branch is required: set CI_MERGE_REQUEST_TARGET_BRANCH_NAME, gitlabTargetBranch, or TARGET_BRANCH"
fi

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  fail "not inside a git repository"
fi

mkdir -p "$(dirname "$CHANGED_FILES_OUT")" "$(dirname "$ALL_CHANGED_FILES_OUT")" "$(dirname "$MR_DIFF_OUT")"

log "source branch: $SOURCE_BRANCH"
log "target branch: $TARGET_BRANCH"

if ! git rev-parse --verify "$REMOTE_NAME/$TARGET_BRANCH" >/dev/null 2>&1; then
  log "fetching $REMOTE_NAME $TARGET_BRANCH"
  git fetch "$REMOTE_NAME" "$TARGET_BRANCH"
fi

BASE_REF="$REMOTE_NAME/$TARGET_BRANCH"

git diff --name-only --diff-filter=ACMR "$BASE_REF...HEAD" > "$ALL_CHANGED_FILES_OUT"
grep -E '^server/.*/src/main/java/.*\.java$' "$ALL_CHANGED_FILES_OUT" > "$CHANGED_FILES_OUT" || true

if [ -s "$CHANGED_FILES_OUT" ]; then
  mapfile -t backend_java_files < "$CHANGED_FILES_OUT"
  git diff --binary "$BASE_REF...HEAD" -- "${backend_java_files[@]}" > "$MR_DIFF_OUT"
else
  : > "$MR_DIFF_OUT"
fi

log "all changed files written to $ALL_CHANGED_FILES_OUT"
log "backend Java changed files written to $CHANGED_FILES_OUT"
log "backend Java MR diff written to $MR_DIFF_OUT"
