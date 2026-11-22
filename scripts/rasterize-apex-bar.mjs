import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { Resvg } = require("./.raster/node_modules/@resvg/resvg-js");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/brand/apex-bar.svg"));
const resvg = new Resvg(svg, {
  fitTo: { mode: "height", value: 64 },
  background: "rgba(0,0,0,0)",
});
writeFileSync(join(root, "public/brand/apex-bar.png"), resvg.render().asPng());
console.log("wrote public/brand/apex-bar.png");
