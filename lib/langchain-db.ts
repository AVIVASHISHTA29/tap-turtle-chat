/* eslint-disable @typescript-eslint/no-explicit-any */
import clickhouse from "@/lib/clickhouse";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { retrieveSimilarContexts, storeQueryContext } from "./pinecone-client";

interface QueryContext {
  lastQuery?: string;
  lastResults?: any;
}

class ClickhouseDatabase {
  private queryContext: QueryContext = {};

  async getTableInfo() {
    const tables = await clickhouse.query({
      query: `
        SELECT 
          table,
          name,
          type
        FROM system.columns 
        WHERE database = currentDatabase()
        AND table IN ('projects', 'sessions', 'events')
      `,
      format: "JSONEachRow",
    });

    const tablesInfo = await tables.json();
    return tablesInfo
      .map(
        (row: any) =>
          `Table: ${row.table}
         Column: ${row.name} (${row.type})
         ${this.getColumnContext(row.table, row.name)}`
      )
      .join("\n");
  }

  private getColumnContext(table: string, column: string): string {
    const contextMap: Record<string, Record<string, string>> = {
      events: {
        event_type:
          "Enum: click, scroll, mouse_move, dom_load, dom_unload. Use for behavior analysis.",
        scroll_direction: "Enum: up, down. Indicates scroll behavior.",
        x_position:
          "Float32: Click/mouse X coordinate (0-100%). Use for heatmaps.",
        y_position:
          "Float32: Click/mouse Y coordinate (0-100%). Use for heatmaps.",
        metadata: "JSON string with event-specific data.",
        text_content: "String: Text content of interacted element.",
        html_content: "String: HTML content of interacted element.",
        scroll_percentage: "UInt8: Page scroll depth (0-100).",
        element_id: "String: DOM element ID of interacted element.",
        css_selector: "String: Full CSS path to interacted element.",
      },
      sessions: {
        viewport_width: "UInt16: Browser window width in pixels.",
        viewport_height: "UInt16: Browser window height in pixels.",
        user_agent: "String: Browser and device information.",
        referrer: "String: Traffic source URL.",
        timestamp_start: "DateTime: Session start time.",
        page_url: "String: Current page URL.",
      },
      projects: {
        project_id: "UUID: Links events and sessions to projects.",
        created_at: "DateTime: Project creation timestamp.",
      },
    };

    return contextMap[table]?.[column] || "";
  }

