"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Settings,
  Sun,
  Moon,
  Target,
  LayoutTemplate,
  Layers,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "./ThemeProvider";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/phrases", label: "Phrase Bank", icon: BookOpen },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/problems", label: "Problems", icon: AlertCircle },
  { href: "/errors", label: "Errors", icon: Target },
  { href: "/review", label: "Review", icon: RefreshCw },
  { href: "/add", label: "Add Phrase", icon: PlusCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className="sticky top-0 z-50 border-b border-theme backdrop-blur-md"
      style={{ background: "var(--nav-bg)" }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="font-semibold text-lg tracking-tight text-foreground shrink-0"
          >
            English Phrase Bank
          </Link>
          <div className="hidden lg:flex items-center gap-0.5 flex-wrap justify-end">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-100 dark:bg-slate-800 text-foreground"
                      : "text-muted hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-foreground"
                  )}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={toggleTheme}
              className="ml-1 p-2 rounded-md text-muted hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-foreground transition-colors"
              aria-label="Toggle theme"
              title={
                theme === "light" ? "Switch to dark mode" : "Switch to light mode"
              }
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
        {/* Mobile / tablet nav */}
        <div className="flex lg:hidden overflow-x-auto gap-1 pb-2 -mt-1 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap",
                  active
                    ? "bg-slate-100 dark:bg-slate-800 text-foreground"
                    : "text-muted"
                )}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-muted ml-1"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
