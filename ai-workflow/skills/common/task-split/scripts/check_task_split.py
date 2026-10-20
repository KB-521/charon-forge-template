#!/usr/bin/env python3
"""Validate task-split skill references and rule structure."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REFERENCES_DIR = ROOT / "references"
COMMON_DIR = REFERENCES_DIR / "common"
BACKEND_DIR = REFERENCES_DIR / "backend"
FRONTEND_DIR = REFERENCES_DIR / "frontend"
REQUIRED_BACKEND_FILES = {
    "granularity.md",
    "dependency.md",
    "templates.md",
    "gates.md",
}
REQUIRED_COMMON_FILES = {
    "task-document-structure.md",
    "parallel-boundary.md",
    "resume-summary.md",
    "template-blocks.md",
}
REQUIRED_FRONTEND_FILES = {
    "page-slicing.md",
    "dependency-and-parallel.md",
    "templates.md",
    "gates.md",
}
REQUIRED_TEMPLATE_SECTIONS = [
    "## Complexity / 复杂度",
    "## Subtask Complexity Budget",
    "## Refinement Plan / 细化计划",
    "## SQL Namespace",
    "## Task Type",
    "## Subtask Complexity",
    "Refinement Level：Full / Outline",
    "../common/template-blocks.md",
]
STALE_FILES = [
    REFERENCES_DIR / "backend.md",
    REFERENCES_DIR / "frontend.md",
    BACKEND_DIR / "complexity-model.md",
    BACKEND_DIR / "task-types.md",
    BACKEND_DIR / "slicing-strategy.md",
    BACKEND_DIR / "dependency-graph.md",
    BACKEND_DIR / "parallel-execution.md",
]


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def validate_index(directory: Path, required_files: set[str], label: str, errors: list[str]) -> None:
    index = directory / "INDEX.md"
    if not index.exists():
        errors.append(f"missing {label}/INDEX.md")
        return

    text = read(index)
    refs = set(re.findall(r"`([^`]+\.md)`", text))
    missing_refs = required_files - refs
    for name in sorted(missing_refs):
        errors.append(f"{label} index missing reference: {name}")

    for name in sorted(required_files):
        path = directory / name
        if not path.exists():
            errors.append(f"missing {label} rule file: {name}")

    local = {path.name for path in directory.glob("*.md") if path.name != "INDEX.md"}
    for name in sorted(local - required_files):
        errors.append(f"unexpected {label} rule file: {name}")


def validate_templates(errors: list[str]) -> None:
    path = BACKEND_DIR / "templates.md"
    if not path.exists():
        return
    text = read(path)
    for section in REQUIRED_TEMPLATE_SECTIONS:
        if section not in text:
            errors.append(f"templates.md missing section: {section}")


def validate_no_stale_files(errors: list[str]) -> None:
    for stale in STALE_FILES:
        if stale.exists():
            errors.append(f"stale task-split file still exists: {rel(stale)}")

    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in {".md", ".py"}:
            continue
        if path == Path(__file__).resolve():
            continue
        text = read(path)
        if "references/backend.md" in text:
            errors.append(f"stale backend.md reference: {rel(path)}")
        if "references/frontend.md" in text:
            errors.append(f"stale frontend.md reference: {rel(path)}")
        for stale_name in [
            "complexity-model.md",
            "task-types.md",
            "slicing-strategy.md",
            "dependency-graph.md",
            "parallel-execution.md",
        ]:
            if stale_name in text:
                errors.append(f"stale backend split reference {stale_name}: {rel(path)}")


def validate_adaptive_granularity(errors: list[str]) -> None:
    for path in [BACKEND_DIR / "granularity.md", BACKEND_DIR / "gates.md"]:
        if not path.exists():
            continue
        text = read(path)
        if "Split Budget" not in text:
            errors.append(f"missing Split Budget wording: {rel(path)}")
        if "Subtask Complexity" not in text:
            errors.append(f"missing Subtask Complexity wording: {rel(path)}")
    backend_text = "\n".join(read(path) for path in BACKEND_DIR.glob("*.md"))
    banned = ["至少 3 个", "至少3个", "至少 3个", "至少3 个"]
    for phrase in banned:
        if phrase in backend_text:
            errors.append(f"fixed minimum child task count remains: {phrase}")


def main() -> int:
    errors: list[str] = []
    validate_index(COMMON_DIR, REQUIRED_COMMON_FILES, "common", errors)
    validate_index(BACKEND_DIR, REQUIRED_BACKEND_FILES, "backend", errors)
    validate_index(FRONTEND_DIR, REQUIRED_FRONTEND_FILES, "frontend", errors)
    validate_templates(errors)
    validate_no_stale_files(errors)
    validate_adaptive_granularity(errors)

    if errors:
        print("Task-split validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Task-split validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
