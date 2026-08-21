import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  await sql.unsafe(`
    ALTER TABLE IF EXISTS consulting_sessions DROP CONSTRAINT IF EXISTS consulting_sessions_created_by_id_users_id_fk;
    ALTER TABLE IF EXISTS diagnostics DROP CONSTRAINT IF EXISTS diagnostics_validated_by_id_users_id_fk;
    ALTER TABLE IF EXISTS memberships DROP CONSTRAINT IF EXISTS memberships_user_id_users_id_fk;
    ALTER TABLE IF EXISTS sessions_auth DROP CONSTRAINT IF EXISTS sessions_auth_user_id_users_id_fk;
    ALTER TABLE IF EXISTS accounts DROP CONSTRAINT IF EXISTS accounts_user_id_users_id_fk;

    DROP TABLE IF EXISTS sessions_auth CASCADE;
    DROP TABLE IF EXISTS accounts CASCADE;
    DROP TABLE IF EXISTS verifications CASCADE;
    DROP TABLE IF EXISTS memberships CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS session CASCADE;
    DROP TABLE IF EXISTS account CASCADE;
    DROP TABLE IF EXISTS verification CASCADE;
    DROP TABLE IF EXISTS "user" CASCADE;

    ALTER TABLE IF EXISTS consulting_sessions
      ALTER COLUMN created_by_id TYPE text USING created_by_id::text;
    ALTER TABLE IF EXISTS diagnostics
      ALTER COLUMN validated_by_id TYPE text USING validated_by_id::text;
  `);

  console.log("Auth tables dropped / columns adjusted");
  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
