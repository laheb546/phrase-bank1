import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Phrase from "@/models/Phrase";

export async function GET() {
  try {
    await connectDB();

    const [
      total,
      collocations,
      chunks,
      activeProblems,
      dueForReview,
      recentPhrases,
      recentProblems,
    ] = await Promise.all([
      Phrase.countDocuments(),
      Phrase.countDocuments({ type: "collocation" }),
      Phrase.countDocuments({ type: "chunk" }),
      Phrase.countDocuments({
        mistakeCount: { $gte: 2 },
        status: { $in: ["new", "learning", "improving"] },
      }),
      Phrase.countDocuments({ nextReviewAt: { $lte: new Date() } }),
      Phrase.find().sort({ createdAt: -1 }).limit(5).lean(),
      Phrase.find({ mistakeCount: { $gte: 1 } })
        .sort({ mistakeCount: -1, lastMistakeDate: -1 })
        .limit(5)
        .lean(),
    ]);

    const statusCounts = await Phrase.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusMap: Record<string, number> = {
      new: 0,
      learning: 0,
      improving: 0,
      mastered: 0,
    };
    statusCounts.forEach((s: { _id: string; count: number }) => {
      statusMap[s._id] = s.count;
    });

    return NextResponse.json({
      total,
      collocations,
      chunks,
      activeProblems,
      dueForReview,
      recentPhrases,
      recentProblems,
      statusCounts: statusMap,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
