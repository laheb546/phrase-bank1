import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const expected = process.env.APP_PASSWORD;

    if (!expected) {
      // No password set — treat as open
      return NextResponse.json({ ok: true });
    }

    if (!password || password !== expected) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    // Cookie valid 1 year — personal app
    res.cookies.set("phrase_bank_auth", expected, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
