"use client";

import { useEffect, useRef } from "react";
import { GISCUS, giscusReady } from "@/lib/giscus";

// 每条动态的评论区：基于 giscus，数据存在仓库的 GitHub Discussions 里。
// term 用动态 id 作为稳定标识，与页面地址无关。
export default function Comments({ term }: { term: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!giscusReady() || !ref.current || ref.current.firstChild) return;
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    const attrs: Record<string, string> = {
      "data-repo": GISCUS.repo,
      "data-repo-id": GISCUS.repoId,
      "data-category": GISCUS.category,
      "data-category-id": GISCUS.categoryId,
      "data-mapping": "specific",
      "data-term": term,
      "data-strict": "1",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "top",
      "data-theme": "transparent_dark",
      "data-lang": "zh-CN",
      "data-loading": "lazy",
    };
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    ref.current.appendChild(s);
  }, [term]);

  if (!giscusReady()) return null;

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="mb-2 text-xs text-moon">
        ✦ 评论区 · 用 GitHub 账号发言，表情可点赞
      </p>
      <div ref={ref} />
      <p className="mt-2 text-xs text-moon/70">
        评论区加载不出来？{" "}
        <a
          href={`https://github.com/${GISCUS.repo}/discussions`}
          target="_blank"
          rel="noreferrer"
          className="text-aurora underline-offset-2 hover:underline"
        >
          去 GitHub Discussions 留言 →
        </a>
      </p>
    </div>
  );
}
