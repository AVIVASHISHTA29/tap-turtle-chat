// app/api/recording_sessions/route.ts
import clickhouse from "@/lib/clickhouse";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const query = await clickhouse.query({
      query: `SELECT session_id, project_id, start_timestamp, end_timestamp, page_url, viewport_width, viewport_height, user_agent, referrer
              FROM recording_sessions
              ORDER BY start_timestamp DESC`,
      format: "JSONEachRow",
    });

    const sessions = await query.json();

    return NextResponse.json({ sessions });
  } catch (error: unknown) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
