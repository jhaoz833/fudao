"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import WorkCard from "@/components/WorkCard";
import worksData from "@/data/works.json";
import type { Work } from "@/lib/types";

const works = worksData as Work[];

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function WorksPage() {
  const [active, setActive] = useState<Work | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-28">
      <header className="mb-10 text-center">
        <p className="text-xs tracking-[0.5em] text-moon">✦ 作品</p>
        <h1 className="gradient-text mt-3 text-3xl font-bold">岛上收藏的创作</h1>
        <p className="mt-3 text-sm text-moon/80">点击卡片查看大图与创作说明</p>
      </header>

      <motion.div
        variants={grid}
        initial="hidden"
        animate="show"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {works.map((w) => (
          <WorkCard key={w.slug} work={w} onSelect={setActive} />
        ))}
      </motion.div>

      <AnimatePresence>
        {active && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-void/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 34, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass w-full max-w-xl overflow-hidden rounded-3xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.image}
                alt={active.title}
                className="max-h-[46vh] w-full object-cover"
              />
              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold text-star">{active.title}</h3>
                  <span className="text-sm text-moon/70">{active.year}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {active.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-aurora/10 px-2.5 py-1 text-[11px] text-aurora ring-1 ring-aurora/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-4 leading-relaxed text-moon">{active.description}</p>
                <button
                  onClick={() => setActive(null)}
                  className="glass mt-6 rounded-full px-5 py-2 text-sm text-moon transition hover:text-star"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
