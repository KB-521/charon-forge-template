#!/usr/bin/env python3
"""Build Maven test commands from generated or related Java test files."""

from __future__ import annotations

import argparse
import re
import subprocess
from collections import defaultdict
from pathlib import Path


TEST_PATTERN = re.compile(r"^server/([^/]+)/src/test/java/.+/(.+(?:Test|IT))\.java$")
SOURCE_PATTERN = re.compile(r"^server/([^/]+)/src/main/java/.+/([^/]+)\.java$")


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


def read_lines(path: str) -> list[str]:
    file_path = Path(path)
    if not file_path.exists():
        return []
    return [line.strip() for line in file_path.read_text(encoding="utf-8").splitlines() if line.strip()]


def quote_arg(value: str) -> str:
    return "'" + value.replace("'", "'\"'\"'") + "'"


def add_test_path(path: str, module_classes: dict[str, set[str]]) -> bool:
    match = TEST_PATTERN.match(path)
    if not match:
        return False
    module, test_class = match.groups()
    module_classes[module].add(test_class)
    return True


def related_existing_tests(repo_root: Path, source_files: list[str]) -> list[str]:
    related: list[str] = []
    for source_file in source_files:
        match = SOURCE_PATTERN.match(source_file)
        if not match:
            continue
        module, source_class = match.groups()
        test_root = repo_root / "server" / module / "src" / "test" / "java"
        if not test_root.exists():
            continue
        for suffix in ("Test", "IT"):
            related.extend(
                str(path.relative_to(repo_root))
                for path in test_root.rglob(f"{source_class}{suffix}.java")
            )
    return sorted(set(related))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".")
    parser.add_argument("--commands-file", default="/tmp/ci-test-codegen-commands.txt")
    parser.add_argument("--changed-tests-file", default="/tmp/ci-test-codegen-generated-tests.txt")
    parser.add_argument("--selected-tests-file", default="/tmp/ci-test-codegen-selected-tests.txt")
    parser.add_argument("--source-files", default="/tmp/changed-files.txt")
    parser.add_argument("--maven-settings", default="server/tools/maven/settings.xml")
    parser.add_argument("--server-pom", default="server/pom.xml")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    changed_tests: list[str] = []
    selected_tests: set[str] = set()
    module_classes: dict[str, set[str]] = defaultdict(set)

    for path in changed_files(repo_root):
        if add_test_path(path, module_classes):
            changed_tests.append(path)
            selected_tests.add(path)

    for path in related_existing_tests(repo_root, read_lines(args.source_files)):
        if add_test_path(path, module_classes):
            selected_tests.add(path)

    changed_tests_path = Path(args.changed_tests_file)
    changed_tests_path.parent.mkdir(parents=True, exist_ok=True)
    changed_tests_path.write_text(
        "".join(f"{path}\n" for path in changed_tests),
        encoding="utf-8",
    )

    selected_tests_path = Path(args.selected_tests_file)
    selected_tests_path.parent.mkdir(parents=True, exist_ok=True)
    selected_tests_path.write_text(
        "".join(f"{path}\n" for path in sorted(selected_tests)),
        encoding="utf-8",
    )

    commands: list[str] = []
    for module in sorted(module_classes):
        test_classes = ",".join(sorted(module_classes[module]))
        commands.append(
            " ".join(
                [
                    "mvn",
                    "-s",
                    quote_arg(args.maven_settings),
                    "-f",
                    quote_arg(args.server_pom),
                    "-pl",
                    quote_arg(module),
                    "-am",
                    "-Dmaven.test.skip=false",
                    "-DskipTests=false",
                    f"-Dtest={quote_arg(test_classes)}",
                    "-DfailIfNoTests=false",
                    "test",
                ]
            )
        )

    commands_path = Path(args.commands_file)
    commands_path.parent.mkdir(parents=True, exist_ok=True)
    commands_path.write_text("".join(f"{command}\n" for command in commands), encoding="utf-8")

    print(f"[ci-test-codegen] generated test files written to {changed_tests_path}")
    for path in changed_tests:
        print(path)
    print(f"[ci-test-codegen] selected test files written to {selected_tests_path}")
    for path in sorted(selected_tests):
        print(path)
    print(f"[ci-test-codegen] test commands written to {commands_path}")
    for command in commands:
        print(command)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
