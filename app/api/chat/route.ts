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

    // Parse the visualization data and analysis from the response
    let visualizationData = null;
    let analysis = "";

    try {
      // Extract sections using regex
      const vizMatch = analyticsResponse.match(
        /---VISUALIZATION_DATA---\n```json\n([\s\S]*?)\n```/
      );
      const analysisMatch = analyticsResponse.match(
        /---ANALYSIS---([\s\S]*?)---END---/
      );

      if (vizMatch) {
        const jsonStr = vizMatch[1].replace(/\/\/.*/g, "").trim(); // Remove comments
        visualizationData = JSON.parse(jsonStr);
      }

      if (analysisMatch) {
        analysis = analysisMatch[1].trim();
      }
    } catch (e) {
      console.error("Error parsing LangChain response:", e);
      analysis = analyticsResponse; // Fallback to showing the full response
    }

    // Prepare the system message
    const systemMessage = `You are an AI analytics assistant that helps users understand their website analytics data.

${
  analysis
    ? `Here's the analysis of your data:

${analysis}`
    : ""
}

${
  visualizationData
    ? `I'll create a visualization using the ${
        visualizationData.type
      } tool with the following data:
${JSON.stringify(visualizationData, null, 2)}`
    : ""
}

Remember to:
1. Present the analysis clearly and maintain its structure
2. Use the visualization data exactly as provided
3. Don't ask for additional data or clarification`;

    return streamText({
      model: openai("gpt-4o"),
      system: systemMessage,
      messages,
      maxSteps: 5,
      tools,
    }).toDataStreamResponse();
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
