import { initRRWebGroupAnalysis } from "@/lib/langchain-group-rrweb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { sessionIds } = await req.json();

  try {
    const { analysisChain } = await initRRWebGroupAnalysis();

    const analysis = await analysisChain.invoke({
      sessionIds,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Error analyzing recording:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
