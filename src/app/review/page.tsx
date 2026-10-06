"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phrase, ReviewResult } from "@/types";

type ReviewMode = "fill-blank" | "multiple-choice" | "recall" | "personal";

function ReviewContent() {
  const searchParams = useSearchParams();
  const specificId = searchParams.get("id");

  const [queue, setQueue] = useState<Phrase[]>([]);
  const [current, setCurrent] = useState(0);
  const [mode, setMode] = useState<ReviewMode>("fill-blank");
  const [revealed, setRevealed] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionResults, setSessionResults] = useState<
    { result: ReviewResult; phrase: string }[]
  >([]);

  useEffect(() => {
    async function load() {
      if (specificId) {
        const res = await fetch(`/api/phrases/${specificId}`);
        const data = await res.json();
        if (!data.error) setQueue([data]);
      } else {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        setQueue(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    }
    load();
  }, [specificId]);

  const phrase = queue[current];

  const pickMode = (p: Phrase): ReviewMode => {
    const modes: ReviewMode[] = ["fill-blank", "multiple-choice", "recall"];
    if (p.exampleSentence) modes.push("personal");
    return modes[Math.floor(Math.random() * modes.length)];
  };

  useEffect(() => {
    if (phrase) {
      setMode(pickMode(phrase));
      setRevealed(false);
      setUserAnswer("");
    }
  }, [current, phrase?._id]);

  const submitResult = async (result: ReviewResult) => {
    if (!phrase || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phraseId: phrase._id,
          result,
          reviewType: mode,
          userAnswer: userAnswer || undefined,
        }),
      });
      setSessionResults((prev) => [
        ...prev,
        { result, phrase: phrase.phrase },
      ]);
      if (current + 1 >= queue.length) {
        setDone(true);
      } else {
        setCurrent((c) => c + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-muted text-center py-20">Loading review...</p>;
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-foreground font-medium mb-2">Nothing due for review</p>
        <p className="text-muted text-sm mb-6">
          Great job! Come back later or review a specific phrase from the bank.
        </p>
        <Link
          href="/phrases"
          className="text-sm bg-accent text-white px-4 py-2 rounded-lg"
        >
          Browse Phrase Bank
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <h1 className="text-2xl font-semibold">Review Complete!</h1>
        <p className="text-muted">
          You reviewed {sessionResults.length} phrase
          {sessionResults.length !== 1 ? "s" : ""}.
        </p>
        <div className="bg-card border border-theme rounded-lg p-4 text-left space-y-2">
          {sessionResults.map((r, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-foreground">{r.phrase}</span>
              <span
                className={
                  r.result === "again"
                    ? "text-red-600"
                    : r.result === "hard"
                    ? "text-amber-600"
                    : r.result === "good"
                    ? "text-sky-600"
                    : "text-emerald-600"
                }
              >
                {r.result}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/review"
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm"
            onClick={() => window.location.reload()}
          >
            Review more
          </Link>
          <Link
            href="/"
            className="border border-theme px-4 py-2 rounded-lg text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Generate prompt based on mode
  const blankPrompt = () => {
    if (phrase.exampleSentence && phrase.exampleSentence.includes(phrase.phrase)) {
      return phrase.exampleSentence.replace(
        new RegExp(phrase.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
        "______"
      );
    }
    // Fallback: use pattern or meaning
    if (phrase.pattern) {
      return `Complete: ${phrase.pattern.replace(/\+.*$/, "______")}`;
    }
    return `I need to ______ (related to: ${phrase.meaning.slice(0, 40)}...)`;
  };

  const mcOptions = () => {
    const options = [phrase.phrase];
    if (phrase.originalMistake) options.push(phrase.originalMistake);
    // Dummy distractors
    options.push(phrase.phrase.split(" ").reverse().join(" "));
    if (options.length < 3) options.push("make a " + phrase.phrase);
    return options.sort(() => Math.random() - 0.5).slice(0, 3);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {current + 1} / {queue.length}
        </span>
        <span className="capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
          {mode.replace("-", " ")}
        </span>
      </div>

      <div className="bg-card border border-theme rounded-xl p-6 min-h-[220px] flex flex-col">
        {/* Prompt */}
        {mode === "fill-blank" && (
          <div className="flex-1">
            <p className="text-xs text-muted uppercase tracking-wide mb-3">
              Fill in the blank
            </p>
            <p className="text-lg text-foreground leading-relaxed">
              {blankPrompt()}
            </p>
          </div>
        )}

        {mode === "multiple-choice" && (
          <div className="flex-1">
            <p className="text-xs text-muted uppercase tracking-wide mb-3">
              Choose the natural expression
            </p>
            {phrase.originalMistake && (
              <p className="text-sm text-muted mb-3">
                Instead of: <span className="line-through">{phrase.originalMistake}</span>
              </p>
            )}
            <div className="space-y-2">
              {mcOptions().map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setUserAnswer(opt);
                    setRevealed(true);
                  }}
                  disabled={revealed}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    revealed
                      ? opt === phrase.phrase
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : opt === userAnswer
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-theme text-muted"
                      : "border-theme hover:border-slate-400"
                  }`}
                >
                  {String.fromCharCode(65 + i)}. {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "recall" && (
          <div className="flex-1">
            <p className="text-xs text-muted uppercase tracking-wide mb-3">
              Recall the phrase
            </p>
            <p className="text-lg text-foreground">{phrase.meaning}</p>
            {phrase.category && (
              <p className="text-sm text-muted mt-2">Category: {phrase.category}</p>
            )}
          </div>
        )}

        {mode === "personal" && (
          <div className="flex-1">
            <p className="text-xs text-muted uppercase tracking-wide mb-3">
              Create your own sentence
            </p>
            <p className="text-foreground mb-3">
              Use: <strong>&ldquo;{phrase.phrase}&rdquo;</strong>
            </p>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              rows={3}
              placeholder="Type your sentence here..."
              className="w-full border border-theme rounded-lg p-3 text-sm focus:outline-none focus:border-slate-400"
              disabled={revealed}
            />
          </div>
        )}

        {/* Reveal area */}
        {revealed && mode !== "multiple-choice" && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">
              Answer
            </p>
            <p className="text-xl font-medium text-foreground">{phrase.phrase}</p>
            {phrase.exampleSentence && (
              <p className="text-sm text-muted mt-1 italic">
                {phrase.exampleSentence}
              </p>
            )}
          </div>
        )}

        {mode === "multiple-choice" && revealed && (
          <div className="mt-3 text-sm text-muted">
            {userAnswer === phrase.phrase ? (
              <span className="text-emerald-600 font-medium">Correct!</span>
            ) : (
              <span className="text-red-600">
                Correct answer: <strong>{phrase.phrase}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full bg-accent text-white py-2.5 rounded-lg font-medium hover:opacity-90"
        >
          {mode === "personal" ? "Show answer & rate" : "Reveal Answer"}
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { key: "again", label: "Again", color: "bg-red-500 hover:bg-red-600" },
              { key: "hard", label: "Hard", color: "bg-amber-500 hover:bg-amber-600" },
              { key: "good", label: "Good", color: "bg-sky-500 hover:bg-sky-600" },
              { key: "easy", label: "Easy", color: "bg-emerald-500 hover:bg-emerald-600" },
            ] as const
          ).map((btn) => (
            <button
              key={btn.key}
              disabled={submitting}
              onClick={() => submitResult(btn.key)}
              className={`${btn.color} text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<p className="text-center py-20 text-muted">Loading...</p>}>
      <ReviewContent />
    </Suspense>
  );
}
