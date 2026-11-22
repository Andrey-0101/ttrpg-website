import "server-only";

import sharp from "sharp";

import { createAdminClient } from "@/utils/supabase/admin";
import type { createClient } from "@/utils/supabase/server";
import { CAMPAIGN_HANDOUT_BUCKET, CAMPAIGN_HANDOUT_MAX_BYTES } from "./contracts";

const MAX_THUMBNAIL_BYTES = 128 * 1024;
const MAX_CONCURRENT_GENERATIONS = 2;
const MAX_PENDING_GENERATIONS = 24;
const inFlight = new Map<string, Promise<Buffer | null>>();
const generating = new Set<Promise<Buffer | null>>();

type StorageBucket = ReturnType<Awaited<ReturnType<typeof createClient>>["storage"]["from"]>;

async function readSourceVersion(bucket: StorageBucket, path: string) {
  const { data, error } = await bucket.info(path);
  if (error || !data || (!data.version && !data.etag && !data.lastModified)) return null;
  return JSON.stringify([path, data.version, data.etag, data.lastModified]);
}

async function resizeOriginal(blob: Blob) {
  if (!blob.size || blob.size > CAMPAIGN_HANDOUT_MAX_BYTES) return null;
  const original = sharp(Buffer.from(await blob.arrayBuffer()), { limitInputPixels: 40_000_000 });
  const { format } = await original.metadata();
  if (format !== "jpeg" && format !== "png" && format !== "webp") return null;

  for (const size of [384, 192]) {
    const thumbnail = await original.clone().autoOrient()
      .resize(size, size, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 70 }).timeout({ seconds: 5 }).toBuffer();
    if (thumbnail.byteLength <= MAX_THUMBNAIL_BYTES) return thumbnail;
  }
  return null;
}

async function generateWhenAvailable(generate: () => Promise<Buffer | null>) {
  const queuedAt = Date.now();
  while (generating.size >= MAX_CONCURRENT_GENERATIONS) {
    await Promise.race(generating);
    if (Date.now() - queuedAt > 10_000) return null;
  }
  const task = generate().catch(() => null);
  generating.add(task);
  try {
    return await task;
  } finally {
    generating.delete(task);
  }
}

export async function loadCampaignGalleryThumbnail(
  client: Awaited<ReturnType<typeof createClient>>,
  imageId: string,
  path: string,
): Promise<Buffer | null> {
  // Check the original with the viewer's Storage permissions before using the private cache.
  const bucket = client.storage.from(CAMPAIGN_HANDOUT_BUCKET);
  const version = await readSourceVersion(bucket, path);
  if (!version) return null;
  const cache = createAdminClient(5000).from("campaign_image_thumbnails");
  const { data, error } = await cache.select("webp_base64")
    .eq("image_id", imageId).eq("source_version", version).maybeSingle();
  if (error) return null;
  if (data) return Buffer.from(data.webp_base64, "base64");

  const key = JSON.stringify([imageId, version]);
  const pending = inFlight.get(key);
  if (pending) return pending;
  if (inFlight.size >= MAX_PENDING_GENERATIONS) return null;

  const generation = generateWhenAvailable(async () => {
    const { data: blob, error: downloadError } = await bucket.download(path, {}, {
      cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    if (downloadError || !blob) return null;
    const thumbnail = await resizeOriginal(blob);
    if (!thumbnail || await readSourceVersion(bucket, path) !== version) return null;
    const { error: writeError } = await cache.upsert({
      image_id: imageId, source_version: version, webp_base64: thumbnail.toString("base64"),
    });
    return writeError ? null : thumbnail;
  });
  inFlight.set(key, generation);
  try {
    return await generation;
  } finally {
    inFlight.delete(key);
  }
}
