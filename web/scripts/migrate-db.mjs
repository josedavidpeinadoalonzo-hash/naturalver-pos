import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const password = "AHqXBWTupMShcjlE";
const ref = "trnbgsixswqniiuusgdh";

const regions = [
  "us-west-1","us-east-1","us-west-2","eu-west-1","eu-central-1",
  "ap-southeast-1","ap-southeast-2","ap-northeast-1","ap-northeast-2",
  "ap-south-1","sa-east-1","ca-central-1","eu-west-2","eu-west-3",
  "me-central-1","af-south-1",
];

async function main() {
  const configs = regions.map(r => ({
    label: `pooler-${r}`,
    conn: `postgresql://postgres.${ref}:${password}@aws-0-${r}.pooler.supabase.com:5432/postgres`
  }));

  for (const cfg of configs) {
    try {
      const pool = new pg.Pool({
        connectionString: cfg.conn,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      const r = await pool.query("SELECT 1 AS test");
      console.log(`✅ ${cfg.label} connected:`, JSON.stringify(r.rows[0]));

      const migration = readFileSync(join(root, "supabase", "migrations", "00001_initial_schema.sql"), "utf-8");
      await pool.query(migration);
      console.log("✅ Migration done!");

      try {
        const seed = readFileSync(join(root, "supabase", "seed.sql"), "utf-8");
        await pool.query(seed);
        console.log("✅ Seed done!");
      } catch (e) {
        console.log("⚠️ Seed:", e.message?.slice(0, 80));
      }

      await pool.end();
      return;
    } catch (e) {
      // skip, try next
    }
  }

  console.log("❌ No pooler region worked.");
  console.log("Trying direct (IPv6)...");
  try {
    const ipv6 = "2600:1f16:1ce4:1c01:1440:8c70:b20c:bed7";
    const pool = new pg.Pool({
      connectionString: `postgresql://postgres:${password}@[${ipv6}]:5432/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    const r = await pool.query("SELECT 1");
    console.log("✅ Direct IPv6:", JSON.stringify(r.rows[0]));
    const migration = readFileSync(join(root, "supabase", "migrations", "00001_initial_schema.sql"), "utf-8");
    await pool.query(migration);
    console.log("✅ Done!");
    await pool.end();
  } catch (e) {
    console.log("❌ Direct IPv6:", e.message?.slice(0, 80));
  }
}

main().catch((e) => console.error("Error:", e.message));
