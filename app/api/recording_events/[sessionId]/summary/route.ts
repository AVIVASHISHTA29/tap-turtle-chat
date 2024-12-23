/* eslint-disable @typescript-eslint/no-explicit-any */
import clickhouse from "@/lib/clickhouse";
import DeviceDetector from "device-detector-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const deviceDetector = new DeviceDetector();

  try {
    // Get session details
    const sessionQuery = await clickhouse.query({
      query: `
        SELECT 
          session_id,
          project_id,
          start_timestamp,
          end_timestamp,
          page_url,
          viewport_width,
          viewport_height,
          user_agent,
          referrer
        FROM recording_sessions
        WHERE session_id = '${sessionId}'
        LIMIT 1
      `,
      format: "JSONEachRow",
    });

    const sessionData = await sessionQuery.json();
    const session: any = sessionData[0];

    // Parse device info if user agent exists
    let deviceInfo = null;
    if (session?.user_agent) {
      deviceInfo = deviceDetector.parse(session.user_agent);
    }

    // Get event statistics
    const eventsQuery = await clickhouse.query({
      query: `
        SELECT 
          countIf(event_type = 'click') as total_clicks,
          countIf(event_type = 'scroll') as total_scrolls,
          countIf(event_type = 'mouse_move') as total_mousemoves,
          countIf(event_type = 'dom_load') as total_page_loads,
          min(timestamp) as first_event_time,
          max(timestamp) as last_event_time,
          count() as total_events,
          groupUniqArray(element_id) as unique_elements_interacted,
          groupUniqArray(css_selector) as unique_selectors_interacted
        FROM events
        WHERE session_id = '${sessionId}'
        GROUP BY session_id
      `,
      format: "JSONEachRow",
    });

    const eventsData = await eventsQuery.json();
    const eventStats = eventsData[0];

    // Get page navigation data
    const pageLoadsQuery = await clickhouse.query({
      query: `
        SELECT 
          timestamp,
          metadata
        FROM events
        WHERE session_id = '${sessionId}'
          AND event_type = 'dom_load'
        ORDER BY timestamp ASC
      `,
      format: "JSONEachRow",
    });

    const pageLoads = await pageLoadsQuery.json();

    // Combine all data
    const summary = {
      session: {
        ...session,
        device: deviceInfo,
      },
      events: eventStats,
      pageNavigation: pageLoads,
    };

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    console.error("Error fetching session summary:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
