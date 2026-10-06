import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Phrase from "@/models/Phrase";
import Review from "@/models/Review";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const phrase = await Phrase.findById(id).lean();
    if (!phrase) {
      return NextResponse.json({ error: "Phrase not found" }, { status: 404 });
    }

    const reviews = await Review.find({ phraseId: id })
      .sort({ reviewedAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ ...phrase, reviews });
  } catch (error) {
    console.error("GET /api/phrases/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch phrase" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const allowed = [
      "phrase",
      "type",
      "meaning",
      "pattern",
      "exampleSentence",
      "originalMistake",
      "category",
      "notes",
      "status",
      "mistakeCount",
      "successfulUseCount",
      "lastMistakeDate",
      "lastSuccessDate",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // Handle increment helpers
    if (body.incrementMistake) {
      updates.$inc = { ...(updates.$inc as object || {}), mistakeCount: 1 };
      updates.lastMistakeDate = new Date();
      if (!updates.status) updates.status = "learning";
    }
    if (body.incrementSuccess) {
      updates.$inc = { ...(updates.$inc as object || {}), successfulUseCount: 1 };
      updates.lastSuccessDate = new Date();
    }

    const phrase = await Phrase.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!phrase) {
      return NextResponse.json({ error: "Phrase not found" }, { status: 404 });
    }

    return NextResponse.json(phrase);
  } catch (error) {
    console.error("PATCH /api/phrases/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update phrase" },
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

    const phrase = await Phrase.findByIdAndDelete(id);
    if (!phrase) {
      return NextResponse.json({ error: "Phrase not found" }, { status: 404 });
    }

    await Review.deleteMany({ phraseId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/phrases/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete phrase" },
      { status: 500 }
    );
  }
}
