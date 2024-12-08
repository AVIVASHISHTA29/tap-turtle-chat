import { tools } from "@/ai/tools";
import { initLangChainDB } from "@/lib/langchain-db";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1].content;

    // Initialize LangChain DB connection for analytics
    const { finalChain } = await initLangChainDB();

    // Process the query through LangChain
    const analyticsResponse = await finalChain.invoke({
      question: lastMessage,
    });

    console.log("analyticsResponse", analyticsResponse);

    // Extract visualization data and analysis
    let visualizationData = null;
    let analysis = null;
    try {
      const vizMatch = analyticsResponse.match(
        /---VISUALIZATION_DATA---\n```json\n([\s\S]*?)\n```/
      );
      const analysisMatch = analyticsResponse.match(
        /---ANALYSIS---\n([\s\S]*?)\n---END---/
      );

      if (vizMatch) {
        visualizationData = JSON.parse(vizMatch[1]);
      }
      if (analysisMatch) {
        analysis = analysisMatch[1].trim();
      }
    } catch (e) {
      console.error("Error parsing response sections:", e);
    }

    // First, send the analysis as a regular message
    const analysisResponse = streamText({
      model: openai("gpt-4o"),
      messages: [
        ...messages,
        {
          role: "assistant",
          content: analysis || "No analysis available.",
        },
      ],
    }).toDataStreamResponse();

    // If we have visualization data, send it as a separate message with tool invocation
    if (visualizationData) {
      return streamText({
        model: openai("gpt-4o"),
        system: `
        You're an expert analyst. You've been given an analysis with data for visualisation.
        Create a visualization using the exact data provided and include the analysis.
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
      }).toDataStreamResponse();
    }

    return analysisResponse;
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
