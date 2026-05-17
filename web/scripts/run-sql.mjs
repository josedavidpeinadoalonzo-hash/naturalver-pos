import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql_path = join(__dirname, "..", "supabase", "migrations", "00001_initial_schema.sql");
const seed_path = join(__dirname, "..", "supabase", "seed.sql");

async function main() {
  const { default: pg } = await import("pg");

  const configs = [
    {
      label: "direct",
      conn: "postgresql://postgres:3eKKxj8RnpaKdPwh@db.trnbgsixswqniiuusgdh.supabase.co:5432/postgres",
    },
    {
      label: "pooler-us-west",
      conn: "postgresql://postgres.trnbgsixswqniiuusgdh:3eKKxj8RnpaKdPwh@aws-0-us-west-1.pooler.supabase.com:5432/postgres",
    },
    {
      label: "pooler-us-east",
      conn: "postgresql://postgres.trnbgsixswqniiuusgdh:3eKKxj8RnpaKdPwh@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    },
  ];

  for (const cfg of configs) {
    console.log(`Trying ${cfg.label}...`);
    try {
      const pool = new pg.Pool({
        connectionString: cfg.conn,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      const r = await pool.query("SELECT 1 AS test");
      console.log(`✅ ${cfg.label} connected:`, r.rows[0]);

      // Run migration
      console.log("Running migration...");
      const migration = readFileSync(sql_path, "utf-8");
      await pool.query(migration);
      console.log("✅ Migration done!");

      // Run seed
      console.log("Running seed data...");
      const seed = readFileSync(seed_path, "utf-8");
      await pool.query(seed);
      console.log("✅ Seed done!");

      await pool.end();
      return;
    } catch (e) {
      console.log(`  ${cfg.label} failed:`, e.message?.slice(0, 120));
    }
  }

  console.log("\n❌ Could not connect via any method.");
  console.log("Please run the SQL manually in the Supabase dashboard SQL Editor.");
}

main().catch((e) => console.error("Error:", e.message));
