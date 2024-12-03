import { tools } from "@/ai/tools";
import { initLangChainDB } from "@/lib/langchain-db";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1].content;

    // Initialize LangChain DB connection
    const { finalChain } = await initLangChainDB();

    // Process the query through LangChain
    const analyticsResponse = await finalChain.invoke({
      question: lastMessage,
    });

    const result = streamText({
      model: openai("gpt-4"),
      system: `You are an AI analytics assistant that helps users understand their website analytics data.
      You can generate various types of visualizations and provide actionable insights.
      
      Use the analytics data provided to generate appropriate visualizations.
      
      Available visualizations and when to use them:
      - getVisitorsTrend: For showing visitor and pageview trends over time
      - getDeviceDistribution: For showing device usage breakdown
      - getBrowserAnalytics: For showing browser usage statistics
      - getUserEngagement: For showing engagement metrics across different activities
      - getPagePerformance: For comparing performance metrics across pages
      - getPageHeatmap: ONLY use for heatmap visualization of click patterns
      
      Here is the analytics data from the database:
      ${analyticsResponse}
      
      When users specify a chart type in their query:
      - Always pass the preferredChart parameter to the appropriate tool
      - Example: "Show me visitor trends as line chart" -> Call getVisitorsTrend with preferredChart: "line"`,
      messages,
      maxSteps: 5,
      tools,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
