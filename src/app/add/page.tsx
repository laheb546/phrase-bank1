"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, PhraseType } from "@/types";
import clsx from "clsx";

/**
 * Parse bulk text from ChatGPT into phrase + meaning pairs.
 * Supports:
 * - One per line: "phrase - meaning" | "phrase: meaning" | "phrase | meaning"
 * - Numbered: "1. phrase - meaning"
 * - Comma-separated pairs: "a - mean a, b - mean b"
 * - Phrase only (meaning = phrase)
 */
function parseBulkText(raw: string): { phrase: string; meaning: string }[] {
  const text = raw.trim();
  if (!text) return [];

  // Prefer line-based if multiple lines
  let chunks: string[] = [];
  if (text.includes("\n")) {
    chunks = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  } else {
    // Single line: split on commas only when each part looks like "x - y" or "x: y"
    const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
    const lookLikePairs = parts.filter((p) =>
      /[-–—:|]/.test(p)
    ).length;
    if (parts.length > 1 && lookLikePairs >= Math.ceil(parts.length * 0.5)) {
      chunks = parts;
    } else if (parts.length > 1 && lookLikePairs === 0) {
      // Just phrases separated by commas, no meanings
      return parts.map((p) => ({ phrase: p, meaning: p }));
    } else {
      chunks = [text];
    }
  }

  const results: { phrase: string; meaning: string }[] = [];

  for (let line of chunks) {
    // Strip leading numbers: "1. ", "1) ", "(1) "
    line = line.replace(/^\s*[\(\[]?\d+[\.\)\]]\s*/, "").trim();
    if (!line) continue;

    // Split phrase / meaning on first separator
    const m = line.match(/^(.+?)\s*[-–—:|]\s*(.+)$/);
    if (m) {
      const phrase = m[1].trim();
      const meaning = m[2].trim();
      if (phrase) results.push({ phrase, meaning: meaning || phrase });
    } else {
      results.push({ phrase: line, meaning: line });
    }
  }

  // Dedupe by phrase (case-insensitive)
  const seen = new Set<string>();
  return results.filter((r) => {
    const k = r.phrase.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export default function AddPhrasePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    phrase: "",
    type: "chunk" as PhraseType,
    meaning: "",
    pattern: "",
    exampleSentence: "",
    originalMistake: "",
    category: "Other",
    notes: "",
    mistakeCount: 0,
  });

  // Bulk state
  const [bulkText, setBulkText] = useState("");
  const [bulkType, setBulkType] = useState<PhraseType>("chunk");
  const [bulkCategory, setBulkCategory] = useState("Other");

  const parsed = useMemo(() => parseBulkText(bulkText), [bulkText]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "mistakeCount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/phrases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push(`/phrases/${data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const handleBulkSave = async () => {
    if (parsed.length === 0) {
      setError("Paste some chunks first");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/phrases/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: parsed,
          type: bulkType,
          category: bulkCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSuccess(`Added ${data.count} phrase${data.count !== 1 ? "s" : ""} to your bank.`);
      setBulkText("");
      setTimeout(() => router.push("/phrases"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-foreground mb-1">Add Phrase</h1>
      <p className="text-muted text-sm mb-4">
        One phrase at a time, or paste many from ChatGPT in one go.
      </p>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("single");
            setError("");
            setSuccess("");
          }}
          className={clsx(
            "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
            mode === "single"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          )}
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("bulk");
            setError("");
            setSuccess("");
          }}
          className={clsx(
            "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
            mode === "bulk"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          )}
        >
          Bulk paste
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm px-3 py-2 rounded-lg mb-4">
          {success}
        </div>
      )}

      {mode === "bulk" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Paste from ChatGPT
            </label>
            <p className="text-xs text-muted mb-2">
              One per line works best. Formats:{" "}
              <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 rounded">
                phrase - meaning
              </code>
              ,{" "}
              <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 rounded">
                phrase: meaning
              </code>
              , or comma-separated phrases.
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              placeholder={`Example:\ninvest in education - put money/time into learning\ntake part in - participate in\nin terms of - regarding / about\n\nOr just:\ninvest in education, take part in, in terms of`}
              className="input font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Type for all
              </label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value as PhraseType)}
                className="input"
              >
                <option value="chunk">Chunk</option>
                <option value="collocation">Collocation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Category for all
              </label>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          {parsed.length > 0 && (
            <div className="bg-card border border-theme rounded-lg p-3 space-y-2 max-h-56 overflow-y-auto">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                Preview · {parsed.length} phrase
                {parsed.length !== 1 ? "s" : ""}
              </p>
              {parsed.map((item, i) => (
                <div
                  key={i}
                  className="text-sm border-b border-theme last:border-0 pb-1.5 last:pb-0"
                >
                  <span className="font-medium text-foreground">
                    {item.phrase}
                  </span>
                  {item.meaning !== item.phrase && (
                    <span className="text-muted"> — {item.meaning}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={loading || parsed.length === 0}
            onClick={handleBulkSave}
            className="w-full bg-accent text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : `Add ${parsed.length || ""} phrase${parsed.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Natural expression *" name="phrase">
            <input
              name="phrase"
              value={form.phrase}
              onChange={handleChange}
              required
              placeholder="e.g. invest in my education"
              className="input"
            />
          </Field>

          <Field label="Type *" name="type">
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="input"
            >
              <option value="collocation">Collocation</option>
              <option value="chunk">Chunk</option>
            </select>
          </Field>

          <Field label="My original mistake" name="originalMistake">
            <input
              name="originalMistake"
              value={form.originalMistake}
              onChange={handleChange}
              placeholder="e.g. education on myself"
              className="input"
            />
          </Field>

          <Field label="Meaning *" name="meaning">
            <textarea
              name="meaning"
              value={form.meaning}
              onChange={handleChange}
              required
              rows={2}
              placeholder="Put time, money, or effort into improving something."
              className="input"
            />
          </Field>

          <Field label="Pattern" name="pattern">
            <input
              name="pattern"
              value={form.pattern}
              onChange={handleChange}
              placeholder="e.g. invest in + noun"
              className="input"
            />
          </Field>

          <Field label="Example sentence" name="exampleSentence">
            <textarea
              name="exampleSentence"
              value={form.exampleSentence}
              onChange={handleChange}
              rows={2}
              placeholder="I want to invest in my education because..."
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" name="category">
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Initial mistake count" name="mistakeCount">
              <input
                type="number"
                name="mistakeCount"
                value={form.mistakeCount}
                onChange={handleChange}
                min={0}
                className="input"
              />
            </Field>
          </div>

          <Field label="Notes" name="notes">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Any extra context..."
              className="input"
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save phrase"}
          </button>
        </form>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background: var(--input-bg);
          color: var(--foreground);
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.4);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  name,
  children,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-foreground mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
