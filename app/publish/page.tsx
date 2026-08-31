"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { compressImage, dataUrlToBase64, type CompressedImage } from "@/lib/image";
import { clearDraft, clearToken, getToken, loadDraft, saveDraft, setToken } from "@/lib/publish-store";
import { POST_ANIMATIONS, cardVariants, type PostAnimationKey } from "@/lib/animations";

const REPO = "jhaoz833/jhaoz833.github.io";
const TAG_CHOICES = ["日常", "练习", "碎片", "灵感", "作品"];

type Status = { kind: "idle" | "working" | "ok" | "error"; message?: string; url?: string };

function genId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const rnd = Math.random().toString(36).slice(2, 6);
  return `${ymd}-${rnd}`;
}

export default function PublishPage() {
  const [token, setTokenState] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [animation, setAnimation] = useState<PostAnimationKey>("fadeUp");
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTokenState(getToken());
    const d = loadDraft();
    if (d) {
      setText(d.text);
      setTags(d.tags);
      setAnimation((d.animation as PostAnimationKey) in cardVariants ? (d.animation as PostAnimationKey) : "fadeUp");
      setImages(d.images.map((i) => ({ dataUrl: i.dataUrl, name: i.name, sizeKB: 0 })));
    }
  }, []);

  // 草稿自动保存
  useEffect(() => {
    if (!text && !images.length) return;
    saveDraft({
      text,
      tags,
      animation,
      images: images.map((i) => ({ dataUrl: i.dataUrl, name: i.name })),
      savedAt: new Date().toISOString(),
    });
  }, [text, tags, animation, images]);

  const previewVariants = useMemo(() => cardVariants[animation], [animation]);
  const [previewKey, setPreviewKey] = useState(0);

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setCompressing(true);
    try {
      const next: CompressedImage[] = [];
      for (const f of Array.from(files).slice(0, 9)) {
        next.push(await compressImage(f));
      }
      setImages((prev) => [...prev, ...next].slice(0, 9));
    } catch {
      setStatus({ kind: "error", message: "有图片处理失败，请重试" });
    } finally {
      setCompressing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addCustomTag = () => {
    const t = customTag.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setCustomTag("");
  };

  const submit = async () => {
    if (!text.trim()) return setStatus({ kind: "error", message: "写点什么再发布吧" });
    if (!token) return setStatus({ kind: "error", message: "请先在上方配置发布钥匙（PAT）" });
    setStatus({ kind: "working" });
    try {
      // 动态导入提交模块，避免页面首载就带上 API 代码
      const { publishPost } = await import("@/lib/github-publish");
      const id = genId();
      const url = await publishPost({
        token,
        id,
        text: text.trim(),
        tags,
        animation,
        images: images.map((i) => ({ base64: dataUrlToBase64(i.dataUrl), name: i.name })),
      });
      clearDraft();
      setText("");
      setTags([]);
      setImages([]);
      setStatus({ kind: "ok", url });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "发布失败，请检查网络后重试",
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-28">
      <header className="mb-8 text-center">
        <p className="text-xs tracking-[0.5em] text-moon">✦ 岛主工作室</p>
        <h1 className="gradient-text mt-3 text-3xl font-bold">发布新动态</h1>
        <p className="mt-2 text-xs text-moon/70">
          发布后自动提交到 GitHub 仓库并触发构建，约 1 分钟后全网生效。发布的内容是公开内容。
        </p>
      </header>

      {/* 钥匙区 */}
      <section className="glass mb-6 rounded-2xl p-5">
        {token ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-star/90">
              🔑 发布钥匙已配置 <span className="text-moon/60">（存于本机浏览器）</span>
            </p>
            <button
              onClick={() => {
                clearToken();
                setTokenState("");
              }}
              className="text-xs text-moon underline-offset-2 hover:text-star hover:underline"
            >
              清除
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-moon">
              首次使用需要配置发布钥匙（PAT）。生成方法：{" "}
              <a
                href="https://github.com/settings/personal-access-tokens/new"
                target="_blank"
                rel="noreferrer"
                className="text-aurora underline-offset-2 hover:underline"
              >
                打开 GitHub 令牌页
              </a>
              → Repository access 选 <b className="text-star/90">Only select repositories → jhaoz833/jhaoz833.github.io</b>{" "}
              → Permissions → Contents 选 <b className="text-star/90">Read and write</b> → 有效期 1 年 → 生成并复制。
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="粘贴 github_pat_ 开头的令牌"
                className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-star placeholder:text-moon/50 focus:border-aurora/50 focus:outline-none"
              />
              <button
                onClick={() => {
                  if (tokenInput.trim().length < 20) return;
                  setToken(tokenInput);
                  setTokenState(tokenInput.trim());
                  setTokenInput("");
                }}
                className="rounded-full bg-aurora px-5 py-2 text-sm font-medium text-void"
              >
                保存钥匙
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* 左：表单 */}
        <section className="glass rounded-2xl p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="今天岛上发生了什么？"
            className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-relaxed text-star placeholder:text-moon/50 focus:border-aurora/50 focus:outline-none"
          />

          {/* 标签 */}
          <div className="mt-4">
            <p className="mb-2 text-xs text-moon">标签</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {TAG_CHOICES.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
                  }
                  className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
                    tags.includes(t)
                      ? "bg-aurora/20 text-aurora ring-aurora/40"
                      : "bg-white/5 text-moon ring-white/10 hover:text-star"
                  }`}
                >
                  #{t}
                </button>
              ))}
              {tags
                .filter((t) => !TAG_CHOICES.includes(t))
                .map((t) => (
                  <button
                    key={t}
                    onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                    className="rounded-full bg-aurora/20 px-3 py-1 text-xs text-aurora ring-1 ring-aurora/40"
                  >
                    #{t} ✕
                  </button>
                ))}
              <input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                placeholder="自定义…"
                className="w-20 rounded-full border border-dashed border-white/20 bg-transparent px-3 py-1 text-xs text-star placeholder:text-moon/40 focus:border-aurora/50 focus:outline-none"
              />
            </div>
          </div>

          {/* 图片 */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-moon">图片（最多 9 张，自动压缩）</p>
              {compressing && <span className="text-xs text-gold">压缩中…</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.dataUrl} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/15" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-void/90 text-xs text-moon ring-1 ring-white/20 hover:text-star"
                    aria-label="移除图片"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="grid h-16 w-16 place-items-center rounded-lg border border-dashed border-white/25 text-moon transition hover:border-aurora/50 hover:text-aurora"
                  aria-label="添加图片"
                >
                  ＋
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onPickFiles(e.target.files)}
            />
          </div>

          {/* 动画选择 */}
          <div className="mt-4">
            <p className="mb-2 text-xs text-moon">入场动画（访客刷到这条动态时播放）</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(POST_ANIMATIONS).map(([key, v]) => (
                <button
                  key={key}
                  onClick={() => {
                    setAnimation(key as PostAnimationKey);
                    setPreviewKey((k) => k + 1);
                  }}
                  className={`rounded-full px-3 py-1 text-xs ring-1 transition ${
                    animation === key
                      ? "bg-gold/15 text-gold ring-gold/40"
                      : "bg-white/5 text-moon ring-white/10 hover:text-star"
                  }`}
                >
                  ✦ {v.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submit}
            disabled={status.kind === "working"}
            className="mt-6 w-full rounded-full bg-aurora py-3 text-sm font-semibold text-void shadow-[0_0_30px_-8px_rgba(142,162,255,0.8)] transition hover:brightness-110 disabled:opacity-50"
          >
            {status.kind === "working" ? "发布中…" : "✦ 发布到浮岛"}
          </button>

          <AnimatePresence>
            {status.kind === "ok" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl bg-aurora/10 p-4 text-sm text-aurora ring-1 ring-aurora/30"
              >
                🎉 已提交！约 1 分钟后生效。
                <div className="mt-2 flex gap-3 text-xs">
                  <Link href="/moments" className="underline underline-offset-2">
                    去动态页看看
                  </Link>
                  <a
                    href={`https://github.com/${REPO}/actions`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    查看构建状态
                  </a>
                </div>
              </motion.div>
            )}
            {status.kind === "error" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-400/30"
              >
                {status.message}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-between text-xs text-moon/60">
            <span>草稿自动保存到本机</span>
            <button
              onClick={() => {
                clearDraft();
                setText("");
                setTags([]);
                setImages([]);
              }}
              className="underline-offset-2 hover:text-star hover:underline"
            >
              清空草稿
            </button>
          </div>
        </section>

        {/* 右：实时预览 */}
        <section className="glass h-fit rounded-2xl p-5">
          <p className="mb-3 text-xs text-moon">发布预览（播放你选的入场动画）</p>
          <motion.div
            key={previewKey}
            variants={previewVariants}
            initial="hidden"
            animate="show"
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            {images[0] && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={images[0].dataUrl} alt="" className="h-36 w-full object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-moon">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-aurora/20 text-aurora ring-1 ring-aurora/30">
                  ✦
                </span>
                岛主 · 今天
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-star/90">
                {text || "（内容预览）"}
              </p>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-moon">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            className="mt-3 w-full rounded-full border border-white/10 py-1.5 text-xs text-moon transition hover:text-star"
          >
            ↻ 重播动画
          </button>
        </section>
      </div>
    </div>
  );
}
