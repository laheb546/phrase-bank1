"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Plus,
  RotateCcw,
  Layers,
  Trash2,
  Download,
} from "lucide-react";
import clsx from "clsx";

interface Flashcard {
  _id: string;
  front: string;
  back: string;
  source: "template" | "manual";
  phraseText?: string;
  sentences?: string[];
  reviewCount: number;
  nextReviewAt: string;
}

interface Counts {
  total: number;
  template: number;
  manual: number;
  due: number;
}

interface DailyInfo {
  flashcardsCreated: number;
  flashcardsReviewed: number;
  flashcardsProgress: number;
  flashcardsGoal: number;
  flashcardsMet: boolean;
  templatesCompleted: number;
  templatesGoal: number;
  templatesMet: boolean;
  allMet: boolean;
}

type Tab = "review" | "create" | "browse";


/** Draw one flashcard as a gallery photo.
 * Template: phrase as big title + sentences 1–5.
 * Manual: mistake (front) + correct (back).
 */
function drawFlashcardImage(
  card: Flashcard,
  index: number,
  total: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 1080;
    const H = 1920; // tall phone wallpaper style
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas not supported"));
      return;
    }

    const isTemplate =
      card.source === "template" ||
      (card.sentences && card.sentences.length > 0);

    // Background
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0a1628");
    g.addColorStop(0.5, "#0f2744");
    g.addColorStop(1, "#0b1220");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Soft glow circle
    const glow = ctx.createRadialGradient(W / 2, 280, 20, W / 2, 280, 400);
    glow.addColorStop(0, "rgba(59,130,246,0.25)");
    glow.addColorStop(1, "rgba(59,130,246,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 700);

    // Border
    ctx.strokeStyle = "rgba(56,189,248,0.45)";
    ctx.lineWidth = 6;
    roundRect(ctx, 32, 32, W - 64, H - 64, 32);
    ctx.stroke();

    // Top meta
    ctx.fillStyle = "#64748b";
    ctx.font = "26px system-ui, sans-serif";
    ctx.fillText("ENGLISH PHRASE BANK", 72, 100);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText(`${index + 1} / ${total}`, W - 160, 100);

    if (isTemplate) {
      const title = (card.phraseText || card.front || "").trim();
      // Badge
      ctx.fillStyle = "#0389c7";
      roundRect(ctx, 72, 140, 160, 44, 12);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px system-ui, sans-serif";
      ctx.fillText("CHUNK", 100, 170);

      // TITLE = phrase only
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 52px system-ui, sans-serif";
      const titleY = wrapTextCentered(ctx, title, W / 2, 280, W - 140, 62);

      // Divider
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, titleY + 30);
      ctx.lineTo(W - 100, titleY + 30);
      ctx.stroke();

      // Five sentences
      const sentences =
        card.sentences && card.sentences.length
          ? card.sentences
          : (card.back || "")
              .split("\n")
              .map((l) => l.replace(/^\d+\.\s*/, "").trim())
              .filter(Boolean);

      let y = titleY + 90;
      sentences.slice(0, 5).forEach((s, i) => {
        // number circle
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(110, y + 8, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px system-ui, sans-serif";
        ctx.fillText(String(i + 1), i + 1 >= 10 ? 96 : 103, y + 17);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "32px system-ui, sans-serif";
        y = wrapText(ctx, s, 150, y + 10, W - 230, 42) + 36;
      });
    } else {
      // Manual: mistake / correct
      ctx.fillStyle = "#7c3aed";
      roundRect(ctx, 72, 140, 180, 44, 12);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px system-ui, sans-serif";
      ctx.fillText("MANUAL", 100, 170);

      ctx.fillStyle = "#f87171";
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.fillText("MISTAKE", 72, 260);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "36px system-ui, sans-serif";
      let y = wrapText(ctx, card.front || "", 72, 320, W - 144, 48);

      y += 50;
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.fillText("CORRECT", 72, y);
      y += 50;
      ctx.fillStyle = "#f8fafc";
      ctx.font = "36px system-ui, sans-serif";
      wrapText(ctx, card.back || "", 72, y, W - 144, 48);
    }

    // Footer
    ctx.fillStyle = "#475569";
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText("Study daily · save to gallery", 72, H - 70);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to make image"));
      },
      "image/png",
      1
    );
  });
}

function wrapTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = String(text).split(/\s+/).filter(Boolean);
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, centerX - ctx.measureText(line).width / 2, cy);
      cy += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, centerX - ctx.measureText(line).width / 2, cy);
    cy += lineHeight;
  }
  return cy;
}


