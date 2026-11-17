// Client-side helpers: shrink photos before upload (faster + cheaper analysis).

type Source = HTMLVideoElement | HTMLImageElement | ImageBitmap;

function sizeOf(src: Source) {
  if (src instanceof HTMLVideoElement) return { w: src.videoWidth, h: src.videoHeight };
  if (src instanceof HTMLImageElement) return { w: src.naturalWidth, h: src.naturalHeight };
  return { w: src.width, h: src.height };
}

function toJpeg(src: Source, maxSide: number, quality: number): string {
  const { w, h } = sizeOf(src);
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export type Shot = {
  dataUrl: string; // ~1024px JPEG for analysis + preview
  base64: string; // dataUrl without prefix
  thumbnail: string; // small JPEG for the daily log
};

export function shotFrom(src: Source): Shot {
  const dataUrl = toJpeg(src, 1024, 0.85);
  return {
    dataUrl,
    base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
    thumbnail: toJpeg(src, 160, 0.7),
  };
}

export async function shotFromFile(file: File): Promise<Shot> {
  // createImageBitmap respects EXIF orientation in modern browsers
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    return shotFrom(bitmap);
  } finally {
    bitmap.close();
  }
}
