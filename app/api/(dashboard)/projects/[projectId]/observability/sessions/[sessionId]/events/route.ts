import clickhouse from "@/lib/clickhouse";
import { ObservabilityEvent } from "@/redux/features/observability/api";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string; sessionId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId, sessionId } = params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = 20;

    // Verify user has access to this project
    const projectAccess = await clickhouse.query({
      query: `
        SELECT 1
        FROM user_projects
        WHERE user_id = '${userId}'
        AND project_id = '${projectId}'
        LIMIT 1
      `,
      format: "JSONEachRow",
    });

    const hasAccess = (await projectAccess.json()).length > 0;
    if (!hasAccess) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get events for specific session with pagination
    const result = await clickhouse.query({
      query: `
        SELECT *
        FROM observability_events
        WHERE project_id = '${projectId}'
        AND session_id = '${sessionId}'
        ${cursor ? `AND timestamp < '${cursor}'` : ""}
        ORDER BY timestamp DESC
        LIMIT ${limit + 1}
      `,
      format: "JSONEachRow",
    });

    const data = (await result.json()) as ObservabilityEvent[];
    const hasMore = data.length > limit;
    const events = data.slice(0, limit);
    const nextCursor =
      events.length > 0 ? events[events.length - 1].timestamp : null;

    return NextResponse.json({
      events,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching session events:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
