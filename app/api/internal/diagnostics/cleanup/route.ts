import { authorizedCleanup } from "@/lib/diagnostics/cleanup";
import { cleanup, responseError } from "@/lib/diagnostics/server";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  // Do not construct clients, query DB, or touch Storage until this check succeeds.
  if (
    !authorizedCleanup(request.headers.get("authorization"), process.env.DIAGNOSTIC_CLEANUP_SECRET)
  )
    return Response.json(
      { error: "forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  try {
    return Response.json(await cleanup(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return responseError(error);
  }
}
