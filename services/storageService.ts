import { storage } from './firebaseClient';
import { captureError } from './telemetry';

const MAX_DIMENSION = 1080;
const LARGE_DATA_URL_BYTES = 1.2 * 1024 * 1024; // ~1.2MB threshold for compressing

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Math.ceil((base64.length * 3) / 4); // base64 to bytes approximation
}

async function compressDataUrlIfNeeded(dataUrl: string): Promise<string> {
  const shouldCompress = estimateDataUrlBytes(dataUrl) > LARGE_DATA_URL_BYTES;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const maxSide = Math.max(width, height);

      if (!shouldCompress && maxSide <= MAX_DIMENSION) {
        resolve(dataUrl);
        return;
      }

      const scale = maxSide > MAX_DIMENSION ? MAX_DIMENSION / maxSide : 1;
      const targetWidth = Math.round(width * scale);
      const targetHeight = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const compressed = canvas.toDataURL('image/jpeg', 0.85);
      resolve(compressed || dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function uploadWardrobeImage(
  userId: string,
  base64DataUrl: string,
  filenameHint?: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const optimizedDataUrl = await compressDataUrlIfNeeded(base64DataUrl);
    const blob = await dataUrlToBlob(optimizedDataUrl);
    const safeHint = (filenameHint || 'item').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 40) || 'item';
    const fileName = `${Date.now()}-${randomSuffix()}.jpg`;
    const path = `users/${userId}/wardrobe/${safeHint}-${fileName}`;

    const ref = storage.ref().child(path);
    const uploadTask = ref.put(blob, { contentType: blob.type || 'image/jpeg' });

    return await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress && snapshot.totalBytes) {
            const pct = Math.min(100, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
            onProgress(pct);
          }
        },
        (error) => {
          captureError(error, { userId, hint: filenameHint, scope: 'uploadWardrobeImage' });
          reject(error);
        },
        async () => {
          try {
            const url = await ref.getDownloadURL();
            onProgress?.(100);
            resolve(url);
          } catch (err) {
            captureError(err, { userId, hint: filenameHint, scope: 'uploadWardrobeImage' });
            reject(err);
          }
        }
      );
    });
  } catch (err) {
    captureError(err, { userId, hint: filenameHint, scope: 'uploadWardrobeImage' });
    throw err;
  }
}
