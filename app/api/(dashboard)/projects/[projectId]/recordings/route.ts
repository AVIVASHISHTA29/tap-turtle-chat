import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = params;

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

    const query = await clickhouse.query({
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
        WHERE project_id = {projectId:String}
        ORDER BY start_timestamp DESC
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    const sessions = await query.json();

    return NextResponse.json(sessions);
  } catch (error: unknown) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
