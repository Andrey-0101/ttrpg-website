import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  CAMPAIGN_HANDOUT_MAX_BYTES,
  createCampaignHandoutDisplayName,
  createCampaignHandoutPath,
  validateCampaignHandoutFile,
} from "../../lib/campaign-handouts/contracts";
import {
  uploadCampaignHandoutBatch,
  uploadCampaignHandoutFile,
  type CampaignHandoutUploadFile,
  type CampaignHandoutUploadMetadata,
} from "../../lib/campaign-handouts/upload";
import {
  deleteCampaignWithHandoutsStorageFirst,
  removeAndVerifyCampaignHandoutObjects,
  rollbackFailedCampaignHandoutUpload,
} from "../../lib/campaign-handouts/workflows";

const campaignId = "20000000-0000-4000-8000-000000000001";
const imageId = "60000000-0000-4000-8000-000000000001";
const objectId = "70000000-0000-4000-8000-000000000001";
const storagePath = `${campaignId}/${imageId}/${objectId}.webp`;

function testFile(
  name: string,
  type = "image/webp",
  size = 128,
): CampaignHandoutUploadFile {
  return { name, type, size };
}

test("handout file validation enforces image type, non-empty bytes, and 5 MiB", () => {
  assert.equal(
    validateCampaignHandoutFile({
      name: "map.webp",
      size: CAMPAIGN_HANDOUT_MAX_BYTES,
      type: "image/webp",
    }),
    null,
  );
  assert.equal(
    validateCampaignHandoutFile({
      name: "map.webp",
      size: CAMPAIGN_HANDOUT_MAX_BYTES + 1,
      type: "image/webp",
    }),
    "too_large",
  );
  assert.equal(
    validateCampaignHandoutFile({
      name: "empty.png",
      size: 0,
      type: "image/png",
    }),
    "empty",
  );
  assert.equal(
    validateCampaignHandoutFile({
      name: "animation.gif",
      size: 100,
      type: "image/gif",
    }),
    "invalid_type",
  );
});

test("handout metadata uses a safe display name and exact represented path", () => {
  assert.equal(
    createCampaignHandoutDisplayName("  Session\u0000 map.webp  "),
    "Session map",
  );
  assert.equal(
    createCampaignHandoutPath({
      campaignId,
      imageId,
      objectId,
      mimeType: "image/webp",
    }),
    storagePath,
  );
  assert.throws(() =>
    createCampaignHandoutPath({
      campaignId,
      imageId,
      objectId,
      mimeType: "image/gif",
    }),
  );
});

test("multiple handouts upload sequentially with independent private metadata", async () => {
  const files = [
    testFile("portrait.webp"),
    testFile("landscape.png", "image/png"),
  ];
  const events: string[] = [];
  const metadata: CampaignHandoutUploadMetadata[] = [];
  const identifiers = [
    "60000000-0000-4000-8000-000000000011",
    "70000000-0000-4000-8000-000000000011",
    "60000000-0000-4000-8000-000000000012",
    "70000000-0000-4000-8000-000000000012",
  ];
  let activeUploads = 0;
  let maximumActiveUploads = 0;

  const result = await uploadCampaignHandoutBatch({
    files,
    uploadFile: (file) =>
      uploadCampaignHandoutFile({
        campaignId,
        uploaderId: "10000000-0000-4000-8000-000000000001",
        file,
        dependencies: {
          createId: () => identifiers.shift()!,
          insertMetadata: async (entry) => {
            metadata.push(entry);
            events.push(`metadata:${file.name}`);
            return true;
          },
          uploadObject: async () => {
            activeUploads += 1;
            maximumActiveUploads = Math.max(
              maximumActiveUploads,
              activeUploads,
            );
            events.push(`upload:${file.name}`);
            await Promise.resolve();
            activeUploads -= 1;
            return true;
          },
          rollbackUpload: async () => {
            assert.fail("successful uploads must not be rolled back");
          },
        },
      }),
  });

  assert.equal(result.successes.length, 2);
  assert.deepEqual(result.failures, []);
  assert.equal(maximumActiveUploads, 1);
  assert.deepEqual(events, [
    "metadata:portrait.webp",
    "upload:portrait.webp",
    "metadata:landscape.png",
    "upload:landscape.png",
  ]);
  assert.equal(
    new Set(result.successes.map((entry) => entry.imageId)).size,
    2,
  );
  assert.equal(
    new Set(result.successes.map((entry) => entry.storagePath)).size,
    2,
  );
  assert.ok(metadata.every((entry) => entry.visibility === "gm_only"));
  assert.deepEqual(
    metadata.map((entry) => entry.display_name),
    ["portrait", "landscape"],
  );
});

