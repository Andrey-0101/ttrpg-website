import {
  actor,
  dispatch,
  limitedBody,
  sameOrigin,
  responseError,
  DiagnosticError,
  publicRun,
} from "@/lib/diagnostics/server";
import { object } from "@/lib/diagnostics/validation";
import { UUID } from "@/lib/diagnostics/contracts";
import { registeredPath } from "@/lib/diagnostics/cleanup";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Database } from "@/types/database.types";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const who = await actor();
    const body: unknown = JSON.parse(new TextDecoder().decode(await limitedBody(request, 2048)));
    if (
      !object(body) ||
      typeof body.run !== "string" ||
      !UUID.test(body.run) ||
      !["manifest", "segments", "chunks", "download"].includes(String(body.action)) ||
      Object.keys(body).some((k) => !["run", "action", "cursor", "chunk"].includes(k)) ||
      (body.cursor != null &&
        (typeof body.cursor !== "string" ||
          !(body.action === "chunks"
            ? /^[0-9a-f-]{36}:\d{1,9}$/i.test(body.cursor) && UUID.test(body.cursor.split(":")[0])
            : UUID.test(body.cursor))))
    )
      throw new DiagnosticError("malformed_request", 400);
    const raw = await dispatch(who, "export", null, body.run);
    if (!object(raw)) throw new DiagnosticError("export_unavailable");
    const row = raw as unknown as Database["public"]["Tables"]["game_room_diagnostic_runs"]["Row"];
    const admin = createAdminClient(5_000);
    const headers = { "Cache-Control": "no-store" };
    if (body.action === "manifest")
      return Response.json(
        {
          schema: 1,
          run: publicRun(row),
          server_build: row.server_build,
          exported_at: new Date().toISOString(),
          completeness: row.partial ? "partial" : "complete",
          clock:
            "server UTC estimate + local wall + monotonic + sequence; uncertainty recorded; no strict cross-client ordering guarantee",
          units:
            "bytes, packets, seconds, bits/second, pixels, frames/second; loss is a fraction; SFU transport RTT is not peer RTT; null means unavailable",
          privacy:
            "Allowlisted connection statistics only. No media recordings, emails, user UUIDs, IPs, SDP, tokens, device labels, or game content.",
        },
        { headers },
      );
    if (body.action === "segments") {
      let q = admin
        .from("game_room_diagnostic_clients")
        .select(
          "id,alias,epoch,role,slot,state,joined_at,final_at,checkpoint_at,valid_progress_at,next_sequence,error",
        )
        .eq("run_id", row.id)
        .order("id")
        .limit(100);
      if (typeof body.cursor === "string") q = q.gt("id", body.cursor);
      const r = await q;
      if (r.error) throw new DiagnosticError("export_unavailable");
      return Response.json(
        { items: r.data, next: r.data.length === 100 ? r.data.at(-1)!.id : null },
        { headers },
      );
    }
    if (body.action === "chunks") {
      let q = admin
        .from("game_room_diagnostic_chunks")
        .select("id,client_id,sequence,sha256,compressed_bytes,expanded_bytes,record_count")
        .eq("run_id", row.id)
        .eq("state", "accepted")
        .order("client_id")
        .order("sequence")
        .limit(100);
      if (typeof body.cursor === "string") {
        const [client, sequence] = body.cursor.split(":");
        q = q.or(`client_id.gt.${client},and(client_id.eq.${client},sequence.gt.${sequence})`);
      }
      const r = await q;
      if (r.error) throw new DiagnosticError("export_unavailable");
      const last = r.data.at(-1);
      return Response.json(
        {
          items: r.data,
          next: r.data.length === 100 ? `${last!.client_id}:${last!.sequence}` : null,
        },
        { headers },
      );
    }
    if (typeof body.chunk !== "string" || !UUID.test(body.chunk))
      throw new DiagnosticError("malformed_request", 400);
    const r = await admin
      .from("game_room_diagnostic_chunks")
      .select("id,run_id,client_id,storage_path")
      .eq("run_id", row.id)
      .eq("id", body.chunk)
      .eq("state", "accepted")
      .maybeSingle();
    if (
      r.error ||
      !r.data ||
      !registeredPath(r.data.run_id, r.data.client_id, r.data.id, r.data.storage_path)
    )
      throw new DiagnosticError("export_unavailable");
    const file = await admin.storage.from("game-room-diagnostics").download(r.data.storage_path);
    if (file.error || !file.data) throw new DiagnosticError("export_unavailable");
    return new Response(file.data, { headers: { ...headers, "Content-Type": "application/gzip" } });
  } catch (error) {
    return responseError(error);
  }
}
