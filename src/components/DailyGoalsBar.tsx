"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, LayoutTemplate, Layers } from "lucide-react";
import clsx from "clsx";

interface DailyInfo {
  templatesCompleted: number;
  templatesGoal: number;
  templatesMet: boolean;
  flashcardsProgress: number;
  flashcardsGoal: number;
  flashcardsMet: boolean;
  allMet: boolean;
}

export default function DailyGoalsBar() {
  const [daily, setDaily] = useState<DailyInfo | null>(null);

  useEffect(() => {
    fetch("/api/daily")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setDaily(d);
      })
      .catch(() => {});
  }, []);

  if (!daily) return null;

  return (
    <section
      className={clsx(
        "rounded-xl border p-4 space-y-3",
        daily.allMet
          ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800"
          : "border-theme bg-card"
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-foreground">
          Today&apos;s practice goals
        </h2>
        {daily.allMet && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <CheckCircle2 size={14} /> All done
          </span>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/templates"
          className="flex items-center gap-3 p-3 rounded-lg border border-theme hover:border-blue-400 transition-colors"
        >
          <LayoutTemplate size={20} className="text-muted shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Templates {daily.templatesCompleted}/{daily.templatesGoal}
            </p>
            <p className="text-[11px] text-muted">
              3 sessions · 15 personal sentences
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${Math.min(100, (daily.templatesCompleted / daily.templatesGoal) * 100)}%`,
                }}
              />
            </div>
          </div>
        </Link>
        <Link
          href="/flashcards"
          className="flex items-center gap-3 p-3 rounded-lg border border-theme hover:border-blue-400 transition-colors"
        >
          <Layers size={20} className="text-muted shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Flashcards {daily.flashcardsProgress}/{daily.flashcardsGoal}
            </p>
            <p className="text-[11px] text-muted">
              Create or review · 5 actions
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${Math.min(100, (daily.flashcardsProgress / daily.flashcardsGoal) * 100)}%`,
                }}
              />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
