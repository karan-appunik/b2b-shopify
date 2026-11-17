// Runs the storefront logic tests (stock, price changes, reorder, exceptions).
// They compile the app's TypeScript on the fly and need no database or Shopify.
//
//   node tests/run-all.cjs

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "logic");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.cjs")).sort();

let passed = 0;
let failed = 0;

for (const file of files) {
  const run = spawnSync(process.execPath, [path.join(dir, file)], { encoding: "utf8", timeout: 300000 });
  const out = (run.stdout || "") + (run.stderr || "");
  const m = out.match(/(\d+) passed, (\d+) failed/);
  const p = m ? Number(m[1]) : 0;
  const f = m ? Number(m[2]) : 1;
  passed += p;
  failed += f;
  console.log(`${f ? "FAIL" : "ok  "} ${file.padEnd(28)} ${m ? `${p} passed, ${f} failed` : "did not finish"}`);
  if (f || !m) console.log(out.split("\n").filter((l) => /^FAIL|Error/.test(l)).slice(0, 10).join("\n"));
}

console.log(`\n${files.length} files, ${passed} checks passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
