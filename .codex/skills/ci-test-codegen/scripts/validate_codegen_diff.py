#!/usr/bin/env python3
"""Validate that generated changes only contain allowed Java test files."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


ALLOWED_PATTERN = re.compile(r"^server/[^/]+/src/test/java/.+(Test|IT)\.java$")


def git_lines(repo_root: Path, *args: str) -> list[str]:
    result = subprocess.run(
        ["git", *args],
        cwd=repo_root,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
    )
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def changed_files(repo_root: Path) -> list[str]:
    files = git_lines(repo_root, "diff", "--name-only", "--diff-filter=ACMR", "HEAD")
    files.extend(git_lines(repo_root, "ls-files", "--others", "--exclude-standard"))
    return sorted(set(files))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".")
    parser.add_argument("--json-output", help="optional JSON report path")
    parser.add_argument("--print-files", action="store_true")
    parser.add_argument("--exit-zero", action="store_true", help="write reports but return 0 even when violations exist")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    files = changed_files(repo_root)
    allowed = [path for path in files if ALLOWED_PATTERN.match(path)]
    violations = [path for path in files if not ALLOWED_PATTERN.match(path)]

    report = {
        "status": "PASS" if not violations else "FAIL",
        "changedFiles": files,
        "allowedFiles": allowed,
        "violations": violations,
    }
    if args.json_output:
        output_path = Path(args.json_output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if args.print_files:
        for path in allowed:
            print(path)

    if violations:
        print("[ci-test-codegen][FAIL] disallowed generated changes:", file=sys.stderr)
        for path in violations:
            print(f"- {path}", file=sys.stderr)
        return 0 if args.exit_zero else 1

    print("[ci-test-codegen] PASS: generated diff is within allowed test-code paths")
    return 0


if __name__ == "__main__":
    sys.exit(main())
