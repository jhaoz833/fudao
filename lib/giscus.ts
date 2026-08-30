// giscus 评论配置：占位值由用户从 giscus.app 生成的代码填入
export const GISCUS = {
  repo: "jhaoz833/jhaoz833.github.io",
  repoId: "PENDING",
  category: "Announcements",
  categoryId: "PENDING",
};

export function giscusReady() {
  return GISCUS.repoId !== "PENDING" && GISCUS.categoryId !== "PENDING";
}