  async run(query: string) {
    try {
      if (!query.trim().toUpperCase().startsWith("SELECT")) {
        return this.queryContext.lastResults || [];
      }

      const cleanQuery = query
        .replace(/```sql\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const result = await clickhouse.query({
        query: cleanQuery,
        format: "JSONEachRow",
      });

      const results = await result.json();

      this.queryContext = {
        lastQuery: cleanQuery,
        lastResults: results,
      };

      return results;
    } catch (error) {
      console.error("Query execution error:", error);
      return this.queryContext.lastResults || [];
    }
  }

  getLastContext() {
    return this.queryContext;
  }
}

export const initLangChainDB = async () => {
  const db = new ClickhouseDatabase();
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
  });

  const sqlPrompt = PromptTemplate.fromTemplate(`
    You are an expert analytics engineer specializing in user behavior analysis.
    Your task is to write SQL queries for ClickHouse that analyze user interactions and provide meaningful insights.
    
    Available tables and their schemas:
    {schema}
    
    User Question: {question}
    
    Previous Similar Queries and Results:
    {previousContext}
    
    ANALYSIS PATTERNS AND QUERY GUIDELINES:

    1. Click Pattern Analysis:
    - Use x_position, y_position for heatmap data
    - Join events with sessions for device context
    - Group by element_id, css_selector for interaction targets
    - Calculate time between clicks for rage click detection
    - Example patterns:
      * Rage clicks: Multiple clicks (>3) on same element within 2 seconds
      * Dead clicks: Clicks with no element_id or on non-interactive elements
      * Navigation patterns: Sequence of clicks across pages

    2. Scroll Behavior Analysis:
    - Use scroll_percentage and scroll_direction
    - Calculate dwell time between scroll events
    - Identify reading vs scanning patterns
    - Example patterns:
      * Content engagement: Time spent at each scroll depth
      * Reading patterns: Slow scrolls with occasional up-scrolls
      * Quick scanning: Rapid continuous scrolls

    3. Session Quality Analysis:
    - Combine dom_load and dom_unload events
    - Track cross-page navigation
    - Analyze session duration and interaction density
    - Example patterns:
      * Engagement score: Interactions per minute
      * Session depth: Number of pages visited
      * Exit triggers: Last interaction before dom_unload

    4. User Journey Analysis:
    - Use timestamp ordering of events
    - Track page_url sequences
    - Analyze interaction patterns between pages
    - Example patterns:
      * Common paths: Frequent page_url sequences
      * Drop-off points: Last page_url before exit
      * Success paths: Sessions with desired outcomes

    5. Performance Impact Analysis:
    - Calculate time between dom_load events
    - Group by user_agent and viewport dimensions
    - Correlate with session duration
    - Example patterns:
      * Load time impact: Session duration vs load time
      * Device issues: Performance by user_agent
      * Viewport problems: Issues at specific dimensions

    6. Frustration Detection:
    - Combine click, scroll, and mouse_move events
    - Look for rapid repetitive patterns
    - Analyze exit triggers
    - Example patterns:
      * Rage clicks: Multiple rapid clicks
      * Erratic scrolling: Quick direction changes
      * Abandonment: Interaction sequence before exit

    QUERY WRITING RULES:
    1. Always include project_id in WHERE clauses
    2. Use appropriate time ranges (last day, week, month)
    3. Join tables efficiently (sessions -> events)
    4. Calculate relevant metrics based on analysis type
    5. Format results suitable for visualization
    6. Use CTEs for complex analysis
    7. Include relevant dimension columns

    Write a SQL query that provides detailed analytics. Use ClickHouse SQL syntax.
    If multiple queries are needed, separate them with semicolons.
    
    SQL QUERY:
  `);

  const responsePrompt = PromptTemplate.fromTemplate(`
    You are an expert product analyst who helps product managers and designers understand user behavior.
    
    Schema: {schema}
    Question: {question}
    SQL Query: {query}
    Query Results: {response}
    Previous Context: {previousContext}
    
    Provide your response in two parts:
    1. A visualization section with the appropriate tool (getUserEngagement, getPageHeatmap, getVisitorsTrend, or getDeviceDistribution)
    2. An analysis section with findings and recommendations

    Start your response with ---VISUALIZATION_DATA--- followed by a JSON code block.
    Then add ---ANALYSIS--- followed by your detailed analysis.
    End with ---END---

    Keep numbers as numbers, not strings.
    Make your analysis clear and actionable.
    Choose the most appropriate visualization type for the data.

    Response:`);

  const sqlQueryChain = RunnableSequence.from([
    {
      schema: async () => db.getTableInfo(),
      question: (input: { question: string }) => input.question,
      previousContext: async (input: { question: string }) => {
        const similarContexts = await retrieveSimilarContexts(input.question);
        return JSON.stringify(similarContexts, null, 2);
      },
    },
    sqlPrompt,
    llm.bind({ stop: ["\nSQLResult:", "```"] }),
    new StringOutputParser(),
  ]);

  const finalChain = RunnableSequence.from([
    {
      question: (input) => input.question,
      query: sqlQueryChain,
    },
    {
      schema: async () => db.getTableInfo(),
      question: (input) => input.question,
      query: (input) =>
        input.query === "USE_PREVIOUS_RESULTS"
          ? db.getLastContext().lastQuery
          : input.query,
      response: async (input) => {
        const results = await db.run(input.query);
        await storeQueryContext(input.question, input.query, results);
        return results;
      },
      previousContext: async (input) => {
        const similarContexts = await retrieveSimilarContexts(input.question);
        return JSON.stringify(similarContexts, null, 2);
      },
    },
    responsePrompt,
    llm,
    new StringOutputParser(),
  ]);

  return { db, finalChain };
};
