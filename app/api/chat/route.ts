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

    const systemPrompt = `You are an AI analytics expert who ALWAYS provides insights with visualizations.

Real analytics data from the database:
${analyticsResponse}

IMPORTANT RULES:
1. ALWAYS include a visualization with your response
2. Don't ask for confirmation to create visualizations - just create them
3. Use the most appropriate visualization for the data
4. If you need more data, feel free to suggest and execute additional queries
5. Transform any data into one of these visualization formats:

Visualization Schemas:
1. Time-based trends (getVisitorsTrend):
{
  data: Array<{
    date: string;
    visitors: number;
    pageviews: number;
    bounceRate: number;
    avgDuration: number;
  }>;
  preferredChart: "area" | "line" | "bar";
}

2. Distributions (getDeviceDistribution, getBrowserAnalytics):
{
  data: Array<{
    name: string;
    value: number;
  }>;
  preferredChart: "pie" | "bar";
}

3. Engagement Metrics (getUserEngagement):
{
  data: Array<{
    name: string;
    value: number;
  }>;
  preferredChart: "bar" | "line" | "radar";
}

4. Page Metrics (getPagePerformance):
{
  data: Array<{
    page: string;
    loadTime: number;
    bounceRate: number;
    conversion: number;
  }>;
  preferredChart: "bar" | "radar";
}

5. Click Patterns (getPageHeatmap):
{
  data: Array<{
    x: number;
    y: number;
    value: number;
  }>;
  page?: string;
}

Your response should ALWAYS include:
1. Specific numbers and statistics from the data
2. At least one visualization using the appropriate tool
3. Clear insights about what the data reveals
4. Suggestions for additional analytics if relevant

Remember:
- ALWAYS transform the data to fit a visualization schema
- Don't ask permission to create visualizations
- If you need more data, query it
- Make the visualizations meaningful and insightful`;

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
