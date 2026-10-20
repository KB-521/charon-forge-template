#!/usr/bin/env python3
"""Post a Markdown file as a GitLab merge request comment."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from ci_context import (
    default_payload_file,
    env as context_env,
    load_agent_config,
    load_payload,
    resolve_field,
)


def env(name: str, fallback: str | None = None) -> str | None:
    value = os.environ.get(name)
    return value if value else fallback


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--comment-file", default=env("CI_MR_COMMENT_FILE", "/tmp/ci-test-codegen-comment.md"))
    parser.add_argument("--payload-file", default=default_payload_file())
    parser.add_argument(
        "--agent-config",
        default=context_env("AGENT_CONFIG") or context_env("CI_AGENT_CONFIG") or "agent.config",
    )
    parser.add_argument("--api-url")
    parser.add_argument("--project-id")
    parser.add_argument("--merge-request-iid")
    parser.add_argument("--token-env", default="GITLAB_TOKEN")
    args = parser.parse_args()

    payload = load_payload(args.payload_file)
    config = load_agent_config(args.agent_config)
    api_url = resolve_field("api_url", explicit=args.api_url, payload=payload, config=config)
    project_id = resolve_field("project_id", explicit=args.project_id, payload=payload, config=config)
    merge_request_iid = resolve_field(
        "merge_request_iid",
        explicit=args.merge_request_iid,
        payload=payload,
        config=config,
    )
    token = resolve_field("token", payload=payload, config=config, token_env=args.token_env)
    missing = [
        name
        for name, value in [
            ("api url", api_url),
            ("project id", project_id),
            ("merge request iid", merge_request_iid),
            (args.token_env, token),
        ]
        if not value
    ]
    if missing:
        print(f"[ci-test-codegen] NOT_CONFIGURED: missing {', '.join(missing)}")
        return 2

    comment_path = Path(args.comment_file)
    if not comment_path.exists():
        print(f"[ci-test-codegen] MR_COMMENT_FAILED: comment file not found: {comment_path}", file=sys.stderr)
        return 1

    body = comment_path.read_text(encoding="utf-8")
    project = urllib.parse.quote(str(project_id), safe="")
    api_url = str(api_url).rstrip("/")
    url = f"{api_url}/projects/{project}/merge_requests/{merge_request_iid}/notes"
    payload = json.dumps({"body": body}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "PRIVATE-TOKEN": str(token),
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response.read()
    except urllib.error.HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        print(
            f"[ci-test-codegen] MR_COMMENT_FAILED: HTTP {error.code}: {details}",
            file=sys.stderr,
        )
        return 1
    except urllib.error.URLError as error:
        print(f"[ci-test-codegen] MR_COMMENT_FAILED: {error.reason}", file=sys.stderr)
        return 1

    print("[ci-test-codegen] POSTED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
