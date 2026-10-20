#!/usr/bin/env python3
"""Validate server skill rule indexes and rule files."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RULES_DIRS = sorted(
    path
    for path in ROOT.glob("*/references/rules")
    if not path.parts[-3].startswith("_")
)
BANNED_PATTERNS = [
    "rule" + "-map.md",
    "rule" + "-map",
    "implementation" + "-rules.md",
    "entry" + "-rules.md",
    "persistence" + "-rules.md",
    "08-" + "日志规范",
    "09-" + "注释文档",
    "13-" + "测试质量",
    "07-" + "上下文租户",
    "11-" + "异步任务",
    "12-" + "外部集成",
    "05-" + "Service",
    "06-" + "DAO",
]
REQUIRED_HEADINGS = ("## 适用场景", "## 命中条件")
BACKTICK_RE = re.compile(r"`([^`]+)`")
REFERENCE_RE = re.compile(r"`([^`]+\.md)`")


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def referenced_rule_files(index: Path) -> set[Path]:
    refs: set[Path] = set()
    for match in REFERENCE_RE.finditer(index.read_text(encoding="utf-8")):
        raw = match.group(1)
        if "/" in raw:
            continue
        candidate = (index.parent / raw).resolve()
        if ROOT in candidate.parents or candidate == ROOT:
            refs.add(candidate)
    return refs


def validate_index(rules_dir: Path, errors: list[str]) -> None:
    index = rules_dir / "INDEX.md"
    if not index.exists():
        errors.append(f"missing rules index: {rel(rules_dir)}")
        return

    text = index.read_text(encoding="utf-8")
    for match in BACKTICK_RE.finditer(text):
        raw = match.group(1)
        if "/" in raw or raw.startswith(".") or "templates" in raw:
            errors.append(
                f"rules index must reference local rule files only: {rel(index)} -> {raw}"
            )

    refs = referenced_rule_files(index)
    for ref in refs:
        if not ref.exists():
            errors.append(f"missing referenced rule file: {rel(index)} -> {ref}")

    local_rules = {
        path.resolve()
        for path in rules_dir.glob("*.md")
        if path.name != "INDEX.md"
    }
    unreferenced = sorted(local_rules - refs)
    for path in unreferenced:
        errors.append(f"unreferenced rule file: {rel(path)}")


def validate_rule_file(path: Path, errors: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    for heading in REQUIRED_HEADINGS:
        if heading not in text:
            errors.append(f"missing heading {heading!r}: {rel(path)}")
    if "## 门禁" not in text and "## 交付要求" not in text:
        errors.append(f"missing gate or delivery section: {rel(path)}")


def validate_banned_references(errors: list[str]) -> None:
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path == Path(__file__).resolve():
            continue
        if path.suffix not in {".md", ".py", ".json", ".sql"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in BANNED_PATTERNS:
            if pattern in text:
                errors.append(f"banned reference {pattern!r}: {rel(path)}")


def main() -> int:
    errors: list[str] = []

    if not RULES_DIRS:
        errors.append("no rules directories found")

    for rules_dir in RULES_DIRS:
        validate_index(rules_dir, errors)
        for path in rules_dir.glob("*.md"):
            if path.name != "INDEX.md":
                validate_rule_file(path, errors)

    validate_banned_references(errors)

    if errors:
        print("Rule validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Rule validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
