#!/usr/bin/env python3
"""Run all test commands and write a Markdown summary without fail-fast."""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path


@dataclass
class CommandResult:
    command: str
    exit_code: int
    duration_seconds: float
    output_tail: str

    @property
    def status(self) -> str:
        return "PASS" if self.exit_code == 0 else "FAIL"


def read_commands(args: argparse.Namespace) -> list[str]:
    commands: list[str] = []
    if args.command:
        commands.extend(args.command)
    if args.commands_file:
        path = Path(args.commands_file)
        if not path.exists():
            raise SystemExit(f"commands file not found: {path}")
        for line in path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                commands.append(stripped)
    return commands


def tail(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[-max_chars:]


def run_command(command: str, cwd: Path, output_tail_chars: int) -> CommandResult:
    started = time.monotonic()
    result = subprocess.run(
        command,
        cwd=cwd,
        shell=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    duration = time.monotonic() - started
    return CommandResult(
        command=command,
        exit_code=result.returncode,
        duration_seconds=duration,
        output_tail=tail(result.stdout or "", output_tail_chars),
    )


def markdown_summary(results: list[CommandResult]) -> str:
    if not results:
        return "\n".join(
            [
                "## CI Test Codegen Test Results",
                "",
                "Final status: `NOT_RUN`",
                "",
                "No test commands were provided.",
                "",
            ]
        )

    final_status = "PASS" if all(result.exit_code == 0 for result in results) else "FAIL"
    lines = [
        "## CI Test Codegen Test Results",
        "",
        f"Final status: `{final_status}`",
        "",
        "| # | Status | Exit | Duration | Command |",
        "| --- | --- | --- | --- | --- |",
    ]
    for index, result in enumerate(results, start=1):
        command = result.command.replace("|", "\\|")
        lines.append(
            f"| {index} | `{result.status}` | `{result.exit_code}` | "
            f"`{result.duration_seconds:.1f}s` | `{command}` |"
        )

    failures = [result for result in results if result.exit_code != 0]
    if failures:
        lines.extend(["", "### Failure Output"])
        for index, result in enumerate(results, start=1):
            if result.exit_code == 0:
                continue
            lines.extend(
                [
                    "",
                    f"#### Command {index}",
                    "",
                    "```text",
                    result.output_tail.strip() or "(no output)",
                    "```",
                ]
            )

    lines.append("")
    return "\n".join(lines)


def final_status(results: list[CommandResult]) -> str:
    if not results:
        return "NOT_RUN"
    return "PASS" if all(result.exit_code == 0 for result in results) else "FAIL"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--command", action="append", help="test command to run; may be repeated")
    parser.add_argument("--commands-file", help="file containing one test command per line")
    parser.add_argument("--summary-file", default="/tmp/ci-test-codegen-test-results.md")
    parser.add_argument("--status-file", default="/tmp/ci-test-codegen-test-status.txt")
    parser.add_argument("--cwd", default=".")
    parser.add_argument("--output-tail-chars", type=int, default=6000)
    parser.add_argument(
        "--exit-zero",
        action="store_true",
        help="always exit 0 after writing summary/status so later CI steps can post comments and push generated tests",
    )
    args = parser.parse_args()

    commands = read_commands(args)
    cwd = Path(args.cwd).resolve()
    results: list[CommandResult] = []
    for command in commands:
        print(f"[ci-test-codegen] running: {command}", flush=True)
        result = run_command(command, cwd, args.output_tail_chars)
        print(
            f"[ci-test-codegen] {result.status}: exit={result.exit_code} "
            f"duration={result.duration_seconds:.1f}s",
            flush=True,
        )
        results.append(result)

    summary = markdown_summary(results)
    summary_path = Path(args.summary_file)
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(summary, encoding="utf-8")
    print(f"[ci-test-codegen] summary written to {summary_path}")

    status = final_status(results)
    status_path = Path(args.status_file)
    status_path.parent.mkdir(parents=True, exist_ok=True)
    status_path.write_text(status + "\n", encoding="utf-8")
    print(f"[ci-test-codegen] final status: {status}")
    print(f"[ci-test-codegen] status written to {status_path}")

    if args.exit_zero:
        return 0
    if status == "NOT_RUN":
        return 2
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
