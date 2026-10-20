#!/usr/bin/env python3
"""Generate dictionary insert SQL and enums from physical schema.

Rules:
- Scan CREATE TABLE columns in schema SQL.
- Pick columns whose name indicates type/status semantics.
- Extract enum codes from column comment/default value.
- Write dictionary insert SQL to the configured output path.
- Write enum classes to the configured enum output directory.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


TABLE_RE = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`(?P<table>[A-Z0-9_]+)`\s*\((?P<body>.*?)\)\s*(?=(?:ENGINE|DEFAULT|CHARSET|COLLATE|COMMENT|ROW_FORMAT|PARTITION|;))[^;]*;",
    re.IGNORECASE | re.DOTALL,
)
ALTER_TABLE_RE = re.compile(
    r"ALTER\s+TABLE\s+`(?P<table>[A-Z0-9_]+)`\s+(?P<body>.*?);",
    re.IGNORECASE | re.DOTALL,
)
COLUMN_RE = re.compile(r"^\s*`(?P<name>[A-Z0-9_]+)`\s+(?P<type>[^\s,]+(?:\([^\)]*\))?)(?P<rest>.*)$", re.IGNORECASE)
ADD_COLUMN_RE = re.compile(
    r"ADD\s+COLUMN\s+`(?P<name>[A-Z0-9_]+)`\s+(?P<type>[^\s,]+(?:\([^\)]*\))?)(?P<rest>.*?)(?=,\s*ADD\s+COLUMN\b|,\s*ADD\s+(?:KEY|INDEX|UNIQUE|PRIMARY|CONSTRAINT|FULLTEXT|SPATIAL)\b|$)",
    re.IGNORECASE | re.DOTALL,
)
COMMENT_RE = re.compile(r"COMMENT\s+'([^']*)'", re.IGNORECASE)
DEFAULT_RE = re.compile(r"DEFAULT\s+(?:'([^']*)'|([^\s,]+))", re.IGNORECASE)


@dataclass
class ColumnDef:
    table: str
    name: str
    data_type: str
    comment: str
    default: str


@dataclass
class EnumValue:
    code: str
    desc: str


@dataclass
class EnumField:
    table: str
    column: str
    comment: str
    values: List[EnumValue]

    @property
    def dic_type(self) -> str:
        return f"{self.table}_{self.column}"

    @property
    def class_name(self) -> str:
        return f"{to_pascal(self.table)}{to_pascal(self.column)}Enum"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate dictionary SQL and enum classes from physical schema SQL")
    parser.add_argument(
        "--schema-file",
        required=True,
        help="Schema SQL path",
    )
    parser.add_argument(
        "--sql-output",
        help="Dictionary SQL output path; defaults to <schema-file-dir>/<schema-file-stem>-dict-init.sql",
    )
    parser.add_argument(
        "--dictionary-table",
        default="COMMON_DICTIONARY",
        help="Dictionary table name used in insert statements",
    )
    parser.add_argument(
        "--enum-dir",
        required=True,
        help="Enum java files output directory",
    )
    parser.add_argument(
        "--package",
        help="Enum Java package; defaults to the package derived from --enum-dir under src/main/java",
    )
    parser.add_argument(
        "--min-values",
        type=int,
        default=2,
        help="Minimum extracted values per field for SQL/enum generation",
    )
    return parser.parse_args()


def to_pascal(text: str) -> str:
    return "".join(part.capitalize() for part in text.lower().split("_"))


def derive_sql_output(schema_path: Path) -> Path:
    file_name = re.sub(r"-physical-schema\.sql$", "-dict-init.sql", schema_path.name)
    if file_name == schema_path.name:
        file_name = f"{schema_path.stem}-dict-init.sql"
    return schema_path.parent / file_name


def derive_package(enum_dir: Path) -> str:
    marker = "/src/main/java/"
    enum_dir_posix = enum_dir.as_posix()
    if marker not in enum_dir_posix:
        raise ValueError("package is required when enum-dir is not under src/main/java")
    package_path = enum_dir_posix.split(marker, 1)[1].strip("/")
    if not package_path:
        raise ValueError("package is required when enum-dir points to src/main/java root")
    return package_path.replace("/", ".")


def build_column(table: str, name: str, data_type: str, rest: str) -> ColumnDef:
    comment_match = COMMENT_RE.search(rest)
    default_match = DEFAULT_RE.search(rest)
    return ColumnDef(
        table=table.upper(),
        name=name.upper(),
        data_type=data_type,
        comment=(comment_match.group(1).strip() if comment_match else ""),
        default=(default_match.group(1) or default_match.group(2) or "").strip() if default_match else "",
    )


def load_columns(schema_text: str) -> List[ColumnDef]:
    columns: List[ColumnDef] = []
    for block in TABLE_RE.finditer(schema_text):
        table = block.group("table").upper()
        body = block.group("body")
        for line in body.splitlines():
            stripped = line.strip().rstrip(",")
            if not stripped.startswith("`"):
                continue
            match = COLUMN_RE.match(stripped)
            if not match:
                continue
            columns.append(
                build_column(
                    table=table,
                    name=match.group("name"),
                    data_type=match.group("type"),
                    rest=match.group("rest"),
                )
            )

    for block in ALTER_TABLE_RE.finditer(schema_text):
        table = block.group("table").upper()
        body = block.group("body")
        for match in ADD_COLUMN_RE.finditer(body):
            columns.append(
                build_column(
                    table=table,
                    name=match.group("name"),
                    data_type=match.group("type"),
                    rest=match.group("rest"),
                )
            )
    return columns


def is_candidate(column: ColumnDef) -> bool:
    field = column.name.upper()
    return (
        field == "STATUS"
        or field.endswith("_STATUS")
        or field.endswith("_TYPE")
        or field.endswith("_MODE")
        or field.endswith("_SCOPE")
        or ("状态" in column.comment)
        or ("类型" in column.comment)
    )


def parse_code_desc_pairs(comment: str) -> List[Tuple[str, str]]:
    if not comment:
        return []
    pairs: List[Tuple[str, str]] = []
    for code, desc in re.findall(r"([A-Za-z0-9_]+)\s*(?:[\.:：]|[-—])\s*([^\s,，;；。)）/]+)", comment):
        pairs.append((code.strip(), desc.strip()))
    return pairs


def parse_slash_values(comment: str) -> List[str]:
    if not comment:
        return []
    values: List[str] = []
    slash_groups = re.findall(r"([A-Za-z0-9_]+(?:/[A-Za-z0-9_]+)+)", comment)
    for group in slash_groups:
        values.extend([token for token in group.split("/") if token])
    return values


def extract_values(column: ColumnDef) -> List[EnumValue]:
    values: List[EnumValue] = []
    seen: Dict[str, bool] = {}

    def push(code: str, desc: str) -> None:
        normalized = code.upper()
        if not normalized or normalized in seen:
            return
        values.append(EnumValue(code=code, desc=desc))
        seen[normalized] = True

    for code, desc in parse_code_desc_pairs(column.comment):
        push(code.strip(), desc.strip() or code.strip())

    for token in parse_slash_values(column.comment):
        code = token.strip()
        push(code, code)

    default_token = column.default.strip().strip("'")
    if default_token and re.fullmatch(r"[A-Za-z0-9_]+", default_token):
        push(default_token, default_token)

    return values


def build_enum_fields(columns: Sequence[ColumnDef], min_values: int) -> List[EnumField]:
    fields: List[EnumField] = []
    for column in columns:
        if not is_candidate(column):
            continue
        values = extract_values(column)
        if len(values) < min_values:
            continue
        fields.append(
            EnumField(
                table=column.table,
                column=column.name,
                comment=column.comment,
                values=values,
            )
        )

    unique: Dict[Tuple[str, str], EnumField] = {}
    for field in fields:
        unique[(field.table, field.column)] = field
    return sorted(unique.values(), key=lambda item: (item.table, item.column))


def sql_quote(text: str) -> str:
    return text.replace("'", "''")


def build_dictionary_sql(fields: Sequence[EnumField], dictionary_table: str, schema_file: str) -> str:
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines: List[str] = []
    lines.append("-- AUTO GENERATED FILE. DO NOT EDIT MANUALLY.")
    lines.append(f"-- generated_at: {now}")
    lines.append(f"-- source_schema: {schema_file}")
    lines.append("-- dictionary_table: {}".format(dictionary_table))
    lines.append("")

    if not fields:
        lines.append("-- No type/status field with explicit enum values found.")
        return "\n".join(lines) + "\n"

    for field in fields:
        lines.append(f"-- {field.table}.{field.column} {field.comment}".rstrip())
        rows: List[Tuple[str, str, str, str, int, int, int, str]] = []

        parent_code = field.dic_type
        rows.append(
            (
                parent_code,
                f"{field.table}.{field.column}",
                field.dic_type,
                "0",
                1,
                1,
                1,
                f"AUTO GENERATED FROM {field.table}.{field.column}",
            )
        )

        for index, enum_value in enumerate(field.values, start=1):
            rows.append(
                (
                    enum_value.code,
                    enum_value.desc,
                    field.dic_type,
                    parent_code,
                    2,
                    index,
                    1,
                    f"AUTO GENERATED FROM {field.table}.{field.column}",
                )
            )

        lines.append(
            f"INSERT INTO `{dictionary_table}` "
            "(`DIC_CODE`,`DIC_NAME`,`DIC_TYPE`,`PARENT_CODE`,`DIC_LEVEL`,`DIC_SORT`,`STATUS`,`REMARK`,`CREATE_BY`,`UPDATE_BY`,`TENANT_ID`)"
        )
        lines.append("VALUES")

        value_lines: List[str] = []
        for dic_code, dic_name, dic_type, parent_code, level, sort, status, remark in rows:
            value_lines.append(
                "  ('{dic_code}','{dic_name}','{dic_type}','{parent_code}',{level},{sort},{status},'{remark}','1','1',1)".format(
                    dic_code=sql_quote(dic_code),
                    dic_name=sql_quote(dic_name),
                    dic_type=sql_quote(dic_type),
                    parent_code=sql_quote(parent_code),
                    level=level,
                    sort=sort,
                    status=status,
                    remark=sql_quote(remark),
                )
            )

        lines.append(",\n".join(value_lines))
        lines.append("ON DUPLICATE KEY UPDATE")
        lines.append("  `DIC_NAME` = VALUES(`DIC_NAME`),")
        lines.append("  `PARENT_CODE` = VALUES(`PARENT_CODE`),")
        lines.append("  `DIC_SORT` = VALUES(`DIC_SORT`),")
        lines.append("  `STATUS` = VALUES(`STATUS`),")
        lines.append("  `REMARK` = VALUES(`REMARK`),")
        lines.append("  `UPDATE_BY` = '1';")
        lines.append("")

    return "\n".join(lines)


def enum_constant_name(code: str) -> str:
    token = re.sub(r"[^A-Z0-9]+", "_", code.upper()).strip("_")
    if not token:
        token = "UNKNOWN"
    if token[0].isdigit():
        token = f"VALUE_{token}"
    return token


def build_enum_java(field: EnumField, package_name: str) -> str:
    class_name = field.class_name
    constant_counts: Dict[str, int] = {}
    constants: List[Tuple[str, str, str]] = []

    for enum_value in field.values:
        raw_name = enum_constant_name(enum_value.code)
        count = constant_counts.get(raw_name, 0) + 1
        constant_counts[raw_name] = count
        const_name = raw_name if count == 1 else f"{raw_name}_{count}"
        constants.append((const_name, enum_value.code, enum_value.desc))

    constant_lines = [f'    {name}("{code}", "{desc}")' for name, code, desc in constants]
    body = ",\n".join(constant_lines) + ";"

    return "\n".join(
        [
            f"package {package_name};",
            "",
            "import java.util.Objects;",
            "",
            "/**",
            f" * Auto generated enum for {field.table}.{field.column}.",
            " */",
            f"public enum {class_name} {{",
            body,
            "",
            "    private final String code;",
            "    private final String desc;",
            "",
            f"    {class_name}(String code, String desc) {{",
            "        this.code = code;",
            "        this.desc = desc;",
            "    }",
            "",
            "    public String getCode() {",
            "        return code;",
            "    }",
            "",
            "    public String getDesc() {",
            "        return desc;",
            "    }",
            "",
            f"    public static {class_name} getEnum(String code) {{",
            f"        for ({class_name} item : values()) {{",
            "            if (Objects.equals(item.code, code)) {",
            "                return item;",
            "            }",
            "        }",
            "        return null;",
            "    }",
            "}",
            "",
        ]
    )


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> int:
    args = parse_args()
    schema_path = Path(args.schema_file)
    enum_dir = Path(args.enum_dir)
    sql_output_path = Path(args.sql_output) if args.sql_output else derive_sql_output(schema_path)
    package_name = args.package or derive_package(enum_dir)

    if not schema_path.exists():
        raise FileNotFoundError(f"schema file not found: {schema_path}")

    schema_text = schema_path.read_text(encoding="utf-8")
    columns = load_columns(schema_text)
    enum_fields = build_enum_fields(columns, min_values=args.min_values)

    sql_text = build_dictionary_sql(
        fields=enum_fields,
        dictionary_table=args.dictionary_table,
        schema_file=str(schema_path.as_posix()),
    )
    write_text(sql_output_path, sql_text)

    enum_dir.mkdir(parents=True, exist_ok=True)
    generated_files: List[str] = []
    for field in enum_fields:
        file_path = enum_dir / f"{field.class_name}.java"
        java_content = build_enum_java(field, package_name)
        write_text(file_path, java_content)
        generated_files.append(str(file_path.as_posix()))

    print(f"schema_columns={len(columns)}")
    print(f"enum_fields={len(enum_fields)}")
    print(f"sql_output={sql_output_path.as_posix()}")
    print(f"enum_package={package_name}")
    for path in generated_files:
        print(f"enum_file={path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
