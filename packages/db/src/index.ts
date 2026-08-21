import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";

function resolveDatabaseUrl() {
  const url = process.env["DATABASE_URL"];
  if (url) return url;

  // Next.js imports server modules during `next build`; allow a dummy URL then.
  if (process.env["NEXT_PHASE"] === "phase-production-build") {
    return "postgresql://build:build@127.0.0.1:5432/build";
  }

  throw new Error("DATABASE_URL não definido");
}

function createDb() {
  const client = postgres(resolveDatabaseUrl(), {
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
