// 生成示例占位图：6 张作品图 + 1 张头像（纯本地生成，无网络依赖）
// 用法：node scripts/make-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const worksDir = join(root, "public", "images", "works");
const imgDir = join(root, "public", "images");
mkdirSync(worksDir, { recursive: true });

const W = 960;
const H = 640;

// 确定性伪随机
const rand = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// 四角星路径
function sparkle(x, y, s, fill, op = 1) {
  const d =
    `M${x} ${y - s} C ${x + s * 0.08} ${y - s * 0.25}, ${x + s * 0.25} ${y - s * 0.08}, ${x + s} ${y} ` +
    `C ${x + s * 0.25} ${y + s * 0.08}, ${x + s * 0.08} ${y + s * 0.25}, ${x} ${y + s} ` +
    `C ${x - s * 0.08} ${y + s * 0.25}, ${x - s * 0.25} ${y + s * 0.08}, ${x - s} ${y} ` +
    `C ${x - s * 0.25} ${y - s * 0.08}, ${x - s * 0.08} ${y - s * 0.25}, ${x} ${y - s} Z`;
  return `<path d="${d}" fill="${fill}" fill-opacity="${op}"/>`;
}

function stars(seed, n, colors, yMax = H) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = rand(seed + i * 2) * W;
    const y = rand(seed + i * 2 + 1) * yMax;
    const r = 0.6 + rand(seed + i * 3 + 5) * 1.6;
    const c = colors[Math.floor(rand(seed + i * 5 + 7) * colors.length)];
    const op = 0.25 + rand(seed + i * 7 + 9) * 0.65;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${c}" fill-opacity="${op.toFixed(2)}"/>`;
  }
  return out;
}

function base(id, a, b, glow) {
  return `<defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
    <radialGradient id="glow${id}" cx="0.75" cy="0.2" r="0.9">
      <stop offset="0" stop-color="${glow}" stop-opacity="0.35"/>
      <stop offset="0.6" stop-color="${glow}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="42"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg${id})"/>
  <rect width="${W}" height="${H}" fill="url(#glow${id})"/>`;
}

const starColors = ["#e9ecff", "#f5d9a0", "#a0b4ff"];

