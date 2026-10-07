import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export function createAdminClient(requestTimeoutMs?: number) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase server credentials are unavailable.");
  }

  return createClient<Database>(url, secretKey, {
    ...(requestTimeoutMs
      ? {
          global: {
            fetch: (input, init) =>
              fetch(input, {
                ...init,
                signal: init?.signal
                  ? AbortSignal.any([init.signal, AbortSignal.timeout(requestTimeoutMs)])
                  : AbortSignal.timeout(requestTimeoutMs),
              }),
          },
        }
      : {}),
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
