// app/api/recording_events/[sessionId]/route.ts
import clickhouse from "@/lib/clickhouse";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  try {
    const query = await clickhouse.query({
      query: `
        SELECT rrweb_data, timestamp, event_type
        FROM recording_events
        WHERE session_id = '${sessionId}'
        ORDER BY timestamp ASC
      `,
      format: "JSONEachRow",
    });

    const events = (await query.json()) as Array<{
      rrweb_data: string;
      timestamp: string;
      event_type: number;
    }>;

    // Convert stored rrweb_data (string) back to object
    const rrwebEvents = events.map((e) => {
      const parsed = JSON.parse(e.rrweb_data);
      // The rrweb event expects fields like type, data, timestamp
      // Since we stored the whole event, it should already contain these fields.
      return parsed;
    });

    return NextResponse.json({ events: rrwebEvents });
  } catch (error: unknown) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
