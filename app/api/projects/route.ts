import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await clickhouse.query({
      query: `
        SELECT p.*
        FROM projects p
        JOIN user_projects up ON p.project_id = up.project_id
        WHERE up.user_id = {userId:String}
        ORDER BY p.created_at DESC
      `,
      query_params: {
        userId,
      },
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
    const { userId } = auth();
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
    const created_at = new Date().toISOString();

    // Insert project
    await clickhouse.query({
      query: `
        INSERT INTO projects
        (project_id, api_key, project_name, created_at)
        VALUES
        ({project_id:String}, {api_key:String}, {project_name:String}, {created_at:String})
      `,
      query_params: {
        project_id,
        api_key,
        project_name,
        created_at,
      },
    });

    // Link project to user
    await clickhouse.query({
      query: `
        INSERT INTO user_projects
        (user_id, project_id, role, created_at)
        VALUES
        ({userId:String}, {project_id:String}, 'owner', {created_at:String})
      `,
      query_params: {
        userId,
        project_id,
        created_at,
      },
    });

    return NextResponse.json({
      project_id,
      api_key,
      project_name,
      created_at,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
