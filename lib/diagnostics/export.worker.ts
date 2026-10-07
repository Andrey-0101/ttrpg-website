import { Zip, ZipDeflate, gunzipSync, strToU8 } from "fflate";
import type { DiagnosticChunk } from "./contracts";
import { DIAGNOSTICS } from "./contracts";
import type { ExportChunk, ExportManifest, ExportSegment } from "./export-contracts";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<{ run: string }>) => void) | null;
  postMessage(value: unknown): void;
};
const README =
  "Schema version: 1. Files: manifest.json, combined-events.ndjson and participants/<alias>/<segment>/{client.json,connections.ndjson,tracks.ndjson,events.ndjson,errors.ndjson}.\n" +
  "Technical diagnostics: allowlisted connection statistics only, no audio/video recording.\nTimes: client monotonic ms + wall UTC ms + estimated server UTC ms, with uncertainty. No strict cross-client ordering guarantee.\nDirection: local_outbound, remote_inbound, sfu_feedback; transport is SFU-wide, not peer RTT.\nUnits: seconds for jitter/RTT/buffer delay, bits/second for bitrate, packets/bytes/frames for counters, loss as fraction. Null means unavailable, not zero. Counter resets/gaps invalidate derived rates.\nSegments are separate reload/tab epochs. Fenced/unfinished segments, missing sequences, errors and deadlines make the artifact partial.\nNo MOS score or guarantee of media quality. Build identities may be unknown.\n";
