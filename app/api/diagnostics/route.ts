import {
  actor,
  dispatch,
  state,
  serverBuild,
  limitedBody,
  sameOrigin,
  responseError,
  DiagnosticError,
  cleanup,
} from "@/lib/diagnostics/server";
import { object } from "@/lib/diagnostics/validation";
import { UUID } from "@/lib/diagnostics/contracts";
import type { Json } from "@/types/database.types";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const who = await actor();
    const body: unknown = JSON.parse(new TextDecoder().decode(await limitedBody(request, 4096)));
    if (
      !object(body) ||
      typeof body.action !== "string" ||
      Object.keys(body).some(
        (k) =>
          ![
            "action",
            "campaign",
            "run",
            "segment",
            "epoch",
            "instance",
            "visibility",
            "error",
            "reason",
            "next_sequence",
          ].includes(k),
      )
    )
      throw new DiagnosticError("malformed_request", 400);
    const campaign =
      typeof body.campaign === "string" && UUID.test(body.campaign) ? body.campaign : null;
    const run = typeof body.run === "string" && UUID.test(body.run) ? body.run : null;
    if (body.action === "capability")
      return Response.json(await dispatch(who, "capability", null, null), {
        headers: { "Cache-Control": "no-store" },
      });
    if (body.action === "owner")
      return Response.json(await state(who, null, null, true), {
        headers: { "Cache-Control": "no-store" },
      });
    if (!campaign && !run) throw new DiagnosticError("malformed_request", 400);
    if (body.action === "state")
      return Response.json(await state(who, campaign, run), {
        headers: { "Cache-Control": "no-store" },
      });
    if (
      ![
        "start",
        "stop",
        "owner_heartbeat",
        "join",
        "heartbeat",
        "final",
        "request_cleanup",
      ].includes(body.action)
    )
      throw new DiagnosticError("malformed_request", 400);
    if (body.action !== "start" && !run) throw new DiagnosticError("malformed_request", 400);
    const input: Record<string, Json> = {};
    if (body.action === "start") input.build = serverBuild();
    if (body.action === "stop")
      input.reason = body.reason === "route_exit" ? "route_exit" : "explicit";
    if (body.action === "join") {
      if (typeof body.instance !== "string" || !UUID.test(body.instance))
        throw new DiagnosticError("malformed_request", 400);
      input.instance = body.instance;
    }
    if (["heartbeat", "final"].includes(body.action)) {
      if (
        typeof body.segment !== "string" ||
        !UUID.test(body.segment) ||
        !Number.isSafeInteger(body.epoch) ||
        (body.epoch as number) < 1
      )
        throw new DiagnosticError("malformed_request", 400);
      input.segment = body.segment;
      input.epoch = body.epoch as number;
      if (body.action === "heartbeat") {
        input.visibility = body.visibility === "background" ? "background" : "foreground";
        input.error = typeof body.error === "string" ? body.error : null;
      } else {
        if (!Number.isSafeInteger(body.next_sequence) || (body.next_sequence as number) < 0)
          throw new DiagnosticError("malformed_request", 400);
        input.next_sequence = body.next_sequence as number;
      }
    }
    if (body.action === "request_cleanup") {
      const existing = await dispatch(who, "state", null, run);
      if (object(existing) && existing.cleanup_requested_at != null) {
        const authorized = await state(who, null, run);
        if (!authorized.owner) throw new DiagnosticError("developer_gm_required");
        return Response.json(await cleanup(run), { headers: { "Cache-Control": "no-store" } });
      }
    }
    const result = await dispatch(who, body.action, campaign, run, input);
    if (body.action === "request_cleanup")
      return Response.json(await cleanup(run), { headers: { "Cache-Control": "no-store" } });
    // Internal DB rows never cross the client boundary, including actor/session hashes and paths.
    if (body.action === "join" && object(result))
      return Response.json(
        {
          id: result.id,
          alias: result.alias,
          epoch: result.epoch,
          lease_until: result.lease_until,
          next_sequence: result.next_sequence,
          state: result.state,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (body.action === "heartbeat" || body.action === "final")
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    return Response.json(await state(who, campaign, run), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return responseError(error);
  }
}
