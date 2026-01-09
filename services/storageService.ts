import { storage } from './firebaseClient';

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

export async function uploadWardrobeImage(
  userId: string,
  base64DataUrl: string,
  filenameHint?: string
): Promise<string> {
  const blob = await dataUrlToBlob(base64DataUrl);
  const safeHint = (filenameHint || 'item').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 40) || 'item';
  const fileName = `${Date.now()}-${randomSuffix()}.jpg`;
  const path = `users/${userId}/wardrobe/${safeHint}-${fileName}`;

  const ref = storage.ref().child(path);
  await ref.put(blob, { contentType: blob.type || 'image/jpeg' });
  return await ref.getDownloadURL();
}
