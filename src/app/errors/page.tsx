"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import clsx from "clsx";

interface Category {
  _id: string;
  name: string;
  totalCount: number;
  todayCount: number;
}

interface DailyTotal {
  date: string;
  count: number;
}

const SUGGESTED = [
  "Preposition",
  "Verb agreement",
  "Adverb",
  "Tense",
  "Clause",
  "Article (a/an/the)",
  "Word order",
  "Pronoun",
  "Collocation",
  "Other",
];

export default function ErrorsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/errors");
      const data = await res.json();
      if (!data.error) {
        setCategories(data.categories || []);
        setDailyTotals(data.dailyTotals || []);
        setTodayTotal(data.todayTotal || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addCategory = async (name: string) => {
    const n = name.trim();
    if (!n) return;
    setAdding(true);
    try {
      const res = await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed");
        return;
      }
      setNewName("");
      await load();
    } finally {
      setAdding(false);
    }
  };

  const changeCount = async (id: string, delta: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/errors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setCategories((prev) =>
        prev
          .map((c) =>
            c._id === id
              ? {
                  ...c,
                  totalCount: data.totalCount,
                  todayCount: data.todayCount,
                }
              : c
          )
          .sort((a, b) => b.totalCount - a.totalCount)
      );
      // Refresh daily totals lightly
      setTodayTotal((t) => Math.max(0, t + delta));
      setDailyTotals((prev) => {
        const today = new Date().toISOString().slice(0, 10);
        return prev.map((d) =>
          d.date === today
            ? { ...d, count: Math.max(0, d.count + delta) }
            : d
        );
      });
    } finally {
      setBusyId(null);
    }
  };

  const removeCategory = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its history?`)) return;
    await fetch(`/api/errors/${id}`, { method: "DELETE" });
    await load();
  };

  const maxDaily = Math.max(1, ...dailyTotals.map((d) => d.count));
  const existingNames = new Set(categories.map((c) => c.name.toLowerCase()));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Grammar errors
        </h1>
        <p className="text-muted text-sm mt-0.5">
          Track weak spots — prepositions, tense, agreement, and more. Tap +
          when you make a mistake.
        </p>
      </div>

      {/* Today summary */}
      <div className="bg-card border border-theme rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide font-medium">
            Today
          </p>
          <p className="text-3xl font-semibold text-foreground mt-0.5">
            {todayTotal}
          </p>
          <p className="text-xs text-muted">errors logged today</p>
        </div>
        <div className="text-right text-sm text-muted">
          <p>
            All time:{" "}
            <strong className="text-foreground">
              {categories.reduce((s, c) => s + c.totalCount, 0)}
            </strong>
          </p>
          <p>
            Categories:{" "}
            <strong className="text-foreground">{categories.length}</strong>
          </p>
        </div>
      </div>

      {/* Last 14 days bar chart */}
      {dailyTotals.length > 0 && (
        <div className="bg-card border border-theme rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Last 14 days
          </h2>
          <div className="flex items-end gap-1 h-24">
            {dailyTotals.map((d) => {
              const h = d.count === 0 ? 4 : Math.max(8, (d.count / maxDaily) * 100);
              const label = new Date(d.date + "T12:00:00").toLocaleDateString(
                undefined,
                { weekday: "narrow", day: "numeric" }
              );
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-1 min-w-0"
                  title={`${d.date}: ${d.count}`}
                >
                  <span className="text-[9px] text-muted tabular-nums">
                    {d.count || ""}
                  </span>
                  <div
                    className={clsx(
                      "w-full rounded-t-sm transition-all",
                      d.count > 0
                        ? "bg-amber-500 dark:bg-amber-500/80"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[9px] text-muted truncate w-full text-center">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories with + / - */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
          Your categories
        </h2>
        {loading ? (
          <p className="text-muted text-center py-8">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-muted text-sm py-4">
            No categories yet. Add ones below (e.g. Preposition, Tense).
          </p>
        ) : (
          categories.map((c) => (
            <div
              key={c._id}
              className="flex items-center gap-3 bg-card border border-theme rounded-lg px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted">
                  Today:{" "}
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {c.todayCount}
                  </span>
                  {" · "}
                  Total: {c.totalCount}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  disabled={busyId === c._id || c.totalCount === 0}
                  onClick={() => changeCount(c._id, -1)}
                  className="p-2 rounded-lg border border-theme hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                  title="Undo one"
                >
                  <Minus size={16} />
                </button>
                <button
                  disabled={busyId === c._id}
                  onClick={() => changeCount(c._id, 1)}
                  className="p-2.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 shadow-sm"
                  title="I made this error"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => removeCategory(c._id, c.name)}
                  className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Delete category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add category */}
      <div className="bg-card border border-theme rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Add category</h2>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCategory(newName);
            }}
            placeholder="e.g. Relative clause"
            className="flex-1 px-3 py-2 border border-theme rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
          <button
            disabled={adding || !newName.trim()}
            onClick={() => addCategory(newName)}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED.filter((s) => !existingNames.has(s.toLowerCase())).map(
            (s) => (
              <button
                key={s}
                disabled={adding}
                onClick={() => addCategory(s)}
                className="text-xs px-2.5 py-1 rounded-full border border-theme text-muted hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground"
              >
                + {s}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
