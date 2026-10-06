import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Flashcard from "@/models/Flashcard";
import { bumpDaily } from "@/lib/daily";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const dueOnly = searchParams.get("dueOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const query: Record<string, unknown> = {};
    if (source === "template" || source === "manual") query.source = source;
    if (dueOnly) query.nextReviewAt = { $lte: new Date() };

    const cards = await Flashcard.find(query)
      .sort(dueOnly ? { nextReviewAt: 1 } : { createdAt: -1 })
      .limit(limit)
      .lean();

    const counts = {
      total: await Flashcard.countDocuments(),
      template: await Flashcard.countDocuments({ source: "template" }),
      manual: await Flashcard.countDocuments({ source: "manual" }),
      due: await Flashcard.countDocuments({
        nextReviewAt: { $lte: new Date() },
      }),
    };

    return NextResponse.json({ cards, counts });
  } catch (error) {
    console.error("GET /api/flashcards error:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Template: one card with 5 sentences
    // { source: "template", phraseText, phraseId?, sentences: string[5] }
    if (
      body.source === "template" &&
      Array.isArray(body.sentences) &&
      body.sentences.length > 0
    ) {
      const sentences = body.sentences
        .map((s: string) => String(s || "").trim())
        .filter(Boolean);
      if (sentences.length < 5) {
        return NextResponse.json(
          { error: "All 5 sentences are required" },
          { status: 400 }
        );
      }
      const phraseText = (body.phraseText || body.front || "").trim();
      if (!phraseText) {
        return NextResponse.json(
          { error: "phraseText is required" },
          { status: 400 }
        );
      }
      const back = sentences.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n");
      const card = await Flashcard.create({
        front: phraseText,
        back,
        source: "template",
        phraseId: body.phraseId,
        phraseText,
        sentences,
        nextReviewAt: new Date(),
      });
      await bumpDaily("flashcardsCreated", 1);
      if (body.countTemplate !== false) {
        await bumpDaily("templatesCompleted", 1);
      }
      return NextResponse.json(card, { status: 201 });
    }

    // Legacy bulk array (keep compatible)
    if (Array.isArray(body.cards)) {
      const source = body.source === "manual" ? "manual" : "template";
      const docs = body.cards
        .map(
          (c: {
            front?: string;
            back?: string;
            phraseId?: string;
            phraseText?: string;
            sentences?: string[];
          }) => {
            const front = (c.front || "").trim();
            const back = (c.back || "").trim();
            if (!front || !back) return null;
            return {
              front,
              back,
              source,
              phraseId: c.phraseId || undefined,
              phraseText: c.phraseText || undefined,
              sentences: c.sentences,
              nextReviewAt: new Date(),
            };
          }
        )
        .filter(Boolean);

      if (docs.length === 0) {
        return NextResponse.json({ error: "No valid cards" }, { status: 400 });
      }
      const created = await Flashcard.insertMany(docs);
      await bumpDaily("flashcardsCreated", created.length);
      if (source === "template" && body.countTemplate !== false) {
        await bumpDaily("templatesCompleted", 1);
      }
      return NextResponse.json(
        { count: created.length, ids: created.map((d) => d._id) },
        { status: 201 }
      );
    }

    // Single manual card: front = mistake, back = correct
    const front = (body.front || "").trim();
    const back = (body.back || "").trim();
    if (!front || !back) {
      return NextResponse.json(
        { error: "front and back are required" },
        { status: 400 }
      );
    }

    const card = await Flashcard.create({
      front,
      back,
      source: body.source === "template" ? "template" : "manual",
      phraseId: body.phraseId,
      phraseText: body.phraseText,
      sentences: body.sentences,
      tags: body.tags,
      nextReviewAt: new Date(),
    });

    await bumpDaily("flashcardsCreated", 1);
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("POST /api/flashcards error:", error);
    return NextResponse.json(
      { error: "Failed to create flashcard" },
      { status: 500 }
    );
  }
}
