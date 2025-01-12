import clickhouse from "@/lib/clickhouse";
import { NextRequest, NextResponse } from "next/server";
import * as pako from "pako";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// CORS headers configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Content-Encoding, Authorization",
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Observability schema validation using Zod
const observabilityEventSchema = z.object({
  session_id: z.string(),
  event_type: z.enum(["request", "response", "error"]),
  method: z.string().nullable(),
  url: z.string().nullable(),
  status: z.number().nullable(),
  headers: z.string().nullable(),
  body: z.string().nullable(),
  timestamp: z.string(),
});

// Accept array of events directly
const observabilityPayloadSchema = z.array(observabilityEventSchema);

// POST handler
export async function POST(req: NextRequest) {
  try {
    // Decompress the request body
    const compressedData = await req.arrayBuffer();
    const decompressedData = pako.inflate(new Uint8Array(compressedData), {
      to: "string",
    });
    const jsonData = JSON.parse(decompressedData);

    // Validate the payload
    const events = observabilityPayloadSchema.parse(jsonData);

    if (events.length === 0) {
      return NextResponse.json({ status: "success" }, { headers: corsHeaders });
    }

    const session_id = events[0].session_id;

    // First, try to get project_id from sessions table
    const projectQuery = await clickhouse.query({
      query: `SELECT project_id FROM sessions WHERE session_id = '${session_id}'`,
      format: "JSONEachRow",
    });
    const projectData = (await projectQuery.json()) as { project_id: string }[];

    if (projectData.length === 0) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const project_id = projectData[0].project_id;

    // Check if the session exists in observability_sessions
    const sessionQuery = await clickhouse.query({
      query: `SELECT session_id FROM observability_sessions WHERE session_id = '${session_id}'`,
      format: "JSONEachRow",
    });
    const sessionExists = (await sessionQuery.json()).length > 0;

    // If session does not exist, create it
    if (!sessionExists) {
      await clickhouse.insert({
        table: "observability_sessions",
        values: [
          {
            session_id,
            project_id,
            start_timestamp: events[0]?.timestamp || new Date().toISOString(),
            user_agent: req.headers.get("user-agent") || null,
            referrer: req.headers.get("referer") || null,
          },
        ],
        format: "JSONEachRow",
      });
    }

    // Prepare event data for insertion
    const eventValues = events.map((event) => ({
      event_id: uuidv4(),
      project_id,
      session_id: event.session_id,
      event_type: event.event_type,
      method: event.method,
      url: event.url,
      status: event.status,
      headers: event.headers,
      body: event.body,
      timestamp: event.timestamp,
    }));

    // Insert event data into ClickHouse
    await clickhouse.insert({
      table: "observability_events",
      values: eventValues,
      format: "JSONEachRow",
    });

    return NextResponse.json({ status: "success" }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation Error:", error.errors);
      return NextResponse.json(
        { error: "Invalid payload", details: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
