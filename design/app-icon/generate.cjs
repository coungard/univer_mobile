/**
 * Generates the app icon (issue #79, concept 02 «Монограмма U») for iOS and Android from one
 * definition: a Lora Bold «U» converted to outlines plus the five-colour «Library» spine strip.
 *
 * Needs three packages that are deliberately NOT project dependencies — install them anywhere and
 * point NODE_PATH there:
 *
 *   npm i --prefix /tmp/icon-deps @resvg/resvg-js@2.6.2 opentype.js@1.3.4 pngjs@7.0.0
 *   NODE_PATH=/tmp/icon-deps/node_modules node design/app-icon/generate.cjs
 *
 * Re-run after changing anything below; it overwrites every generated file (listed in README.md).
 */
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '../..');
const out = (...p) => path.join(ROOT, ...p);

// Palettes from src/theme/library.ts (light) and the dark «Переплёт» theme (#62).
const THEMES = {
  light: { bg: '#F8F1E7', ink: '#271D17', strip: ['#742F25', '#C5953B', '#295233', '#924D35', '#114054'] },
  dark: { bg: '#1E1814', ink: '#F3EBE0', strip: ['#B4533F', '#D4A64E', '#4E8A5C', '#B56A4C', '#2F6F8C'] },
  // iOS «tinted» icon: grayscale, the system maps luminance onto the user's tint colour.
  tinted: { bg: '#000000', ink: '#FFFFFF', strip: ['#8C8C8C', '#D6D6D6', '#7A7A7A', '#A8A8A8', '#666666'] },
};

// --- Geometry, in a 100×100 design space (the canvas artboards use the same numbers) ---
const font = opentype.loadSync(out('assets/fonts/Lora-Bold.ttf'));
const GLYPH_SIZE = 62;
const BASELINE = 68;
const probe = font.getPath('U', 0, 0, GLYPH_SIZE).getBoundingBox();
const glyphX = 50 - (probe.x1 + probe.x2) / 2;
const U_PATH = font.getPath('U', glyphX, BASELINE, GLYPH_SIZE).toPathData(2);

const STRIP = { x: 27.5, y: 76, w: 9, h: 5 };
const stripRects = (colors) =>
  colors.map((fill, i) => ({ fill, x: STRIP.x + i * STRIP.w, y: STRIP.y, w: STRIP.w, h: STRIP.h }));

const glyphSvg = (t) =>
  [`<path fill="${t.ink}" d="${U_PATH}"/>`]
    .concat(stripRects(t.strip).map((r) => `<rect fill="${r.fill}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`))
    .join('\n  ');

/** Full-bleed square (iOS: the system applies the corner mask itself). */
const squareSvg = (t, px = 1024) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100">
  <rect fill="${t.bg}" width="100" height="100"/>
  ${glyphSvg(t)}
</svg>
`;

/** Legacy Android launcher PNG (API 24–25): rounded square or circle on transparent. */
const legacySvg = (t, px, round) => {
  const clip = round ? '<circle cx="50" cy="50" r="48"/>' : '<rect x="2" y="2" width="96" height="96" rx="18"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100">
  <defs><clipPath id="m">${clip}</clipPath></defs>
  <g clip-path="url(#m)">
  <rect fill="${t.bg}" width="100" height="100"/>
  <g transform="translate(50 50) scale(0.9) translate(-50 -50)">
  ${glyphSvg(t)}
  </g>
  </g>
</svg>
`;
};

const render = (svg) => new Resvg(svg, { font: { loadSystemFonts: false } }).render();

function writePng(file, svg, { opaque = false } = {}) {
  const img = render(svg);
  const png = new PNG({ width: img.width, height: img.height });
  png.data = Buffer.from(img.pixels);
  // App Store icons must not have an alpha channel.
  const buf = PNG.sync.write(png, opaque ? { colorType: 2 } : {});
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

// --- Sources ---
for (const [name, t] of Object.entries(THEMES)) {
  writeText(out('design/app-icon', name === 'light' ? 'icon.svg' : `icon-${name}.svg`), squareSvg(t));
}

// --- iOS: single-size 1024 icon with dark and tinted appearances (Xcode 16+) ---
const iosDir = out('ios/univer_mobile/Images.xcassets/AppIcon.appiconset');
writePng(path.join(iosDir, 'AppIcon.png'), squareSvg(THEMES.light), { opaque: true });
writePng(path.join(iosDir, 'AppIcon-Dark.png'), squareSvg(THEMES.dark), { opaque: true });
writePng(path.join(iosDir, 'AppIcon-Tinted.png'), squareSvg(THEMES.tinted), { opaque: true });
writeText(
  path.join(iosDir, 'Contents.json'),
  JSON.stringify(
    {
      images: [
        { filename: 'AppIcon.png', idiom: 'universal', platform: 'ios', size: '1024x1024' },
        {
          appearances: [{ appearance: 'luminosity', value: 'dark' }],
          filename: 'AppIcon-Dark.png',
          idiom: 'universal',
          platform: 'ios',
          size: '1024x1024',
        },
        {
          appearances: [{ appearance: 'luminosity', value: 'tinted' }],
          filename: 'AppIcon-Tinted.png',
          idiom: 'universal',
          platform: 'ios',
          size: '1024x1024',
        },
      ],
      info: { author: 'xcode', version: 1 },
    },
    null,
    2,
  ) + '\n',
);

// --- Android: adaptive icon (API 26+) ---
// The 100-unit design is mapped onto the visible 72 dp of the 108 dp canvas (offset 18 dp), so the
// glyph and strip stay inside the 66 dp safe circle under every launcher mask.
const res = out('android/app/src/main/res');
const vector = (paths) => `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by design/app-icon/generate.cjs (issue #79). Do not edit by hand. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
  <group
      android:scaleX="0.72"
      android:scaleY="0.72"
      android:translateX="18"
      android:translateY="18">
${paths.map((p) => `    <path android:fillColor="${p.fill}" android:pathData="${p.d}" />`).join('\n')}
  </group>
</vector>
`;
const rectPath = (r) => `M${r.x},${r.y}h${r.w}v${r.h}h-${r.w}z`;
const fgPaths = (t) => [{ fill: t.ink, d: U_PATH }].concat(stripRects(t.strip).map((r) => ({ fill: r.fill, d: rectPath(r) })));

writeText(path.join(res, 'drawable/ic_launcher_foreground.xml'), vector(fgPaths(THEMES.light)));
// Themed icons (Android 13+): the launcher uses only the alpha of this layer.
writeText(
  path.join(res, 'drawable/ic_launcher_monochrome.xml'),
  vector(fgPaths({ ink: '#FF000000', strip: Array(5).fill('#FF000000') })),
);
writeText(
  path.join(res, 'values/ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${THEMES.light.bg}</color>
</resources>
`,
);
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />
</adaptive-icon>
`;
writeText(path.join(res, 'mipmap-anydpi-v26/ic_launcher.xml'), adaptive);
writeText(path.join(res, 'mipmap-anydpi-v26/ic_launcher_round.xml'), adaptive);

// --- Android: legacy PNGs for API 24–25 ---
const DENSITIES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [density, px] of Object.entries(DENSITIES)) {
  writePng(path.join(res, `mipmap-${density}/ic_launcher.png`), legacySvg(THEMES.light, px, false));
  writePng(path.join(res, `mipmap-${density}/ic_launcher_round.png`), legacySvg(THEMES.light, px, true));
}

console.log('App icon generated.');
