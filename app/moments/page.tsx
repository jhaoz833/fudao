import Link from "next/link";
import PostCard from "@/components/PostCard";
import postsData from "@/data/posts.json";
import commentsJson from "@/data/comments.json";
import type { Post, PostThread } from "@/lib/types";

const posts = postsData as Post[];
const commentsData = commentsJson as Record<string, PostThread>;

export default function MomentsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-28">
      <header className="mb-10 text-center">
        <p className="text-xs tracking-[0.5em] text-moon">✦ 动态</p>
        <h1 className="gradient-text mt-3 text-3xl font-bold">岛上的最近更新</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-moon/80">
          当前为示例内容。发布器上线后，在网页里点一下即可发布，动态会自动存进 GitHub 仓库并全网生效。
        </p>
      </header>
      <div className="space-y-6 [perspective:1200px]">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} thread={commentsData[p.id]} />
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-moon/70">
        评论与点赞将接入 GitHub Discussions（{" "}
        <span className="text-moon/50">第 2 期</span> ）
      </p>
      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-moon transition hover:text-aurora">
          ← 回到首页
        </Link>
      </div>
    </div>
  );
}
