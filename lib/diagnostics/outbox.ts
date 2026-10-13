import { DIAGNOSTICS } from "./contracts";
export type OutboxChunk = {
  key: string;
  run: string;
  segment: string;
  sequence: number;
  bytes: ArrayBuffer;
  created: number;
};
export function mayEnqueue(current: number, additional: number) {
  return additional > 0 && current + additional <= DIAGNOSTICS.localOutboxBytes;
}
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ttrpg-diagnostics-v1", 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore("chunks", { keyPath: "key" });
      store.createIndex("segment", "segment");
      store.createIndex("run", "run");
      request.result.createObjectStore("usage");
    };
    request.onerror = () => reject(new Error("indexeddb_failed"));
    request.onblocked = () => reject(new Error("indexeddb_failed"));
    request.onsuccess = () => resolve(request.result);
  });
}
export async function enqueue(chunk: OutboxChunk) {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["chunks", "usage"], "readwrite");
      const usage = tx.objectStore("usage");
      const store = tx.objectStore("chunks");
      let failure = "indexeddb_failed";
      const read = usage.get("bytes");
      read.onsuccess = () => {
        const exists = store.get(chunk.key);
        exists.onsuccess = () => {
          if (exists.result) return;
          const total = typeof read.result === "number" ? read.result : 0;
          if (!mayEnqueue(total, chunk.bytes.byteLength)) {
            failure = "outbox_limit";
            tx.abort();
            return;
          }
          store.add(chunk);
          usage.put(total + chunk.bytes.byteLength, "bytes");
        };
      };
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(new Error(failure));
      tx.onerror = () => reject(new Error(failure));
    });
  } finally {
    db.close();
  }
}
export async function pending(segment: string): Promise<OutboxChunk[]> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("chunks");
      const read = tx.objectStore("chunks").index("segment").getAll(segment, 1);
      read.onsuccess = () => resolve(read.result as OutboxChunk[]);
      read.onerror = () => reject(new Error("indexeddb_failed"));
    });
  } finally {
    db.close();
  }
}
export async function acknowledge(key: string) {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["chunks", "usage"], "readwrite");
      const chunks = tx.objectStore("chunks");
      const usage = tx.objectStore("usage");
      const read = chunks.get(key);
      read.onsuccess = () => {
        if (!read.result) return;
        const size = (read.result as OutboxChunk).bytes.byteLength;
        const total = usage.get("bytes");
        total.onsuccess = () => {
          usage.put(Math.max(0, (total.result ?? 0) - size), "bytes");
          chunks.delete(key);
        };
      };
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(new Error("indexeddb_failed"));
      tx.onerror = () => reject(new Error("indexeddb_failed"));
    });
  } finally {
    db.close();
  }
}
export async function pruneLocal(run: string) {
  const db = await open();
  try {
    const keys = await new Promise<string[]>((resolve, reject) => {
      const read = db.transaction("chunks").objectStore("chunks").index("run").getAllKeys(run);
      read.onsuccess = () => resolve(read.result as string[]);
      read.onerror = () => reject(new Error("indexeddb_failed"));
    });
    for (const key of keys) await acknowledge(key);
  } finally {
    db.close();
  }
}
// Reconcile a bounded set of old queues without reading their compressed payloads.
export async function outboxRuns(): Promise<string[]> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const runs: string[] = [];
      const read = db
        .transaction("chunks")
        .objectStore("chunks")
        .index("run")
        .openKeyCursor(null, "nextunique");
      read.onsuccess = () => {
        const cursor = read.result;
        if (!cursor || runs.length >= 8) return resolve(runs);
        runs.push(String(cursor.key));
        cursor.continue();
      };
      read.onerror = () => reject(new Error("indexeddb_failed"));
    });
  } finally {
    db.close();
  }
}
