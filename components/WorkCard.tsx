"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import type { Work } from "@/lib/types";

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function WorkCard({
  work,
  onSelect,
}: {
  work: Work;
  onSelect?: (work: Work) => void;
}) {
  const Comp = onSelect ? motion.button : motion.div;

  return (
    <Comp
      variants={item}
      onClick={onSelect ? () => onSelect(work) : undefined}
      whileHover={{ y: -6 }}
      className="text-left"
    >
      <div className="glass card-glow float-isle group h-full overflow-hidden rounded-2xl">
      <div className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={work.image}
          alt={work.title}
          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-52"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mist/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-medium text-star">{work.title}</h3>
          <span className="text-xs text-moon/70">{work.year}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {work.tags.map((t) => (
            <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-moon">
              {t}
            </span>
          ))}
        </div>
      </div>
      </div>
    </Comp>
  );
}
