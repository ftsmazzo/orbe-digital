import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";

function createDb() {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL não definido");
  }

  const client = postgres(url, {
    max: 10,
    prepare: false,
  });

  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as {
  __orbeDb?: ReturnType<typeof createDb>;
};

export const db = globalForDb.__orbeDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__orbeDb = db;
}

export type Database = typeof db;
