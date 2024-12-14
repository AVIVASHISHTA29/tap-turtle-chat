import clickhouse from "@/lib/clickhouse";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

interface RRWebEvent {
  text_content: string;
  html_content: string;
  event_type: number;
  x_position: number;
  y_position: number;
  timestamp: string;
  element_id?: string;
  css_selector?: string;
}

interface InteractionSummary {
  element: string;
  count: number;
  locations: string[];
}

async function fetchSessionEvents(sessionId: string): Promise<RRWebEvent[]> {
  const query = await clickhouse.query({
    query: `
      SELECT 
        text_content,
        html_content,
        event_type,
        x_position,
        y_position,
        timestamp,
        element_id,
        css_selector
      FROM events
      WHERE session_id = '${sessionId}'
      AND (event_type = 1 OR event_type = 2) -- Only clicks and hovers
      ORDER BY timestamp ASC
      LIMIT 1000
    `,
    format: "JSONEachRow",
  });

  return await query.json();
}

function processEventsForAnalysis(events: RRWebEvent[]) {
  // Create a map to track interactions with each element
  const elementInteractions = new Map<string, InteractionSummary>();

  // Track chronological key events
  const keyEvents: Array<{ time: string; action: string }> = [];
  let lastTimestamp = "";

  events.forEach((event) => {
    const elementKey =
      event.css_selector || event.text_content || "unknown element";
    const position = `(${Math.round(event.x_position)}%, ${Math.round(
      event.y_position
    )}%)`;

    // Only add timestamp if it's significantly different from last one (e.g., 2 seconds apart)
    const currentTime = new Date(event.timestamp);
    if (
      !lastTimestamp ||
      currentTime.getTime() - new Date(lastTimestamp).getTime() > 2000
    ) {
      keyEvents.push({
        time: currentTime.toISOString(),
        action: `${event.event_type === 1 ? "Clicked" : "Hovered"} ${
          event.text_content || elementKey
        }`,
      });
      lastTimestamp = event.timestamp;
    }

    // Update element interaction summary
    if (!elementInteractions.has(elementKey)) {
      elementInteractions.set(elementKey, {
        element: elementKey,
        count: 0,
        locations: [],
      });
    }

    const summary = elementInteractions.get(elementKey)!;
    summary.count++;
    if (!summary.locations.includes(position)) {
      summary.locations.push(position);
    }
  });

  // Sort interactions by count and take top 10
  const topInteractions = Array.from(elementInteractions.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((interaction) => ({
      element: interaction.element,
      count: interaction.count,
      locations:
        interaction.locations.length > 3
          ? interaction.locations
              .slice(0, 3)
              .concat([`...and ${interaction.locations.length - 3} more`])
          : interaction.locations,
    }));

  // Take only the 20 most significant key events
  const significantEvents =
    keyEvents.length > 20
      ? keyEvents
          .slice(0, 20)
          .concat([
            { time: "...", action: `(${keyEvents.length - 20} more events)` },
          ])
      : keyEvents;

  return {
    sessionDuration:
      events.length > 0
        ? `${Math.round(
            (new Date(events[events.length - 1].timestamp).getTime() -
              new Date(events[0].timestamp).getTime()) /
              1000
          )} seconds`
        : "unknown",
    totalEvents: events.length,
    keyEvents: significantEvents,
    mostInteractedElements: topInteractions,
  };
}

export const initRRWebAnalysis = async () => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  const analysisPrompt = PromptTemplate.fromTemplate(`
    Analyze this user session recording summary:
    {sessionData}

    Provide a brief analysis in markdown format:
    1. Session Overview (duration, total interactions)
    2. Key User Journey (main actions and their significance)
    3. Most Engaged Areas (where user spent most time/attention)
    4. UX Insights (patterns, potential issues, recommendations)

    Keep it concise and actionable. Focus on insights that would help improve the user experience.
    Avoid technical details unless they're crucial for understanding user behavior.
  `);

  const analysisChain = RunnableSequence.from([
    {
      sessionData: async (input: { sessionId: string }) => {
        const events = await fetchSessionEvents(input.sessionId);
        return JSON.stringify(processEventsForAnalysis(events), null, 2);
      },
    },
    analysisPrompt,
    llm,
    new StringOutputParser(),
  ]);

  return { analysisChain };
};
