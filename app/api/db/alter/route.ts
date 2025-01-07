import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Add DEFAULT now() to projects.created_at
    await clickhouse.query({
      query: `ALTER TABLE projects MODIFY COLUMN created_at DateTime DEFAULT now()`,
    });

    // Add DEFAULT now() to user_projects.created_at
    await clickhouse.query({
      query: `ALTER TABLE user_projects MODIFY COLUMN created_at DateTime DEFAULT now()`,
    });

    return NextResponse.json({ message: "Tables altered successfully" });
  } catch (error) {
    console.error("Error altering tables:", error);
    return new NextResponse("Error altering tables", { status: 500 });
  }
}
