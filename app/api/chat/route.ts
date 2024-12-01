import { tools } from "@/ai/tools";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function POST(request: Request) {
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
    - getPageHeatmap: For showing heatmap of user interactions
    
    When suggesting visualizations, also recommend appropriate chart types:
    - Area charts: Good for showing trends over time and cumulative data
    - Bar charts: Excellent for comparing quantities across categories
    - Pie charts: Best for showing proportions of a whole
    - Line charts: Perfect for showing trends and continuous data
    - Radar charts: Useful for comparing multiple variables
    - Scatter plots: Great for showing correlations
    - Heatmaps: Best for showing user interactions and click patterns
    
    Ask users about their preferred chart type when relevant.
    Example: "Would you like to see this data as a bar chart or pie chart?"
    
    Always provide context and insights with visualizations.`,
    messages,
    maxSteps: 5,
    tools,
  });

  return result.toDataStreamResponse();
}
