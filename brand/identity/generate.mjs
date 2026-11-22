/**
 * Alvora identity kit generator.
 * 01 Canonical Open (display) + 08 Optical 16 (small).
 * No alternate marks.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SVG = join(ROOT, "svg");

const PRIMARY = "#0f766e";
const PAPER = "#f7f8f6";
const INK = "#15201c";

function n(v) {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
}

function buildApexBar({
  thetaDeg,
  stem,
  barH,
  apex,
  height,
  barInsetRatio = 0.1,
  minSideGap = 1,
}) {
  const th = (thetaDeg * Math.PI) / 180;
  const s = Math.sin(th);
  const c = Math.cos(th);
  const L = (height - stem * s) / c;

  const T_L = { x: -apex / 2, y: 0 };
  const T_R = { x: apex / 2, y: 0 };
  const B_Lo = { x: T_L.x - L * s, y: T_L.y + L * c };
  const B_Li = { x: B_Lo.x + stem * c, y: B_Lo.y + stem * s };
  const B_Ro = { x: T_R.x + L * s, y: T_R.y + L * c };
  const B_Ri = { x: B_Ro.x - stem * c, y: B_Ro.y + stem * s };

  const k = (B_Ri.x - B_Li.x) / (2 * s);
  const P = { x: B_Li.x + k * s, y: B_Li.y - k * c };

  const xs = [T_L.x, T_R.x, B_Lo.x, B_Li.x, B_Ro.x, B_Ri.x, P.x];
  const ys = [T_L.y, T_R.y, B_Lo.y, B_Li.y, B_Ro.y, B_Ri.y, P.y];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const innerXAt = (y) => {
    const t = (B_Li.y - y) / (B_Li.y - P.y);
    const xL = B_Li.x + t * (P.x - B_Li.x);
    const xR = B_Ri.x + t * (P.x - B_Ri.x);
    return { xL, xR, width: xR - xL };
  };

  const counterH = B_Li.y - P.y;
  const barCenterY = P.y + counterH * 0.5;
  const barTop = barCenterY - barH / 2;
  const barBot = barCenterY + barH / 2;
  const inner = innerXAt(barTop);
  const inset = Math.max(
    minSideGap,
    Math.min(inner.width * barInsetRatio, inner.width * 0.22),
  );
  const barW = inner.width - 2 * inset;
  const bar = {
    x: inner.xL + inset,
    y: barTop,
    w: Math.max(barW, minSideGap),
    h: barH,
  };

  const stemPath = [
    `M${n(T_L.x)} ${n(T_L.y)}`,
    `L${n(T_R.x)} ${n(T_R.y)}`,
    `L${n(B_Ro.x)} ${n(B_Ro.y)}`,
    `L${n(B_Ri.x)} ${n(B_Ri.y)}`,
    `L${n(P.x)} ${n(P.y)}`,
    `L${n(B_Li.x)} ${n(B_Li.y)}`,
    `L${n(B_Lo.x)} ${n(B_Lo.y)}`,
    "Z",
  ].join(" ");

  return {
    stemPath,
    bar,
    P,
    barCenterY,
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

const DISPLAY = buildApexBar({
  thetaDeg: 20,
  stem: 18,
  barH: 12,
  apex: 6,
  height: 84,
  barInsetRatio: 0.1,
  minSideGap: 1.2,
});

const SMALL = buildApexBar({
  thetaDeg: 20,
  stem: 3,
  barH: 2,
  apex: 2,
  height: 14,
  barInsetRatio: 0.1,
  minSideGap: 0.35,
});

function svgDoc(viewBox, body, { width, height, title } = {}) {
  const w = width ? ` width="${width}"` : "";
  const h = height ? ` height="${height}"` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"${w}${h} viewBox="${viewBox}" fill="none" role="img" aria-labelledby="title">
  <title id="title">${title}</title>
${body}
</svg>
`;
}

function markGroup(geom, fill, { tx = 0, ty = 0, scale = 1 } = {}) {
  const t = `translate(${n(tx)} ${n(ty)}) scale(${n(scale)})`;
  return `  <g transform="${t}" fill="${fill}">
    <path d="${geom.stemPath}"/>
    <rect x="${n(geom.bar.x)}" y="${n(geom.bar.y)}" width="${n(geom.bar.w)}" height="${n(geom.bar.h)}"/>
  </g>`;
}

function placeInBox(geom, box, { fill, pad = 0 } = {}) {
  const inner = box - 2 * pad;
  const scale = inner / Math.max(geom.width, geom.height);
  const tx = pad + (inner - geom.width * scale) / 2 - geom.minX * scale;
  const ty = pad + (inner - geom.height * scale) / 2 - geom.minY * scale;
  return markGroup(geom, fill, { tx, ty, scale });
}

function wordmark({
  canvasW,
  canvasH,
  bg,
  markFill,
  wordFill,
  taglineFill,
  markSize,
  wordSize,
  gap,
  padX,
  padY,
  tagline,
  taglineSize = 14,
  taglineGap = 8,
  title,
}) {
  const geom = DISPLAY;
  const scale = markSize / geom.height;
  const markW = geom.width * scale;
  const markX = padX - geom.minX * scale;
  const markY = padY - geom.minY * scale;
  const wordX = padX + markW + gap;
  const capY = padY + markSize * 0.82;
  const taglineX = wordX;
  const extra = tagline ? taglineSize + taglineGap : 0;

  const body = `  <style>@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@500&amp;family=Source+Serif+4:opsz,wght@8..60,400&amp;display=swap");</style>
${bg ? `  <rect width="${canvasW}" height="${canvasH}" fill="${bg}"/>\n` : ""}${markGroup(geom, markFill, { tx: markX, ty: markY, scale })}
  <text x="${n(wordX)}" y="${n(capY)}" fill="${wordFill}" font-family="Outfit, ui-sans-serif, sans-serif" font-size="${wordSize}" font-weight="500" letter-spacing="-0.02em">Alvora</text>${
    tagline
      ? `
  <text x="${n(taglineX)}" y="${n(padY + markSize + taglineGap + taglineSize * 0.8)}" fill="${taglineFill}" font-family="'Source Serif 4', 'Source Serif 4', 'Source Serif Pro', Georgia, serif" font-size="${taglineSize}" font-weight="400">Prove the AI work you ship.</text>`
      : ""
  }`;

  return svgDoc(`0 0 ${canvasW} ${canvasH}`, body, {
    width: canvasW,
    height: canvasH + extra * 0,
    title,
  });
}

mkdirSync(SVG, { recursive: true });

const files = {};

function write(name, contents) {
  files[name] = contents;
  writeFileSync(join(SVG, name), contents, "utf8");
}

write(
  "01-apex-bar-master.svg",
  svgDoc(
    "0 0 100 100",
    placeInBox(DISPLAY, 100, { fill: PRIMARY, pad: 8 }),
    { width: 512, height: 512, title: "Alvora Apex Bar — 01 Canonical Open" },
  ),
);

write(
  "01-apex-bar-on-paper.svg",
  svgDoc(
    "0 0 100 100",
    `  <rect width="100" height="100" fill="${PAPER}"/>\n${placeInBox(DISPLAY, 100, { fill: PRIMARY, pad: 8 })}`,
    { width: 512, height: 512, title: "Alvora Apex Bar — light field" },
  ),
);

write(
  "01-apex-bar-on-ink.svg",
  svgDoc(
    "0 0 100 100",
    `  <rect width="100" height="100" fill="${INK}"/>\n${placeInBox(DISPLAY, 100, { fill: PAPER, pad: 8 })}`,
    { width: 512, height: 512, title: "Alvora Apex Bar — dark field" },
  ),
);

write(
  "01-apex-bar-mono-ink.svg",
  svgDoc(
    "0 0 100 100",
    placeInBox(DISPLAY, 100, { fill: INK, pad: 8 }),
    { width: 512, height: 512, title: "Alvora Apex Bar — ink" },
  ),
);

write(
  "01-apex-bar-mono-paper.svg",
  svgDoc(
    "0 0 100 100",
    placeInBox(DISPLAY, 100, { fill: PAPER, pad: 8 }),
    { width: 512, height: 512, title: "Alvora Apex Bar — paper (knockout)" },
  ),
);

function faviconBare(size, { fill, bg, title }) {
  const pad = size / 16;
  const body = `${bg ? `  <rect width="${size}" height="${size}" fill="${bg}"/>\n` : ""}${placeInBox(SMALL, size, { fill, pad })}`;
  return svgDoc(`0 0 ${size} ${size}`, body, {
    width: size,
    height: size,
    title,
  });
}

function faviconTile(size, { title }) {
  const rx = (6 / 32) * size;
  const pad = size * (2 / 32);
  const body = `  <rect width="${size}" height="${size}" rx="${n(rx)}" fill="${PRIMARY}"/>
${placeInBox(SMALL, size, { fill: PAPER, pad })}`;
  return svgDoc(`0 0 ${size} ${size}`, body, {
    width: size,
    height: size,
    title,
  });
}

write(
  "08-favicon-16.svg",
  faviconBare(16, {
    fill: PRIMARY,
    bg: PAPER,
    title: "Alvora favicon 16 — Optical 16, teal on paper",
  }),
);
write(
  "08-favicon-32.svg",
  faviconBare(32, {
    fill: PRIMARY,
    bg: PAPER,
    title: "Alvora favicon 32 — Optical 16, teal on paper",
  }),
);
write(
  "08-favicon-48.svg",
  faviconBare(48, {
    fill: PRIMARY,
    bg: PAPER,
    title: "Alvora favicon 48 — Optical 16, teal on paper",
  }),
);
write(
  "08-favicon-16-dark.svg",
  faviconBare(16, {
    fill: PAPER,
    bg: INK,
    title: "Alvora favicon 16 — dark",
  }),
);
write(
  "08-favicon-32-tile.svg",
  faviconTile(32, { title: "Alvora favicon 32 — paper on primary tile" }),
);
write(
  "08-favicon-48-tile.svg",
  faviconTile(48, { title: "Alvora favicon 48 — paper on primary tile" }),
);
write(
  "08-favicon-180-apple.svg",
  faviconTile(180, { title: "Alvora Apple touch icon — paper on primary" }),
);

write(
  "lockup-wordmark-light.svg",
  wordmark({
    canvasW: 280,
    canvasH: 64,
    bg: PAPER,
    markFill: PRIMARY,
    wordFill: INK,
    markSize: 40,
    wordSize: 36,
    gap: 14,
    padX: 24,
    padY: 12,
    title: "Alvora wordmark lockup — light",
  }),
);

write(
  "lockup-wordmark-dark.svg",
  wordmark({
    canvasW: 280,
    canvasH: 64,
    bg: INK,
    markFill: PAPER,
    wordFill: PAPER,
    markSize: 40,
    wordSize: 36,
    gap: 14,
    padX: 24,
    padY: 12,
    title: "Alvora wordmark lockup — dark",
  }),
);

write(
  "lockup-header-light.svg",
  wordmark({
    canvasW: 160,
    canvasH: 32,
    bg: PAPER,
    markFill: PRIMARY,
    wordFill: INK,
    markSize: 24,
    wordSize: 18,
    gap: 10,
    padX: 0,
    padY: 4,
    title: "Alvora header lockup — 24px mark, Outfit 18",
  }),
);

write(
  "lockup-header-dark.svg",
  wordmark({
    canvasW: 160,
    canvasH: 32,
    bg: INK,
    markFill: PAPER,
    wordFill: PAPER,
    markSize: 24,
    wordSize: 18,
    gap: 10,
    padX: 0,
    padY: 4,
    title: "Alvora header lockup — dark",
  }),
);

write(
  "lockup-email-light.svg",
  wordmark({
    canvasW: 480,
    canvasH: 112,
    bg: PAPER,
    markFill: PRIMARY,
    wordFill: INK,
    taglineFill: "#15201cb3",
    markSize: 32,
    wordSize: 20,
    gap: 12,
    padX: 32,
    padY: 28,
    tagline: true,
    taglineSize: 14,
    taglineGap: 8,
    title: "Alvora email header — light",
  }),
);

write(
  "lockup-email-dark.svg",
  wordmark({
    canvasW: 480,
    canvasH: 112,
    bg: INK,
    markFill: PAPER,
    wordFill: PAPER,
    taglineFill: "#f7f8f6b3",
    markSize: 32,
    wordSize: 20,
    gap: 12,
    padX: 32,
    padY: 28,
    tagline: true,
    taglineSize: 14,
    taglineGap: 8,
    title: "Alvora email header — dark",
  }),
);

function avatar({ size, rx, bg, fill, title, widthRatio = 0.56, nudgeY = 0.02 }) {
  const geom = DISPLAY;
  const markW = size * widthRatio;
  const scale = markW / geom.width;
  const markH = geom.height * scale;
  const tx = (size - markW) / 2 - geom.minX * scale;
  const ty = (size - markH) / 2 - geom.minY * scale + size * nudgeY;
  const radius = rx == null ? 0 : rx;
  const body = `  <rect width="${size}" height="${size}" rx="${n(radius)}" fill="${bg}"/>
${markGroup(geom, fill, { tx, ty, scale })}`;
  return svgDoc(`0 0 ${size} ${size}`, body, { width: size, height: size, title });
}

write(
  "avatar-social.svg",
  avatar({
    size: 512,
    rx: 96,
    bg: PRIMARY,
    fill: PAPER,
    title: "Alvora social avatar — paper on primary",
  }),
);
write(
  "avatar-social-on-paper.svg",
  avatar({
    size: 512,
    rx: 96,
    bg: PAPER,
    fill: PRIMARY,
    title: "Alvora social avatar — primary on paper (OG / light posts)",
  }),
);
write(
  "avatar-social-on-ink.svg",
  avatar({
    size: 512,
    rx: 96,
    bg: INK,
    fill: PAPER,
    title: "Alvora social avatar — dark",
  }),
);

write(
  "avatar-linkedin.svg",
  avatar({
    size: 400,
    rx: 0,
    bg: PRIMARY,
    fill: PAPER,
    title: "Alvora LinkedIn profile — square, circle-safe",
  }),
);
write(
  "avatar-linkedin-on-ink.svg",
  avatar({
    size: 400,
    rx: 0,
    bg: INK,
    fill: PAPER,
    title: "Alvora LinkedIn — dark field",
  }),
);

const cs = 0.5;
const gw = DISPLAY.width;
const gh = DISPLAY.height;
const clear = gw * cs;
const specW = gw + 2 * clear + 40;
const specH = gh + 2 * clear + 40;
const ox = 20 + clear - DISPLAY.minX;
const oy = 20 + clear - DISPLAY.minY;
write(
  "spec-clear-space.svg",
  svgDoc(
    `0 0 ${n(specW)} ${n(specH)}`,
    `  <rect width="${n(specW)}" height="${n(specH)}" fill="${PAPER}"/>
  <rect x="20" y="20" width="${n(gw + 2 * clear)}" height="${n(gh + 2 * clear)}" fill="none" stroke="${INK}" stroke-opacity="0.18" stroke-dasharray="4 3"/>
  <rect x="${n(20 + clear)}" y="${n(20 + clear)}" width="${n(gw)}" height="${n(gh)}" fill="none" stroke="${INK}" stroke-opacity="0.28"/>
${markGroup(DISPLAY, PRIMARY, { tx: ox, ty: oy, scale: 1 })}
  <text x="${n(specW / 2)}" y="${n(specH - 8)}" text-anchor="middle" fill="${INK}" font-family="Outfit, ui-sans-serif, sans-serif" font-size="8" font-weight="400">Clear space = ½ mark width on every side</text>`,
    { width: 512, height: 512, title: "Alvora Apex Bar — clear space" },
  ),
);

write(
  "spec-min-size.svg",
  svgDoc(
    "0 0 360 80",
    `  <rect width="360" height="80" fill="${PAPER}"/>
  <g transform="translate(24 32)">
${placeInBox(SMALL, 16, { fill: PRIMARY, pad: 1 })}
  </g>
  <g transform="translate(56 28)">
${placeInBox(SMALL, 24, { fill: PRIMARY, pad: 1.5 })}
  </g>
  <g transform="translate(96 24)">
${placeInBox(SMALL, 32, { fill: PRIMARY, pad: 2 })}
  </g>
  <text x="24" y="68" fill="${INK}" font-family="Outfit, ui-sans-serif, sans-serif" font-size="8">16px floor — mark only</text>
  <text x="150" y="40" fill="${INK}" font-family="Outfit, ui-sans-serif, sans-serif" font-size="8">24px floor — header lockup</text>`,
    { width: 360, height: 80, title: "Alvora minimum sizes" },
  ),
);

writeFileSync(
  join(ROOT, "geometry.json"),
  JSON.stringify(
    {
      display: {
        id: "01-canonical-open",
        thetaDeg: 20,
        stem: 18,
        barH: 12,
        apex: 6,
        height: 84,
        barCenterY: DISPLAY.barCenterY,
        barInsetRatio: 0.1,
        bbox: {
          minX: DISPLAY.minX,
          minY: DISPLAY.minY,
          width: DISPLAY.width,
          height: DISPLAY.height,
        },
        bar: DISPLAY.bar,
      },
      optical16: {
        id: "08-optical-16",
        thetaDeg: 20,
        stem: 3,
        barH: 2,
        apex: 2,
        height: 14,
        barCenterY: SMALL.barCenterY,
        barInsetRatio: 0.1,
        bbox: {
          minX: SMALL.minX,
          minY: SMALL.minY,
          width: SMALL.width,
          height: SMALL.height,
        },
        bar: SMALL.bar,
      },
    },
    null,
    2,
  ),
  "utf8",
);

const previewItems = Object.keys(files).map(
  (name) => `    <figure>
      <img src="svg/${name}" alt="${name}"/>
      <figcaption>${name}</figcaption>
    </figure>`,
);

writeFileSync(
  join(ROOT, "preview.html"),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Alvora identity kit</title>
  <style>
    body { margin: 0; font-family: Outfit, ui-sans-serif, sans-serif; background: #d8dbd6; color: ${INK}; }
    h1 { font-weight: 500; font-size: 18px; margin: 0; }
    header { padding: 24px 32px; background: ${PAPER}; }
    p { margin: 8px 0 0; font-size: 13px; }
    main { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; padding: 24px; }
    figure { margin: 0; background: ${PAPER}; padding: 16px; }
    figcaption { font-size: 11px; margin-top: 12px; word-break: break-all; }
    .native { display: flex; gap: 24px; align-items: end; padding: 16px 32px 32px; background: ${PAPER}; }
    .native figure { margin: 0; padding: 0; background: transparent; }
    .native img { width: auto; height: auto; image-rendering: pixelated; }
    img { display: block; width: 100%; height: 180px; object-fit: contain; background:
      linear-gradient(45deg, #eceee9 25%, transparent 25%),
      linear-gradient(-45deg, #eceee9 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #eceee9 75%),
      linear-gradient(-45deg, transparent 75%, #eceee9 75%);
      background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0; }
  </style>
</head>
<body>
  <header>
    <h1>Alvora identity kit</h1>
    <p>01 Canonical Open · 08 Optical 16 · Primary ${PRIMARY} · Paper ${PAPER} · Ink ${INK}</p>
  </header>
  <section class="native">
    <figure><img src="svg/08-favicon-16.svg" width="16" height="16" alt="16"/><figcaption>16px</figcaption></figure>
    <figure><img src="svg/08-favicon-32.svg" width="32" height="32" alt="32"/><figcaption>32px</figcaption></figure>
    <figure><img src="svg/08-favicon-48.svg" width="48" height="48" alt="48"/><figcaption>48px</figcaption></figure>
    <figure><img src="svg/08-favicon-32-tile.svg" width="32" height="32" alt="32 tile"/><figcaption>32 tile</figcaption></figure>
    <figure><img src="svg/lockup-header-light.svg" height="32" alt="header"/><figcaption>header 32h</figcaption></figure>
  </section>
  <main>
${previewItems.join("\n")}
  </main>
</body>
</html>
`,
  "utf8",
);

console.log(`Wrote ${Object.keys(files).length} SVGs to ${SVG}`);
