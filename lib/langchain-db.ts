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
      console.log("Original query:", query);

      const cleanQuery = extractSQLQuery(query);
      console.log("Extracted SQL query:", cleanQuery);

      if (!cleanQuery) {
        console.error("No valid SQL query found");
        return this.queryContext.lastResults || [];
      }

      const result = await clickhouse.query({
        query: cleanQuery,
        format: "JSONEachRow",
      });

      const results = await result.json();
      console.log("Query results:", results);

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

function extractSQLQuery(text: string): string {
  // Remove any markdown code blocks
  text = text.replace(/```sql\n?/g, "").replace(/```\n?/g, "");

  // Remove any explanatory text before the actual SQL
  const sqlKeywords =
    /(SELECT|CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|TRUNCATE|WITH)/i;
  const match = text.match(sqlKeywords);
  if (match) {
    text = text.slice(match.index);
  }

  return text.trim();
}

export const initLangChainDB = async () => {
  const db = new ClickhouseDatabase();
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  const sqlPrompt = PromptTemplate.fromTemplate(`
    You are an expert analytics engineer specializing in user behavior analysis.
    Your task is to write efficient SQL queries for ClickHouse that analyze user interactions and provide meaningful insights.
    
    Available tables and their schemas:
    {schema}
    
    User Question: {question}
    
    Previous Similar Queries and Results:
    {previousContext}
    
    IMPORTANT: 
    1. Respond ONLY with the SQL query, no explanations
    2. ALWAYS use aggregations for large tables (especially events)
    3. NEVER return raw event data - always group, count, or summarize
    4. Use time-based partitioning when querying large date ranges
    5. Limit results to meaningful samples when analyzing patterns
    
    
    EFFICIENT QUERY PATTERNS:

    1. Event Volume Analysis:
    - Use COUNT(*) with GROUP BY
    - Aggregate by time windows (toStartOfHour, toStartOfDay)
    - Example:
      SELECT 
        toStartOfHour(timestamp) as hour,
        event_type,
        COUNT(*) as event_count
      FROM events
      GROUP BY hour, event_type
      ORDER BY hour DESC

    2. User Behavior Patterns:
    - Use aggregation functions (avg, percentile, uniq)
    - Sample data for pattern detection
    - Example:
      SELECT 
        element_id,
        COUNT(*) as click_count,
        uniqExact(session_id) as unique_sessions
      FROM events
      WHERE event_type = 'click'
      GROUP BY element_id
      HAVING click_count > 10

    3. Session Analysis:
    - Pre-aggregate metrics at session level
    - Use window functions for sequential analysis
    - Example:
      SELECT 
        session_id,
        COUNT(DISTINCT event_type) as interaction_types,
        MAX(timestamp) - MIN(timestamp) as session_duration
      FROM events
      GROUP BY session_id

    4. Performance Metrics:
    - Use quantile functions for distribution analysis
    - Aggregate by relevant dimensions
    - Example:
      SELECT 
        user_agent,
        count() as sample_size,
        quantile(0.95)(load_time) as p95_load_time
      FROM sessions
      GROUP BY user_agent

    5. Funnel Analysis:
    - Use window functions and aggregates
    - Focus on conversion rates between steps
    - Example:
      WITH step_counts AS (
        SELECT 
          step_name,
          COUNT(DISTINCT session_id) as users_at_step
        FROM events
        GROUP BY step_name
      )

    6. Heatmap Data:
    - Use grid-based aggregation
    - Round coordinates to reduce granularity
    - Example:
      SELECT 
        round(x_position/10)*10 as x_grid,
        round(y_position/10)*10 as y_grid,
        COUNT(*) as click_count
      FROM events
      WHERE event_type = 'click'
      GROUP BY x_grid, y_grid

    OPTIMIZATION RULES:
    1. Always include WHERE clauses for date ranges
    2. Use appropriate aggregation functions
    3. Always avoid SELECT * or returning raw events
    4. Limit result sets to meaningful samples
    5. Use materialized views for common aggregations
    6. Include LIMIT clauses for exploratory queries
    7. Use approximate functions for high-cardinality data (uniqHLL instead of uniqExact)
    8. Always make sure to make the most efficient query as possible - and reduce context length as much as possible

    Write an efficient SQL query that provides aggregated analytics. Use ClickHouse SQL syntax.
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
      schema: async () => {
        try {
          return await db.getTableInfo();
        } catch (error) {
          console.error("Error getting schema:", error);
          throw error;
        }
      },
      question: (input: { question: string }) => input.question,
      previousContext: async (input: { question: string }) => {
        try {
          const similarContexts = await retrieveSimilarContexts(input.question);
          return JSON.stringify(similarContexts, null, 2);
        } catch (error) {
          console.error("Error getting previous context:", error);
          return "[]";
        }
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
