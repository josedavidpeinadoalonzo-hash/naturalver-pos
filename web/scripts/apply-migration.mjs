import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const sql = readFileSync("supabase/migrations/00003_multi_tenant.sql", "utf8");

const supabase = createClient(
  "https://trnbgsixswqniiuusgdh.supabase.co",
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  const { data, error } = await supabase.rpc("exec_sql", { sql_text: sql });
  if (error) {
    console.error("Migration error:", error.message);
    process.exit(1);
  }
  console.log("Migration applied:", JSON.stringify(data));
}

main();
