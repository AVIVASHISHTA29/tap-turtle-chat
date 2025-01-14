import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await clickhouse.query({
      query: `
        SELECT *
        FROM chat_conversations
        WHERE user_id = {userId:String}
        AND is_deleted = 0
        ORDER BY updated_at DESC
      `,
      query_params: {
        userId,
      },
      format: "JSONEachRow",
    });

    const conversations = await result.json();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, projectId } = await request.json();
    const conversationId = uuidv4();

    await clickhouse.insert({
      table: "chat_conversations",
      values: [
        {
          conversation_id: conversationId,
          user_id: userId,
          project_id: projectId,
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: 0,
        },
      ],
      format: "JSONEachRow",
    });

    return NextResponse.json({
      conversation_id: conversationId,
      user_id: userId,
      project_id: projectId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
