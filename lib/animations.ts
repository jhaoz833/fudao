import type { Variants } from "motion/react";

// 动态入场动画库：发布者在发布时点选一种，
// 访客"刷到"这条动态时播放对应动画。key 会写进动态 JSON 的 animation 字段。
export type PostAnimationKey = "fadeUp" | "flipIn" | "polaroid" | "typewriter" | "starlight";

export const POST_ANIMATIONS: Record<PostAnimationKey, { label: string }> = {
  fadeUp: { label: "淡入上浮" },
  flipIn: { label: "卡片翻转" },
  polaroid: { label: "拍立得甩入" },
  typewriter: { label: "打字机" },
  starlight: { label: "星光显影" },
};

export const cardVariants: Record<PostAnimationKey, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  },
  flipIn: {
    hidden: { opacity: 0, rotateY: 70, y: 30 },
    show: { opacity: 1, rotateY: 0, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
  },
  polaroid: {
    hidden: { opacity: 0, rotate: -9, scale: 0.85, y: 40 },
    show: { opacity: 1, rotate: 0, scale: 1, y: 0, transition: { type: "spring", stiffness: 160, damping: 15 } },
  },
  typewriter: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.45 } },
  },
  starlight: {
    hidden: { opacity: 0, scale: 0.96, filter: "brightness(2.4) blur(4px)" },
    show: { opacity: 1, scale: 1, filter: "brightness(1) blur(0px)", transition: { duration: 1.1, ease: "easeOut" } },
  },
};

// 打字机模式下逐字显影
export const textCharVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.12 } },
};

export function resolveAnimation(key: string): PostAnimationKey {
  return (key in cardVariants ? key : "fadeUp") as PostAnimationKey;
}
