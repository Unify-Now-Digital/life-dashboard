// Revolut CSV parser. Hand-rolled (no papaparse dependency) — Revolut exports
// are simple comma-separated with optional double-quoted fields. We read the
// signed `Amount` for direction (negative = out) and the merchant/description.
//
// Columns vary slightly by export but always include a signed Amount, a
// Description, and a Started/Completed Date. We match headers case-insensitively
// and tolerate a couple of common aliases.

// Split one CSV line into fields, honouring double-quoted values and escaped
// quotes ("" inside a quoted field).
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

// Split a whole CSV into rows, respecting newlines inside quoted fields.
function splitCsvRows(text) {
  const rows = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      if (cur.length) rows.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.length) rows.push(cur);
  return rows;
}

const pick = (row, header, names) => {
  for (const n of names) {
    const idx = header.indexOf(n.toLowerCase());
    if (idx >= 0 && row[idx] != null && row[idx] !== "") return row[idx];
  }
  return "";
};

export function parseRevolutCsv(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  const rows = splitCsvRows(csvText).filter((r) => r.trim() !== "");
  if (rows.length < 2) return [];

  const header = splitCsvLine(rows[0]).map((h) => h.trim().toLowerCase());

  return rows
    .slice(1)
    .map((line, i) => {
      const cells = splitCsvLine(line).map((c) => c.trim());
      const amountRaw = pick(cells, header, ["amount"]);
      const amount = parseFloat(String(amountRaw).replace(/[^0-9.\-]/g, ""));
      const desc = pick(cells, header, ["description", "reference", "merchant"]).trim();
      const date = pick(cells, header, ["completed date", "started date", "date", "date completed"]).slice(0, 10);
      const fee = parseFloat(pick(cells, header, ["fee"])) || 0;
      return {
        id: "tx_" + i,
        date,
        desc,
        amount,
        fee,
        direction: amount < 0 ? "out" : "in",
      };
    })
    .filter((t) => t.date && !Number.isNaN(t.amount));
}
