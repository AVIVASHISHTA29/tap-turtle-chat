import clickhouse from "./clickhouse";

export type AnalyticsResult = {
  type: "lineChart" | "barChart";
  data: Array<{
    timestamp: string;
    value: number;
  }>;
  title: string;
  description: string;
};

export class AnalyticsService {
  async getEventsByType(params: {
    projectId: string;
    eventType: string;
    timeframe: string;
    aggregation: "hourly" | "daily";
  }): Promise<AnalyticsResult> {
    const { projectId, eventType, timeframe, aggregation } = params;

    const sqlQuery = `
      SELECT 
        ${
          aggregation === "hourly"
            ? "toStartOfHour(timestamp) as time_bucket"
            : "toStartOfDay(timestamp) as time_bucket"
        },
        count(*) as event_count
      FROM events
      WHERE project_id = '${projectId}'
        AND event_type = '${eventType}'
        AND timestamp >= now() - INTERVAL ${timeframe}
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `;

    const queryResponse = await clickhouse.query({
      query: sqlQuery,
      format: "JSONEachRow",
    });

    const results = await queryResponse.json();

    return {
      type: "lineChart",
      data: results.map((row: unknown) => ({
        timestamp: (row as { time_bucket: string })?.time_bucket ?? "",
        value: (row as { event_count: number })?.event_count ?? 0,
      })),
      title: `${eventType} Events Over Time`,
      description: `Number of ${eventType} events in the last ${timeframe}`,
    };
  }

  async getProjectId(apiKey: string): Promise<string | null> {
    const query = `
      SELECT project_id 
      FROM projects 
      WHERE api_key = '${apiKey}'
      LIMIT 1
    `;

    const response = await clickhouse.query({
      query,
      format: "JSONEachRow",
    });

    const results: { project_id: string }[] = await response.json();
    return results[0]?.project_id || null;
  }
}
