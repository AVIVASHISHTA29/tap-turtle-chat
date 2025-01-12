import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = params;

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

    // Get events
    const result = await clickhouse.query({
      query: `
        SELECT *
        FROM observability_events
        WHERE project_id = '${projectId}'
        ORDER BY timestamp DESC
      `,
      format: "JSONEachRow",
    });

    const data = await result.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching observability events:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
