import clickhouse from "@/lib/clickhouse";
import { NextRequest, NextResponse } from "next/server";
import * as pako from "pako";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const rrwebEventType = z.enum(["dom_snapshot", "mutation", "interaction"]);

const rrwebEventSchema = z.object({
  event_type: rrwebEventType,
  rrweb_data: z.string(),
  timestamp: z.string(),
});

const recordingPayloadSchema = z.object({
  api_key: z.string(),
  session_id: z.string(),
  rrwebEvents: z.array(rrwebEventSchema),
  timestamp: z.string(),
  page_url: z.string(),
  viewport_width: z.number(),
  viewport_height: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    // Decompress request
    const compressedData = await req.arrayBuffer();
    const decompressedData = pako.inflate(new Uint8Array(compressedData), {
      to: "string",
    });
    const jsonData = JSON.parse(decompressedData);

    const payload = recordingPayloadSchema.parse(jsonData);

    const {
      api_key,
      session_id,
      rrwebEvents,
      timestamp,
      page_url,
      viewport_width,
      viewport_height,
    } = payload;

    // Validate API Key
    const projectQuery = await clickhouse.query({
      query: `SELECT project_id FROM projects WHERE api_key = '${api_key}'`,
      format: "JSONEachRow",
    });
    const results = (await projectQuery.json()) as Array<{
      project_id: string;
    }>;

    if (results.length === 0) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    const project_id = results[0].project_id;

    // Check if recording session exists
    const sessionQuery = await clickhouse.query({
      query: `SELECT session_id FROM recording_sessions WHERE session_id = '${session_id}' AND project_id = '${project_id}'`,
      format: "JSONEachRow",
    });
    const sessionResults = (await sessionQuery.json()) as Array<{
      session_id: string;
    }>;
    const sessionExists = sessionResults.length > 0;

    if (!sessionExists) {
      await clickhouse.insert({
        table: "recording_sessions",
        values: [
          {
            session_id: session_id,
            project_id: project_id,
            start_timestamp: timestamp,
            page_url: page_url,
            viewport_width: viewport_width,
            viewport_height: viewport_height,
            referrer: req.headers.get("referrer") || null,
            user_agent: req.headers.get("user-agent") || null,
          },
        ],
        format: "JSONEachRow",
      });
    }

    // Map event_type to Enum8 values
    // dom_snapshot = 1, mutation = 2, interaction = 3
    const mapEventType = (
      type: "dom_snapshot" | "mutation" | "interaction"
    ) => {
      if (type === "dom_snapshot") return 1;
      if (type === "mutation") return 2;
      if (type === "interaction") return 3;
      return 2; // default
    };

    const eventValues = rrwebEvents.map((event) => ({
      event_id: uuidv4(),
      session_id: session_id,
      project_id: project_id,
      timestamp: event.timestamp,
      event_type: mapEventType(event.event_type),
      rrweb_data: event.rrweb_data,
    }));

    await clickhouse.insert({
      table: "recording_events",
      values: eventValues,
      format: "JSONEachRow",
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation Error:", error.errors);
      return NextResponse.json(
        { error: "Invalid payload", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
