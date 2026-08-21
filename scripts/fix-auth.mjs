import postgres from "postgres";
import { hashPassword, verifyPassword } from "better-auth/crypto";

const sql = postgres(process.env.DATABASE_URL);

const users = await sql`select id, email, name from users`;
const accounts = await sql`
  select id, user_id, provider_id, account_id,
         left(coalesce(password,''), 30) as pw_prefix,
         length(coalesce(password,'')) as pw_len
  from accounts
`;
const memberships = await sql`select * from memberships`;

console.log("users", users);
console.log("accounts", accounts);
console.log("memberships", memberships);

const acc = accounts[0];
if (acc) {
  const full = await sql`select password from accounts where id = ${acc.id}`;
  const ok = await verifyPassword({
    hash: full[0].password,
    password: "orbe-demo-2026",
  });
  console.log("verifyPassword", ok);

  if (!ok) {
    const hashed = await hashPassword("orbe-demo-2026");
    await sql`update accounts set password = ${hashed} where id = ${acc.id}`;
    const ok2 = await verifyPassword({ hash: hashed, password: "orbe-demo-2026" });
    console.log("resetPassword", ok2);
  }
}

await sql.end();
