import Link from "next/link";
import { Phrase, STATUS_COLORS, STATUS_LABELS } from "@/types";
import clsx from "clsx";

interface Props {
  phrase: Phrase;
  compact?: boolean;
}

export default function PhraseCard({ phrase, compact = false }: Props) {
  return (
    <Link
      href={`/phrases/${phrase._id}`}
      className="block bg-card border border-theme rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground truncate">{phrase.phrase}</h3>
          {!compact && phrase.originalMistake && (
            <p className="text-sm text-muted mt-0.5 line-through">
              {phrase.originalMistake}
            </p>
          )}
        </div>
        <span
          className={clsx(
            "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
            STATUS_COLORS[phrase.status]
          )}
        >
          {STATUS_LABELS[phrase.status]}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="capitalize bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          {phrase.type}
        </span>
        <span>{phrase.category}</span>
        {phrase.mistakeCount > 0 && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            {phrase.mistakeCount} mistake{phrase.mistakeCount !== 1 ? "s" : ""}
          </span>
        )}
        {phrase.successfulUseCount > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400">
            {phrase.successfulUseCount} success
            {phrase.successfulUseCount !== 1 ? "es" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
