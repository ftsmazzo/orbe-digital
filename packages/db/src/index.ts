import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __orbeSql?: ReturnType<typeof postgres>;
  __orbeDb?: Db;
};

function getDatabaseUrl() {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL não definido");
  }
  return url;
}

function createDb() {
  const client =
    globalForDb.__orbeSql ??
    postgres(getDatabaseUrl(), {
      max: 10,
      prepare: false,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__orbeSql = client;
  }

  return drizzle(client, { schema });
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const instance = globalForDb.__orbeDb ?? createDb();
    globalForDb.__orbeDb = instance;
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export type Database = Db;
