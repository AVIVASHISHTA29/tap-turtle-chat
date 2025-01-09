import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import * as UAParser from "ua-parser-js";

interface SessionData {
  session_id: string;
  project_id: string;
  start_timestamp: string;
  end_timestamp: string | null;
  page_url: string;
  viewport_width: number;
  viewport_height: number;
  user_agent: string | null;
  referrer: string | null;
}

interface EventStats {
  total_clicks: number;
  total_scrolls: number;
  total_mousemoves: number;
  total_page_loads: number;
  first_event_time: string;
  last_event_time: string;
  total_events: number;
  unique_elements: string[];
  unique_selectors: string[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; sessionId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId, sessionId } = params;

    // Verify user has access to this project
    const accessResult = await clickhouse.query({
      query: `
        SELECT 1 FROM user_projects
        WHERE user_id = {userId:String}
        AND project_id = {projectId:String}
        LIMIT 1
      `,
      query_params: {
        userId,
        projectId,
      },
      format: "JSONEachRow",
    });

    const accessData = await accessResult.json();
    if (!accessData.length) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get session data
    const sessionResult = await clickhouse.query({
      query: `
        SELECT *
        FROM recording_sessions
        WHERE session_id = {sessionId:String}
        AND project_id = {projectId:String}
        LIMIT 1
      `,
      query_params: {
        sessionId,
        projectId,
      },
      format: "JSONEachRow",
    });

    const sessionData = await sessionResult.json();
    if (!sessionData.length) {
      return new NextResponse("Session not found", { status: 404 });
    }

    // Get event statistics
    const eventsResult = await clickhouse.query({
      query: `
        WITH event_counts AS (
          SELECT
            countIf(JSONExtractString(rrweb_data, 'type') = 'click') as total_clicks,
            countIf(JSONExtractString(rrweb_data, 'type') = 'scroll') as total_scrolls,
            countIf(JSONExtractString(rrweb_data, 'type') = 'mousemove') as total_mousemoves,
            countIf(JSONExtractString(rrweb_data, 'type') = 'load') as total_page_loads,
            min(timestamp) as first_event_time,
            max(timestamp) as last_event_time,
            count(*) as total_events,
            groupUniqArray(
              JSONExtractString(
                JSONExtractRaw(rrweb_data, 'data'), 
                'selector'
              )
            ) as unique_selectors,
            groupUniqArray(
              JSONExtractString(
                JSONExtractRaw(rrweb_data, 'data'), 
                'tag'
              )
            ) as unique_elements
          FROM recording_events
          WHERE session_id = {sessionId:String}
        )
        SELECT
          total_clicks,
          total_scrolls,
          total_mousemoves,
          total_page_loads,
          first_event_time,
          last_event_time,
          total_events,
          unique_selectors,
          unique_elements
        FROM event_counts
      `,
      query_params: {
        sessionId,
      },
      format: "JSONEachRow",
    });

    const eventsData = await eventsResult.json();

    // Get page navigation events
    const navigationResult = await clickhouse.query({
      query: `
        SELECT timestamp, JSONExtractString(rrweb_data, 'data') as metadata
        FROM recording_events
        WHERE session_id = {sessionId:String}
        AND JSONExtractString(rrweb_data, 'type') = 'load'
        ORDER BY timestamp ASC
      `,
      query_params: {
        sessionId,
      },
      format: "JSONEachRow",
    });

    const navigationData = await navigationResult.json();

    // Parse user agent
    const session = sessionData[0] as SessionData;
    const parser = new UAParser.UAParser(session.user_agent || "");
    const deviceInfo = {
      client: parser.getBrowser(),
      os: parser.getOS(),
      device: parser.getDevice(),
    };

    const eventStats = eventsData[0] as EventStats;
    const summary = {
      session: {
        ...session,
        device: deviceInfo,
      },
      events: {
        total_clicks: eventStats.total_clicks,
        total_scrolls: eventStats.total_scrolls,
        total_mousemoves: eventStats.total_mousemoves,
        total_page_loads: eventStats.total_page_loads,
        first_event_time: eventStats.first_event_time,
        last_event_time: eventStats.last_event_time,
        total_events: eventStats.total_events,
        unique_elements_interacted: eventStats.unique_elements || [],
        unique_selectors_interacted: eventStats.unique_selectors || [],
      },
      pageNavigation: navigationData,
    };

    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error("Error fetching session summary:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
