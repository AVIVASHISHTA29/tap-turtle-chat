import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

interface User {
  email: string;
  user_id: string;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user's email
    const userResult = await clickhouse.query({
      query: `
        SELECT email
        FROM users
        WHERE user_id = '${userId}'
      `,
      format: "JSONEachRow",
    });

    const userData = (await userResult.json()) as User[];
    if (!userData.length) {
      return new NextResponse("User not found", { status: 404 });
    }

    const userEmail = userData[0].email;

    // Get all pending invitations for the user
    const result = await clickhouse.query({
      query: `
        SELECT i.*, p.project_name
        FROM project_invitations i
        LEFT JOIN projects p ON i.project_id = p.project_id
        WHERE i.email = '${userEmail}'
        AND i.status = 1
        AND i.expires_at > now()
      `,
      format: "JSONEachRow",
    });

    const invitations = await result.json();
    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
