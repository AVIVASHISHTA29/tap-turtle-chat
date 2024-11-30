import { OpenAI } from "@langchain/openai";
import { SqlDatabaseChain } from "langchain/chains/sql_db";
import { SqlDatabase } from "langchain/sql_db";
import clickhouse from "./clickhouse";

const llm = new OpenAI({
  temperature: 0,
  modelName: "gpt-4",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

async function createChain() {
  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: clickhouse,
  });

  return new SqlDatabaseChain({
    llm,
    database: db,
  });
}

export const sqlChain = createChain();
