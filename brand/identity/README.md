# Alvora identity kit

Approved system. Do not redraw the A.

- **Display mark:** 01 Canonical Open (Apex Bar)
- **Small mark:** 08 Optical 16 (same 20° skeleton, 14px drawing in 16, stems 3, bar 2, apex 2)
- **Primary** `#0f766e` · **Paper** `#f7f8f6` · **Ink** `#15201c`
- **Word:** Outfit Medium, tracking −0.02em
- **Display / tagline:** Source Serif 4 Regular

Regenerate SVGs: `node brand/identity/generate.mjs`

---

## Files (`svg/`)

| File | Use |
|------|-----|
| `01-apex-bar-master.svg` | Master logo, transparent |
| `01-apex-bar-on-paper.svg` | Light-mode mark |
| `01-apex-bar-on-ink.svg` | Dark-mode mark |
| `01-apex-bar-mono-ink.svg` | One-color ink |
| `01-apex-bar-mono-paper.svg` | Knockout |
| `08-favicon-16.svg` | Tab 16, teal on paper, no tile |
| `08-favicon-32.svg` / `08-favicon-48.svg` | Teal on paper |
| `08-favicon-16-dark.svg` | Dark tab |
| `08-favicon-32-tile.svg` / `08-favicon-48-tile.svg` | Paper A on primary rounded square |
| `08-favicon-180-apple.svg` | Apple touch |
| `lockup-wordmark-light.svg` / `-dark.svg` | Primary lockup |
| `lockup-header-light.svg` / `-dark.svg` | Product nav (24px mark) |
| `lockup-email-light.svg` / `-dark.svg` | Mail header + tagline |
| `avatar-social.svg` | Official account avatar (paper on primary) |
| `avatar-social-on-paper.svg` | Light OG / posts only |
| `avatar-social-on-ink.svg` | Dark avatar |
| `avatar-linkedin.svg` | LinkedIn upload (400×400, circle-safe) |
| `avatar-linkedin-on-ink.svg` | LinkedIn dark field |
| `spec-clear-space.svg` | Clear-space drawing |
| `spec-min-size.svg` | Size floors |

`geometry.json` stores the locked construction numbers.

Lockups use live `Outfit` and `Source Serif 4`. Outline type in a vector app before sending to a vendor who will not have the fonts.

---

## Clear space

Quiet zone = **½ the mark width** on all four sides. No type, rules, or photos inside that box.

---

## Minimum sizes

| Use | Floor |
|-----|--------|
| Mark only | **16px** / **6 mm** |
| Header lockup | Mark **24px** |
| Email lockup | Mark **28px** (32px as drawn) |
| Print lockup | Mark **8 mm** |
| LinkedIn / social | File 400+ / 512; do not display below **32px** |

Below 24px in a header: **mark only**. Never thin the bar.

---

## Export recommendations

| Destination | Source | Export |
|-------------|--------|--------|
| Site / app logo | `01-apex-bar-master.svg` | SVG, currentColor only if you swap fill in CSS |
| Favicon package | `08-favicon-16.svg` + `08-favicon-32-tile.svg` | SVG for modern browsers; PNG 16/32/48 from Optical 16; ICO = 16 + 32 tile |
| Apple touch | `08-favicon-180-apple.svg` | PNG 180×180 |
| Product header | `lockup-header-light.svg` | Inline SVG; dark = header-dark |
| Email | `lockup-email-light.svg` | PNG 480×112 @2x (960×224) for clients that block SVG; keep SVG for internal |
| LinkedIn | `avatar-linkedin.svg` | PNG 400×400, sRGB |
| X / GitHub / Discord | `avatar-social.svg` | PNG 512×512, sRGB |
| OG fallback icon | `avatar-social.svg` or `-on-paper` | PNG 512 |
| Print / merch | `01-apex-bar-mono-ink.svg` | PDF/SVG outlined; one color |
| Dark UI | `01-apex-bar-on-ink.svg` | Paper mark, never primary on ink |

PNG: sRGB, no compression artifacts on the bar, integer scales only (16, 32, 48, 64, 128, 256, 512).

Do not add shadows, gradients, or a second A. Gold is not part of this kit.
