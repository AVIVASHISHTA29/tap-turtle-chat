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
    
    Always use the appropriate tool when asked about any of these metrics.
    Provide context before and after showing visualizations.
    
    Example responses:
    - "Let me show you the visitor trends... [use getVisitorsTrend]"
    - "Here's the breakdown of devices... [use getDeviceDistribution]"
    - "Let me analyze the engagement metrics... [use getUserEngagement]"`,
    messages,
    maxSteps: 5,
    tools,
  });

  return result.toDataStreamResponse();
}
