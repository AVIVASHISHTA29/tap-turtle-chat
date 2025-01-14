import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get conversation details
    const conversationResult = await clickhouse.query({
      query: `
        SELECT *
        FROM chat_conversations
        WHERE conversation_id = {conversationId:UUID}
        AND user_id = {userId:String}
        AND is_deleted = 0
        ORDER BY created_at DESC
        LIMIT 1
      `,
      query_params: {
        conversationId: params.conversationId,
        userId,
      },
      format: "JSONEachRow",
    });

    const conversations = await conversationResult.json();
    if (!conversations.length) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    // Get messages for the conversation
    const messagesResult = await clickhouse.query({
      query: `
        SELECT *
        FROM chat_messages
        WHERE conversation_id = {conversationId:UUID}
        ORDER BY timestamp ASC
      `,
      query_params: {
        conversationId: params.conversationId,
      },
      format: "JSONEachRow",
    });

    const messages = await messagesResult.json();

    return NextResponse.json({
      conversation: conversations[0],
      messages,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title } = await request.json();

    await clickhouse.query({
      query: `
        ALTER TABLE chat_conversations
        UPDATE title = {title:String}, updated_at = now()
        WHERE conversation_id = {conversationId:UUID}
        AND user_id = {userId:String}
      `,
      query_params: {
        conversationId: params.conversationId,
        userId,
        title,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await clickhouse.query({
      query: `
        ALTER TABLE chat_conversations
        UPDATE is_deleted = 1
        WHERE conversation_id = {conversationId:UUID}
        AND user_id = {userId:String}
      `,
      query_params: {
        conversationId: params.conversationId,
        userId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