test("an invalid or failed handout does not block successful siblings", async () => {
  const files = [
    testFile("first.webp"),
    testFile("animation.gif", "image/gif"),
    testFile("third.webp"),
  ];
  const rollbackPaths: string[] = [];
  let nextId = 0;

  const result = await uploadCampaignHandoutBatch({
    files,
    uploadFile: (file) =>
      uploadCampaignHandoutFile({
        campaignId,
        uploaderId: "10000000-0000-4000-8000-000000000001",
        file,
        dependencies: {
          createId: () =>
            `${nextId++}`.padStart(8, "0") +
            "-0000-4000-8000-000000000099",
          insertMetadata: async () => true,
          uploadObject: async () => true,
          rollbackUpload: async (_targetImageId, targetStoragePath) => {
            rollbackPaths.push(targetStoragePath);
            return true;
          },
        },
      }),
  });

  assert.deepEqual(
    result.successes.map((entry) => entry.file.name),
    ["first.webp", "third.webp"],
  );
  assert.deepEqual(
    result.failures.map((entry) => [entry.file.name, entry.error]),
    [["animation.gif", "invalid_type"]],
  );
  assert.deepEqual(rollbackPaths, []);
});

test("a failed object upload rolls back only that handout", async () => {
  const files = [
    testFile("first.webp"),
    testFile("second.webp"),
    testFile("third.webp"),
  ];
  const rollbacks: string[] = [];
  let nextId = 20;

  const result = await uploadCampaignHandoutBatch({
    files,
    uploadFile: (file) =>
      uploadCampaignHandoutFile({
        campaignId,
        uploaderId: "10000000-0000-4000-8000-000000000001",
        file,
        dependencies: {
          createId: () =>
            `${nextId++}`.padStart(8, "0") +
            "-0000-4000-8000-000000000099",
          insertMetadata: async () => true,
          uploadObject: async () => file.name !== "second.webp",
          rollbackUpload: async (_targetImageId, targetStoragePath) => {
            rollbacks.push(targetStoragePath);
            return true;
          },
        },
      }),
  });

  assert.deepEqual(
    result.successes.map((entry) => entry.file.name),
    ["first.webp", "third.webp"],
  );
  assert.deepEqual(
    result.failures.map((entry) => [entry.file.name, entry.error]),
    [["second.webp", "upload_failed"]],
  );
  assert.equal(rollbacks.length, 1);
});

test("Storage cleanup tolerates already-absent objects and blocks unverifiable deletion", async () => {
  assert.deepEqual(
    await removeAndVerifyCampaignHandoutObjects([storagePath], {
      removeObjectPaths: async () => ({ error: new Error("already absent") }),
      objectExists: async () => false,
    }),
    { ok: true },
  );

  assert.deepEqual(
    await removeAndVerifyCampaignHandoutObjects([storagePath], {
      removeObjectPaths: async () => ({ error: null }),
      objectExists: async () => true,
    }),
    { ok: false, error: "storage_cleanup_unverified" },
  );
});

test("failed upload cleanup removes bytes before metadata", async () => {
  const events: string[] = [];
  const result = await rollbackFailedCampaignHandoutUpload({
    imageId,
    storagePath,
    storage: {
      removeObjectPaths: async () => {
        events.push("storage-remove");
        return { error: null };
      },
      objectExists: async () => {
        events.push("storage-verify");
        return false;
      },
    },
    deleteMetadata: async () => {
      events.push("metadata-delete");
      return true;
    },
  });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(events, [
    "storage-remove",
    "storage-verify",
    "metadata-delete",
  ]);
});

test("partial Storage cleanup keeps campaign metadata for a safe retry", async () => {
  let campaignDeleteCalls = 0;
  const result = await deleteCampaignWithHandoutsStorageFirst({
    storagePaths: [storagePath, `${campaignId}/${imageId}/${objectId}.png`],
    storage: {
      removeObjectPaths: async () => ({ error: null }),
      objectExists: async (path) => path.endsWith(".png"),
    },
    deleteCampaign: async () => {
      campaignDeleteCalls += 1;
      return true;
    },
  });

  assert.deepEqual(result, {
    ok: false,
    error: "storage_cleanup_unverified",
  });
  assert.equal(campaignDeleteCalls, 0);
});

