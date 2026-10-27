// Bulk quick order (spec §4.5): an agent pastes lines of SKU/barcode and a
// quantity, and every row is checked on its own so one bad row never hides
// the rest. Kept free of Shopify and network calls so the rules can be tested.

export const MAX_ROWS = 200;
export const MAX_QUANTITY = 9999;

export interface ParsedRow {
  line: number;
  code: string;
  quantity: number;
  // Set when the row can't be used as written.
  error?: "INVALID_QUANTITY" | "INVALID_CODE";
}

export interface ParsedText {
  rows: ParsedRow[];
  tooMany: boolean;
}

// Letters, digits and a few separators. Anything else is refused rather than
// sent into a search query.
const CODE_PATTERN = /^[A-Za-z0-9._\-/#+ ]{1,64}$/;

const HEADER = /^(sku|code|barcode|item|product)\b.*\b(qty|quantity|amount)\b/i;

function unquote(value: string): string {
  const v = value.trim();
  return v.length >= 2 && v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1).trim() : v;
}

// One line: "SKU", "SKU,5", "SKU;5", "SKU<tab>5", "SKU 5" or "SKU x 5". The
// quantity is the last piece, when it looks like a number.
function splitLine(raw: string): { code: string; qty: string | null } {
  const line = raw.trim();

  for (const sep of [",", ";", "\t"]) {
    if (line.includes(sep)) {
      const parts = line.split(sep).map(unquote);
      return { code: parts[0], qty: parts.length > 1 ? parts[1] : null };
    }
  }

  const x = line.match(/^(.+?)\s+[xX]\s*(\S+)$/);
  if (x) return { code: unquote(x[1]), qty: x[2] };

  const space = line.match(/^(\S+)\s+(\S+)$/);
  if (space && /^-?\d+(\.\d+)?$/.test(space[2])) return { code: unquote(space[1]), qty: space[2] };

  return { code: unquote(line), qty: null };
}

export function parseQuickOrderText(text: string): ParsedText {
  const lines = String(text ?? "").split(/\r?\n/);
  const rows: ParsedRow[] = [];
  let seenData = false;

  lines.forEach((raw, index) => {
    if (!raw.trim()) return;
    if (!seenData && HEADER.test(raw.trim())) return;
    seenData = true;

    const { code, qty } = splitLine(raw);
    const row: ParsedRow = { line: index + 1, code, quantity: 1 };

    if (qty !== null && qty !== "") {
      const n = Number(qty);
      if (!Number.isInteger(n) || n < 1 || n > MAX_QUANTITY) {
        row.error = "INVALID_QUANTITY";
        row.quantity = 0;
      } else {
        row.quantity = n;
      }
    }

    if (!row.error && !CODE_PATTERN.test(code)) row.error = "INVALID_CODE";
    rows.push(row);
  });

  return { rows: rows.slice(0, MAX_ROWS), tooMany: rows.length > MAX_ROWS };
}

export interface FoundVariant {
  id: string; // numeric id
  sku: string | null;
  barcode: string | null;
  title: string;
  availableForSale: boolean;
  active: boolean;
}

export type RowStatus = "ok" | "error";

export interface ResolvedRow {
  line: number;
  code: string;
  quantity: number;
  status: RowStatus;
  error?: "INVALID_QUANTITY" | "INVALID_CODE" | "NOT_FOUND" | "AMBIGUOUS" | "UNAVAILABLE";
  variantId?: string;
  title?: string;
  sku?: string | null;
  // More than one pasted row named this item and they were added together.
  mergedFrom?: number[];
}

// Pairs every row with the variant it names: an exact SKU or barcode match
// (not case sensitive for SKUs). A code that matches two different variants is
// ambiguous; an unavailable or inactive one is refused. Rows that name the
// same variant are added together so the cart gets one line.
export function matchRows(rows: ParsedRow[], variants: FoundVariant[]): ResolvedRow[] {
  const out: ResolvedRow[] = [];
  const byVariant = new Map<string, ResolvedRow>();

  for (const row of rows) {
    const base = { line: row.line, code: row.code, quantity: row.quantity };
    if (row.error) {
      out.push({ ...base, status: "error", error: row.error });
      continue;
    }

    const needle = row.code.toLowerCase();
    const matches = variants.filter(
      (v) => (v.sku && v.sku.toLowerCase() === needle) || (v.barcode && v.barcode.toLowerCase() === needle),
    );
    const distinct = [...new Map(matches.map((m) => [m.id, m])).values()];

    if (distinct.length === 0) {
      out.push({ ...base, status: "error", error: "NOT_FOUND" });
      continue;
    }
    if (distinct.length > 1) {
      out.push({ ...base, status: "error", error: "AMBIGUOUS" });
      continue;
    }

    const v = distinct[0];
    if (!v.active || !v.availableForSale) {
      out.push({ ...base, status: "error", error: "UNAVAILABLE", variantId: v.id, title: v.title, sku: v.sku });
      continue;
    }

    const earlier = byVariant.get(v.id);
    if (earlier) {
      earlier.quantity = Math.min(earlier.quantity + row.quantity, MAX_QUANTITY);
      earlier.mergedFrom = [...(earlier.mergedFrom ?? [earlier.line]), row.line];
      continue;
    }

    const resolved: ResolvedRow = { ...base, status: "ok", variantId: v.id, title: v.title, sku: v.sku };
    byVariant.set(v.id, resolved);
    out.push(resolved);
  }

  return out;
}
