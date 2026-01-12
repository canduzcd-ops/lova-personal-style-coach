// services/imageOptimizer.ts
export type OptimizeOptions = {
  maxDimension?: number; // default 800
  quality?: number;      // default 0.8
  mimeType?: 'image/jpeg' | 'image/webp'; // default jpeg
};

/**
 * Input: data URL (data:image/...;base64,....)
 * Output: data URL (JPEG/WebP), resized to maxDimension, with given quality
 *
 * Safe behavior:
 * - If anything fails, returns original dataUrl (so UI won't break)
 */
export async function optimizeImageDataUrl(
  dataUrl: string,
  opts: OptimizeOptions = {}
): Promise<string> {
  const maxDimension = opts.maxDimension ?? 800;
  const quality = opts.quality ?? 0.8;
  const mimeType = opts.mimeType ?? 'image/jpeg';

  try {
    if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
    if (!dataUrl.startsWith('data:image/')) return dataUrl;

    return await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const width = img.width || 0;
          const height = img.height || 0;
          if (!width || !height) {
            resolve(dataUrl);
            return;
          }

          const maxSide = Math.max(width, height);
          const scale = maxSide > maxDimension ? maxDimension / maxSide : 1;

          const targetW = Math.max(1, Math.round(width * scale));
          const targetH = Math.max(1, Math.round(height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, targetW, targetH);
          const out = canvas.toDataURL(mimeType, quality);
          resolve(out || dataUrl);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  } catch {
    return dataUrl;
  }
}