test("campaign deletion runs only after every represented object is absent", async () => {
  const events: string[] = [];
  const result = await deleteCampaignWithHandoutsStorageFirst({
    storagePaths: [storagePath],
    storage: {
      removeObjectPaths: async () => {
        events.push("storage-remove");
        return { error: null };
      },
      objectExists: async () => {
        events.push("storage-verify");
        return false;
      },
    },
    deleteCampaign: async () => {
      events.push("campaign-delete");
      return true;
    },
  });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(events, [
    "storage-remove",
    "storage-verify",
    "campaign-delete",
  ]);
});

test("route keeps recipient metadata on the Game Master-only data path", () => {
  const route = readFileSync(
    resolve("app/[locale]/campaigns/[id]/handouts/page.tsx"),
    "utf8",
  );
  const manager = readFileSync(
    resolve("components/campaigns/campaign-handouts-manager.tsx"),
    "utf8",
  );
  const management = readFileSync(
    resolve("components/campaigns/campaign-management-panel.tsx"),
    "utf8",
  );
  const gallery = readFileSync(
    resolve("components/campaigns/campaign-handout-gallery.tsx"),
    "utf8",
  );
  const upload = readFileSync(
    resolve("lib/campaign-handouts/upload.ts"),
    "utf8",
  );

  assert.ok(
    route.indexOf("if (!isGameMaster && !campaignActive)") <
      route.indexOf('.from("campaign_images")'),
  );
  assert.ok(
    route.indexOf("if (isGameMaster && !imageError)") <
      route.indexOf('.from("campaign_image_recipients")'),
  );
  assert.match(
    route,
    /isGameMaster\s*\?\s*\[\]\s*:\s*imagesWithUrls\.flatMap/u,
  );
  assert.doesNotMatch(
    route.slice(route.indexOf("const playerItems")),
    /recipientIds:/u,
  );
  assert.ok(
    upload.indexOf("insertMetadata") < upload.indexOf("uploadObject"),
  );
  assert.match(upload, /visibility: "gm_only"/u);
  assert.match(manager, /upsert: false/u);
  assert.match(manager, /multiple/u);
  assert.match(manager, /uploadCampaignHandoutBatch/u);
  assert.match(manager, /uploadProgress/u);
  assert.match(manager, /renderCardFooter/u);
  assert.doesNotMatch(manager, /manageTitle|manageDescription/u);
  assert.match(gallery, /object-contain/u);
  assert.doesNotMatch(gallery, /object-cover/u);
  assert.match(gallery, /lg:grid-cols-4/u);
  assert.match(manager, /set_campaign_image_visibility/u);
  assert.match(manager, /mutationLockRef\.current/u);
  assert.match(manager, /enabled: mutation === "upload"/u);
  assert.match(
    manager,
    /if \(files\.length === 0 \|\| mutationLockRef\.current \|\| !campaignActive\)/u,
  );
  assert.match(manager, /selectedNames\.join\(", "\)/u);
  assert.match(management, /deleteCampaignWithHandoutsStorageFirst/u);

  const playerViewer = readFileSync(
    resolve("components/campaigns/campaign-handouts-viewer.tsx"),
    "utf8",
  );
  assert.doesNotMatch(playerViewer, /visibility|recipient|player\.id/iu);
});

test("completed campaigns render no Handout mutation controls", () => {
  const manager = readFileSync(
    resolve("components/campaigns/campaign-handouts-manager.tsx"),
    "utf8",
  );

  assert.match(manager, /renderCardFooter=\{\s*campaignActive/u);
  assert.match(manager, /!campaignActive \? \(/u);
  assert.match(manager, /completedGameMasterDescription/u);
});

test("both locales expose Handouts with matching message contracts", () => {
  const english = JSON.parse(
    readFileSync(resolve("messages/en.json"), "utf8"),
  ) as Record<string, Record<string, unknown>>;
  const russian = JSON.parse(
    readFileSync(resolve("messages/ru.json"), "utf8"),
  ) as typeof english;

  assert.equal(english.CampaignHandouts.title, "Handouts");
  assert.equal(russian.CampaignHandouts.title, "Раздаточные материалы");
  assert.deepEqual(
    Object.keys(english.CampaignHandouts).sort(),
    Object.keys(russian.CampaignHandouts).sort(),
  );
});
