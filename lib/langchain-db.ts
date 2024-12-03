/* eslint-disable @typescript-eslint/no-explicit-any */
import clickhouse from "@/lib/clickhouse";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

// Custom SQL Database class for Clickhouse
class ClickhouseDatabase {
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
      const result = await clickhouse.query({
        query,
        format: "JSONEachRow",
      });
      return await result.json();
    } catch (error) {
      console.error("Query execution error:", error);
      throw error;
    }
  }
}

// Initialize the database and LangChain
export const initLangChainDB = async () => {
  const db = new ClickhouseDatabase();
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
  });

  // Create prompt template for SQL query generation
  const sqlPrompt = PromptTemplate.fromTemplate(`
    Based on the provided SQL table schema below, write a SQL query that would answer the user's question.
    Use ClickHouse SQL syntax. The database contains analytics data about website visitors and their interactions.
    
    Available tables and their schemas:
    ------------
    {schema}
    ------------
    
    User Question: {question}
    
    Write a SQL query that answers this question. Use only the tables and columns shown in the schema.
    If the question cannot be answered with the available schema, respond with "Cannot answer this question with the available data."
    
    SQL QUERY:
  `);

  // Chain for generating SQL queries
  const sqlQueryChain = RunnableSequence.from([
    {
      schema: async () => db.getTableInfo(),
      question: (input: { question: string }) => input.question,
    },
    sqlPrompt,
    llm.bind({ stop: ["\nSQLResult:"] }),
    new StringOutputParser(),
  ]);

  // Prompt for natural language response
  const responsePrompt = PromptTemplate.fromTemplate(`
    You are an analytics assistant. Based on the following information, provide a clear and concise response:
    
    Schema of available data:
    {schema}
    
    Original Question: {question}
    
    SQL Query Used: {query}
    
    Query Results: {response}
    
    Provide a natural language response that:
    1. Answers the user's question directly
    2. Includes relevant numbers and statistics from the query results
    3. Adds brief insights about what the data suggests
    
    Response:
  `);

  // Final chain combining SQL query and natural language response
  const finalChain = RunnableSequence.from([
    {
      question: (input) => input.question,
      query: sqlQueryChain,
    },
    {
      schema: async () => db.getTableInfo(),
      question: (input) => input.question,
      query: (input) => input.query,
      response: async (input) => db.run(input.query),
    },
    responsePrompt,
    llm,
    new StringOutputParser(),
  ]);

  return { db, finalChain };
};
