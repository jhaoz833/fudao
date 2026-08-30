"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  base: number;
  phase: number;
  speed: number;
  hue: "white" | "gold" | "blue";
  vx: number;
  vy: number;
  bright: boolean;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

const STAR_COLORS: Record<Star["hue"], string> = {
  white: "233,236,255",
  gold: "245,217,160",
  blue: "160,180,255",
};

const TAU = Math.PI * 2;

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let nextMeteorAt = 3000;
    let lastT = 0;

    const buildStars = () => {
      const count = Math.min(
        200,
        Math.floor((window.innerWidth * window.innerHeight) / 8000)
      );
      stars = Array.from({ length: count }, (_, i) => ({
        x: rand(i * 3 + 1),
        y: rand(i * 3 + 2),
        r: 0.3 + rand(i * 3 + 3) * 1.3,
        base: 0.3 + rand(i * 7 + 5) * 0.6,
        phase: rand(i * 11 + 7) * Math.PI * 2,
        speed: 0.5 + rand(i * 13 + 9) * 1.6,
        hue: pickHue(i),
        // 缓慢漂移：整体微微向左下流动，模拟银河运转
        vx: (rand(i * 19 + 2) - 0.5) * 0.008,
        vy: 0.002 + rand(i * 23 + 4) * 0.004,
        bright: i % 24 === 0,
      }));
    };

    const drawStars = (t: number, dt: number) => {
      const W = canvas.width;
      const H = canvas.height;
      for (const s of stars) {
        if (!reduced) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          if (s.x < -0.02) s.x += 1.04;
          else if (s.x > 1.02) s.x -= 1.04;
          if (s.y > 1.02) s.y -= 1.04;
        }

        const tw = reduced
          ? s.base
          : Math.max(0.05, Math.min(1, s.base + Math.sin((t / 1000) * s.speed + s.phase) * 0.42));
        const px = s.x * W;
        const py = s.y * H;
        const color = STAR_COLORS[s.hue];

        if (s.bright) {
          // 大星：光晕 + 十字星芒 + 亮核
          const glow = ctx.createRadialGradient(px, py, 0, px, py, 15 * dpr);
          glow.addColorStop(0, `rgba(${color},${0.5 * tw})`);
          glow.addColorStop(1, `rgba(${color},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(px, py, 15 * dpr, 0, TAU);
          ctx.fill();

          ctx.strokeStyle = `rgba(${color},${0.55 * tw})`;
          ctx.lineWidth = dpr;
          ctx.beginPath();
          ctx.moveTo(px - 9 * dpr, py);
          ctx.lineTo(px + 9 * dpr, py);
          ctx.moveTo(px, py - 9 * dpr);
          ctx.lineTo(px, py + 9 * dpr);
          ctx.stroke();

          ctx.fillStyle = `rgba(${color},${Math.min(1, tw + 0.25)})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.7 * dpr, 0, TAU);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${color},${tw})`;
          ctx.arc(px, py, s.r * dpr, 0, TAU);
          ctx.fill();
        }
      }
    };

    const drawMeteors = () => {
      meteors = meteors.filter((m) => m.life < m.maxLife);
      for (const m of meteors) {
        m.x += m.vx;
        m.y += m.vy;
        m.life += 1;
        const fade = Math.sin((m.life / m.maxLife) * Math.PI);
        const tailX = m.x - m.vx * 14;
        const tailY = m.y - m.vy * 14;
        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(233,236,255,${0.9 * fade})`);
        grad.addColorStop(1, "rgba(233,236,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4 * dpr;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      buildStars();
    };

    const tick = (t: number) => {
      const dt = Math.min(0.05, lastT ? (t - lastT) / 1000 : 0);
      lastT = t;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawStars(t, dt);
      if (t > nextMeteorAt) {
        nextMeteorAt = t + 3500 + Math.random() * 6500;
        const speed = (5 + Math.random() * 4) * dpr;
        meteors.push({
          x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          y: Math.random() * canvas.height * 0.3,
          vx: -speed,
          vy: speed * (0.5 + Math.random() * 0.3),
          life: 0,
          maxLife: 60 + Math.random() * 30,
        });
      }
      drawMeteors();
      raf = requestAnimationFrame(tick);
    };

    resize();

    if (reduced) {
      // 减少动态偏好：只画一帧静态星空
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawStars(0, 0);
    } else {
      raf = requestAnimationFrame(tick);
      window.addEventListener("resize", resize);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}

// 确定性伪随机，避免每次重建闪烁位置跳变
function rand(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function pickHue(i: number): Star["hue"] {
  const v = rand(i * 17 + 3);
  if (v < 0.82) return "white";
  return v < 0.92 ? "gold" : "blue";
}
