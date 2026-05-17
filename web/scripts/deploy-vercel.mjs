import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_NAME = "naturalver-web";
const SUPABASE_URL = "https://trnbgsixswqniiuusgdh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ksD86pmMmX6K6lkCe93TAQ_mK-YtA6H";

if (!TOKEN) {
  console.error("Missing VERCEL_TOKEN env");
  process.exit(1);
}

const API = "https://api.vercel.com";
const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

async function api(path, options = {}) {
  const url = `${API}${path}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

async function main() {
  // 1. Project
  console.log("Setting up project...");
  let projectId;
  try {
    const p = await api(`/v9/projects?name=${PROJECT_NAME}`);
    projectId = p.projects?.[0]?.id;
  } catch {}
  
  if (!projectId) {
    const created = await api("/v9/projects", {
      method: "POST",
      body: JSON.stringify({ name: PROJECT_NAME, framework: "nextjs" }),
    });
    projectId = created.id;
    console.log("Created project:", projectId);
  } else {
    console.log("Found project:", projectId);
  }

  // 2. Env vars
  console.log("Setting env vars...");
  for (const { key, value } of [
    { key: "NEXT_PUBLIC_SUPABASE_URL", value: SUPABASE_URL },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: SUPABASE_ANON_KEY },
  ]) {
    try {
      await api(`/v10/projects/${projectId}/env`, {
        method: "POST",
        body: JSON.stringify({
          type: "encrypted",
          key,
          value,
          target: ["production", "preview", "development"],
        }),
      });
    } catch (e) {
      console.log(`  ${key}: already set or error`);
    }
  }

  // 3. Collect source files (exclude build output, node_modules etc.)
  console.log("Collecting source files...");
  const ignoreNames = new Set([
    ".next", "node_modules", ".git", "deploy.tar",
    ".env", ".env.local", ".env.production",
  ]);
  const ignoreTop = new Set(["scripts"]);
  const sourceFiles = [];

  function walk(dir, prefix = "") {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = entry.name;
      const rel = prefix ? `${prefix}/${name}` : name;
      if (ignoreNames.has(name)) continue;
      if (!prefix && ignoreTop.has(name)) continue;
      if (name.startsWith(".") && name !== ".eslintrc.json") continue;
      if (name === "node_modules" && entry.isDirectory()) continue;
      if (entry.isDirectory()) walk(path.join(dir, name), rel);
      else sourceFiles.push(rel);
    }
  }
  walk(process.cwd());
  console.log(`  ${sourceFiles.length} source files`);

  // 4. Deploy
  console.log("Creating deployment...");
  const body = {
    name: PROJECT_NAME,
    target: "production",
    files: sourceFiles.map((f) => ({
      file: f,
      data: fs.readFileSync(path.join(process.cwd(), f), "base64"),
      encoding: "base64",
    })),
    projectSettings: {
      framework: "nextjs",
      buildCommand: "next build",
      outputDirectory: ".next",
      installCommand: "npm install",
    },
  };

  const deploy = await api(`/v13/deployments?projectId=${projectId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  console.log("\n✅ Deployed!");
  console.log("   Preview:", `https://${deploy.url}`);
  console.log("   Production:", deploy.alias?.[0] ? `https://${deploy.alias[0]}` : "pending alias...");
  console.log("   Inspect:", deploy.inspectorUrl);
}

main().catch((err) => {
  console.error("Deploy failed:", err.message);
  process.exit(1);
});
