"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

interface DayActivity {
  date: string;
  count: number;
}

interface ActivityData {
  activity: DayActivity[];
  totalActiveDays: number;
  totalActions: number;
  maxCount: number;
  streak: number;
  start: string;
  end: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function levelFromCount(count: number, max: number): number {
  if (count <= 0) return 0;
  if (max <= 1) return 2;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const LEVEL_CLASSES = [
  "bg-slate-200 dark:bg-slate-700/80", // 0 empty — visible gray
  "bg-emerald-200 dark:bg-emerald-900/70",
  "bg-emerald-300 dark:bg-emerald-700/80",
  "bg-emerald-500 dark:bg-emerald-600",
  "bg-emerald-700 dark:bg-emerald-400", // bold
];

/** Build an empty ~53-week activity list ending today */
function buildEmptyActivity(): DayActivity[] {
  const days = 371;
  const end = new Date();
  const list: DayActivity[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    list.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return list;
}

export default function ActivityHeatmap() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/activity")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d && !d.error && Array.isArray(d.activity)) {
          setData(d);
        } else {
          // Fallback empty grid so the UI is always visible
          const activity = buildEmptyActivity();
          setData({
            activity,
            totalActiveDays: 0,
            totalActions: 0,
            maxCount: 0,
            streak: 0,
            start: activity[0].date,
            end: activity[activity.length - 1].date,
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        const activity = buildEmptyActivity();
        setData({
          activity,
          totalActiveDays: 0,
          totalActions: 0,
          maxCount: 0,
          streak: 0,
          start: activity[0].date,
          end: activity[activity.length - 1].date,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { weeks, monthLabels } = useMemo(() => {
    const activity = data?.activity?.length ? data.activity : buildEmptyActivity();

    const first = new Date(activity[0].date + "T12:00:00");
    const pad = first.getDay();
    const padded: DayActivity[] = [];
    for (let i = 0; i < pad; i++) {
      padded.push({ date: "", count: -1 });
    }
    padded.push(...activity);

    const weeks: DayActivity[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      const week = padded.slice(i, i + 7);
      while (week.length < 7) week.push({ date: "", count: -1 });
      weeks.push(week);
    }

    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      for (const d of week) {
        if (!d.date) continue;
        const m = new Date(d.date + "T12:00:00").getMonth();
        if (m !== lastMonth) {
          monthLabels.push({ label: MONTHS[m], col });
          lastMonth = m;
          break;
        }
      }
    });

    return { weeks, monthLabels };
  }, [data]);

  const max = data?.maxCount || 1;
  const totalActions = data?.totalActions ?? 0;
  const totalActiveDays = data?.totalActiveDays ?? 0;
  const streak = data?.streak ?? 0;

  return (
    <section className="bg-card border border-theme rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Learning activity
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {loading
              ? "Loading..."
              : `${totalActions} action${totalActions !== 1 ? "s" : ""} in the last year · ${totalActiveDays} active day${totalActiveDays !== 1 ? "s" : ""}${
                  streak > 0
                    ? ` · ${streak}-day streak`
                    : ""
                }`}
          </p>
        </div>
      </div>

      {/* GitHub-style contribution grid */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-1 ml-7 relative h-4 min-w-[700px]">
            {monthLabels.map((m, i) => (
              <span
                key={`${m.label}-${m.col}-${i}`}
                className="absolute text-[10px] text-muted whitespace-nowrap"
                style={{ left: `${m.col * 13}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Weekday labels */}
            <div className="flex flex-col gap-[3px] mr-1 shrink-0 w-6">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className="h-[11px] text-[9px] text-muted leading-[11px]"
                >
                  {i % 2 === 1 ? d.slice(0, 3) : ""}
                </div>
              ))}
            </div>

            {/* Day squares */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => {
                    if (day.count < 0 || !day.date) {
                      return (
                        <div
                          key={`empty-${wi}-${di}`}
                          className="h-[11px] w-[11px] rounded-sm bg-transparent"
                        />
                      );
                    }
                    const level = levelFromCount(day.count, max);
                    const label = `${day.count} action${day.count !== 1 ? "s" : ""} on ${day.date}`;
                    return (
                      <div
                        key={day.date}
                        title={label}
                        className={clsx(
                          "h-[11px] w-[11px] rounded-sm transition-colors border border-black/5 dark:border-white/5",
                          LEVEL_CLASSES[level]
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-muted">
            <span>Less</span>
            {LEVEL_CLASSES.map((c, i) => (
              <div
                key={i}
                className={clsx(
                  "h-[11px] w-[11px] rounded-sm border border-black/5 dark:border-white/5",
                  c
                )}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted leading-relaxed">
        Like GitHub contributions: each square is a day. Green means you added
        phrases, reviewed, or edited that day. Darker green = more work.
        {totalActions === 0 && !loading && (
          <span className="block mt-1 text-foreground/80">
            No activity yet — add a phrase or complete a review to light up a
            green square.
          </span>
        )}
      </p>
    </section>
  );
}
