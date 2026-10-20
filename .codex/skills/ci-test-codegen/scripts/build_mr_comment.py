#!/usr/bin/env python3
"""Build a GitLab MR comment for CI test-codegen results."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from ci_context import (
    default_payload_file,
    env as context_env,
    load_agent_config,
    load_payload,
    resolve_field,
)


def env(name: str, fallback: str = "") -> str:
    return os.environ.get(name) or fallback


def read_text(path: str | None, fallback: str = "") -> str:
    if not path:
        return fallback
    file_path = Path(path)
    if not file_path.exists():
        return fallback
    return file_path.read_text(encoding="utf-8")


def read_json(path: str | None) -> dict:
    if not path:
        return {}
    file_path = Path(path)
    if not file_path.exists():
        return {}
    return json.loads(file_path.read_text(encoding="utf-8"))


def markdown_list(items: list[str], empty: str) -> list[str]:
    if not items:
        return [f"- {empty}"]
    return [f"- `{item}`" for item in items]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-file", default=env("CI_MR_COMMENT_FILE", "/tmp/ci-test-codegen-comment.md"))
    parser.add_argument("--changed-files", default=env("CI_CHANGED_FILES", "/tmp/changed-files.txt"))
    parser.add_argument("--test-results-file", default="/tmp/ci-test-codegen-test-results.md")
    parser.add_argument("--test-status-file", default="/tmp/ci-test-codegen-test-status.txt")
    parser.add_argument("--diff-report-file", default="/tmp/ci-test-codegen-diff-report.json")
    parser.add_argument("--payload-file", default=default_payload_file())
    parser.add_argument(
        "--agent-config",
        default=context_env("AGENT_CONFIG") or context_env("CI_AGENT_CONFIG") or "agent.config",
    )
    parser.add_argument("--source-branch")
    parser.add_argument("--target-branch")
    args = parser.parse_args()

    payload = load_payload(args.payload_file)
    config = load_agent_config(args.agent_config)
    source_branch = resolve_field("source_branch", explicit=args.source_branch, payload=payload, config=config)
    target_branch = resolve_field("target_branch", explicit=args.target_branch, payload=payload, config=config)
    test_results = read_text(args.test_results_file, "No test result summary was generated.")
    test_status = read_text(args.test_status_file, "UNKNOWN").strip() or "UNKNOWN"
    diff_report = read_json(args.diff_report_file)
    allowed_files = diff_report.get("allowedFiles", [])
    diff_status = diff_report.get("status", "UNKNOWN")

    lines = [
        "## CI Test Codegen Result",
        "",
        f"- Source branch: `{source_branch or 'unknown'}`",
        f"- Target branch: `{target_branch or 'unknown'}`",
        f"- Test status: `{test_status}`",
        f"- Diff safety status: `{diff_status}`",
        "",
        "### Generated Test Files",
        *markdown_list(allowed_files, "No generated Java test files detected."),
        "",
        test_results.strip(),
        "",
    ]

    output = Path(args.output_file)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines), encoding="utf-8")
    print(f"[ci-test-codegen] MR comment written to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
