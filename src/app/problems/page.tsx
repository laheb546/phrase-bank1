"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phrase, STATUS_COLORS, STATUS_LABELS } from "@/types";
import clsx from "clsx";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/phrases?sort=mistakes&limit=50")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data.filter((p: Phrase) => p.mistakeCount >= 1)
          : [];
        setProblems(list);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Recurring Problems
        </h1>
        <p className="text-muted text-sm mt-0.5">
          Expressions that still need work — track and conquer them.
        </p>
      </div>

      {loading ? (
        <p className="text-muted text-center py-10">Loading...</p>
      ) : problems.length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-theme rounded-xl">
          <p className="text-muted">No recurring problems yet.</p>
          <p className="text-sm text-muted mt-1">
            When you record mistakes, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {problems.map((p, i) => (
            <Link
              key={p._id}
              href={`/phrases/${p._id}`}
              className="flex items-start gap-4 bg-card border border-theme rounded-lg p-4 hover:border-theme transition-colors"
            >
              <span className="text-muted font-mono text-sm w-6 shrink-0 pt-0.5">
                {i + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{p.phrase}</span>
                  <span
                    className={clsx(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      STATUS_COLORS[p.status]
                    )}
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
                {p.originalMistake && (
                  <p className="text-sm text-muted mt-0.5">
                    My mistake:{" "}
                    <span className="line-through">{p.originalMistake}</span>
                  </p>
                )}
                <div className="flex gap-4 mt-1.5 text-xs">
                  <span className="text-amber-600 font-medium">
                    Mistakes: {p.mistakeCount}
                  </span>
                  <span className="text-emerald-600">
                    Successful uses: {p.successfulUseCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
