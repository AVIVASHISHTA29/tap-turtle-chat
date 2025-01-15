import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
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

export async function POST(
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

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Check if user is already a member
    const existingMemberResult = await clickhouse.query({
      query: `
        SELECT 1
        FROM user_projects
        WHERE project_id = '${params.projectId}' AND user_id IN (
          SELECT user_id FROM users WHERE email = '${email}'
        )
      `,
      format: "JSONEachRow",
    });

    const existingMember = await existingMemberResult.json();
    if (existingMember.length > 0) {
      return new NextResponse("User is already a member", { status: 400 });
    }

    // Check for existing pending invitation
    const existingInviteResult = await clickhouse.query({
      query: `
        SELECT 1
        FROM project_invitations
        WHERE project_id = '${params.projectId}'
        AND email = '${email}'
        AND status = 'pending'
        AND expires_at > now()
      `,
      format: "JSONEachRow",
    });

    const existingInvite = await existingInviteResult.json();
    if (existingInvite.length > 0) {
      return new NextResponse("Invitation already sent", { status: 400 });
    }

    // Create invitation
    const invitationId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    await clickhouse.insert({
      table: "project_invitations",
      values: [
        {
          invitation_id: invitationId,
          project_id: params.projectId,
          email: email,
          role: 2, // member
          status: 1, // pending
          invited_by: userId,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
      ],
      format: "JSONEachRow",
    });

    // TODO: Send email to invitee (implement email service)

    return NextResponse.json({ invitationId });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
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

    // Get all pending invitations
    const result = await clickhouse.query({
      query: `
        SELECT invitation_id, email, created_at, expires_at, status
        FROM project_invitations
        WHERE project_id = '${params.projectId}'
        AND status = 'pending'
        AND expires_at > now()
      `,
      format: "JSONEachRow",
    });

    const invitations = await result.json();
    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
