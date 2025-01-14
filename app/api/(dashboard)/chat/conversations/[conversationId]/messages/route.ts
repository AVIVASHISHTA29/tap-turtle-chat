import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId } = await auth();
    const { conversationId } = await params;
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
        conversationId,
        userId,
      },
      format: "JSONEachRow",
    });

    const conversations = await conversationResult.json();
    if (!conversations.length) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    const { content, role, tool_invocations } = await request.json();
    const messageId = uuidv4();

    // Validate role
    const validRoles = ["user", "assistant", "system"];
    if (!validRoles.includes(role)) {
      return new NextResponse(
        "Invalid role. Must be one of: user, assistant, system",
        { status: 400 }
      );
    }

    // Map role string to enum value
    const roleToEnumValue = {
      user: 1,
      assistant: 2,
      system: 3,
    };

    // Validate and format tool_invocations
    let formattedToolInvocations = "[]";
    if (tool_invocations) {
      try {
        // If it's already a string, parse and stringify to validate
        if (typeof tool_invocations === "string") {
          JSON.parse(tool_invocations);
          formattedToolInvocations = tool_invocations;
        } else {
          // If it's an object/array, stringify it
          formattedToolInvocations = JSON.stringify(tool_invocations);
        }
      } catch {
        return new NextResponse("Invalid tool_invocations JSON", {
          status: 400,
        });
      }
    }

    // Insert message using insert method
    await clickhouse.insert({
      table: "chat_messages",
      values: [
        {
          message_id: messageId,
          conversation_id: conversationId,
          role: roleToEnumValue[role as keyof typeof roleToEnumValue],
          content,
          tool_invocations: formattedToolInvocations,
          timestamp: new Date().toISOString(),
        },
      ],
      format: "JSONEachRow",
    });

    // Update conversation last modified time
    await clickhouse.query({
      query: `
        ALTER TABLE chat_conversations
        UPDATE updated_at = now()
        WHERE conversation_id = {conversationId:UUID}
      `,
      query_params: {
        conversationId,
      },
    });

    return NextResponse.json({
      message_id: messageId,
      conversation_id: conversationId,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding message:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
