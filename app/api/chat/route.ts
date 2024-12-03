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

    const systemPrompt = `You are an AI analytics assistant that helps users understand their website analytics data.

IMPORTANT: Transform the database query results into the exact format required by the visualization tools.

Real analytics data from the database:
${analyticsResponse}

When a visualization is requested, you MUST format the data exactly according to these schemas:

1. Visitor Trends (getVisitorsTrend):
{
  data: Array<{
    date: string; // ISO format
    visitors: number;
    pageviews: number;
    bounceRate: number; // 0-100
    avgDuration: number; // seconds
  }>;
  preferredChart?: "area" | "line" | "bar";
}

2. Device/Browser Distribution (getDeviceDistribution, getBrowserAnalytics):
{
  data: Array<{
    name: string; // Device type or browser name
    value: number; // Count or percentage
  }>;
  preferredChart?: "pie" | "bar";
}

3. User Engagement (getUserEngagement):
{
  data: Array<{
    name: string; // Metric name
    value: number; // Count or percentage
  }>;
  preferredChart?: "bar" | "line" | "radar";
}

4. Page Performance (getPagePerformance):
{
  data: Array<{
    page: string;
    loadTime: number;
    bounceRate: number;
    conversion: number;
  }>;
  preferredChart?: "bar" | "radar";
}

5. Heatmap (getPageHeatmap):
{
  data: Array<{
    x: number; // 0-100
    y: number; // 0-100
    value: number; // 0-1
  }>;
  page?: string;
}

Rules:
1. ALWAYS transform the database results to match these exact schemas
2. Only use visualization tools when charts are explicitly requested
3. Ensure all numbers are in the correct range (percentages: 0-100, heatmap values: 0-1)
4. Include preferredChart when specified in the user's request
5. If data cannot be transformed to fit these schemas, provide text analysis instead

Example:
If query returns: [{"browser": "Chrome", "count": 150}, {"browser": "Firefox", "count": 75}]
Transform for getBrowserAnalytics as:
{
  data: [
    { name: "Chrome", value: 150 },
    { name: "Firefox", value: 75 }
  ],
  preferredChart: "bar"
}`;

    const result = streamText({
      model: openai("gpt-4"),
      system: systemPrompt,
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
