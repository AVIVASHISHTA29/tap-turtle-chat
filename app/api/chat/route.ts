import { tools } from "@/ai/tools";
import { initLangChainDB } from "@/lib/langchain-db";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1].content;

    // Initialize LangChain DB connection for analytics
    const { finalChain } = await initLangChainDB();

    // Process the query through LangChain
    const analyticsResponse = await finalChain.invoke({
      question: lastMessage,
    });

    console.log("analyticsResponse>>>", analyticsResponse);

    return streamText({
      model: openai("gpt-4o"),
      system: `You are an AI analytics assistant that helps users understand their website analytics data.
      
      Here is the analytics data and insights from our database:
      ${analyticsResponse}
      
      Your task is to:
      1. Present the insights in a clear, structured format
      2. If the data suggests a visualization would be helpful, use the appropriate tool:
      
      - For click patterns and heatmaps, use getPageHeatmap with data in format:
        { data: [{ x: number, y: number, value: number }] }
      
      - For user engagement metrics, use getUserEngagement with data in format:
        { data: [{ metric: string, value: number }] }
      
      - For page performance data, use getPagePerformance with data in format:
        { data: [{ page: string, loadTime: number, bounceRate: number, conversion: number }] }
      
      - For visitor trends, use getVisitorsTrend with data in format:
        { data: [{ date: string, visitors: number, pageviews: number, bounceRate: number, avgDuration: number }] }
      
      - For device or browser distributions, use getDeviceDistribution or getBrowserAnalytics with data in format:
        { data: [{ name: string, value: number }] }
      
      Structure your response as:
      1. Key Findings (bullet points)
      2. Detailed Analysis
      3. Recommendations
      
      Use markdown for formatting. If you need to create a visualization, ensure the data matches the exact format required.`,
      messages,
      maxSteps: 5,
      tools,
    }).toDataStreamResponse();
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
