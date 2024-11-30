import clickhouse from "@/lib/clickhouse";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4-turbo"),
    messages,
    tools: {
      executeAnalyticsQuery: {
        description:
          "Execute an analytics query to get click events data and return the results.",
        parameters: z.object({
          timeframe: z
            .string()
            .describe(
              "The timeframe for the query (e.g., '1 hour', '24 hours', '7 days')"
            ),
          aggregation: z
            .string()
            .describe(
              "How to aggregate the data (e.g., 'count', 'hourly', 'daily')"
            ),
        }),
        execute: async ({
          timeframe,
          aggregation,
        }: {
          timeframe: string;
          aggregation: string;
        }) => {
          const sqlQuery = `
            SELECT 
              ${
                aggregation === "hourly"
                  ? "toStartOfHour(timestamp) as time_bucket"
                  : "toStartOfDay(timestamp) as time_bucket"
              },
              count(*) as click_count
            FROM events
            WHERE event_type = 'click'
              AND timestamp >= now() - INTERVAL ${timeframe}
            GROUP BY time_bucket
            ORDER BY time_bucket ASC
          `;

          try {
            const queryResponse = await clickhouse.query({
              query: sqlQuery,
              format: "JSONEachRow",
            });

            const results = await queryResponse.json();
            return {
              type: "lineChart",
              data: results.map((row: unknown) => ({
                timestamp: (row as { time_bucket: string })?.time_bucket ?? "",
                value: (row as { click_count: number })?.click_count ?? 0,
              })),
            };
          } catch (error) {
            console.error("Error executing SQL query:", error);
            throw new Error("Error executing the query.");
          }
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
