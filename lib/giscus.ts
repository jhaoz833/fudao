// giscus 评论配置：占位值由用户从 giscus.app 生成的代码填入
export const GISCUS = {
  repo: "jhaoz833/jhaoz833.github.io",
  repoId: "R_kgDOUI6Wew",
  category: "Announcements",
  categoryId: "DIC_kwDOUI6We84DEhRC",
};

export function giscusReady() {
  return GISCUS.repoId !== "PENDING" && GISCUS.categoryId !== "PENDING";
}
