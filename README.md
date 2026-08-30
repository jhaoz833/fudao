# 浮岛 · Floating Island

个人网站（暗色银河风），规划文档见 `../docs/网站方案.md`。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:3000
```

## 构建与部署

```bash
npm run build    # 静态导出到 out/
```

部署：Cloudflare Pages 连接本仓库即可，push 后自动构建上线。

## 结构速览

- `app/` 页面（首页 / 动态 / 作品 / 关于）
- `data/` 动态与作品数据（JSON，将来由发布器自动提交到 GitHub 仓库）
- `lib/animations.ts` 动态入场动画库（发布者点选）
- `components/Starfield.tsx` 银河星空画布
- `components/IntroGate.tsx` 上线入场动画（每次会话播放一次，sessionStorage 控制）

## 示例素材

`public/images/` 下的占位图由 `scripts/make-placeholders.mjs` 生成，替换真实作品时直接覆盖同名文件或修改 `data/works.json`。
