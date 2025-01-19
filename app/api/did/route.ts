import { NextRequest, NextResponse } from "next/server";
import { didTool } from "@/ai-tools/ai-id";
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const did = searchParams.get("did");
  const result = await didTool.invoke({ subject: "ai" });
  return NextResponse.json(result);
}
