import { tools } from "@/ai/tools";
import clickhouse from "@/lib/clickhouse";
import { initLangChainDB } from "@/lib/langchain-db";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { messages, conversationId } = await request.json();

    if (!conversationId) {
      return new NextResponse(
        JSON.stringify({
          error: "Bad Request",
          details: "conversation_id is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const lastMessage = messages[messages.length - 1].content;

    // Initialize LangChain DB connection for analytics
    const { finalChain } = await initLangChainDB();

    // Process the query through LangChain
    const analyticsResponse = await finalChain.invoke({
      question: lastMessage,
    });

    // Save the user message
    const userMessageId = uuidv4();
    await clickhouse.insert({
      table: "chat_messages",
      values: [
        {
          message_id: userMessageId,
          conversation_id: conversationId,
          role: "user",
          content: lastMessage,
          timestamp: new Date().toISOString(),
        },
      ],
      format: "JSONEachRow",
    });

    // Extract visualization data and analysis
    let visualizationData = null;
    let analysis = null;
    try {
      const vizMatch = analyticsResponse.match(
        /---VISUALIZATION_DATA---\n```json\n([\s\S]*?)\n```/
      );
      if (!vizMatch) {
        // Try without the json code block format
        const altVizMatch = analyticsResponse.match(
          /---VISUALIZATION_DATA---\n({[\s\S]*?})\n---ANALYSIS---/
        );
        if (altVizMatch) {
          visualizationData = JSON.parse(altVizMatch[1]);
        }
      } else {
        visualizationData = JSON.parse(vizMatch[1]);
      }

      const analysisMatch = analyticsResponse.match(
        /---ANALYSIS---\n([\s\S]*?)\n---END---/
      );
      if (analysisMatch) {
        analysis = analysisMatch[1].trim();
      }
    } catch (e) {
      console.error("Error parsing response sections:", e);
      console.error("Raw response:", analyticsResponse);
    }

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

    // If we have visualization data, use it to create a visualization
    if (visualizationData) {
      const toolName = visualizationData.type;
      if (toolName && typeof toolName === "string" && toolName in tools) {
        const response = streamText({
          model: openai("gpt-4o-mini"),
          system: `
        You're an expert analyst. You've been given an analysis with data for visualisation.
        Create a visualization using the exact data provided and include the analysis.
        You must always use the tools provided to you to create the visualization. Fix the data if necessary - based on the schema of the tools and then call the tool invokation.
        `,
          messages: [
            {
              role: "user",
              content: `Create visualization using this data: ${JSON.stringify(
                visualizationData
              )}. Include this exact analysis: ${analysis}`,
            },
          ],
          tools,
        });

        // Save the assistant message
        const assistantMessageId = uuidv4();
        await clickhouse.insert({
          table: "chat_messages",
          values: [
            {
              message_id: assistantMessageId,
              conversation_id: conversationId,
              role: "assistant",
              content: analysis || "No analysis available.",
              timestamp: new Date().toISOString(),
            },
          ],
          format: "JSONEachRow",
        });

        return response.toDataStreamResponse();
      }
    }

    // If no visualization data or invalid tool, just return the analysis
    const response = streamText({
      model: openai("gpt-4o"),
      system: `
        You're an expert analyst. You've been given an analysis with maybe some data for visualisation.
        Create a visualization using the exact data provided and include the analysis.
        You must always use the tools provided to you to create the visualization. Fix the data if necessary - based on the schema of the tools and then call the tool invokation.
        `,
      messages: [
        ...messages,
        {
          role: "assistant",
          content: analyticsResponse || "No analysis available.",
        },
      ],
      tools,
    });

    // Save the assistant message
    const assistantMessageId = uuidv4();
    await clickhouse.insert({
      table: "chat_messages",
      values: [
        {
          message_id: assistantMessageId,
          conversation_id: conversationId,
          role: "assistant",
          content: analyticsResponse || "No analysis available.",
          timestamp: new Date().toISOString(),
        },
      ],
      format: "JSONEachRow",
    });

    return response.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
