import { EventType } from "@/types/eventTypes";
import { NextRequest, NextResponse } from "next/server";
import * as pako from "pako";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { default as clickhouse } from "../../../lib/clickhouse";

const eventTypeEnum = z.enum([
  "click",
  "scroll",
  "mousemove",
  "dom_load",
  "dom_unload",
]) as z.ZodType<EventType>;

const eventDataSchema = z.object({
  event_type: eventTypeEnum,
  element_id: z.string().nullable(),
  css_selector: z.string().nullable(),
  x_position: z.number().nullable(),
  y_position: z.number().nullable(),
  timestamp: z.string(),
  metadata: z.any().optional(),
});

const payloadSchema = z.object({
  api_key: z.string(),
  session_id: z.string(),
  events: z.array(eventDataSchema),
  timestamp: z.string(),
  page_url: z.string(),
  viewport_width: z.number(),
  viewport_height: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    // Read the compressed data from the request body
    const compressedData = await req.arrayBuffer();

    // Decompress the data
    const decompressedData = pako.inflate(new Uint8Array(compressedData), {
      to: "string",
    });
    const jsonData = JSON.parse(decompressedData);

    // Validate the payload using Zod
    const payload = payloadSchema.parse(jsonData);

    const {
      api_key,
      session_id,
      events,
      timestamp,
      page_url,
      viewport_width,
      viewport_height,
    } = payload;

    const projectQuery = await clickhouse.query({
      query: `SELECT project_id FROM projects WHERE api_key = '${api_key}'`,
      format: "JSONEachRow",
    });

    const results = await projectQuery.json();
    const rows = results as Array<{ project_id: string }>;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    const project_id = rows[0].project_id;

    // Insert or update the session - Fix the insert format
    await clickhouse.insert({
      table: "sessions",
      values: [
        {
          // Wrap the values in an array
          session_id: session_id,
          project_id: project_id,
          timestamp_start: timestamp,
          page_url: page_url,
          viewport_width: viewport_width,
          viewport_height: viewport_height,
        },
      ],
      format: "JSONEachRow", // Specify the format
    });

    // Prepare all events in a single batch
    const eventValues = events.map((event) => ({
      event_id: uuidv4(),
      session_id: session_id,
      project_id: project_id,
      timestamp: event.timestamp,
      event_type: event.event_type,
      element_id: event.element_id,
      css_selector: event.css_selector,
      x_position: event.x_position,
      y_position: event.y_position,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    }));

    // Insert all events in a single batch operation
    await clickhouse.insert({
      table: "events",
      values: eventValues,
      format: "JSONEachRow",
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    // Add better error logging
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
