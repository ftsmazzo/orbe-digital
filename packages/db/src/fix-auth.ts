import postgres from "postgres";
import { hashPassword, verifyPassword } from "better-auth/crypto";

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const users = await sql`select id, email, name from users`;
  const accounts = await sql`
    select id, user_id, provider_id, account_id,
           left(coalesce(password,''), 40) as pw_prefix,
           length(coalesce(password,'')) as pw_len
    from accounts
  `;
  const memberships = await sql`select * from memberships`;

  console.log("users", users);
  console.log("accounts", accounts);
  console.log("memberships", memberships);

  const email = "daniel@danielherculis.com.br";
  const password = "orbe-demo-2026";

  let user = users.find((u) => u.email === email);
  if (!user) {
    const inserted = await sql`
      insert into users (name, email, email_verified)
      values ('Daniel Herculis', ${email}, true)
      returning id, email, name
    `;
    user = inserted[0];
    console.log("created user", user);
  }

  let account = accounts.find((a) => a.user_id === user!.id);
  const hashed = await hashPassword(password);

  if (!account) {
    await sql`
      insert into accounts (account_id, provider_id, user_id, password)
      values (${user!.id}, 'credential', ${user!.id}, ${hashed})
    `;
    console.log("created account");
  } else {
    const full = await sql`select password from accounts where id = ${account.id}`;
    const ok = await verifyPassword({
      hash: full[0].password ?? "",
      password,
    });
    console.log("verifyPassword before", ok);
    await sql`update accounts set password = ${hashed} where id = ${account.id}`;
    console.log("password reset");
  }

  if (memberships.length === 0) {
    let org = (await sql`select id from organizations where slug = 'daniel-herculis'`)[0];
    if (!org) {
      org = (
        await sql`
          insert into organizations (name, slug)
          values ('Daniel Herculis Consultoria', 'daniel-herculis')
          returning id
        `
      )[0];
    }
    await sql`
      insert into memberships (organization_id, user_id, role)
      values (${org.id}, ${user!.id}, 'owner')
    `;
    console.log("created membership");
  }

  const after = await sql`select password from accounts where user_id = ${user!.id}`;
  console.log(
    "verifyPassword after",
    await verifyPassword({ hash: after[0].password, password }),
  );

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
