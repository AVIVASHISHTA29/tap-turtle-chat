import { createClient } from "@clickhouse/client";

const clickhouse = createClient({
  url: `${process.env.NEXT_PUBLIC_CLICKHOUSE_HOST}:${process.env.NEXT_PUBLIC_CLICKHOUSE_PORT}`,
  username: process.env.NEXT_PUBLIC_CLICKHOUSE_USER!,
  password: process.env.NEXT_PUBLIC_CLICKHOUSE_PASSWORD!,
});

export default clickhouse;
