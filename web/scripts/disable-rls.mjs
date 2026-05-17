import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const sql = `
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closes DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_config DISABLE ROW LEVEL SECURITY;
`;

const tmp = join(tmpdir(), "disable_rls.sql");
writeFileSync(tmp, sql, "utf-8");

try {
  const r = execSync(`npx supabase@latest db query --linked --file "${tmp}" 2>&1`, {
    encoding: "utf8",
    timeout: 30000,
  });
  console.log(r);
} catch (e) {
  console.log(e.stdout || e.message);
}
