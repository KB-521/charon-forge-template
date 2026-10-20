#!/usr/bin/env python3
"""Fetch a Yuque document through Open API without MCP."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from html import unescape
from pathlib import Path
from typing import List, Optional, Tuple
from urllib import error, parse, request


DEFAULT_BASE_URL = "https://www.yuque.com"
DEFAULT_TIMEOUT_SECONDS = 20.0
_HTML_HEADING_PATTERN = re.compile(r"<h([1-6])\b[^>]*>(.*?)</h\1>", re.IGNORECASE | re.DOTALL)
_HTML_IGNORE_PATTERN = re.compile(
    r"<[^>]*\blake-read-ignore\b[^>]*>(.*?)</[^>]+>", re.IGNORECASE | re.DOTALL
)
_HTML_TAG_PATTERN = re.compile(r"<[^>]+>")
_MARKDOWN_HEADING_PATTERN = re.compile(r"^(#{1,6})\s*(.+?)\s*$")
_MARKDOWN_HEADING_PREFIX_PATTERN = re.compile(r"^\d+(?:\.\d+)*\.\s+")
_NUMERIC_PREFIX_PATTERN = re.compile(r"^\d+(?:\.\d+)*\.?$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch Yuque document by URL/namespace/doc-id and output markdown/html/json."
    )
    parser.add_argument("--url", help="Yuque document URL, e.g. https://www.yuque.com/group/repo/slug")
    parser.add_argument("--namespace", help="Yuque repo namespace, e.g. group/repo")
    parser.add_argument("--slug", help="Yuque doc slug when using --namespace")
    parser.add_argument("--doc-id", help="Yuque doc id, e.g. 123456")
    parser.add_argument("--repo-id", help="Yuque repo(book) id. Optional for doc-id fetch, auto-resolved for URL/namespace.")
    parser.add_argument(
        "--format",
        choices=["markdown", "html", "json"],
        default="markdown",
        help="Output format. default: markdown",
    )
    parser.add_argument("--output", help="Output file path. If omitted, print to stdout.")
    parser.add_argument("--token", help="Yuque token. Highest priority.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help=f"Yuque base URL. default: {DEFAULT_BASE_URL}")
    parser.add_argument(
        "--timeout",
        type=float,
        default=DEFAULT_TIMEOUT_SECONDS,
        help=f"HTTP timeout seconds. default: {DEFAULT_TIMEOUT_SECONDS}",
    )
    parser.add_argument(
        "--print-meta",
        action="store_true",
        help="Print title/slug/id metadata to stderr after fetching.",
    )
    return parser.parse_args()


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def find_repo_root(start: Path) -> Path:
    for current in [start, *start.parents]:
        if (current / ".git").exists():
            return current
    return start


def load_agent_config(repo_root: Path) -> dict:
    config_path = Path(os.getenv("AGENT_CONFIG") or "agent.config")
    if not config_path.is_absolute():
        config_path = repo_root / config_path
    if not config_path.exists():
        return {}

    values = {}
    try:
        lines = config_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return {}

    for line in lines:
        text = line.strip()
        if not text or text.startswith("#"):
            continue
        if text.startswith("export "):
            text = text[len("export ") :].strip()
        if "=" not in text:
            continue
        key, value = text.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            values[key] = value
    return values


def load_token_from_agent_config(repo_root: Path) -> Optional[str]:
    agent_config = load_agent_config(repo_root)
    if not agent_config:
        return None

    for key in ("YUQUE_TOKEN", "YUQUE_API_TOKEN"):
        value = agent_config.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def resolve_token(args: argparse.Namespace, repo_root: Path) -> str:
    if args.token and args.token.strip():
        return args.token.strip()

    for env_key in ("YUQUE_TOKEN", "YUQUE_API_TOKEN"):
        value = os.getenv(env_key)
        if value and value.strip():
            return value.strip()

    config_token = load_token_from_agent_config(repo_root)
    if config_token:
        return config_token

    fail(
        "Missing token. Provide --token, or set YUQUE_TOKEN/YUQUE_API_TOKEN, "
        "or add YUQUE_TOKEN/YUQUE_API_TOKEN in repo-root agent.config."
    )
    return ""


def normalize_url(url: str) -> str:
    text = url.strip()
    if not text:
        fail("--url is empty")
    if "://" not in text:
        text = f"https://{text}"
    return text


def parse_yuque_url(url: str) -> Tuple[Optional[str], Optional[str], str]:
    parsed = parse.urlparse(normalize_url(url))
    if not parsed.netloc:
        fail(f"Invalid URL: {url}")
    origin = f"{parsed.scheme or 'https'}://{parsed.netloc}"
    path_parts = [part for part in parsed.path.split("/") if part]

    if len(path_parts) >= 4 and path_parts[2] == "docs":
        namespace = parse.unquote(f"{path_parts[0]}/{path_parts[1]}")
        slug = parse.unquote(path_parts[3])
        return namespace, slug, origin

    if len(path_parts) >= 3:
        namespace = parse.unquote(f"{path_parts[0]}/{path_parts[1]}")
        slug = parse.unquote(path_parts[2])
        return namespace, slug, origin

    fail(
        "Cannot parse namespace/slug from --url. Expect URL like "
        "https://www.yuque.com/<group>/<repo>/<slug> or /<group>/<repo>/docs/<slug>."
    )
    return None, None, origin


def resolve_locator(args: argparse.Namespace) -> Tuple[str, Optional[str], Optional[str], str]:
    # Returns: locator_type("repo_doc"/"doc_id"), namespace, slug_or_id, resolved_base_url
    if args.doc_id:
        return "doc_id", None, args.doc_id.strip(), args.base_url.rstrip("/")

    if args.namespace or args.slug:
        if not (args.namespace and args.slug):
            fail("Using --namespace/--slug requires both arguments.")
        return "repo_doc", args.namespace.strip(), args.slug.strip(), args.base_url.rstrip("/")

    if args.url:
        namespace, slug, origin = parse_yuque_url(args.url)
        base_url = args.base_url.rstrip("/")
        if args.base_url == DEFAULT_BASE_URL and origin != DEFAULT_BASE_URL:
            base_url = origin.rstrip("/")
        return "repo_doc", namespace, slug, base_url

    fail("Missing locator. Use one of: --url, --namespace+--slug, or --doc-id.")
    return "", None, None, args.base_url.rstrip("/")


def build_endpoint(locator_type: str, namespace: Optional[str], slug_or_id: Optional[str], base_url: str, fmt: str) -> str:
    if not slug_or_id:
        fail("Document identifier is empty.")

    query = {}
    if locator_type == "repo_doc":
        if not namespace:
            fail("Namespace is required for repo_doc locator.")
        namespace_encoded = parse.quote(namespace, safe="")
        slug_encoded = parse.quote(slug_or_id, safe="")
        endpoint = f"{base_url}/api/v2/repos/{namespace_encoded}/docs/{slug_encoded}"
    else:
        doc_id_encoded = parse.quote(slug_or_id, safe="")
        endpoint = f"{base_url}/api/v2/docs/{doc_id_encoded}"

    # markdown/json use raw body, html uses rendered body_html.
    query["raw"] = "0" if fmt == "html" else "1"
    return f"{endpoint}?{parse.urlencode(query)}"


def build_repo_listing_endpoint(namespace: str, base_url: str) -> str:
    namespace_encoded = parse.quote(namespace, safe="")
    return f"{base_url}/api/v2/repos/{namespace_encoded}/docs?page=1&offset=1"


def resolve_repo_id(namespace: str, base_url: str, token: str, timeout: float) -> str:
    listing_url = build_repo_listing_endpoint(namespace, base_url)
    payload = http_get_json(listing_url, token, timeout)
    repo_id = payload.get("id")
    if repo_id is None:
        fail("Cannot resolve repo id from namespace; API response missing `data.id`.")
    return str(repo_id)


def build_repo_doc_endpoint(repo_id: str, slug: str, base_url: str, fmt: str) -> str:
    repo_encoded = parse.quote(str(repo_id).strip(), safe="")
    slug_encoded = parse.quote(slug, safe="")
    endpoint = f"{base_url}/api/v2/repos/{repo_encoded}/docs/{slug_encoded}"
    query = {"raw": "0" if fmt == "html" else "1"}
    return f"{endpoint}?{parse.urlencode(query)}"


def http_get_json(url: str, token: str, timeout: float) -> dict:
    req = request.Request(
        url=url,
        headers={
            "X-Auth-Token": token,
            "Accept": "application/json",
            "User-Agent": "prd-archive-yuque-fetch/1.0",
        },
        method="GET",
    )
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            payload = resp.read()
            charset = resp.headers.get_content_charset() or "utf-8"
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        fail(f"HTTP {exc.code} when requesting Yuque API: {body}")
    except error.URLError as exc:
        fail(f"Network error when requesting Yuque API: {exc}")

    try:
        data = json.loads(payload.decode(charset, errors="replace"))
    except json.JSONDecodeError:
        fail("Yuque API returned non-JSON response.")

    if not isinstance(data, dict):
        fail("Yuque API response is not an object.")

    if "data" not in data:
        message = data.get("message") if isinstance(data.get("message"), str) else str(data)
        fail(f"Yuque API response missing data field: {message}")

    detail = data["data"]
    if not isinstance(detail, dict):
        fail("Yuque API data field is not an object.")
    return detail


def to_output_text(doc: dict, fmt: str) -> str:
    if fmt == "json":
        return json.dumps(doc, ensure_ascii=False, indent=2) + "\n"

    if fmt == "html":
        body = doc.get("body_html")
        if not isinstance(body, str) or not body.strip():
            body = doc.get("body")
    else:
        body = doc.get("body")
        if not isinstance(body, str) or not body.strip():
            body = doc.get("body_html")
        elif isinstance(doc.get("body_html"), str) and doc.get("body_html").strip():
            body = inject_heading_numbers_from_html(body, doc["body_html"])

    if not isinstance(body, str):
        fail("Document body is empty or invalid in API response.")
    return body if body.endswith("\n") else f"{body}\n"


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_heading_match_key(text: str) -> str:
    return re.sub(r"\s+", "", unescape(text or "")).strip()


def normalize_heading_prefix(prefix: str) -> str:
    raw = re.sub(r"\s+", "", unescape(prefix or "")).strip()
    if not raw:
        return ""
    if _NUMERIC_PREFIX_PATTERN.fullmatch(raw):
        if not raw.endswith("."):
            raw = f"{raw}."
        return raw
    return raw


def extract_numbered_headings(body_html: str) -> List[Tuple[int, str, str]]:
    headings: List[Tuple[int, str, str]] = []
    for match in _HTML_HEADING_PATTERN.finditer(body_html):
        level = int(match.group(1))
        inner_html = match.group(2)

        prefix_parts = _HTML_IGNORE_PATTERN.findall(inner_html)
        prefix_raw = "".join(_HTML_TAG_PATTERN.sub("", part) for part in prefix_parts)
        prefix = normalize_heading_prefix(prefix_raw)

        title_html = _HTML_IGNORE_PATTERN.sub("", inner_html)
        title_text = normalize_whitespace(unescape(_HTML_TAG_PATTERN.sub("", title_html)))
        if not title_text:
            continue

        headings.append((level, title_text, prefix))
    return headings


def inject_heading_numbers_from_html(markdown_body: str, body_html: str) -> str:
    numbered_headings = extract_numbered_headings(body_html)
    if not numbered_headings:
        return markdown_body

    lines = markdown_body.splitlines(keepends=True)
    output_lines = []
    cursor = 0

    for line in lines:
        stripped = line.rstrip("\n")
        heading_match = _MARKDOWN_HEADING_PATTERN.match(stripped)
        if not heading_match:
            output_lines.append(line)
            continue

        hashes = heading_match.group(1)
        level = len(hashes)
        title = heading_match.group(2).strip()

        matched_index = None
        title_key = normalize_heading_match_key(title)
        for index in range(cursor, len(numbered_headings)):
            html_level, html_title, _ = numbered_headings[index]
            if html_level != level:
                continue
            if normalize_heading_match_key(html_title) == title_key:
                matched_index = index
                break

        if matched_index is None:
            output_lines.append(line)
            continue

        cursor = matched_index + 1
        prefix = numbered_headings[matched_index][2]
        if not prefix or _MARKDOWN_HEADING_PREFIX_PATTERN.match(title):
            output_lines.append(line)
            continue

        new_line = f"{hashes} {prefix} {title}"
        if line.endswith("\n"):
            new_line += "\n"
        output_lines.append(new_line)

    return "".join(output_lines)


def write_output(content: str, output: Optional[str]) -> None:
    if output:
        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(content, encoding="utf-8")
        return
    sys.stdout.write(content)


def print_meta(doc: dict) -> None:
    title = doc.get("title")
    slug = doc.get("slug")
    doc_id = doc.get("id")
    print(f"meta: id={doc_id}, slug={slug}, title={title}", file=sys.stderr)


def main() -> int:
    args = parse_args()
    repo_root = find_repo_root(Path.cwd())
    token = resolve_token(args, repo_root)
    locator_type, namespace, slug_or_id, base_url = resolve_locator(args)
    if locator_type == "repo_doc":
        if not namespace or not slug_or_id:
            fail("Missing namespace or slug for repo_doc locator.")
        repo_id = args.repo_id.strip() if isinstance(args.repo_id, str) and args.repo_id.strip() else resolve_repo_id(namespace, base_url, token, args.timeout)
        endpoint = build_repo_doc_endpoint(repo_id, slug_or_id, base_url, args.format)
    elif locator_type == "doc_id":
        if isinstance(args.repo_id, str) and args.repo_id.strip():
            endpoint = build_repo_doc_endpoint(args.repo_id.strip(), slug_or_id or "", base_url, args.format)
        else:
            endpoint = build_endpoint(locator_type, namespace, slug_or_id, base_url, args.format)
    else:
        endpoint = build_endpoint(locator_type, namespace, slug_or_id, base_url, args.format)
    doc = http_get_json(endpoint, token, args.timeout)
    content = to_output_text(doc, args.format)
    write_output(content, args.output)
    if args.print_meta:
        print_meta(doc)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
