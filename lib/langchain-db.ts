/* eslint-disable @typescript-eslint/no-explicit-any */
import clickhouse from "@/lib/clickhouse";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

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
      // If the input is not a SQL query, return the last results
      if (!query.trim().toUpperCase().startsWith("SELECT")) {
        return this.queryContext.lastResults || [];
      }

      // Clean the query by removing markdown formatting and unnecessary whitespace
      const cleanQuery = query
        .replace(/```sql\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const result = await clickhouse.query({
        query: cleanQuery,
        format: "JSONEachRow",
      });

      const results = await result.json();

      // Store the context
      this.queryContext = {
        lastQuery: cleanQuery,
        lastResults: results,
      };

      return results;
    } catch (error) {
      console.error("Query execution error:", error);
      // Return last results if query fails
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
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  const sqlPrompt = PromptTemplate.fromTemplate(`
    Based on the provided SQL table schema below, write a SQL query that would answer the user's question.
    If the user is asking for a visualization or chart of previous results, do not write a new query - instead respond with "USE_PREVIOUS_RESULTS".
    Use ClickHouse SQL syntax. The database contains analytics data about website visitors and their interactions.
    
    Available tables and their schemas:
    
    {schema}
    
    User Question: {question}
    
    Write a SQL query that answers this question. Use only the tables and columns shown in the schema.
    If the question cannot be answered with the available schema, respond with "Cannot answer this question with the available data."
    If the user is asking for a visualization of previous results, respond with "USE_PREVIOUS_RESULTS"
    
    IMPORTANT: Write the SQL query directly without any markdown formatting or code blocks.
    
    SQL QUERY:
  `);

  const sqlQueryChain = RunnableSequence.from([
    {
      schema: async () => db.getTableInfo(),
      question: (input: { question: string }) => input.question,
    },
    sqlPrompt,
    llm.bind({ stop: ["\nSQLResult:", "```"] }),
    new StringOutputParser(),
  ]);

  const responsePrompt = PromptTemplate.fromTemplate(`
    You are an analytics assistant. Based on the following information, provide a clear and concise response:
    
    Schema of available data:
    {schema}
    
    Original Question: {question}
    
    SQL Query Used: {query}
    
    Query Results: {response}
    
    Previous Context: The last query was about {lastContext}
    
    Provide a natural language response that:
    1. Answers the user's question directly
    2. Includes relevant numbers and statistics from the query results
    3. Adds brief insights about what the data suggests
    4. If the user asks for a visualization, format the data according to the appropriate visualization schema
    
    Response:
  `);

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
      response: async (input) => db.run(input.query),
      lastContext: async () => {
        const context = db.getLastContext();
        return context.lastQuery || "No previous query";
      },
    },
    responsePrompt,
    llm,
    new StringOutputParser(),
  ]);

  return { db, finalChain };
};
