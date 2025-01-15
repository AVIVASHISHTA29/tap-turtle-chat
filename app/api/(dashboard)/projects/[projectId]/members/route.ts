import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Helper to check if user has access to project
async function checkProjectAccess(userId: string, projectId: string) {
  const accessResult = await clickhouse.query({
    query: `
      SELECT role
      FROM user_projects
      WHERE user_id = '${userId}' AND project_id = '${projectId}'
    `,
    format: "JSONEachRow",
  });

  const accessData = await accessResult.json();
  return accessData.length > 0 ? accessData[0] : null;
}

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user has access to this project
    const access = await checkProjectAccess(userId, params.projectId);
    if (!access) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Get all members of the project
    const result = await clickhouse.query({
      query: `
        SELECT up.user_id, u.email, u.name, up.role, up.created_at
        FROM user_projects up
        LEFT JOIN users u ON up.user_id = u.user_id
        WHERE up.project_id = '${params.projectId}'
        ORDER BY up.created_at ASC
      `,
      format: "JSONEachRow",
    });

    const members = await result.json();
    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching project members:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
