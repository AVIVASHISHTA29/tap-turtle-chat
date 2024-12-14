/* eslint-disable @typescript-eslint/no-explicit-any */
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

interface DOMSnapshot {
  type: number;
  data: {
    node: DOMNode;
    initialOffset: Offset;
  };
  timestamp: number;
}

interface Offset {
  left: number;
  top: number;
}

interface DOMNode {
  id: number;
  type: number;
  name?: string;
  publicId?: string;
  systemId?: string;
  tagName?: string;
  attributes?: Record<string, string>;
  textContent?: string;
  childNodes?: DOMNode[];
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

async function fetchDOMSnapshots(sessionId: string) {
  const query = await clickhouse.query({
    query: `
      SELECT rrweb_data, timestamp
      FROM recording_events
      WHERE session_id = '${sessionId}'
      AND event_type = 'dom_snapshot'
      ORDER BY timestamp ASC
      LIMIT 10
    `,
    format: "JSONEachRow",
  });

  const snapshots = await query.json();
  return analyzeDOMSnapshots(
    snapshots as Array<{ rrweb_data: string; timestamp: string }>
  );
}

function extractTextContent(node: DOMNode): Record<string, any> {
  const content: Record<string, any> = {};

  if (node.type === 2) {
    // Element node
    if (node.tagName === "meta") {
      const name = node.attributes?.name || node.attributes?.property;
      const content = node.attributes?.content;
      if (name && content) {
        return { [name]: content };
      }
    }

    if (node.tagName === "title") {
      return { title: node.textContent };
    }

    if (
      node.tagName === "h1" ||
      node.tagName === "h2" ||
      node.tagName === "h3" ||
      node.tagName === "h4" ||
      node.tagName === "h5" ||
      node.tagName === "h6"
    ) {
      return { [`heading_${node.tagName}`]: node.textContent };
    }

    if (node.tagName === "p") {
      return { [`paragraph_${node.textContent}`]: node.textContent };
    }

    if (node.tagName === "a") {
      return { [`link_${node.textContent}`]: node.textContent };
    }

    if (node.tagName === "button") {
      return { [`button_${node.textContent}`]: node.textContent };
    }

    if (node.tagName === "input") {
      return { [`input_${node.textContent}`]: node.textContent };
    }

    if (node.tagName === "textarea") {
      return { [`textarea_${node.textContent}`]: node.textContent };
    }

    if (node.tagName === "select") {
      return { [`select_${node.textContent}`]: node.textContent };
    }

    // Extract text from important elements
    if (node.attributes?.["id"] || node.attributes?.["class"]) {
      if (node.textContent?.trim()) {
        const identifier = node.attributes["id"] || node.attributes["class"];
        content[`${node.tagName}_${identifier}`] = node.textContent.trim();
      }
    }
  }

  // Recursively process child nodes
  if (node.childNodes) {
    node.childNodes.forEach((child) => {
      Object.assign(content, extractTextContent(child));
    });
  }

  return content;
}

function analyzeDOMSnapshots(
  snapshots: Array<{ rrweb_data: string; timestamp: string }>
) {
  const pageContent: Record<string, any> = {
    metadata: {},
    headings: [],
    mainContent: {},
  };

  snapshots.forEach((snapshot) => {
    try {
      const parsedData = JSON.parse(snapshot.rrweb_data) as DOMSnapshot;
      const extractedContent = extractTextContent(parsedData.data.node);

      // Organize extracted content
      Object.entries(extractedContent).forEach(([key, value]) => {
        if (key.startsWith("meta")) {
          pageContent.metadata[key] = value;
        } else if (key.startsWith("heading")) {
          if (!pageContent.headings.includes(value)) {
            pageContent.headings.push(value);
          }
        } else {
          pageContent.mainContent[key] = value;
        }
      });
    } catch (error) {
      console.error("Error parsing snapshot:", error);
    }
  });

  return {
    pageTitle: pageContent.metadata.title || pageContent.metadata["og:title"],
    description:
      pageContent.metadata.description ||
      pageContent.metadata["og:description"],
    headings: pageContent.headings.slice(0, 5), // Limit to top 5 headings
    mainContentSummary: Object.entries(pageContent.mainContent)
      .slice(0, 10) // Limit to top 10 content blocks
      .map(([key, value]) => ({ element: key, content: value })),
  };
}

export const initRRWebAnalysis = async () => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  const analysisPrompt = PromptTemplate.fromTemplate(`
    Analyze this user session recording summary and page content:
    
    Page Information:
    {domData}

    User Interactions:
    {sessionData}

    Remember to:
    - Keep each section concise but informative
    - Use bullet points and numbered lists for better readability
    - Include specific examples from the session data
    - Focus on actionable insights
    - Avoid technical jargon unless necessary
    - Give spacing and line breaks to make the report more readable

    Create a detailed markdown analysis with the following structure:

    # Session Analysis Report

    ## 📄 Page Overview
    - **Type**: [Type of page (e.g., Landing, Product, Dashboard)]
    - **Purpose**: [Main purpose of the page]
    - **Key Content**: [Important headings or content elements]

    ## ⏱️ Session Summary
    - **Duration**: [Session duration]
    - **Total Interactions**: [Number of interactions]
    - **Engagement Level**: [High/Medium/Low based on interaction density]

    ## 🔍 User Journey
    1. [First significant action]
    2. [Next significant action]
    3. [Continue with key actions...]

    ## 🎯 Engagement Analysis
    ### Most Engaged Areas
    - [Area 1]: [Description of interaction]
    - [Area 2]: [Description of interaction]
    - [Area 3]: [Description of interaction]

    ### Content Interaction Patterns
    - [Pattern 1]
    - [Pattern 2]
    - [Pattern 3]

    ## 💡 UX Insights
    ### Positive Findings
    - [Positive finding 1]
    - [Positive finding 2]

    ### Areas for Improvement
    - [Improvement suggestion 1]
    - [Improvement suggestion 2]

    ## 🎯 Recommendations
    1. [Primary recommendation]
    2. [Secondary recommendation]
    3. [Additional recommendation if applicable]

  `);

  const analysisChain = RunnableSequence.from([
    {
      sessionData: async (input: { sessionId: string }) => {
        const events = await fetchSessionEvents(input.sessionId);
        return JSON.stringify(processEventsForAnalysis(events), null, 2);
      },
      domData: async (input: { sessionId: string }) => {
        const domAnalysis = await fetchDOMSnapshots(input.sessionId);
        return JSON.stringify(domAnalysis, null, 2);
      },
    },
    analysisPrompt,
    llm,
    new StringOutputParser(),
  ]);

  return { analysisChain };
};
