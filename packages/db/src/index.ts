import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  console.warn("[@orbe/db] DATABASE_URL não definido");
}

const client = postgres(url ?? "postgresql://orbe:orbe_local_dev@127.0.0.1:5432/orbe", {
  max: 10,
  prepare: false,
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
