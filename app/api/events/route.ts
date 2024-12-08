import { EventType, ScrollDirection } from "@/enums";
import clickhouse from "@/lib/clickhouse";
import { NextRequest, NextResponse } from "next/server";
import * as pako from "pako";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const eventTypeEnum = z.enum([
  EventType.CLICK,
  EventType.MOUSE_MOVE,
  EventType.SCROLL,
  EventType.DOM_LOAD,
  EventType.DOM_UNLOAD,
]);

const eventDataSchema = z.object({
  event_type: eventTypeEnum,
  element_id: z.string().nullable(),
  css_selector: z.string().nullable(),
  x_position: z.number().nullable(),
  y_position: z.number().nullable(),
  timestamp: z.string(),
  metadata: z
    .object({
      referrer: z.string().nullable().optional(),
      user_agent: z.string().nullable().optional(),
      text_content: z.string().nullable().optional(),
      html_content: z.string().nullable().optional(),
      scroll_percentage: z.number().int().optional(),
      direction: z.enum([ScrollDirection.UP, ScrollDirection.DOWN]).optional(),
    })
    .optional()
    .nullable(),
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
    // Read and decompress request data
    const compressedData = await req.arrayBuffer();
    const decompressedData = pako.inflate(new Uint8Array(compressedData), {
      to: "string",
    });
    const jsonData = JSON.parse(decompressedData);

    // Validate the payload
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

    // Validate API Key
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

    // Check if session exists
    const sessionQuery = await clickhouse.query({
      query: `SELECT session_id FROM sessions WHERE session_id = '${session_id}' AND project_id = '${project_id}'`,
      format: "JSONEachRow",
    });
    const sessionResults = await sessionQuery.json();
    const sessionExists =
      (sessionResults as Array<{ session_id: string }>).length > 0;

    if (!sessionExists) {
      await clickhouse.insert({
        table: "sessions",
        values: [
          {
            session_id: session_id,
            project_id: project_id,
            timestamp_start: timestamp,
            page_url: page_url,
            viewport_width: viewport_width,
            viewport_height: viewport_height,
            referrer:
              payload.events.find((e) => e.event_type === "dom_load")?.metadata
                ?.referrer ||
              req.headers.get("referrer") ||
              null,
            user_agent:
              payload.events.find((e) => e.event_type === "dom_load")?.metadata
                ?.user_agent ||
              req.headers.get("user-agent") ||
              null,
          },
        ],
        format: "JSONEachRow",
      });
    }

    // Prepare all events for batch insertion
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
      text_content: event.metadata?.text_content || null,
      html_content: event.metadata?.html_content || null,
      scroll_percentage: event.metadata?.scroll_percentage || null,
      scroll_direction:
        event.metadata?.direction === ScrollDirection.UP
          ? 1
          : event.metadata?.direction === ScrollDirection.DOWN
          ? 2
          : null,
    }));

    // Insert all events
    await clickhouse.insert({
      table: "events",
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
