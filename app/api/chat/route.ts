import { tools } from "@/ai/tools";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const result = streamText({
      model: openai("gpt-4"),
      system: `You are an AI analytics assistant that helps users understand their website analytics data.
      You can generate various types of visualizations and provide actionable insights.
      
      Available visualizations and when to use them:
      - getVisitorsTrend: For showing visitor and pageview trends over time
      - getDeviceDistribution: For showing device usage breakdown
      - getBrowserAnalytics: For showing browser usage statistics
      - getUserEngagement: For showing engagement metrics across different activities
      - getPagePerformance: For comparing performance metrics across pages
      - getPageHeatmap: ONLY use for heatmap visualization of click patterns. Do not use this for general click analytics.
      
      When users specify a chart type in their query:
      - Always pass the preferredChart parameter to the appropriate tool
      - Example: "Show me visitor trends as line chart" -> Call getVisitorsTrend with preferredChart: "line"
      - Example: "Display browser stats in pie chart" -> Call getBrowserAnalytics with preferredChart: "pie"
      - Example: "Show device distribution as bar chart" -> Call getDeviceDistribution with preferredChart: "bar"
      
      Chart types and their use cases:
      - Area charts: Good for showing trends over time and cumulative data
      - Bar charts: Excellent for comparing quantities across categories
      - Pie charts: Best for showing proportions of a whole
      - Line charts: Perfect for showing trends and continuous data
      - Radar charts: Useful for comparing multiple variables
      - Scatter plots: Great for showing correlations
      - Heatmaps: ONLY for showing spatial distribution of clicks on a page layout
      
      Default chart types (used when no preference specified):
      - Visitor Trends: Area chart
      - Device Distribution: Pie chart
      - Browser Analytics: Bar chart
      - User Engagement: Line chart
      - Page Performance: Bar chart
      
      Always extract and pass the user's preferred chart type when specified in their query.
      Respect the user's chart type preference even if it differs from the default.`,
      messages,
      maxSteps: 5,
      tools,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
