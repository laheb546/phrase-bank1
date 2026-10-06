"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Phrase } from "@/types";
import { SENTENCE_LABELS } from "@/lib/templates";
import { CheckCircle2, ChevronRight } from "lucide-react";
import clsx from "clsx";

interface DailyInfo {
  templatesCompleted: number;
  templatesGoal: number;
  templatesMet: boolean;
}

export default function TemplatesPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Phrase | null>(null);
  const [answers, setAnswers] = useState<string[]>(["", "", "", "", ""]);
  const [step, setStep] = useState<"pick" | "write" | "done">("pick");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [daily, setDaily] = useState<DailyInfo | null>(null);
  const [search, setSearch] = useState("");

  const loadPhrases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/phrases?limit=100&sort=newest");
      const data = await res.json();
      setPhrases(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDaily = useCallback(async () => {
    try {
      const res = await fetch("/api/daily");
      const data = await res.json();
      if (!data.error) setDaily(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadPhrases();
    loadDaily();
  }, [loadPhrases, loadDaily]);

  const filtered = phrases.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.phrase.toLowerCase().includes(q) ||
      p.meaning.toLowerCase().includes(q)
    );
  });

  const startTemplate = (p: Phrase) => {
    setSelected(p);
    setAnswers(["", "", "", "", ""]);
    setError("");
    setStep("write");
  };

  const filledCount = answers.filter((a) => a.trim().length > 0).length;
  const allFilled = answers.every((a) => a.trim().length >= 3);

  const submit = async () => {
    if (!selected || !allFilled) {
      setError("Write all five sentences (at least a few words each).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // ONE flashcard: title = phrase, body = all 5 sentences
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "template",
          phraseId: selected._id,
          phraseText: selected.phrase,
          sentences: answers.map((a) => a.trim()),
          countTemplate: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setStep("done");
      loadDaily();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Templates</h1>
        <p className="text-muted text-sm mt-0.5">
          Pick a chunk → write <strong>five sentences</strong> → they become{" "}
          <strong>one flashcard</strong> (phrase as title, sentences 1–5). Daily
          goal: 3 templates.
        </p>
      </div>

      {daily && (
        <div
          className={clsx(
            "rounded-xl border p-4 flex items-center justify-between gap-4",
            daily.templatesMet
              ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800"
              : "border-theme bg-card"
          )}
        >
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide">
              Today&apos;s templates
            </p>
            <p className="text-2xl font-semibold text-foreground mt-0.5">
              {daily.templatesCompleted} / {daily.templatesGoal}
            </p>
          </div>
          {daily.templatesMet ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <CheckCircle2 size={18} /> Goal met
            </span>
          ) : (
            <p className="text-sm text-muted">
              {daily.templatesGoal - daily.templatesCompleted} left
            </p>
          )}
        </div>
      )}

      {step === "pick" && (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your phrases..."
            className="w-full px-3 py-2 border border-theme rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
          {loading ? (
            <p className="text-muted text-center py-10">Loading phrases...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-card border border-dashed border-theme rounded-xl">
              <p className="text-muted mb-2">No phrases yet.</p>
              <Link href="/add" className="text-sm text-blue-600 underline">
                Add a chunk first
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => startTemplate(p)}
                  className="w-full text-left flex items-center gap-3 bg-card border border-theme rounded-lg px-4 py-3 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {p.phrase}
                    </p>
                    <p className="text-xs text-muted truncate">{p.meaning}</p>
                  </div>
                  <ChevronRight size={18} className="text-muted shrink-0" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {step === "write" && selected && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3 bg-card border border-theme rounded-xl p-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">
                Phrase / chunk (title on the flashcard)
              </p>
              <p className="text-xl font-semibold text-foreground mt-0.5">
                {selected.phrase}
              </p>
              <p className="text-sm text-muted mt-1">{selected.meaning}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="text-sm text-muted hover:text-foreground shrink-0"
            >
              Change
            </button>
          </div>

          <p className="text-sm text-muted">
            Write any five sentences you want. All five go on{" "}
            <strong className="text-foreground">one flashcard</strong>.
          </p>

          {SENTENCE_LABELS.map((label, i) => (
            <div
              key={label}
              className="bg-card border border-theme rounded-lg p-4 space-y-2"
            >
              <p className="text-sm font-semibold text-foreground">
                {label}
              </p>
              <textarea
                value={answers[i]}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                }}
                rows={2}
                placeholder={`Any sentence using « ${selected.phrase} »...`}
                className="w-full px-3 py-2 border border-theme rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">{filledCount} / 5 sentences</p>
            <button
              type="button"
              disabled={saving || !allFilled}
              onClick={submit}
              className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Finish → one flashcard"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && selected && (
        <div className="text-center py-12 space-y-4 bg-card border border-theme rounded-xl">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
          <h2 className="text-xl font-semibold text-foreground">
            One flashcard created
          </h2>
          <p className="text-sm text-muted max-w-sm mx-auto">
            Title: <strong className="text-foreground">{selected.phrase}</strong>
            <br />
            With your five sentences on the card. Download as gallery photo from
            Flashcards when you want.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep("pick");
                setSelected(null);
              }}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              Do another template
            </button>
            <Link
              href="/flashcards"
              className="px-4 py-2 border border-theme rounded-lg text-sm font-medium text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Open flashcards
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
