import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ErrorCategory from "@/models/ErrorCategory";
import ErrorLog from "@/models/ErrorLog";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const delta = Number(body.delta) || 0; // +1 or -1
    const today = todayKey();

    const cat = await ErrorCategory.findById(id);
    if (!cat) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (delta === 0) {
      return NextResponse.json({ error: "delta required" }, { status: 400 });
    }

    // Update category total (never below 0)
    const newTotal = Math.max(0, (cat.totalCount || 0) + delta);
    cat.totalCount = newTotal;
    await cat.save();

    // Update today's log
    let log = await ErrorLog.findOne({ categoryId: id, date: today });
    if (!log) {
      log = await ErrorLog.create({
        categoryId: id,
        date: today,
        count: Math.max(0, delta),
      });
    } else {
      log.count = Math.max(0, log.count + delta);
      await log.save();
    }

    return NextResponse.json({
      ...cat.toObject(),
      todayCount: log.count,
    });
  } catch (error) {
    console.error("PATCH /api/errors/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update" },
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
    await ErrorCategory.findByIdAndDelete(id);
    await ErrorLog.deleteMany({ categoryId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/errors/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
