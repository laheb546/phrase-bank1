import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Phrase from "@/models/Phrase";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "newest";
    const limit = parseInt(searchParams.get("limit") || "50");
    const dueOnly = searchParams.get("dueOnly") === "true";

    const query: Record<string, unknown> = {};

    if (search.trim()) {
      // Prefix / partial match so a single letter finds phrases whose words begin with it
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|\\s)${escaped}`, "i");
      query.$or = [
        { phrase: regex },
        { meaning: regex },
        { originalMistake: regex },
        { exampleSentence: regex },
        { notes: regex },
        { category: regex },
      ];
    }
    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (dueOnly) {
      query.nextReviewAt = { $lte: new Date() };
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "mistakes") sortOption = { mistakeCount: -1 };
    if (sort === "review") sortOption = { nextReviewAt: 1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const phrases = await Phrase.find(query)
      .sort(sortOption)
      .limit(limit)
      .lean();

    return NextResponse.json(phrases);
  } catch (error) {
    console.error("GET /api/phrases error:", error);
    return NextResponse.json(
      { error: "Failed to fetch phrases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      phrase,
      type,
      meaning,
      pattern,
      exampleSentence,
      originalMistake,
      category,
      notes,
      mistakeCount = 0,
    } = body;

    if (!phrase || !type || !meaning) {
      return NextResponse.json(
        { error: "Phrase, type, and meaning are required" },
        { status: 400 }
      );
    }

    const newPhrase = await Phrase.create({
      phrase: phrase.trim(),
      type,
      meaning,
      pattern,
      exampleSentence,
      originalMistake,
      category: category || "Other",
      notes,
      mistakeCount: Number(mistakeCount) || 0,
      status: Number(mistakeCount) > 0 ? "learning" : "new",
      nextReviewAt: new Date(),
    });

    return NextResponse.json(newPhrase, { status: 201 });
  } catch (error) {
    console.error("POST /api/phrases error:", error);
    return NextResponse.json(
      { error: "Failed to create phrase" },
      { status: 500 }
    );
  }
}
