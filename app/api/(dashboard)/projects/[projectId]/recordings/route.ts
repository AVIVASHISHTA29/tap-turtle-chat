/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const timeFilter = searchParams.get("timeFilter");

    // Add time filter condition
    let timeCondition = "";
    // const now = new Date().toISOString();

    if (timeFilter) {
      switch (timeFilter) {
        case "30m":
          timeCondition = "AND start_timestamp >= subtractMinutes(now(), 30)";
          break;
        case "1h":
          timeCondition = "AND start_timestamp >= subtractHours(now(), 1)";
          break;
        case "6h":
          timeCondition = "AND start_timestamp >= subtractHours(now(), 6)";
          break;
        case "1d":
          timeCondition = "AND start_timestamp >= subtractDays(now(), 1)";
          break;
        case "1w":
          timeCondition = "AND start_timestamp >= subtractDays(now(), 7)";
          break;
        case "custom":
          const startDate = searchParams.get("startDate");
          const endDate = searchParams.get("endDate");
          if (startDate && endDate) {
            timeCondition = `AND start_timestamp BETWEEN '${startDate}' AND '${endDate}'`;
          }
          break;
      }
    }

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
        FROM (
          SELECT 
            session_id,
            project_id,
            start_timestamp,
            end_timestamp,
            page_url,
            viewport_width,
            viewport_height,
            user_agent,
            referrer,
            row_number() OVER (PARTITION BY session_id ORDER BY start_timestamp DESC) as rn
          FROM recording_sessions
          WHERE project_id = {projectId:String}
          ${timeCondition}
        )
        WHERE rn = 1
        ORDER BY start_timestamp DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `,
      query_params: {
        projectId,
        limit,
        offset,
      },
      format: "JSONEachRow",
    });

    const countQuery = await clickhouse.query({
      query: `
        SELECT count(DISTINCT session_id) as total
        FROM recording_sessions
        WHERE project_id = {projectId:String}
        ${timeCondition}
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });
    const sessions = await query.json();
    const countResult = await countQuery.json();
    const total = countResult.length > 0 ? (countResult as any[])[0]?.total : 0;

    return NextResponse.json({
      sessions,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error: unknown) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