function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const paragraphs = String(text).split("\n");
  let cy = y;
  const maxLines = 12;
  let linesUsed = 0;
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, cy);
        cy += lineHeight;
        linesUsed++;
        line = word;
        if (linesUsed >= maxLines) {
          ctx.fillText("…", x, cy);
          return cy;
        }
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, x, cy);
      cy += lineHeight;
      linesUsed++;
      if (linesUsed >= maxLines) return cy;
    }
  }
  return cy;
}

async function exportFlashcardsAsImages(cards: Flashcard[]) {
  const day = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < cards.length; i++) {
    const blob = await drawFlashcardImage(cards[i], i, cards.length);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flashcard-${day}-${String(i + 1).padStart(2, "0")}.png`;
    a.click();
    URL.revokeObjectURL(url);
    await new Promise((r) => setTimeout(r, 350));
  }
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(s: string) {
  const t = String(s ?? "").replace(/"/g, '""');
  return `"${t}"`;
}

function exportFlashcardsCsv(cards: Flashcard[]) {
  const header = "front,back,source,phrase,reviews,next_review";
  const rows = cards.map((c) =>
    [
      escapeCsv(c.front),
      escapeCsv(c.back),
      escapeCsv(c.source),
      escapeCsv(c.phraseText || ""),
      String(c.reviewCount ?? 0),
      escapeCsv(c.nextReviewAt || ""),
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const day = new Date().toISOString().slice(0, 10);
  downloadBlob(`flashcards-${day}.csv`, csv, "text/csv;charset=utf-8");
}


function exportFlashcardsHtml(cards: Flashcard[]) {
  const day = new Date().toISOString().slice(0, 10);
  const payload = JSON.stringify(
    cards.map((c) => ({
      front: c.front,
      back: c.back,
      source: c.source,
      phrase: c.phraseText || "",
    }))
  ).replace(/</g, "\\u003c");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<title>Flashcards ${day}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body {
    margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: #0b1220; color: #e2e8f0; min-height: 100dvh;
    display: flex; flex-direction: column;
  }
  header {
    padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #1e293b; background: #111827; position: sticky; top: 0; z-index: 2;
  }
  header h1 { font-size: 15px; margin: 0; font-weight: 600; }
  header span { font-size: 12px; color: #94a3b8; }
  main { flex: 1; display: flex; flex-direction: column; padding: 16px; gap: 14px; max-width: 480px; margin: 0 auto; width: 100%; }
  .card {
    flex: 1; min-height: 240px; background: linear-gradient(160deg, #1e293b, #0f172a);
    border: 1px solid #334155; border-radius: 16px; padding: 20px;
    display: flex; flex-direction: column; justify-content: center;
    box-shadow: 0 8px 30px rgba(0,0,0,.35); cursor: pointer; user-select: none;
    transition: transform .15s ease;
  }
  .card:active { transform: scale(0.98); }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin-bottom: 10px; }
  .text { font-size: 17px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
  .phrase { margin-top: 12px; font-size: 12px; color: #38bdf8; }
  .hint { text-align: center; font-size: 12px; color: #64748b; }
  .nav { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  button {
    border: none; border-radius: 12px; padding: 14px 10px; font-size: 15px; font-weight: 600;
    cursor: pointer;
  }
  .prev, .next { background: #334155; color: #e2e8f0; }
  .flip { background: #3b82f6; color: #fff; }
  .progress { height: 4px; background: #1e293b; border-radius: 99px; overflow: hidden; }
  .progress > i { display: block; height: 100%; background: #22c55e; width: 0%; transition: width .2s; }
</style>
</head>
<body>
<header>
  <h1>My Flashcards</h1>
  <span id="counter">0 / 0</span>
</header>
<main>
  <div class="progress"><i id="bar"></i></div>
  <div class="card" id="card" onclick="flip()">
    <div class="label" id="side">Front — tap to flip</div>
    <div class="text" id="text"></div>
    <div class="phrase" id="phrase"></div>
  </div>
  <p class="hint" id="hint">Tap the card to show the answer</p>
  <div class="nav">
    <button class="prev" type="button" onclick="go(-1)">Prev</button>
    <button class="flip" type="button" onclick="flip()">Flip</button>
    <button class="next" type="button" onclick="go(1)">Next</button>
  </div>
</main>
<script>
const cards = ${payload};
let i = 0, showBack = false;
const elText = document.getElementById('text');
const elSide = document.getElementById('side');
const elPhrase = document.getElementById('phrase');
const elCounter = document.getElementById('counter');
const elBar = document.getElementById('bar');
const elHint = document.getElementById('hint');
function render() {
  if (!cards.length) {
    elText.textContent = 'No cards in this file.';
    elSide.textContent = '';
    elPhrase.textContent = '';
    elCounter.textContent = '0 / 0';
    return;
  }
  const c = cards[i];
  elText.textContent = showBack ? c.back : c.front;
  elSide.textContent = showBack ? 'Answer' : 'Front — tap to flip';
  elPhrase.textContent = c.phrase ? ('« ' + c.phrase + ' »') : '';
  elCounter.textContent = (i + 1) + ' / ' + cards.length;
  elBar.style.width = ((i + 1) / cards.length * 100) + '%';
  elHint.textContent = showBack ? 'Go next when ready' : 'Tap the card to show the answer';
}
function flip() { if (!cards.length) return; showBack = !showBack; render(); }
function go(d) {
  if (!cards.length) return;
  i = (i + d + cards.length) % cards.length;
  showBack = false;
  render();
}
let x0 = null;
document.getElementById('card').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, {passive:true});
document.getElementById('card').addEventListener('touchend', e => {
  if (x0 == null) return;
  const dx = e.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  x0 = null;
}, {passive:true});
render();
</script>
</body>
</html>`;

  downloadBlob(`flashcards-${day}.html`, html, "text/html;charset=utf-8");
}

