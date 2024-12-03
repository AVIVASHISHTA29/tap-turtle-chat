import { createClient } from "@clickhouse/client";

const clickhouse = createClient({
  url: process.env.NEXT_PUBLIC_CLICKHOUSE_HOST!,
  username: process.env.NEXT_PUBLIC_CLICKHOUSE_USER!,
  password: process.env.NEXT_PUBLIC_CLICKHOUSE_PASSWORD!,
});

export default clickhouse;
