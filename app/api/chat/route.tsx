import { AnalyticsService } from "@/lib/analytics-service";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

const analyticsService = new AnalyticsService();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4-turbo"),
    messages: [
      {
        role: "system",
        content: `You are an analytics assistant that helps users understand their website analytics data.
          You can query event data including clicks, scrolls, mousemove, dom_load, and dom_unload events.
          When users ask for analytics, use the executeAnalyticsQuery function to fetch and visualize the data.
          Always try to understand the time frame the user is interested in - default to last 24 hours if not specified.`,
      },
      ...messages,
    ],
    tools: {
      executeAnalyticsQuery: {
        description: "Execute an analytics query to visualize event data",
        parameters: z.object({
          projectId: z.string().describe("The project ID to query data for"),
          eventType: z.string().describe("The type of event to analyze"),
          timeframe: z
            .string()
            .describe("Time range for the query (e.g., '24 hours', '7 days')"),
          aggregation: z
            .enum(["hourly", "daily"])
            .describe("How to aggregate the data"),
        }),
        execute: async ({ projectId, eventType, timeframe, aggregation }) => {
          try {
            const result = await analyticsService.getEventsByType({
              projectId,
              eventType,
              timeframe,
              aggregation,
            });
            return result;
          } catch (error) {
            console.error("Analytics query error:", error);
            throw new Error("Failed to execute analytics query");
          }
        },
      },
      getProjectId: {
        description: "Get project ID from API key",
        parameters: z.object({
          apiKey: z.string().describe("The API key to look up"),
        }),
        execute: async ({ apiKey }) => {
          return analyticsService.getProjectId(apiKey);
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
