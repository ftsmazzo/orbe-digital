import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);
const tables = await sql`
  select table_name from information_schema.tables
  where table_schema = 'public'
  order by table_name
`;
const users = await sql`select id, email from "user"`;
const accounts = await sql`select user_id, provider_id, account_id, length(password) pw from account`;
console.log("tables", tables.map((t) => t.table_name));
console.log("user", users);
console.log("account", accounts);
await sql.end();
