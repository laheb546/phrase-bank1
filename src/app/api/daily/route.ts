import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getOrCreateToday, DAILY_GOALS } from "@/lib/daily";

export async function GET() {
  try {
    await connectDB();
    const progress = await getOrCreateToday();
    const templatesDone = progress.templatesCompleted || 0;
    const flashDone =
      (progress.flashcardsCreated || 0) + (progress.flashcardsReviewed || 0);

    return NextResponse.json({
      date: progress.date,
      templatesCompleted: templatesDone,
      templatesGoal: DAILY_GOALS.templates,
      flashcardsCreated: progress.flashcardsCreated || 0,
      flashcardsReviewed: progress.flashcardsReviewed || 0,
      flashcardsProgress: flashDone,
      flashcardsGoal: DAILY_GOALS.flashcards,
      templatesMet: templatesDone >= DAILY_GOALS.templates,
      flashcardsMet: flashDone >= DAILY_GOALS.flashcards,
      allMet:
        templatesDone >= DAILY_GOALS.templates &&
        flashDone >= DAILY_GOALS.flashcards,
    });
  } catch (error) {
    console.error("GET /api/daily error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily progress" },
      { status: 500 }
    );
  }
}
