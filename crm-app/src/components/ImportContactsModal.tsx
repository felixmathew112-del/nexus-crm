"use client";
import { useState } from "react";
import { X, Loader2, UploadCloud } from "lucide-react";
import { parseCsv } from "@/lib/csv";

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "full name", "contact name"],
  company: ["company", "organization", "org"],
  email: ["email", "email address"],
  phone: ["phone", "phone number", "mobile"],
  source: ["source", "lead source"],
  owner: ["owner", "owner email", "owner name", "assigned to"],
};

type ParsedRow = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  owner?: string;
};

function mapHeaders(headerRow: string[]): (string | null)[] {
  return headerRow.map((raw) => {
    const normalized = raw.trim().toLowerCase();
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(normalized)) return field;
    }
    return null;
  });
}

function rowsFromCsv(text: string): { rows: ParsedRow[]; error: string | null } {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], error: "The file is empty." };

  const fields = mapHeaders(table[0]);
  if (!fields.includes("name")) {
    return { rows: [], error: 'Couldn\'t find a "Name" column in the header row.' };
  }

  const rows: ParsedRow[] = table.slice(1).map((cells) => {
    const row: ParsedRow = {};
    fields.forEach((field, i) => {
      if (field && cells[i]) (row as Record<string, string>)[field] = cells[i];
    });
    return row;
  });

  return { rows, error: null };
}

type ImportResult = { created: number; skippedDuplicates: number; skippedInvalid: number };

export default function ImportContactsModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    setSubmitError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const { rows: parsed, error } = rowsFromCsv(String(reader.result ?? ""));
      setParseError(error);
      setRows(error ? [] : parsed);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (rows.length === 0 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch("/api/contacts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(body?.error ?? "Couldn't import this file.");
      return;
    }
    setResult(body);
    if (body.created > 0) onImported();
  }

  const validCount = rows.filter((r) => r.name?.trim()).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <h2 className="font-display text-sm font-semibold">Import contacts</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {!result && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-muted)]">
              CSV with a header row. Recognized columns: Name (required), Company, Email, Phone,
              Source, Owner. Rows whose email matches an existing contact are skipped.
            </p>

            <label className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-raised)] px-3 py-6 text-sm cursor-pointer hover:border-[var(--accent)] transition-colors">
              <UploadCloud size={18} className="text-[var(--text-muted)]" />
              {fileName ?? "Choose a .csv file"}
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>

            {parseError && <p className="text-xs text-risk">{parseError}</p>}
            {!parseError && fileName && (
              <p className="text-xs text-[var(--text-muted)]">
                {validCount} contact{validCount === 1 ? "" : "s"} found
                {rows.length !== validCount && `, ${rows.length - validCount} missing a name`}.
              </p>
            )}
            {submitError && <p className="text-xs text-risk">{submitError}</p>}

            <button
              type="button"
              onClick={handleImport}
              disabled={validCount === 0 || submitting}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Import {validCount > 0 && `${validCount} contact${validCount === 1 ? "" : "s"}`}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <p className="text-sm">
              Imported <span className="font-medium">{result.created}</span> contact
              {result.created === 1 ? "" : "s"}.
            </p>
            {result.skippedDuplicates > 0 && (
              <p className="text-xs text-[var(--text-muted)]">
                Skipped {result.skippedDuplicates} duplicate{result.skippedDuplicates === 1 ? "" : "s"} (matching email already on file).
              </p>
            )}
            {result.skippedInvalid > 0 && (
              <p className="text-xs text-[var(--text-muted)]">
                Skipped {result.skippedInvalid} row{result.skippedInvalid === 1 ? "" : "s"} missing a name.
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
