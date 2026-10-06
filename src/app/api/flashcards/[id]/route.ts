import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Flashcard from "@/models/Flashcard";
import { bumpDaily } from "@/lib/daily";

const INTERVALS_DAYS: Record<string, number> = {
  again: 0, // same day / soon
  hard: 1,
  good: 3,
  easy: 7,
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const card = await Flashcard.findById(id);
    if (!card) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Review result
    if (body.result) {
      const result = body.result as string;
      const days = INTERVALS_DAYS[result] ?? 1;
      const next = new Date();
      if (result === "again") {
        next.setMinutes(next.getMinutes() + 10);
      } else {
        next.setDate(next.getDate() + days);
      }
      card.reviewCount = (card.reviewCount || 0) + 1;
      card.lastReviewedAt = new Date();
      card.nextReviewAt = next;
      if (result === "easy") card.ease = Math.min(5, (card.ease || 2.5) + 0.15);
      if (result === "again") card.ease = Math.max(1.3, (card.ease || 2.5) - 0.2);
      await card.save();
      await bumpDaily("flashcardsReviewed", 1);
      return NextResponse.json(card);
    }

    // Edit front/back
    if (body.front !== undefined) card.front = String(body.front).trim();
    if (body.back !== undefined) card.back = String(body.back).trim();
    await card.save();
    return NextResponse.json(card);
  } catch (error) {
    console.error("PATCH /api/flashcards/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update flashcard" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await Flashcard.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/flashcards/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
