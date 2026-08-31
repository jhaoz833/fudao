"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

/**
 * 首页"关于浮岛"动态短片。
 * 滚动进入视口才播放、离开即暂停（省流）；开启"减少动态"时显示封面 + 手动播放按钮。
 */
export default function IslandVideo({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setNeedsTap(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => setNeedsTap(true));
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="glass card-glow relative overflow-hidden rounded-3xl p-2 sm:p-3"
    >
      <div className="relative overflow-hidden rounded-2xl">
        <video
          ref={ref}
          className="block w-full"
          src="/videos/fudao-intro.mp4"
          poster="/videos/fudao-intro-poster.jpg"
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="浮岛介绍短片：一座漂浮在星海里的小岛"
          onPlay={() => setNeedsTap(false)}
        />
        {needsTap && (
          <button
            type="button"
            aria-label="播放介绍短片"
            onClick={() => ref.current?.play()}
            className="absolute inset-0 flex items-center justify-center bg-void/45 backdrop-blur-[2px] transition hover:bg-void/30"
          >
            <span className="glass flex h-16 w-16 items-center justify-center rounded-full text-xl text-star shadow-[0_0_36px_-6px_rgba(142,162,255,0.8)]">
              ▶
            </span>
          </button>
        )}
      </div>
      {children && <div className="px-5 pb-2 pt-4 text-center">{children}</div>}
    </motion.div>
  );
}
