import { tools } from "@/ai/tools";
import { initLangChainDB } from "@/lib/langchain-db";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

// Keywords that indicate an analytics query
const ANALYTICS_KEYWORDS = [
  "analytics",
  "statistics",
  "metrics",
  "data",
  "trends",
  "visitors",
  "clicks",
  "views",
  "performance",
  "traffic",
  "users",
  "engagement",
  "conversion",
  "bounce rate",
  "how many",
  "count",
  "show me",
  "graph",
  "chart",
  "visualization",
  "compare",
];

const isAnalyticsQuery = (message: string): boolean => {
  const lowercaseMessage = message.toLowerCase();
  return ANALYTICS_KEYWORDS.some((keyword) =>
    lowercaseMessage.includes(keyword.toLowerCase())
  );
};

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1].content;

    // Check if this is an analytics query
    if (isAnalyticsQuery(lastMessage)) {
      // Initialize LangChain DB connection for analytics
      const { finalChain } = await initLangChainDB();

      // Process the query through LangChain
      const analyticsResponse = await finalChain.invoke({
        question: lastMessage,
      });

      return streamText({
        model: openai("gpt-4"),
        system: `You are an AI analytics assistant that helps users understand their website analytics data.
        
        IMPORTANT: Use the real analytics data provided below and format it according to the visualization tool requirements.
        
        Real analytics data from the database:
        ${analyticsResponse}
        
        When formatting data for visualizations, use these schemas:
        
        1. Visitor Trends (getVisitorsTrend):
        {
          data: Array<{
            date: string;
            visitors: number;
            pageviews: number;
            bounceRate: number;
            avgDuration: number;
          }>;
        }
        
        2. Device Distribution (getDeviceDistribution):
        {
          data: Array<{
            name: string; // Device type
            value: number; // Percentage or count
          }>;
        }
        
        3. Browser Analytics (getBrowserAnalytics):
        {
          data: Array<{
            name: string; // Browser name
            value: number; // Percentage or count
          }>;
        }
        
        4. User Engagement (getUserEngagement):
        {
          data: Array<{
            metric: string; // Engagement type
            value: number; // Count or percentage
          }>;
        }
        
        5. Page Performance (getPagePerformance):
        {
          data: Array<{
            page: string;
            loadTime: number;
            bounceRate: number;
            conversion: number;
          }>;
        }
        
        6. Heatmap (getPageHeatmap):
        {
          data: Array<{
            x: number; // 0-100 percentage
            y: number; // 0-100 percentage
            value: number; // 0-1 intensity
          }>;
        }`,
        messages,
        maxSteps: 5,
        tools,
      }).toDataStreamResponse();
    } else {
      // Handle normal chat interaction
      return streamText({
        model: openai("gpt-4"),
        system: `You are a helpful AI assistant that can answer questions about website analytics and general topics.
        For analytics queries, you can request specific data and create visualizations.
        For general questions, provide helpful and informative responses.
        
        If the user asks about analytics data but hasn't used specific terms, guide them to rephrase their question
        using terms like "show me", "analyze", "trends", "metrics", etc.`,
        messages,
        maxSteps: 5,
        tools,
      }).toDataStreamResponse();
    }
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
