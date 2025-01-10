/* eslint-disable @typescript-eslint/no-explicit-any */
import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user has access to this project
    const accessResult = await clickhouse.query({
      query: `
        SELECT role
        FROM user_projects
        WHERE user_id = '${userId}' AND project_id = '${params.projectId}'
      `,
      format: "JSONEachRow",
    });

    const accessData = await accessResult.json();
    if (!accessData.length) {
      return new NextResponse("Not found", { status: 404 });
    }

    const body = await req.json();
    const updates = [];

    if (body.project_name) {
      updates.push(`project_name = '${body.project_name}'`);
    }

    if (body.project_url !== undefined) {
      updates.push(`project_url = '${body.project_url || ""}'`);
    }

    if (updates.length === 0) {
      return new NextResponse("No valid updates provided", { status: 400 });
    }

    // Update project
    await clickhouse.query({
      query: `
        ALTER TABLE projects
        UPDATE ${updates.join(", ")}
        WHERE project_id = '${params.projectId}'
      `,
    });

    // Fetch updated project
    const result = await clickhouse.query({
      query: `
        SELECT *
        FROM projects
        WHERE project_id = '${params.projectId}'
      `,
      format: "JSONEachRow",
    });

    const data = await result.json();
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error updating project:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user is the owner of this project
    const accessResult = await clickhouse.query({
      query: `
        SELECT role
        FROM user_projects
        WHERE user_id = '${userId}' AND project_id = '${params.projectId}'
      `,
      format: "JSONEachRow",
    });

    const accessData = await accessResult.json();
    if (!accessData.length || (accessData as any[])[0].role !== "owner") {
      return new NextResponse("Not found or not authorized", { status: 404 });
    }

    // Delete all related data
    const tables = [
      "recording_events",
      "recording_sessions",
      "events",
      "sessions",
      "user_projects",
      "projects",
    ];

    for (const table of tables) {
      await clickhouse.query({
        query: `
          ALTER TABLE ${table}
          DELETE WHERE project_id = '${params.projectId}'
        `,
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting project:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
