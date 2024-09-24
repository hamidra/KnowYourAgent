import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const did = searchParams.get("did");
  return NextResponse.json({ did });
}
