import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Phrase from "@/models/Phrase";
import Review from "@/models/Review";

// Simple spaced repetition intervals (days)
const INTERVALS: Record<string, number> = {
  again: 1,
  hard: 2,
  good: 4,
  easy: 7,
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { phraseId, result, reviewType, userAnswer } = body;

    if (!phraseId || !result) {
      return NextResponse.json(
        { error: "phraseId and result are required" },
        { status: 400 }
      );
    }

    const phrase = await Phrase.findById(phraseId);
    if (!phrase) {
      return NextResponse.json({ error: "Phrase not found" }, { status: 404 });
    }

    // Create review record
    const review = await Review.create({
      phraseId,
      result,
      reviewType,
      userAnswer,
      reviewedAt: new Date(),
    });

    // Update phrase scheduling
    const days = INTERVALS[result] || 1;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + days);

    phrase.reviewCount = (phrase.reviewCount || 0) + 1;
    phrase.lastReviewedAt = new Date();
    phrase.nextReviewAt = nextReview;

    // Adjust status and confidence based on result
    if (result === "again") {
      phrase.confidence = Math.max(0, (phrase.confidence || 0) - 20);
      if (phrase.status === "mastered" || phrase.status === "improving") {
        phrase.status = "learning";
      }
      phrase.mistakeCount = (phrase.mistakeCount || 0) + 1;
      phrase.lastMistakeDate = new Date();
    } else if (result === "hard") {
      phrase.confidence = Math.max(0, (phrase.confidence || 0) - 5);
      if (phrase.status === "new") phrase.status = "learning";
    } else if (result === "good") {
      phrase.confidence = Math.min(100, (phrase.confidence || 0) + 15);
      if (phrase.status === "new" || phrase.status === "learning") {
        phrase.status = "improving";
      }
      phrase.successfulUseCount = (phrase.successfulUseCount || 0) + 1;
      phrase.lastSuccessDate = new Date();
    } else if (result === "easy") {
      phrase.confidence = Math.min(100, (phrase.confidence || 0) + 25);
      if ((phrase.confidence || 0) >= 80 && phrase.reviewCount >= 3) {
        phrase.status = "mastered";
      } else if (phrase.status === "new" || phrase.status === "learning") {
        phrase.status = "improving";
      }
      phrase.successfulUseCount = (phrase.successfulUseCount || 0) + 1;
      phrase.lastSuccessDate = new Date();
    }

    await phrase.save();

    return NextResponse.json({
      review,
      phrase: phrase.toObject(),
    });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { error: "Failed to save review" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phraseId = searchParams.get("phraseId");

    if (phraseId) {
      const reviews = await Review.find({ phraseId })
        .sort({ reviewedAt: -1 })
        .limit(50)
        .lean();
      return NextResponse.json(reviews);
    }

    // Return due phrases for review
    const duePhrases = await Phrase.find({
      nextReviewAt: { $lte: new Date() },
    })
      .sort({ nextReviewAt: 1 })
      .limit(20)
      .lean();

    return NextResponse.json(duePhrases);
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
