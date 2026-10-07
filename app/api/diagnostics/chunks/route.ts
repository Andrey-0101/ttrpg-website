import {
  actor,
  upload,
  limitedBody,
  sameOrigin,
  responseError,
  DiagnosticError,
} from "@/lib/diagnostics/server";
import { UUID, DIAGNOSTICS } from "@/lib/diagnostics/contracts";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const who = await actor();
    const url = new URL(request.url);
    const run = url.searchParams.get("run");
    const segment = url.searchParams.get("segment");
    const epoch = Number(url.searchParams.get("epoch"));
    if (
      !run ||
      !UUID.test(run) ||
      !segment ||
      !UUID.test(segment) ||
      !Number.isSafeInteger(epoch) ||
      epoch < 1 ||
      request.headers.get("content-type") !== "application/gzip"
    )
      throw new DiagnosticError("malformed_request", 400);
    const bytes = await limitedBody(request, DIAGNOSTICS.compressedChunkBytes);
    return Response.json(await upload(who, run, segment, epoch, bytes), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return responseError(error);
  }
}