const pieces = {
  "star-trails": {
    a: "#0b1030",
    b: "#05060f",
    glow: "#8ea2ff",
    extra: () => {
      let s = "";
      for (let i = 0; i < 5; i++) {
        s += `<circle cx="480" cy="250" r="${90 + i * 42}" fill="none" stroke="#8ea2ff" stroke-opacity="${(0.34 - i * 0.05).toFixed(2)}" stroke-width="1.2" stroke-dasharray="2 11"/>`;
      }
      s += sparkle(480, 250, 26, "#e9ecff", 0.95);
      s += sparkle(700, 120, 12, "#f5d9a0", 0.9);
      s += sparkle(200, 420, 10, "#a0b4ff", 0.85);
      return s;
    },
  },
  "floating-garden": {
    a: "#160b2e",
    b: "#07040f",
    glow: "#b39dff",
    extra: () => {
      let s = "";
      s += `<circle cx="300" cy="300" r="90" fill="#b39dff" fill-opacity="0.3" filter="url(#blurfg)"/>`;
      s += `<circle cx="680" cy="420" r="70" fill="#8ea2ff" fill-opacity="0.3" filter="url(#blurfg)"/>`;
      s += `<ellipse cx="480" cy="560" rx="230" ry="34" fill="#1c1140"/>`;
      s += `<ellipse cx="480" cy="548" rx="150" ry="22" fill="#2a1b5e"/>`;
      s += sparkle(480, 500, 34, "#f5d9a0", 0.95);
      s += sparkle(640, 250, 14, "#e9ecff", 0.9);
      s += sparkle(250, 180, 11, "#b39dff", 0.9);
      return s;
    },
  },
  midnight: {
    a: "#0a0d1f",
    b: "#05060d",
    glow: "#ffb35c",
    extra: () => {
      let s = "";
      s += `<polygon points="360,320 600,320 720,640 240,640" fill="#ffffff" fill-opacity="0.05"/>`;
      s += `<rect x="360" y="300" width="240" height="20" fill="#ffb35c" fill-opacity="0.9"/>`;
      s += `<rect x="360" y="300" width="240" height="20" fill="#ffb35c" filter="url(#blurmd)"/>`;
      s += `<rect x="330" y="320" width="300" height="160" fill="#141a33"/>`;
      s += `<rect x="352" y="336" width="70" height="90" fill="#f5d9a0" fill-opacity="0.65"/>`;
      s += `<rect x="438" y="336" width="70" height="90" fill="#f5d9a0" fill-opacity="0.45"/>`;
      s += `<rect x="524" y="336" width="70" height="90" fill="#8ea2ff" fill-opacity="0.35"/>`;
      return s;
    },
  },
  type: {
    a: "#0d0d16",
    b: "#07070d",
    glow: "#f5d9a0",
    extra: () => {
      let s = `<text x="480" y="430" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="280" fill="#f5d9a0" fill-opacity="0.85">浮</text>`;
      s += sparkle(700, 190, 16, "#e9ecff", 0.9);
      s += sparkle(260, 160, 12, "#f5d9a0", 0.85);
      s += sparkle(760, 480, 10, "#8ea2ff", 0.85);
      return s;
    },
  },
  "pixel-sea": {
    a: "#071022",
    b: "#04070f",
    glow: "#f5d9a0",
    extra: () => {
      let s = `<circle cx="480" cy="300" r="90" fill="#f5d9a0" fill-opacity="0.85"/>`;
      s += `<circle cx="480" cy="300" r="130" fill="#f5d9a0" fill-opacity="0.15" filter="url(#blurpx)"/>`;
      const palette = ["#12335c", "#1b4a7e", "#6fd3ff", "#f5d9a0"];
      for (let row = 0; row < 14; row++) {
        const y = 340 + row * 22;
        for (let col = 0; col < 24; col++) {
          const v = rand(row * 31 + col * 7 + 3);
          const c = v < 0.55 ? palette[0] : v < 0.8 ? palette[1] : v < 0.94 ? palette[2] : palette[3];
          const op = (0.25 + (row / 14) * 0.6).toFixed(2);
          s += `<rect x="${col * 40}" y="${y}" width="36" height="18" fill="${c}" fill-opacity="${op}"/>`;
        }
      }
      return s;
    },
  },
  fog: {
    a: "#0a0e18",
    b: "#060810",
    glow: "#c9d4f5",
    extra: () => {
      let s = "";
      for (let i = 0; i < 4; i++) {
        s += `<ellipse cx="${300 + i * 120}" cy="${180 + i * 90}" rx="${260 - i * 20}" ry="46" fill="#c9d4f5" fill-opacity="${(0.12 - i * 0.02).toFixed(2)}" filter="url(#blurfg2)"/>`;
      }
      s += `<path d="M360 560 L480 470 L600 560 Z" fill="#131a2c"/>`;
      s += `<ellipse cx="480" cy="566" rx="190" ry="22" fill="#0d1322"/>`;
      s += sparkle(480, 430, 18, "#e9ecff", 0.9);
      return s;
    },
  },
};

let n = 0;
for (const [name, p] of Object.entries(pieces)) {
  const id = name.replace(/[^a-z]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${base(id + n, p.a, p.b, p.glow)}
${stars(n * 100 + 7, 46, starColors, H * 0.75)}
${p.extra()}
</svg>`;
  writeFileSync(join(worksDir, `${name}.svg`), svg);
  n++;
}

// 头像
const avatar = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
<defs>
  <radialGradient id="av" cx="0.5" cy="0.4" r="0.9">
    <stop offset="0" stop-color="#1a2148"/>
    <stop offset="1" stop-color="#05060d"/>
  </radialGradient>
  <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8ea2ff"/>
    <stop offset="1" stop-color="#f5d9a0"/>
  </linearGradient>
</defs>
<circle cx="150" cy="150" r="146" fill="url(#av)"/>
<circle cx="150" cy="150" r="132" fill="none" stroke="url(#ring)" stroke-width="2.5" stroke-dasharray="4 9"/>
${stars(3, 30, starColors, 260)}
${sparkle(150, 148, 46, "#f5d9a0", 0.95)}
${sparkle(96, 92, 12, "#e9ecff", 0.85)}
${sparkle(208, 200, 9, "#8ea2ff", 0.85)}
</svg>`;
writeFileSync(join(imgDir, "avatar.svg"), avatar);

console.log("done:", n, "works + 1 avatar");
