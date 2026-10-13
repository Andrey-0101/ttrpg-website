import { timingSafeEqual } from "node:crypto";
import { DIAGNOSTICS, UUID } from "./contracts";

export function authorizedCleanup(header: string | null, secret: string | undefined): boolean {
  if (!secret || !/^[A-Za-z0-9_-]{43,128}$/.test(secret) || !header) return false;
  const actual = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function registeredPath(run: string, segment: string, chunk: string, path: string): boolean {
  return (
    UUID.test(run) &&
    UUID.test(segment) &&
    UUID.test(chunk) &&
    path === `${run}/${segment}/${chunk}.ndjson.gz`
  );
}
export type CleanupArtifact = {
  id: string;
  run_id: string;
  client_id: string;
  storage_path: string;
  cleanup_token: string | null;
};
export async function cleanupBatch(
  artifacts: CleanupArtifact[],
  io: {
    remove(path: string): Promise<boolean>;
    acknowledge(id: string, token: string): Promise<boolean>;
  },
) {
  let removed = 0;
  let failed = 0;
  const deadline = Date.now() + 25_000;
  // Sequential calls bound load. Never scan a bucket or accept caller-supplied paths.
  for (const artifact of artifacts.slice(0, DIAGNOSTICS.cleanupBatch)) {
    if (Date.now() >= deadline) {
      failed += artifacts.length - removed - failed;
      break;
    }
    if (
      !artifact.cleanup_token ||
      !registeredPath(artifact.run_id, artifact.client_id, artifact.id, artifact.storage_path)
    ) {
      failed++;
      continue;
    }
    try {
      if (
        (await io.remove(artifact.storage_path)) &&
        (await io.acknowledge(artifact.id, artifact.cleanup_token))
      )
        removed++;
      else failed++;
    } catch {
      failed++;
    }
  }
  return { removed, failed };
}
