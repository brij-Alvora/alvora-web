import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(".env.local");
let text = "";
try {
  text = readFileSync(path, "utf8");
} catch {
  console.log("FAIL missing .env.local");
  process.exit(1);
}

if (/^ADMIN_MFA_REQUIRED=/m.test(text)) {
  text = text.replace(/^ADMIN_MFA_REQUIRED=.*$/m, "ADMIN_MFA_REQUIRED=true");
} else {
  text = `${text.trimEnd()}\nADMIN_MFA_REQUIRED=true\n`;
}

writeFileSync(path, text);
console.log("ADMIN_MFA_REQUIRED=true");
