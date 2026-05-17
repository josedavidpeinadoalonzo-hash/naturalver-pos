import pg from "pg";

const cfgs = [
  { label: "user@ref", conn: "postgresql://postgres.trnbgsixswqniiuusgdh:3eKKxj8RnpaKdPwh@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true" },
  { label: "just postgres", conn: "postgresql://postgres:3eKKxj8RnpaKdPwh@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true" },
  { label: "ref as user", conn: "postgresql://trnbgsixswqniiuusgdh:3eKKxj8RnpaKdPwh@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true" },
  { label: "just postgres no ssl", conn: "postgresql://postgres:3eKKxj8RnpaKdPwh@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require" },
  { label: "user@ref no pgbouncer", conn: "postgresql://postgres.trnbgsixswqniiuusgdh:3eKKxj8RnpaKdPwh@aws-0-us-west-1.pooler.supabase.com:5432/postgres" },
];

async function main() {
  for (const cfg of cfgs) {
    try {
      const pool = new pg.Pool({
        connectionString: cfg.conn,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      const r = await pool.query("SELECT 1 AS test");
      console.log("✅", cfg.label, JSON.stringify(r.rows[0]));
      await pool.end();
    } catch (e) {
      console.log("❌", cfg.label, ":", e.message?.slice(0, 100));
    }
  }
}

main().catch((e) => console.error(e.message));
