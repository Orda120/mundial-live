from __future__ import annotations

from io import BytesIO
from pathlib import Path
import re
import sys
from urllib.request import Request, urlopen

try:
    from pypdf import PdfReader
except ImportError:
    print("Missing dependency: pypdf. Install it with: python -m pip install pypdf", file=sys.stderr)
    raise


SOURCE_URL = "https://digitalhub.fifa.com/m/636f5c9c6f29771f/original/FWC2026_regulations_EN.pdf"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "src" / "thirdPlaceMatrix.js"
EXPECTED_ROWS = 495
TABLE_COLUMNS = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"]
TABLE_MATCHES = [79, 85, 81, 74, 82, 77, 87, 80]


def download_pdf() -> bytes:
    request = Request(SOURCE_URL, headers={"User-Agent": "mundial-live-matrix-retriever/1.0"})
    with urlopen(request, timeout=60) as response:
        return response.read()


def extract_rows(pdf_bytes: bytes) -> list[str]:
    reader = PdfReader(BytesIO(pdf_bytes))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    pattern = re.compile(r"(?<!\d)(\d{1,3})\s+((?:3[A-L]\s+){7}3[A-L])")

    numbered_rows: list[tuple[int, str]] = []
    for match in pattern.finditer(text):
        row_number = int(match.group(1))
        row = "".join(token[1] for token in match.group(2).split())
        numbered_rows.append((row_number, row))

    return validate_rows(numbered_rows)


def validate_rows(numbered_rows: list[tuple[int, str]]) -> list[str]:
    numbers = [number for number, _ in numbered_rows]
    expected_numbers = list(range(1, EXPECTED_ROWS + 1))
    if numbers != expected_numbers:
        missing = sorted(set(expected_numbers) - set(numbers))
        extra = sorted(set(numbers) - set(expected_numbers))
        raise ValueError(f"Unexpected matrix rows. Missing={missing[:20]} Extra={extra[:20]}")

    rows = [row for _, row in numbered_rows]
    if len(rows) != EXPECTED_ROWS:
        raise ValueError(f"Expected {EXPECTED_ROWS} rows, found {len(rows)}")

    for row_number, row in enumerate(rows, start=1):
        if not re.fullmatch(r"[A-L]{8}", row):
            raise ValueError(f"Row {row_number} has invalid groups: {row}")
        if len(set(row)) != 8:
            raise ValueError(f"Row {row_number} repeats a group: {row}")
        for column, third_group in zip(TABLE_COLUMNS, row):
            if column[1] == third_group:
                raise ValueError(f"Row {row_number} creates a same-group rematch: {column} vs 3{third_group}")

    keys = ["".join(sorted(row)) for row in rows]
    if len(set(keys)) != EXPECTED_ROWS:
        raise ValueError("Matrix does not contain one unique row for each eight-group combination")

    return rows


def js_array(rows: list[str]) -> str:
    lines = []
    for start in range(0, len(rows), 5):
        chunk = rows[start:start + 5]
        lines.append("  " + ", ".join(f'"{row}"' for row in chunk) + ",")
    return "\n".join(lines)


def render_module(rows: list[str]) -> str:
    return f"""const TABLE_COLUMNS = {TABLE_COLUMNS!r};
const TABLE_MATCHES = {TABLE_MATCHES!r};

// Generated from FIFA World Cup 2026 Regulations, Annex C.
// Source: {SOURCE_URL}
export const FIFA_THIRD_PLACE_MATRIX = [
{js_array(rows)}
];

export const THIRD_PLACE_TABLE_COLUMNS = TABLE_COLUMNS;
export const THIRD_PLACE_TABLE_MATCHES = TABLE_MATCHES;

const normalizeGroup = (group) => {{
  const match = String(group || "").toUpperCase().match(/^3?([A-L])$/);
  return match ? match[1] : null;
}};

export function thirdPlaceGroupKey(groups) {{
  const normalized = groups.map(normalizeGroup).filter(Boolean);
  if (normalized.length !== 8 || new Set(normalized).size !== 8) return null;
  return [...normalized].sort().join("");
}}

const MATRIX_BY_GROUP_SET = new Map(
  FIFA_THIRD_PLACE_MATRIX.map((row) => [thirdPlaceGroupKey(row.split("")), row])
);

export function rowForThirdPlaceGroups(groups) {{
  const key = thirdPlaceGroupKey(groups);
  return key ? MATRIX_BY_GROUP_SET.get(key) || null : null;
}}

export function assignOfficialThirds(groups) {{
  const row = rowForThirdPlaceGroups(groups);
  if (!row) return {{}};
  return Object.fromEntries(
    row.split("").map((group, index) => [TABLE_MATCHES[index], group])
  );
}}
"""


def main() -> int:
    rows = extract_rows(download_pdf())
    OUTPUT_PATH.write_text(render_module(rows), encoding="utf-8", newline="\n")
    print(f"Retrieved {len(rows)} third-place matrix rows from FIFA Annex C")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
