// 浏览器端图片压缩：长边 ≤2000px、JPEG 质量 0.82，输出 dataURL（发布时转 base64 提交）
export type CompressedImage = {
  dataUrl: string;
  name: string;
  sizeKB: number;
};

export async function compressImage(file: File): Promise<CompressedImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("解析图片失败"));
    el.src = dataUrl;
  });

  const scale = Math.min(1, 2000 / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画布不可用");
  ctx.drawImage(img, 0, 0, w, h);

  const out = canvas.toDataURL("image/jpeg", 0.82);
  return {
    dataUrl: out,
    name: file.name.replace(/\.[^.]+$/, "") || "image",
    sizeKB: Math.round((out.length * 0.75) / 1024),
  };
}

export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}
