"use client";

import { useEffect, useState, useCallback } from "react";
import { Phrase, CATEGORIES, STATUS_LABELS } from "@/types";
import PhraseCard from "@/components/PhraseCard";
import { Search } from "lucide-react";

export default function PhraseBankPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  const fetchPhrases = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    params.set("limit", "100");

    try {
      const res = await fetch(`/api/phrases?${params}`);
      const data = await res.json();
      setPhrases(Array.isArray(data) ? data : []);
    } catch {
      setPhrases([]);
    } finally {
      setLoading(false);
    }
  }, [search, type, status, category, sort]);

  useEffect(() => {
    const t = setTimeout(fetchPhrases, 200);
    return () => clearTimeout(t);
  }, [fetchPhrases]);

  const selectClass =
    "text-sm border border-theme rounded-lg px-2 py-1.5 bg-input text-foreground";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Phrase Bank</h1>
        <p className="text-muted text-sm mt-0.5">
          {phrases.length} phrase{phrases.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-theme rounded-lg p-4 space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a letter or word — finds phrases that start with it..."
            className="w-full pl-9 pr-3 py-2 border border-theme rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={selectClass}
          >
            <option value="">All types</option>
            <option value="collocation">Collocation</option>
            <option value="chunk">Chunk</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectClass}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={selectClass}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="mistakes">Most mistakes</option>
            <option value="review">Review priority</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted text-center py-10">Loading...</p>
      ) : phrases.length === 0 ? (
        <p className="text-muted text-center py-10">No phrases found.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {phrases.map((p) => (
            <PhraseCard key={p._id} phrase={p} />
          ))}
        </div>
      )}
    </div>
  );
}
