export class DiagnosticsHttpError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}
export async function diagnosticRequest<T>(body: Record<string, unknown>): Promise<T> {
  const result = await fetch("/api/diagnostics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data = await result.json();
  if (!result.ok)
    throw new DiagnosticsHttpError(
      typeof data.error === "string" ? data.error : "diagnostics_unavailable",
      result.status,
    );
  return data as T;
}