function exportFlashcardsJson(cards: Flashcard[]) {
  const day = new Date().toISOString().slice(0, 10);
  const payload = cards.map((c) => ({
    front: c.front,
    back: c.back,
    source: c.source,
    phrase: c.phraseText || null,
    reviewCount: c.reviewCount,
    nextReviewAt: c.nextReviewAt,
  }));
  downloadBlob(
    `flashcards-${day}.json`,
    JSON.stringify(payload, null, 2),
    "application/json"
  );
}



export default function FlashcardsPage() {
  const [tab, setTab] = useState<Tab>("review");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [daily, setDaily] = useState<DailyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "template" | "manual">("all");

  // Review state
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  // Manual create
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const loadDaily = useCallback(async () => {
    try {
      const res = await fetch("/api/daily");
      const data = await res.json();
      if (!data.error) setDaily(data);
    } catch {
      /* ignore */
    }
  }, []);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter !== "all") params.set("source", filter);
      const res = await fetch(`/api/flashcards?${params}`);
      const data = await res.json();
      if (!data.error) {
        setCards(data.cards || []);
        setCounts(data.counts || null);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadCards();
    loadDaily();
  }, [loadCards, loadDaily]);

  const startReview = async () => {
    const res = await fetch("/api/flashcards?dueOnly=true&limit=30");
    const data = await res.json();
    let list: Flashcard[] = data.cards || [];
    // If none due, review recent ones so daily practice still works
    if (list.length === 0) {
      const all = await fetch("/api/flashcards?limit=20");
      const allData = await all.json();
      list = allData.cards || [];
    }
    if (list.length === 0) {
      setMsg("No flashcards yet. Finish a template or create one below.");
      return;
    }
    setQueue(list);
    setIdx(0);
    setFlipped(false);
    setReviewing(true);
    setMsg("");
  };

  const grade = async (result: "again" | "hard" | "good" | "easy") => {
    const card = queue[idx];
    if (!card) return;
    await fetch(`/api/flashcards/${card._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    });
    loadDaily();
    if (idx + 1 >= queue.length) {
      setReviewing(false);
      setMsg("Session done — great work.");
      loadCards();
    } else {
      setIdx(idx + 1);
      setFlipped(false);
    }
  };

  const createManual = async () => {
    if (!front.trim() || !back.trim()) {
      setMsg("Both sides are required.");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: front.trim(),
          back: back.trim(),
          source: "manual",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setFront("");
      setBack("");
      setMsg("Flashcard saved.");
      loadCards();
      loadDaily();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const removeCard = async (id: string) => {
    if (!confirm("Delete this flashcard?")) return;
    await fetch(`/api/flashcards/${id}`, { method: "DELETE" });
    loadCards();
  };

  const current = queue[idx];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Flashcards</h1>
        <p className="text-muted text-sm mt-0.5">
          From templates (personal sentences) or your own mistake → correct
          pairs. Daily goal: <strong>5</strong> create or review actions.
        </p>
      </div>

      {/* Daily goals */}
      {daily && (
        <div
          className={clsx(
            "rounded-xl border p-4 space-y-3",
            daily.allMet
              ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800"
              : "border-theme bg-card"
          )}
        >
          <div className="flex flex-wrap gap-4 justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                Flashcards today
              </p>
              <p className="text-xl font-semibold text-foreground">
                {daily.flashcardsProgress} / {daily.flashcardsGoal}
              </p>
              <p className="text-[11px] text-muted">
                {daily.flashcardsCreated} created · {daily.flashcardsReviewed}{" "}
                reviewed
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                Templates today
              </p>
              <p className="text-xl font-semibold text-foreground">
                {daily.templatesCompleted} / {daily.templatesGoal}
              </p>
            </div>
            {daily.allMet && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium self-center">
                <CheckCircle2 size={18} /> Daily goals done
              </span>
            )}
          </div>
          {/* Progress bars */}
          <div className="space-y-1.5">
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (daily.flashcardsProgress / daily.flashcardsGoal) * 100)}%`,
                }}
              />
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (daily.templatesCompleted / daily.templatesGoal) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
        {(
          [
            { id: "review" as Tab, label: "Review" },
            { id: "create" as Tab, label: "Create mine" },
            { id: "browse" as Tab, label: "Browse" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setReviewing(false);
              setMsg("");
            }}
            className={clsx(
              "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>


      {/* Download as gallery photos (PNG) */}
      <div className="flex flex-wrap items-center gap-2 bg-card border border-theme rounded-lg px-3 py-2.5">
        <Download size={16} className="text-muted shrink-0" />
        <span className="text-sm text-foreground font-medium">Download</span>
        <button
          type="button"
          onClick={async () => {
            const params = new URLSearchParams({ limit: "100" });
            if (filter !== "all") params.set("source", filter);
            const res = await fetch(`/api/flashcards?${params}`);
            const data = await res.json();
            const list = data.cards || [];
            if (!list.length) {
              setMsg("Nothing to download.");
              return;
            }
            setMsg(`Creating ${list.length} photo(s)... allow multiple downloads if the browser asks.`);
            try {
              await exportFlashcardsAsImages(list);
              setMsg(
                `Downloaded ${list.length} PNG photo(s). On your phone: open each file → Share / Save to Photos (gallery).`
              );
            } catch {
              setMsg("Could not create images. Try fewer cards or another browser.");
            }
          }}
          className="text-xs px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 font-medium"
        >
          Gallery photos
        </button>
        <button
          type="button"
          onClick={async () => {
            const params = new URLSearchParams({ limit: "500" });
            if (filter !== "all") params.set("source", filter);
            const res = await fetch(`/api/flashcards?${params}`);
            const data = await res.json();
            const list = data.cards || [];
            if (!list.length) {
              setMsg("Nothing to download.");
              return;
            }
            exportFlashcardsHtml(list);
            setMsg(
              `Downloaded ${list.length} cards. Open the .html file in your phone browser to study offline.`
            );
          }}
          className="text-xs px-2.5 py-1 rounded-md border border-theme text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Phone deck
        </button>
        <button
          type="button"
          onClick={async () => {
            const params = new URLSearchParams({ limit: "500" });
            if (filter !== "all") params.set("source", filter);
            const res = await fetch(`/api/flashcards?${params}`);
            const data = await res.json();
            const list = data.cards || [];
            if (!list.length) {
              setMsg("Nothing to download.");
              return;
            }
            exportFlashcardsCsv(list);
            setMsg(`Downloaded ${list.length} cards as CSV.`);
          }}
          className="text-xs px-2.5 py-1 rounded-md border border-theme text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          CSV
        </button>
        <button
          type="button"
          onClick={async () => {
            const params = new URLSearchParams({ limit: "500" });
            if (filter !== "all") params.set("source", filter);
            const res = await fetch(`/api/flashcards?${params}`);
            const data = await res.json();
            const list = data.cards || [];
            if (!list.length) {
              setMsg("Nothing to download.");
              return;
            }
            exportFlashcardsJson(list);
            setMsg(`Downloaded ${list.length} cards as JSON.`);
          }}
          className="text-xs px-2.5 py-1 rounded-md border border-theme text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          JSON
        </button>
        <span className="text-[11px] text-muted">
          Gallery photos = PNG images you save to your camera roll
        </span>
      </div>

      {msg && (
        <p className="text-sm text-muted bg-card border border-theme rounded-lg px-3 py-2">
          {msg}
        </p>
      )}

      {/* REVIEW */}
      {tab === "review" && !reviewing && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="Total" value={counts?.total ?? 0} />
            <Stat label="From templates" value={counts?.template ?? 0} />
            <Stat label="Manual" value={counts?.manual ?? 0} />
            <Stat label="Due now" value={counts?.due ?? 0} accent />
          </div>
          <button
            type="button"
            onClick={startReview}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-white rounded-lg font-medium hover:opacity-90"
          >
            <RotateCcw size={18} />
            Start review session
          </button>
          <p className="text-xs text-muted text-center">
            Prefer due cards first. Each grade counts toward your daily 5.
          </p>
          <p className="text-xs text-muted text-center">
            Need more cards?{" "}
            <Link href="/templates" className="underline text-foreground">
              Run a template
            </Link>
          </p>
        </div>
      )}

      {tab === "review" && reviewing && current && (
        <div className="space-y-4">
          <p className="text-xs text-muted text-center">
            Card {idx + 1} of {queue.length}
            {current.source === "template" ? " · from template" : " · manual"}
            {current.phraseText ? ` · « ${current.phraseText} »` : ""}
          </p>
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className="w-full min-h-[200px] bg-card border-2 border-theme rounded-xl p-6 text-left hover:border-blue-400 transition-colors"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted mb-2">
              {flipped ? "Answer" : "Prompt — tap to flip"}
            </p>
            {flipped && current.source === "template" && current.sentences?.length ? (
              <ol className="list-decimal list-inside space-y-2 text-foreground text-base leading-relaxed">
                {current.sentences.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            ) : (
              <p className="text-foreground whitespace-pre-wrap text-base leading-relaxed">
                {flipped ? current.back : current.front}
              </p>
            )}
            {!flipped && current.source === "template" && (
              <p className="text-sm text-muted mt-3">
                Recall your five sentences for this chunk
              </p>
            )}
          </button>
          {flipped ? (
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ["again", "Again", "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"],
                  ["hard", "Hard", "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"],
                  ["good", "Good", "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"],
                  ["easy", "Easy", "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"],
                ] as const
              ).map(([key, label, cls]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => grade(key)}
                  className={clsx(
                    "py-2.5 rounded-lg text-sm font-medium",
                    cls
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-muted">
              Think of the answer, then flip the card
            </p>
          )}
          <button
            type="button"
            onClick={() => setReviewing(false)}
            className="w-full text-sm text-muted hover:text-foreground"
          >
            End session
          </button>
        </div>
      )}

      {/* CREATE MANUAL */}
      {tab === "create" && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Write the mistake you make and the correct way to say it. One card. Counts toward today&apos;s 5.
          </p>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
              Your mistake
            </label>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              placeholder="e.g. I am agree with you"
              className="w-full px-3 py-2 border border-theme rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
              Correct / natural form
            </label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              placeholder="e.g. I agree with you"
              className="w-full px-3 py-2 border border-theme rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={createManual}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={18} />
            {saving ? "Saving..." : "Add flashcard"}
          </button>
        </div>
      )}

      {/* BROWSE */}
      {tab === "browse" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["all", "template", "manual"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={clsx(
                  "text-xs px-3 py-1.5 rounded-full border capitalize",
                  filter === f
                    ? "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                    : "border-theme text-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          {loading ? (
            <p className="text-muted text-center py-8">Loading...</p>
          ) : cards.length === 0 ? (
            <p className="text-muted text-center py-8">No cards in this filter.</p>
          ) : (
            <div className="space-y-2">
              {cards.map((c) => (
                <div
                  key={c._id}
                  className="bg-card border border-theme rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={clsx(
                        "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded",
                        c.source === "template"
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200"
                          : "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200"
                      )}
                    >
                      {c.source}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCard(c._id)}
                      className="text-muted hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2 whitespace-pre-wrap">
                    {c.source === "template"
                      ? c.phraseText || c.front
                      : c.front}
                  </p>
                  <p className="text-sm text-muted line-clamp-3 whitespace-pre-wrap">
                    {c.source === "template" && c.sentences?.length
                      ? c.sentences.map((s, i) => `${i + 1}. ${s}`).join(" · ")
                      : `→ ${c.back}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-card border border-theme rounded-lg p-3 text-center">
      <p className="text-[10px] text-muted uppercase tracking-wide">{label}</p>
      <p
        className={clsx(
          "text-xl font-semibold",
          accent ? "text-amber-600 dark:text-amber-400" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
