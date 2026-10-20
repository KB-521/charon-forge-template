#!/usr/bin/env python3
"""Commit and push generated Java test files back to the MR source branch."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

from ci_context import (
    default_payload_file,
    env as context_env,
    load_agent_config,
    load_payload,
    resolve_field,
)
from validate_codegen_diff import ALLOWED_PATTERN, changed_files


def run(repo_root: Path, args: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=repo_root,
        check=check,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )


def env(name: str, fallback: str | None = None) -> str | None:
    value = os.environ.get(name)
    return value if value else fallback


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".")
    parser.add_argument("--message", default="test: generate CI tests [ci-generated-tests] [skip ci]")
    parser.add_argument("--payload-file", default=default_payload_file())
    parser.add_argument(
        "--agent-config",
        default=context_env("AGENT_CONFIG") or context_env("CI_AGENT_CONFIG") or "agent.config",
    )
    parser.add_argument("--source-branch")
    parser.add_argument("--remote", default=env("CI_GIT_REMOTE", "origin"))
    parser.add_argument("--user-name", default=env("GITLAB_BOT_NAME", "ci-test-codegen-bot"))
    parser.add_argument("--user-email", default=env("GITLAB_BOT_EMAIL", "ci-test-codegen-bot@example.invalid"))
    parser.add_argument("--no-push", action="store_true")
    args = parser.parse_args()

    payload = load_payload(args.payload_file)
    config = load_agent_config(args.agent_config)
    source_branch = resolve_field("source_branch", explicit=args.source_branch, payload=payload, config=config)
    repo_root = Path(args.repo_root).resolve()
    files = changed_files(repo_root)
    violations = [path for path in files if not ALLOWED_PATTERN.match(path)]
    if violations:
        print("[ci-test-codegen] PUSH_SKIPPED: disallowed changes present", file=sys.stderr)
        for path in violations:
            print(f"- {path}", file=sys.stderr)
        return 1

    allowed = [path for path in files if ALLOWED_PATTERN.match(path)]
    if not allowed:
        print("[ci-test-codegen] NO_CHANGES")
        return 0

    if not source_branch:
        print("[ci-test-codegen] PUSH_SKIPPED: source branch is missing", file=sys.stderr)
        return 1

    run(repo_root, ["git", "config", "user.name", args.user_name])
    run(repo_root, ["git", "config", "user.email", args.user_email])
    run(repo_root, ["git", "add", "--", *allowed])

    diff_cached = run(repo_root, ["git", "diff", "--cached", "--quiet"], check=False)
    if diff_cached.returncode == 0:
        print("[ci-test-codegen] NO_CHANGES")
        return 0

    run(repo_root, ["git", "commit", "-m", args.message])
    if args.no_push:
        print("[ci-test-codegen] PUSH_SKIPPED: --no-push")
        return 0

    push_result = run(repo_root, ["git", "push", args.remote, f"HEAD:{source_branch}"], check=False)
    if push_result.returncode != 0:
        print("[ci-test-codegen] PUSH_FAILED", file=sys.stderr)
        print(push_result.stdout, file=sys.stderr)
        return push_result.returncode

    print("[ci-test-codegen] PUSHED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
