#!/usr/bin/env python3
"""Resolve CI test-codegen context from payload, environment, and agent.config."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
from pathlib import Path
from typing import Any


DEFAULT_PAYLOAD_FILE = "/tmp/gitlab-mr-payload.json"
DEFAULT_AGENT_CONFIG_FILE = "agent.config"


def env(name: str, fallback: str | None = None) -> str | None:
    value = os.environ.get(name)
    return value if value else fallback


def first_nonempty(*values: Any) -> str | None:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return None


def read_json_file(path: str | None) -> dict[str, Any]:
    if not path:
        return {}
    payload_path = Path(path)
    if not payload_path.exists():
        return {}
    return json.loads(payload_path.read_text(encoding="utf-8"))


def default_payload_file() -> str | None:
    configured = env("GITLAB_MR_PAYLOAD")
    if configured:
        return configured
    return DEFAULT_PAYLOAD_FILE if Path(DEFAULT_PAYLOAD_FILE).exists() else None


def load_payload(path: str | None = None) -> dict[str, Any]:
    return read_json_file(path or default_payload_file())


def load_agent_config(path: str | None = None) -> dict[str, str]:
    config_path = Path(path or env("AGENT_CONFIG") or env("CI_AGENT_CONFIG") or DEFAULT_AGENT_CONFIG_FILE)
    if not config_path.exists():
        return {}
    config: dict[str, str] = {}
    for raw_line in config_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export "):].strip()
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'\"")
        if key:
            config[key] = value
    return config


def config_value(config: dict[str, str], *names: str) -> str | None:
    for name in names:
        value = config.get(name)
        if value:
            return value
    return None


def object_attributes(payload: dict[str, Any]) -> dict[str, Any]:
    attrs = payload.get("object_attributes")
    return attrs if isinstance(attrs, dict) else {}


def project(payload: dict[str, Any]) -> dict[str, Any]:
    project_data = payload.get("project")
    return project_data if isinstance(project_data, dict) else {}


def payload_project_id(payload: dict[str, Any]) -> str | None:
    attrs = object_attributes(payload)
    project_data = project(payload)
    return first_nonempty(attrs.get("target_project_id"), project_data.get("id"))


def payload_merge_request_iid(payload: dict[str, Any]) -> str | None:
    return first_nonempty(object_attributes(payload).get("iid"))


def payload_source_branch(payload: dict[str, Any]) -> str | None:
    return first_nonempty(object_attributes(payload).get("source_branch"))


def payload_target_branch(payload: dict[str, Any]) -> str | None:
    return first_nonempty(object_attributes(payload).get("target_branch"))


def api_url_from_payload(payload: dict[str, Any]) -> str | None:
    attrs = object_attributes(payload)
    project_data = project(payload)
    for candidate in (
        project_data.get("web_url"),
        attrs.get("url"),
        project_data.get("git_http_url"),
    ):
        text = first_nonempty(candidate)
        if not text:
            continue
        parsed = urllib.parse.urlparse(text)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}/api/v4"
    return None


def resolve_value(
    explicit: str | None,
    payload_value: str | None,
    env_names: tuple[str, ...],
    config: dict[str, str],
    config_names: tuple[str, ...],
) -> str | None:
    return first_nonempty(
        explicit,
        payload_value,
        *(env(name) for name in env_names),
        config_value(config, *config_names),
    )


def resolve_field(
    field: str,
    *,
    explicit: str | None = None,
    payload: dict[str, Any] | None = None,
    config: dict[str, str] | None = None,
    token_env: str = "GITLAB_TOKEN",
) -> str | None:
    if payload is None:
        payload = load_payload()
    if config is None:
        config = load_agent_config()
    if field == "api_url":
        return resolve_value(
            explicit,
            api_url_from_payload(payload),
            ("GITLAB_API_URL", "CI_API_V4_URL"),
            config,
            ("GITLAB_API_URL", "CI_API_V4_URL"),
        )
    if field == "project_id":
        return resolve_value(
            explicit,
            payload_project_id(payload),
            ("CI_PROJECT_ID", "GITLAB_PROJECT_ID"),
            config,
            ("CI_PROJECT_ID", "GITLAB_PROJECT_ID"),
        )
    if field == "merge_request_iid":
        return resolve_value(
            explicit,
            payload_merge_request_iid(payload),
            ("CI_MERGE_REQUEST_IID", "GITLAB_MERGE_REQUEST_IID"),
            config,
            ("CI_MERGE_REQUEST_IID", "GITLAB_MERGE_REQUEST_IID"),
        )
    if field == "source_branch":
        return resolve_value(
            explicit,
            payload_source_branch(payload),
            ("CI_MERGE_REQUEST_SOURCE_BRANCH_NAME", "gitlabSourceBranch", "SOURCE_BRANCH"),
            config,
            ("CI_MERGE_REQUEST_SOURCE_BRANCH_NAME", "gitlabSourceBranch", "SOURCE_BRANCH"),
        )
    if field == "target_branch":
        return resolve_value(
            explicit,
            payload_target_branch(payload),
            ("CI_MERGE_REQUEST_TARGET_BRANCH_NAME", "gitlabTargetBranch", "TARGET_BRANCH"),
            config,
            ("CI_MERGE_REQUEST_TARGET_BRANCH_NAME", "gitlabTargetBranch", "TARGET_BRANCH"),
        )
    if field == "token":
        return first_nonempty(env(token_env), config_value(config, token_env, "GITLAB_TOKEN"))
    raise ValueError(f"unsupported field: {field}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--field",
        required=True,
        choices=("api_url", "project_id", "merge_request_iid", "source_branch", "target_branch", "token"),
    )
    parser.add_argument("--payload-file", default=default_payload_file())
    parser.add_argument(
        "--agent-config",
        default=env("AGENT_CONFIG") or env("CI_AGENT_CONFIG") or DEFAULT_AGENT_CONFIG_FILE,
    )
    parser.add_argument("--token-env", default="GITLAB_TOKEN")
    args = parser.parse_args()

    payload = load_payload(args.payload_file)
    config = load_agent_config(args.agent_config)
    value = resolve_field(args.field, payload=payload, config=config, token_env=args.token_env)
    if value is None:
        return 1
    if args.field == "token":
        print("[ci-test-codegen] refusing to print token field", file=sys.stderr)
        return 2
    print(value)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
