/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

if (!process.env.NEXT_PUBLIC_PINECONE_API_KEY) {
  throw new Error("Missing Pinecone API key");
}

if (!process.env.NEXT_PUBLIC_PINECONE_INDEX) {
  throw new Error("Missing Pinecone index name");
}

const pinecone = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY,
});

const pineconeIndex = pinecone.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX);

export const initPineconeVectorStore = async () => {
  const embeddings = new OpenAIEmbeddings();

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });

  return vectorStore;
};

export const storeQueryContext = async (
  question: string,
  sqlQuery: string,
  results: any
) => {
  const vectorStore = await initPineconeVectorStore();
  const context = JSON.stringify({
    question,
    sqlQuery,
    results: JSON.stringify(results).slice(0, 2000), // Limit size of stored results
  });

  await vectorStore.addDocuments([
    {
      pageContent: context,
      metadata: {
        type: "query_context",
        timestamp: new Date().toISOString(),
      },
    },
  ]);
};

export const retrieveSimilarContexts = async (question: string, k = 3) => {
  const vectorStore = await initPineconeVectorStore();
  const results = await vectorStore.similaritySearch(question, k);

  return results
    .map((doc) => {
      try {
        return JSON.parse(doc.pageContent);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};
