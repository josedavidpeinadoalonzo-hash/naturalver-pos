import { readFileSync } from "fs";
const sql = readFileSync("supabase/migrations/00003_multi_tenant.sql", "utf8");

async function main() {
  const res = await fetch(
    "https://api.supabase.com/v1/projects/trnbgsixswqniiuusgdh/database/query",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const text = await res.text();
  if (!res.ok) {
    console.error("Error:", res.status, text);
    process.exit(1);
  }
  console.log("Migration applied:", text);
}

main();
