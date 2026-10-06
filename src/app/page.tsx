"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phrase } from "@/types";
import PhraseCard from "@/components/PhraseCard";
import { BookOpen, AlertCircle, RefreshCw, PlusCircle } from "lucide-react";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import DailyGoalsBar from "@/components/DailyGoalsBar";

interface Stats {
  total: number;
  collocations: number;
  chunks: number;
  activeProblems: number;
  dueForReview: number;
  recentPhrases: Phrase[];
  recentProblems: Phrase[];
  statusCounts: Record<string, number>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        Loading your phrase bank...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My English Bank</h1>
          <p className="text-muted mt-1 text-sm">
            Don&apos;t memorize more English. Build a bank of English you actually use.
          </p>
        </div>
        <div className="text-center py-10 bg-card border border-theme rounded-xl">
          <p className="text-red-600 mb-4">{error || "Something went wrong"}</p>
          <p className="text-sm text-muted mb-6">
            Check your connection and try again.
          </p>
          <Link
            href="/add"
            className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <PlusCircle size={16} />
            Add your first phrase
          </Link>
        </div>
        <DailyGoalsBar />

      <ActivityHeatmap />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My English Bank</h1>
        <p className="text-muted mt-1 text-sm">
          Don&apos;t memorize more English. Build a bank of English you actually use.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Phrases" value={stats.total} />
        <StatCard label="Collocations" value={stats.collocations} />
        <StatCard label="Chunks" value={stats.chunks} />
        <StatCard
          label="Active Problems"
          value={stats.activeProblems}
          accent="amber"
        />
      </div>

      {/* Activity heatmap (GitHub-style) */}
      <DailyGoalsBar />

      <ActivityHeatmap />

      {/* Review CTA */}
      {stats.dueForReview > 0 && (
        <div className="bg-accent text-white rounded-xl p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-medium text-lg">
              {stats.dueForReview} phrase{stats.dueForReview !== 1 ? "s" : ""} due for
              review
            </p>
            <p className="text-slate-400 text-sm mt-0.5">
              Keep the language active with spaced recall
            </p>
          </div>
          <Link
            href="/review"
            className="bg-card text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-200 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Start Review
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink
          href="/add"
          icon={<PlusCircle size={18} />}
          title="Add Phrase"
          desc="Save a new collocation or chunk"
        />
        <QuickLink
          href="/phrases"
          icon={<BookOpen size={18} />}
          title="Phrase Bank"
          desc="Browse and search all phrases"
        />
        <QuickLink
          href="/problems"
          icon={<AlertCircle size={18} />}
          title="Recurring Problems"
          desc="Track repeated mistakes"
        />
      </div>

      {/* Recent problems */}
      {stats.recentProblems.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Recent Problems
          </h2>
          <div className="space-y-2">
            {stats.recentProblems.map((p) => (
              <Link
                key={p._id}
                href={`/phrases/${p._id}`}
                className="flex items-center justify-between bg-card border border-theme rounded-lg px-4 py-3 hover:border-theme"
              >
                <div>
                  <span className="font-medium text-foreground">{p.phrase}</span>
                  {p.originalMistake && (
                    <span className="text-muted text-sm ml-2 line-through">
                      {p.originalMistake}
                    </span>
                  )}
                </div>
                <span className="text-amber-600 text-sm font-medium">
                  {p.mistakeCount} mistake{p.mistakeCount !== 1 ? "s" : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent phrases */}
      {stats.recentPhrases.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Recently Added
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {stats.recentPhrases.map((p) => (
              <PhraseCard key={p._id} phrase={p} compact />
            ))}
          </div>
        </section>
      )}

      {stats.total === 0 && (
        <div className="text-center py-12 bg-card border border-dashed border-theme rounded-xl">
          <p className="text-muted mb-4">Your phrase bank is empty.</p>
          <Link
            href="/add"
            className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <PlusCircle size={16} />
            Add your first phrase
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "amber";
}) {
  return (
    <div className="bg-card border border-theme rounded-lg p-4">
      <p className="text-xs text-muted font-medium uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-2xl font-semibold mt-1 ${
          accent === "amber" ? "text-amber-600" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 bg-card border border-theme rounded-lg p-4 hover:border-theme hover:shadow-sm transition-all"
    >
      <div className="text-muted mt-0.5">{icon}</div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted">{desc}</p>
      </div>
    </Link>
  );
}
