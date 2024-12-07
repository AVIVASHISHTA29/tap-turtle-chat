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
      `,
      format: "JSONEachRow",
    });

    const tablesInfo = await tables.json();
    return tablesInfo
      .map(
        (row: any) => `Table: ${row.table}, Column: ${row.name} (${row.type})`
      )
      .join("\n");
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
    modelName: "gpt-4",
    temperature: 0,
  });

  const sqlPrompt = PromptTemplate.fromTemplate(`
    You are an analytics expert. Based on the user's question and previous context, write SQL queries that provide comprehensive analytics.
    Always try to get numerical data that can be visualized.
    
    Available tables and their schemas:
    {schema}
    
    User Question: {question}
    
    Previous Similar Queries and Results:
    {previousContext}
    
    Guidelines:
    1. If the user asks about trends, include time-based grouping
    2. For comparisons, include counts and percentages
    3. When analyzing events, consider grouping by type, page, or time
    4. Always include relevant metrics that could be visualized
    5. If the user asks about previous results, respond with "USE_PREVIOUS_RESULTS"
    6. Use the previous context to improve your query and avoid redundant queries
    
    Write a SQL query that provides detailed analytics. Use ClickHouse SQL syntax.
    
    SQL QUERY:
  `);

  const responsePrompt = PromptTemplate.fromTemplate(`
    You are an analytics expert who always provides insights with visualizations.
    
    Schema: {schema}
    Question: {question}
    SQL Query: {query}
    Results: {response}
    Previous Context: {previousContext}
    
    Instructions:
    1. ALWAYS analyze the numerical data and provide specific statistics
    2. ALWAYS create at least one visualization using the appropriate tool
    3. Format the data according to the visualization schema that best fits the data
    4. If the data shows trends, use getVisitorsTrend or getUserEngagement
    5. If the data shows distribution, use getDeviceDistribution or getBrowserAnalytics
    6. If the data is about pages, use getPagePerformance
    7. If the data involves click positions, use getPageHeatmap
    8. Add insights about what the data and visualization reveal
    9. Reference previous similar queries to provide context and comparisons
    
    Format your response as:
    1. Key Statistics: (list the important numbers)
    2. Visualization: (include the formatted data for the visualization)
    3. Insights: (explain what the data suggests, including historical context)
    
    Remember: ALWAYS include a visualization - transform the data to fit the appropriate visualization schema.
    
    Response:
  `);

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
        // Store the context in Pinecone
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
