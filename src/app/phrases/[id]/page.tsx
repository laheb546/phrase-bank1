"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phrase,
  STATUS_COLORS,
  STATUS_LABELS,
  PhraseStatus,
  CATEGORIES,
  PhraseType,
} from "@/types";
import { ArrowLeft, Trash2, Plus, Minus, Pencil, X, Check } from "lucide-react";
import clsx from "clsx";

export default function PhraseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [phrase, setPhrase] = useState<Phrase | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phrase: "",
    type: "collocation" as PhraseType,
    meaning: "",
    pattern: "",
    exampleSentence: "",
    originalMistake: "",
    category: "Other",
    notes: "",
  });

  const load = async () => {
    const res = await fetch(`/api/phrases/${id}`);
    const data = await res.json();
    if (data.error) {
      setPhrase(null);
    } else {
      setPhrase(data);
      setEditForm({
        phrase: data.phrase || "",
        type: data.type || "collocation",
        meaning: data.meaning || "",
        pattern: data.pattern || "",
        exampleSentence: data.exampleSentence || "",
        originalMistake: data.originalMistake || "",
        category: data.category || "Other",
        notes: data.notes || "",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const update = async (body: Record<string, unknown>) => {
    setUpdating(true);
    const res = await fetch(`/api/phrases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.error) {
      setPhrase(data);
      setEditForm({
        phrase: data.phrase || "",
        type: data.type || "collocation",
        meaning: data.meaning || "",
        pattern: data.pattern || "",
        exampleSentence: data.exampleSentence || "",
        originalMistake: data.originalMistake || "",
        category: data.category || "Other",
        notes: data.notes || "",
      });
    }
    setUpdating(false);
    return !data.error;
  };

  const handleSaveEdit = async () => {
    if (!editForm.phrase.trim() || !editForm.meaning.trim()) {
      alert("Phrase and meaning are required.");
      return;
    }
    const ok = await update(editForm);
    if (ok) setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this phrase?")) return;
    await fetch(`/api/phrases/${id}`, { method: "DELETE" });
    router.push("/phrases");
  };

  if (loading) {
    return <p className="text-muted text-center py-20">Loading...</p>;
  }

  if (!phrase) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-4">Phrase not found</p>
        <Link href="/phrases" className="text-sm text-foreground underline">
          Back to Phrase Bank
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 border border-theme rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/phrases"
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <div className="flex items-center gap-3">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center gap-1"
            >
              <Pencil size={14} />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditForm({
                    phrase: phrase.phrase || "",
                    type: phrase.type || "collocation",
                    meaning: phrase.meaning || "",
                    pattern: phrase.pattern || "",
                    exampleSentence: phrase.exampleSentence || "",
                    originalMistake: phrase.originalMistake || "",
                    category: phrase.category || "Other",
                    notes: phrase.notes || "",
                  });
                }}
                className="text-muted hover:text-foreground text-sm flex items-center gap-1"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updating}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 text-sm flex items-center gap-1 font-medium"
              >
                <Check size={14} />
                Save
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        /* Edit form */
        <div className="bg-card border border-theme rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
              Phrase *
            </label>
            <input
              type="text"
              value={editForm.phrase}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, phrase: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
                Type *
              </label>
              <select
                value={editForm.type}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    type: e.target.value as PhraseType,
                  }))
                }
                className={inputClass}
              >
                <option value="collocation">Collocation</option>
                <option value="chunk">Chunk</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
                Category
              </label>
              <select
                value={editForm.category}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, category: e.target.value }))
                }
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
              Meaning *
            </label>
            <textarea
              value={editForm.meaning}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, meaning: e.target.value }))
              }
              rows={2}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
              Pattern
            </label>
            <input
              type="text"
              value={editForm.pattern}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, pattern: e.target.value }))
              }
              className={inputClass}
              placeholder="e.g. verb + preposition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
              Example sentence
            </label>
            <textarea
              value={editForm.exampleSentence}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  exampleSentence: e.target.value,
                }))
              }
              rows={2}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
              Original mistake
            </label>
            <input
              type="text"
              value={editForm.originalMistake}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  originalMistake: e.target.value,
                }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
              Notes
            </label>
            <textarea
              value={editForm.notes}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              className={inputClass}
            />
          </div>
        </div>
      ) : (
        /* View mode */
        <>
          <div>
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground">
                {phrase.phrase}
              </h1>
              <span
                className={clsx(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  STATUS_COLORS[phrase.status]
                )}
              >
                {STATUS_LABELS[phrase.status]}
              </span>
            </div>
            {phrase.originalMistake && (
              <p className="text-muted mt-1">
                <span className="text-xs uppercase tracking-wide mr-1">
                  Was:
                </span>
                <span className="line-through">{phrase.originalMistake}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="bg-slate-100 dark:bg-slate-800 text-foreground px-2 py-0.5 rounded capitalize">
              {phrase.type}
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-foreground px-2 py-0.5 rounded">
              {phrase.category}
            </span>
          </div>

          <div className="bg-card border border-theme rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
            <DetailRow label="Meaning" value={phrase.meaning} />
            {phrase.pattern && (
              <DetailRow label="Pattern" value={phrase.pattern} />
            )}
            {phrase.exampleSentence && (
              <DetailRow label="Example" value={phrase.exampleSentence} />
            )}
            {phrase.notes && <DetailRow label="Notes" value={phrase.notes} />}
          </div>
        </>
      )}

      {/* Tracking */}
      <div className="bg-card border border-theme rounded-lg p-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
          Tracking
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted">Mistake count</p>
            <div className="flex items-center gap-2 mt-1">
              <button
                disabled={updating}
                onClick={() =>
                  update({
                    mistakeCount: Math.max(0, phrase.mistakeCount - 1),
                  })
                }
                className="p-1 rounded border border-theme hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Minus size={14} />
              </button>
              <span className="text-xl font-semibold text-amber-600 dark:text-amber-400 w-8 text-center">
                {phrase.mistakeCount}
              </span>
              <button
                disabled={updating}
                onClick={() => update({ incrementMistake: true })}
                className="p-1 rounded border border-theme hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted">Successful uses</p>
            <div className="flex items-center gap-2 mt-1">
              <button
                disabled={updating}
                onClick={() =>
                  update({
                    successfulUseCount: Math.max(
                      0,
                      phrase.successfulUseCount - 1
                    ),
                  })
                }
                className="p-1 rounded border border-theme hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Minus size={14} />
              </button>
              <span className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 w-8 text-center">
                {phrase.successfulUseCount}
              </span>
              <button
                disabled={updating}
                onClick={() => update({ incrementSuccess: true })}
                className="p-1 rounded border border-theme hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-muted mb-1">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {(
              ["new", "learning", "improving", "mastered"] as PhraseStatus[]
            ).map((s) => (
              <button
                key={s}
                disabled={updating}
                onClick={() => update({ status: s })}
                className={clsx(
                  "text-xs px-2.5 py-1 rounded-full font-medium border transition-colors",
                  phrase.status === s
                    ? STATUS_COLORS[s] + " border-transparent"
                    : "bg-card text-muted border-theme hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Review info */}
      <div className="bg-card border border-theme rounded-lg p-4 text-sm text-muted space-y-1">
        <p>
          Reviews: <strong className="text-foreground">{phrase.reviewCount}</strong>
        </p>
        {phrase.lastReviewedAt && (
          <p>
            Last reviewed:{" "}
            {new Date(phrase.lastReviewedAt).toLocaleDateString()}
          </p>
        )}
        {phrase.nextReviewAt && (
          <p>
            Next review: {new Date(phrase.nextReviewAt).toLocaleDateString()}
          </p>
        )}
        <p>Added: {new Date(phrase.createdAt).toLocaleDateString()}</p>
      </div>

      <Link
        href={`/review?id=${phrase._id}`}
        className="block w-full text-center bg-accent text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        Review This Phrase
      </Link>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs text-muted font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-foreground mt-0.5">{value}</p>
    </div>
  );
}
