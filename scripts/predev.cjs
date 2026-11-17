// Runs before `shopify app dev` (see shopify.web.toml). On Windows a dev server
// left running in the background keeps Prisma's query engine file open, so
// `prisma generate` cannot replace it and fails with EPERM — and the dev
// server then never starts. This stops any such leftover process first, and
// carries on if the client is already generated.
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function stopStaleDevServers() {
  if (process.platform !== "win32") return;
  const script =
    "Get-Process node -ErrorAction SilentlyContinue | ForEach-Object { " +
    "$holds = $false; " +
    "try { $holds = [bool]($_.Modules | Where-Object { $_.FileName -like '*query_engine*' }) } catch {} " +
    "if ($holds -and $_.Id -ne " + process.pid + ") { 'Stopping leftover dev server (PID ' + $_.Id + ')'; Stop-Process -Id $_.Id -Force } }";
  const res = spawnSync("powershell", ["-NoProfile", "-Command", script], { encoding: "utf8" });
  if (res.stdout && res.stdout.trim()) console.log(res.stdout.trim());
}

function generate() {
  return spawnSync("npm", ["exec", "prisma", "generate"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  }).status;
}

stopStaleDevServers();

let status = generate();
if (status !== 0) {
  // The engine file can stay locked for a moment after its process stops.
  spawnSync(process.platform === "win32" ? "timeout" : "sleep", process.platform === "win32" ? ["/t", "2", "/nobreak"] : ["2"], { shell: true, stdio: "ignore" });
  status = generate();
}

if (status !== 0) {
  const generated = fs.existsSync(path.join(root, "node_modules", ".prisma", "client", "index.js"));
  if (generated) {
    console.warn("\n[predev] prisma generate failed, using the already generated client. Re-run it if prisma/schema.prisma changed.\n");
    process.exit(0);
  }
  process.exit(status || 1);
}
