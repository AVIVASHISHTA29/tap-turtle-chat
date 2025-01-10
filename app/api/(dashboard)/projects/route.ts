import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const { userId } = await auth();
    console.log("userId", userId);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await clickhouse.query({
      query: `
        SELECT p.*
        FROM projects p
        JOIN user_projects up ON p.project_id = up.project_id
        WHERE up.user_id = '${userId}'
        ORDER BY p.created_at DESC
      `,
      format: "JSONEachRow",
    });

    const data = await result.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { project_name } = body;

    if (!project_name) {
      return new NextResponse("Project name is required", { status: 400 });
    }

    const project_id = uuidv4();
    const api_key = uuidv4();
    const created_at = new Date()
      .toISOString()
      .replace("T", " ")
      .replace("Z", "");

    // Insert project
    await clickhouse.insert({
      table: "projects",
      values: [
        {
          project_id,
          api_key,
          project_name,
          created_at,
        },
      ],
      format: "JSONEachRow",
    });

    // Link project to user
    await clickhouse.insert({
      table: "user_projects",
      values: [
        {
          user_id: userId,
          project_id,
          role: "owner",
          created_at,
        },
      ],
      format: "JSONEachRow",
    });

    return NextResponse.json({
      project_id,
      api_key,
      project_name,
      created_at,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
