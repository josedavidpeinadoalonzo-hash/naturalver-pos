const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const TOKEN = process.env.VERCEL_TOKEN || process.argv[2];
const PROJECT_NAME = "naturalver-web";
const SUPABASE_URL = "https://trnbgsixswqniiuusgdh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ksD86pmMmX6K6lkCe93TAQ_mK-YtA6H";

if (!TOKEN) {
  console.error("Missing VERCEL_TOKEN");
  process.exit(1);
}

async function main() {
  // 1. Find or create project
  console.log("Setting up project...");

  const projectRes = await fetch(
    `https://api.vercel.com/v9/projects?name=${PROJECT_NAME}`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const projects = await projectRes.json();
  let projectId;

  if (projects.projects?.length > 0) {
    projectId = projects.projects[0].id;
    console.log("Found existing project:", projectId);
  } else {
    console.log("Creating new project...");
    const createRes = await fetch("https://api.vercel.com/v9/projects", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: PROJECT_NAME, framework: "nextjs" }),
    });
    const created = await createRes.json();
    projectId = created.id;
    console.log("Created project:", projectId);
  }

  // 2. Set environment variables
  console.log("Setting environment variables...");
  const envVars = [
    { key: "NEXT_PUBLIC_SUPABASE_URL", value: SUPABASE_URL, target: ["production", "preview", "development"] },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: SUPABASE_ANON_KEY, target: ["production", "preview", "development"] },
  ];

  for (const env of envVars) {
    await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/env`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "encrypted",
          key: env.key,
          value: env.value,
          target: env.target,
        }),
      }
    );
  }

  // 3. Create deployment
  console.log("Creating deployment...");
  const publicDir = path.join(__dirname, "..", ".next");
  if (!fs.existsSync(publicDir)) {
    console.log("Building first...");
    execSync("npm run build", { cwd: path.join(__dirname, ".."), stdio: "inherit" });
  }

  // Read project files and create tar
  const tar = require("tar");
  const tarPath = path.join(__dirname, "..", "deploy.tar");

  await tar.c(
    {
      file: tarPath,
      cwd: path.join(__dirname, ".."),
      portable: true,
      gzip: true,
    },
    [
      "package.json",
      "package-lock.json",
      "next.config.mjs",
      "tsconfig.json",
      "tailwind.config.ts",
      "postcss.config.mjs",
      ".eslintrc.json",
      "public/",
      "src/",
      ".next/",
    ]
  );

  const tarStream = fs.createReadStream(tarPath);
  const deployRes = await fetch(
    `https://api.vercel.com/v13/deployments?projectId=${projectId}&forceNew=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/x-tar",
      },
      body: tarStream,
    }
  );

  const deployment = await deployRes.json();
  console.log("\nDeployment result:", JSON.stringify(deployment, null, 2));

  if (deployment.url) {
    console.log("\n✅ Deployed to:", deployment.url);
    console.log("   Production: https://" + deployment.alias?.[0] || deployment.url);
  }

  // Clean up
  fs.unlinkSync(tarPath);
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
