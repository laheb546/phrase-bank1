"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import clsx from "clsx";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted text-sm mt-0.5">
          Personal use — keep it simple.
        </p>
      </div>

      <div className="bg-card border border-theme rounded-lg p-5 space-y-4">
        <h2 className="font-medium text-foreground">Appearance</h2>
        <p className="text-sm text-muted">
          Choose how the app looks. Light mode has a soft cloud feel; dark mode
          uses a deep blue palette that is easy on the eyes.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all",
              theme === "light"
                ? "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-600"
                : "border-theme bg-card text-muted hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <Sun size={18} />
            Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all",
              theme === "dark"
                ? "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-600"
                : "border-theme bg-card text-muted hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <Moon size={18} />
            Dark
          </button>
        </div>
      </div>

      <div className="bg-card border border-theme rounded-lg p-5 space-y-3">
        <h2 className="font-medium text-foreground">About</h2>
        <p className="text-sm text-muted">
          <strong className="text-foreground">English Phrase Bank</strong>
        </p>
        <p className="text-sm text-muted">
          A personal English phrase bank that turns your own mistakes into
          reusable natural language.
        </p>
        <p className="text-sm text-muted italic">
          Don&apos;t memorize more English. Build a bank of English you actually
          use.
        </p>
        <p className="text-xs text-muted/80 mt-2">
          MVP — AI speaking features can be added later.
        </p>
      </div>
    </div>
  );
}
