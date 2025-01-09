import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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

    // Verify session belongs to project
    const sessionResult = await clickhouse.query({
      query: `
        SELECT 1 FROM recording_sessions
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

    const query = await clickhouse.query({
      query: `
        SELECT rrweb_data, timestamp, event_type
        FROM recording_events
        WHERE session_id = {sessionId:String}
        ORDER BY timestamp ASC
      `,
      query_params: {
        sessionId,
      },
      format: "JSONEachRow",
    });

    const events = await query.json();

    // Convert stored rrweb_data (string) back to object
    const rrwebEvents = events.map((e: any) => {
      const parsed = JSON.parse(e.rrweb_data);
      return parsed;
    });

    return NextResponse.json(rrwebEvents);
  } catch (error: unknown) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
