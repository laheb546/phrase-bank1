import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Phrase from "@/models/Phrase";
import Review from "@/models/Review";

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    await connectDB();

    const days = 371; // ~53 weeks for a full GitHub-style grid
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const phraseDays = await Phrase.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const reviewDays = await Review.aggregate([
      { $match: { reviewedAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$reviewedAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const updateDays = await Phrase.aggregate([
      {
        $match: {
          updatedAt: { $gte: start, $lte: end },
          $expr: {
            $gt: [
              { $subtract: ["$updatedAt", "$createdAt"] },
              60 * 1000,
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const map: Record<string, number> = {};

    for (const row of phraseDays) {
      map[row._id] = (map[row._id] || 0) + row.count;
    }
    for (const row of reviewDays) {
      map[row._id] = (map[row._id] || 0) + row.count;
    }
    for (const row of updateDays) {
      map[row._id] = (map[row._id] || 0) + row.count;
    }

    const activity: { date: string; count: number }[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = toDateKey(cursor);
      activity.push({ date: key, count: map[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const totalActiveDays = activity.filter((d) => d.count > 0).length;
    const totalActions = activity.reduce((s, d) => s + d.count, 0);
    const maxCount = Math.max(0, ...activity.map((d) => d.count));

    let streak = 0;
    if (activity.length) {
      const last = activity[activity.length - 1];
      let i = activity.length - 1;
      if (last.count === 0) {
        i = activity.length - 2;
      }
      for (; i >= 0; i--) {
        if (activity[i].count > 0) streak++;
        else break;
      }
    }

    return NextResponse.json({
      activity,
      totalActiveDays,
      totalActions,
      maxCount,
      streak,
      start: toDateKey(start),
      end: toDateKey(end),
    });
  } catch (error) {
    console.error("GET /api/activity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
