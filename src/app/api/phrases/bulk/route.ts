import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Phrase from "@/models/Phrase";

/**
 * Accepts array of { phrase, meaning?, type?, category? }
 * Creates many phrases at once.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required" },
        { status: 400 }
      );
    }

    if (items.length > 100) {
      return NextResponse.json(
        { error: "Max 100 items at once" },
        { status: 400 }
      );
    }

    const defaultType = body.type === "collocation" ? "collocation" : "chunk";
    const defaultCategory = body.category || "Other";

    const docs = items
      .map((item: { phrase?: string; meaning?: string }) => {
        const phrase = (item.phrase || "").trim();
        if (!phrase) return null;
        const meaning = (item.meaning || "").trim() || phrase;
        return {
          phrase,
          type: defaultType,
          meaning,
          category: defaultCategory,
          status: "new" as const,
          mistakeCount: 0,
          successfulUseCount: 0,
          reviewCount: 0,
          nextReviewAt: new Date(),
        };
      })
      .filter(Boolean);

    if (docs.length === 0) {
      return NextResponse.json(
        { error: "No valid phrases found" },
        { status: 400 }
      );
    }

    const created = await Phrase.insertMany(docs);
    return NextResponse.json(
      { count: created.length, ids: created.map((d) => d._id) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/phrases/bulk error:", error);
    return NextResponse.json(
      { error: "Failed to bulk create phrases" },
      { status: 500 }
    );
  }
}
