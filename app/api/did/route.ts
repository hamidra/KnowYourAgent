import { NextRequest, NextResponse } from "next/server";
import { authTool } from "@/ai-tools/ai-id";
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const did = searchParams.get("did");
  const result = await authTool.invoke({ subject: "ai" });
  return NextResponse.json(result);
}
