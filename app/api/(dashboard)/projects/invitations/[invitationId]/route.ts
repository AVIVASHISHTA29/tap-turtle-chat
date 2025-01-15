import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

interface User {
  email: string;
  user_id: string;
}

interface Invitation {
  invitation_id: string;
  project_id: string;
  email: string;
  role: number;
  status: number;
  invited_by: string;
  created_at: string;
  expires_at: string;
  project_name?: string;
}

export async function POST(
  req: Request,
  { params }: { params: { invitationId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !["accept", "reject"].includes(action)) {
      return new NextResponse("Invalid action", { status: 400 });
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

    // Get invitation details
    const invitationResult = await clickhouse.query({
      query: `
        SELECT *
        FROM project_invitations
        WHERE invitation_id = '${params.invitationId}'
        AND email = '${userEmail}'
        AND status = 1 -- pending
        AND expires_at > now()
      `,
      format: "JSONEachRow",
    });

    const invitationData = (await invitationResult.json()) as Invitation[];
    if (!invitationData.length) {
      return new NextResponse("Invalid or expired invitation", { status: 404 });
    }

    const invitation = invitationData[0];

    if (action === "accept") {
      // Add user to project
      await clickhouse.insert({
        table: "user_projects",
        values: [
          {
            user_id: userId,
            project_id: invitation.project_id,
            role: invitation.role,
            created_at: new Date().toISOString(),
          },
        ],
        format: "JSONEachRow",
      });
    }

    // Update invitation status
    await clickhouse.query({
      query: `
        ALTER TABLE project_invitations
        UPDATE status = ${
          action === "accept" ? 2 : 3
        } -- 2 for accepted, 3 for rejected
        WHERE invitation_id = '${params.invitationId}'
      `,
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error handling invitation:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Get invitation details
export async function GET(
  req: Request,
  { params }: { params: { invitationId: string } }
) {
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

    // Get invitation details
    const result = await clickhouse.query({
      query: `
        SELECT i.*, p.project_name
        FROM project_invitations i
        LEFT JOIN projects p ON i.project_id = p.project_id
        WHERE i.invitation_id = '${params.invitationId}'
        AND i.email = '${userEmail}'
      `,
      format: "JSONEachRow",
    });

    const invitationData = (await result.json()) as Invitation[];
    if (!invitationData.length) {
      return new NextResponse("Invitation not found", { status: 404 });
    }

    return NextResponse.json(invitationData[0]);
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
