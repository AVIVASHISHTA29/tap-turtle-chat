import { initRRWebAnalysis } from "@/lib/langchain-rrweb";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  try {
    const { analysisChain } = await initRRWebAnalysis();

    const analysis = await analysisChain.invoke({
      sessionId,
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
