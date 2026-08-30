// 构建时抓取 GitHub Discussions 评论，写入 data/comments.json，
// 由 Next.js 在构建时烘进静态页面——访客无需访问任何被墙域名即可看到评论。
// 在 GitHub Actions 中运行（提供 GITHUB_TOKEN）；本地无 token 时安全跳过。
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OWNER = "jhaoz833";
const NAME = "jhaoz833.github.io";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.log("无 GITHUB_TOKEN，跳过评论抓取（保留现有 comments.json）");
  process.exit(0);
}

const query = `query($o:String!,$n:String!){
  repository(owner:$o,name:$n){
    discussions(first:50){
      nodes{
        number
        comments(first:50){
          nodes{
            author{login avatarUrl}
            body
            createdAt
            reactions{totalCount}
          }
        }
      }
    }
  }
}`;

try {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { o: OWNER, n: NAME } }),
  });
  if (!res.ok) {
    console.error(`GraphQL 请求失败: ${res.status}，保留现有数据`);
    process.exit(0);
  }
  const json = await res.json();
  if (json.errors) {
    console.error("GraphQL 错误:", JSON.stringify(json.errors));
    process.exit(0);
  }

  const out = {};
  for (const d of json.data.repository.discussions.nodes) {
    out[String(d.number)] = d.comments.nodes.map((c) => ({
      login: c.author?.login ?? "匿名岛民",
      avatar: c.author?.avatarUrl ?? "",
      body: c.body,
      createdAt: (c.createdAt || "").slice(0, 10),
      likes: c.reactions.totalCount,
    }));
  }

  const target = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "comments.json");
  writeFileSync(target, JSON.stringify(out, null, 2));
  console.log(`已同步 ${Object.keys(out).length} 个讨论的评论`);
} catch (err) {
  console.error("抓取异常，保留现有数据:", err.message);
  process.exit(0);
}
