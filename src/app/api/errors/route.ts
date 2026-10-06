import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ErrorCategory from "@/models/ErrorCategory";
import ErrorLog from "@/models/ErrorLog";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  try {
    await connectDB();
    const today = todayKey();

    const categories = await ErrorCategory.find().sort({ totalCount: -1 }).lean();
    const todayLogs = await ErrorLog.find({ date: today }).lean();
    const todayMap: Record<string, number> = {};
    for (const log of todayLogs) {
      todayMap[String(log.categoryId)] = log.count;
    }

    // Last 14 days summary for charts
    const start = new Date();
    start.setDate(start.getDate() - 13);
    const startKey = start.toISOString().slice(0, 10);
    const recentLogs = await ErrorLog.find({ date: { $gte: startKey } })
      .sort({ date: 1 })
      .lean();

    const byDay: Record<string, number> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      byDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const log of recentLogs) {
      byDay[log.date] = (byDay[log.date] || 0) + log.count;
    }

    const list = categories.map((c) => ({
      ...c,
      todayCount: todayMap[String(c._id)] || 0,
    }));

    return NextResponse.json({
      categories: list,
      dailyTotals: Object.entries(byDay).map(([date, count]) => ({
        date,
        count,
      })),
      todayTotal: Object.values(todayMap).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    console.error("GET /api/errors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch errors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await ErrorCategory.findOne({
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This category already exists" },
        { status: 400 }
      );
    }

    const cat = await ErrorCategory.create({ name, totalCount: 0 });
    return NextResponse.json({ ...cat.toObject(), todayCount: 0 }, { status: 201 });
  } catch (error) {
    console.error("POST /api/errors error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
