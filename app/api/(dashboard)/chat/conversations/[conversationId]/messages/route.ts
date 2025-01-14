import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify conversation belongs to user
    const conversationResult = await clickhouse.query({
      query: `
        SELECT conversation_id
        FROM chat_conversations
        WHERE conversation_id = {conversationId:UUID}
        AND user_id = {userId:String}
        AND is_deleted = 0
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

    const { content } = await request.json();
    const messageId = uuidv4();

    // Insert user message
    await clickhouse.query({
      query: `
        INSERT INTO chat_messages
        (message_id, conversation_id, role, content)
        VALUES
        ({messageId:UUID}, {conversationId:UUID}, 'user', {content:String})
      `,
      query_params: {
        messageId,
        conversationId: params.conversationId,
        content,
      },
    });

    // Update conversation last modified time
    await clickhouse.query({
      query: `
        ALTER TABLE chat_conversations
        UPDATE updated_at = now()
        WHERE conversation_id = {conversationId:UUID}
      `,
      query_params: {
        conversationId: params.conversationId,
      },
    });

    return NextResponse.json({
      message_id: messageId,
      conversation_id: params.conversationId,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding message:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