async function request(run: string, action: string, extra: Record<string, unknown> = {}) {
  const response = await fetch("/api/diagnostics/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run, action, ...extra }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("export_unavailable");
  return response;
}
scope.onmessage = async ({ data }) => {
  try {
    const manifest = (await (await request(data.run, "manifest")).json()) as ExportManifest;
    const segments = new Map<string, ExportSegment>();
    let cursor: string | null = null;
    do {
      const page = (await (await request(data.run, "segments", { cursor })).json()) as {
        items: ExportSegment[];
        next: string | null;
      };
      for (const segment of page.items) segments.set(segment.id, segment);
      cursor = page.next;
      if (segments.size > 10_000) throw new Error("export_limit");
    } while (cursor);
    const parts: Uint8Array<ArrayBuffer>[] = [];
    let zipBytes = 0;
    const zip = new Zip((error, chunk) => {
      if (error) throw error;
      zipBytes += chunk.length;
      if (zipBytes > 512 * 1024 * 1024) throw new Error("export_limit");
      parts.push(new Uint8Array(chunk));
    });
    const file = (name: string) => {
      const entry = new ZipDeflate(name, { level: 3 });
      zip.add(entry);
      return entry;
    };
    const add = (name: string, value: unknown) => {
      const entry = file(name);
      entry.push(strToU8(typeof value === "string" ? value : JSON.stringify(value, null, 2)), true);
    };
    add("README.txt", README);
    const combined = file("combined-events.ndjson");
    const outputs = new Map<
      string,
      { connections: ZipDeflate; tracks: ZipDeflate; events: ZipDeflate; errors: ZipDeflate }
    >();
    const clients = new Map<
      string,
      Extract<DiagnosticChunk["records"][number], { kind: "client" }>
    >();
    const observed = new Map<string, Set<number>>();
    const encounteredSessions = new Set<string>();
    const gapCounts = new Map<string, number>();
    let totalCompressed = 0;
    for (const segment of segments.values()) {
      const prefix = `participants/${segment.alias}/${segment.id}`;
      const output = {
        connections: file(`${prefix}/connections.ndjson`),
        tracks: file(`${prefix}/tracks.ndjson`),
        events: file(`${prefix}/events.ndjson`),
        errors: file(`${prefix}/errors.ndjson`),
      };
      outputs.set(segment.id, output);
      observed.set(segment.id, new Set());
      output.errors.push(
        strToU8(JSON.stringify({ kind: "segment_summary", ...segment }) + "\n"),
        false,
      );
    }
    cursor = null;
    do {
      const page = (await (await request(data.run, "chunks", { cursor })).json()) as {
        items: ExportChunk[];
        next: string | null;
      };
      for (const item of page.items) {
        const response = await request(data.run, "download", { chunk: item.id });
        const compressed = new Uint8Array(await response.arrayBuffer());
        totalCompressed += compressed.length;
        if (totalCompressed > DIAGNOSTICS.runBytes || compressed.length !== item.compressed_bytes)
          throw new Error("export_limit");
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", compressed)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (hash !== item.sha256) throw new Error("chunk_integrity");
        // Server already validated expanded size. A fixed output buffer bounds re-expansion.
        const expanded = gunzipSync(compressed, { out: new Uint8Array(item.expanded_bytes) });
        const payload = JSON.parse(new TextDecoder().decode(expanded)) as DiagnosticChunk;
        const segment = segments.get(item.client_id);
        const output = outputs.get(item.client_id);
        if (
          !segment ||
          !output ||
          payload.segment !== item.client_id ||
          payload.sequence !== item.sequence
        )
          throw new Error("chunk_integrity");
        observed.get(item.client_id)!.add(item.sequence);
        for (const record of payload.records) {
          if (record.kind === "event" && record.code === "session_changed" && record.session)
            encounteredSessions.add(record.session);
          if (record.kind === "event" && record.code === "collection_gap")
            gapCounts.set(segment.id, (gapCounts.get(segment.id) ?? 0) + 1);
          const line = strToU8(JSON.stringify(record) + "\n");
          combined.push(
            strToU8(
              JSON.stringify({ participant: segment.alias, segment: segment.id, ...record }) + "\n",
            ),
            false,
          );
          if (record.kind === "client") clients.set(segment.id, record);
          else if (record.kind === "track") output.tracks.push(line, false);
          else if (record.kind === "sample" || record.kind === "connection")
            output.connections.push(line, false);
          else {
            output.events.push(line, false);
            if (record.kind === "event" && /failed|limit|gap|expired/.test(record.code))
              output.errors.push(line, false);
          }
        }
      }
      cursor = page.next;
      scope.postMessage({ progress: true });
    } while (cursor);
    let partial = manifest.completeness === "partial" || gapCounts.size > 0;
    const missingClients: { alias: string; segment: string; missing_chunks: number[] }[] = [];
    for (const segment of segments.values()) {
      const sequences = observed.get(segment.id)!;
      const missing = Array.from({ length: segment.next_sequence }, (_, i) => i).filter(
        (i) => !sequences.has(i),
      );
      if (
        missing.length ||
        segment.state !== "finished" ||
        segment.error ||
        !segment.valid_progress_at
      ) {
        partial = true;
        missingClients.push({ alias: segment.alias, segment: segment.id, missing_chunks: missing });
      }
      const output = outputs.get(segment.id)!;
      output.errors.push(
        strToU8(JSON.stringify({ kind: "missing_chunks", sequences: missing }) + "\n"),
        false,
      );
      for (const entry of Object.values(output)) entry.push(new Uint8Array(), true);
      add(
        `participants/${segment.alias}/${segment.id}/client.json`,
        clients.get(segment.id) ?? { missing: true },
      );
    }
    combined.push(new Uint8Array(), true);
    add("manifest.json", {
      ...manifest,
      completeness: partial ? "partial" : "complete",
      compressed_input_bytes: totalCompressed,
      run_alias: manifest.run.id,
      run_role: "developer_game_master",
      encountered_game_sessions: [...encounteredSessions],
      telemetry_cadence_ms: {
        sample: DIAGNOSTICS.sampleMs,
        heartbeat: DIAGNOSTICS.heartbeatMs,
        checkpoint: DIAGNOSTICS.checkpointMs,
      },
      missing_clients: missingClients,
      data_gaps: [...gapCounts].map(([segment, count]) => ({ segment, count })),
      segments: [...segments.values()].map((segment) => ({
        ...segment,
        client_build: clients.get(segment.id)?.build ?? null,
        client_metadata: clients.get(segment.id) ?? null,
      })),
    });
    zip.end();
    const blob = new Blob(parts, { type: "application/zip" });
    const stamp = manifest.run.started_at.replace(/[:.]/g, "-");
    scope.postMessage({ blob, filename: `diagnostics-${stamp}-${manifest.run.id}.zip`, partial });
  } catch {
    scope.postMessage({ error: "export_unavailable" });
  }
};
