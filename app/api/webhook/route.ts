import clickhouse from "@/lib/clickhouse";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return new NextResponse("Server configuration error", { status: 500 });
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers:", {
      svix_id,
      svix_timestamp,
      svix_signature,
    });
    return new NextResponse("Missing webhook headers", { status: 400 });
  }

  let payload;
  try {
    // Get the body
    payload = await request.json();
  } catch (err) {
    console.error("Error parsing webhook body:", err);
    return new NextResponse("Error parsing webhook body", { status: 400 });
  }

  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Invalid webhook signature", { status: 401 });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log("Processing webhook event:", eventType);

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, created_at } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;
    const fullName = [first_name, last_name].filter(Boolean).join(" ");

    try {
      console.log("Creating user in ClickHouse:", {
        user_id: id,
        email: primaryEmail,
        name: fullName,
      });

      await clickhouse.query({
        query: `
          INSERT INTO users
          (user_id, email, created_at, name)
          VALUES
          ({user_id:String}, {email:String}, {created_at:DateTime}, {name:String})
        `,
        query_params: {
          user_id: id,
          email: primaryEmail || "",
          created_at: new Date(created_at).toISOString(),
          name: fullName || "",
        },
      });

      console.log("User created successfully in ClickHouse");
      return NextResponse.json({ message: "User created successfully" });
    } catch (error) {
      console.error("Error creating user in ClickHouse:", error);
      // Log the full error details
      if (error instanceof Error) {
        console.error({
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }
      return new NextResponse("Error creating user in database", {
        status: 500,
      });
    }
  }

  return NextResponse.json({ message: "Webhook processed successfully" });
}
