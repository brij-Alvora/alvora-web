import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rasterDir = join(root, "scripts/.raster");
mkdirSync(rasterDir, { recursive: true });

const fontPath = join(rasterDir, "Outfit-Medium.ttf");
if (!existsSync(fontPath)) {
  const res = await fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/outfit@5.2.5/latin-500-normal.ttf",
  );
  if (!res.ok) throw new Error(`Outfit download failed: ${res.status}`);
  writeFileSync(fontPath, Buffer.from(await res.arrayBuffer()));
}

const { Resvg } = require("./.raster/node_modules/@resvg/resvg-js");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f766e"/>
  <g transform="translate(430 189) scale(3)">
    <path fill="#f7f8f6" d="M-3 0 L3 0 L31.333 77.844 L14.418 84 L0 44.386 L-14.418 84 L-31.333 77.844 Z"/>
    <rect fill="#f7f8f6" x="-3.825" y="58.193" width="7.651" height="12"/>
  </g>
  <text x="556" y="348" fill="#f7f8f6" font-family="Outfit" font-size="92" font-weight="500" letter-spacing="-1.84">Alvora</text>
</svg>
`;

writeFileSync(join(root, "public/brand/og.svg"), svg);
const png = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
  font: {
    fontFiles: [fontPath],
    defaultFontFamily: "Outfit",
    loadSystemFonts: false,
  },
}).render().asPng();
writeFileSync(join(root, "public/brand/og.png"), png);
console.log("wrote public/brand/og.png");
