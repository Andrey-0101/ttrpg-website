import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import * as crypto from "node:crypto";
import * as zlib from "node:zlib";
import * as contracts from "../../lib/diagnostics/contracts";
import * as validation from "../../lib/diagnostics/validation";
import * as cleanup from "../../lib/diagnostics/cleanup";

test("server derives actor/session only from verified Auth, rejecting absent/mismatched/revoked identity", async () => {
  const id = "aaaaaaaa-0000-4000-8000-000000000001",
    session = "aaaaaaaa-0000-4000-8000-000000000002";
  let user: { data: { user: { id: string } | null }; error: unknown } = {
    data: { user: { id } },
    error: null,
  };
  const claims: { data: { claims: Record<string, unknown> }; error: unknown } = {
    data: { claims: { sub: id, session_id: session } },
    error: null,
  };
  const exports: {
    actor?: () => Promise<{ id: string; session: string }>;
    sameOrigin?: (request: Request) => void;
    upload?: (
      who: unknown,
      run: string,
      segment: string,
      epoch: number,
      bytes: Uint8Array,
    ) => Promise<unknown>;
  } = {};
  let rpcCalls = 0;
  const source = transpileModule(readFileSync("lib/diagnostics/server.ts", "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, {
    exports,
    Buffer,
    Response,
    TextDecoder,
    AbortSignal,
    URL,
    process: { env: {} },
    require: (name: string) => {
      if (name === "server-only") return {};
      if (name === "node:crypto") return crypto;
      if (name === "node:zlib") return zlib;
      if (name === "@/utils/supabase/server")
        return {
          createClient: async () => ({
            auth: { getUser: async () => user, getClaims: async () => claims },
          }),
        };
      if (name === "@/utils/supabase/admin")
        return {
          createAdminClient: () => ({
            rpc: async () => {
              rpcCalls++;
              return { error: { message: "authentication_required" } };
            },
          }),
        };
      if (name.endsWith("/mapping")) return {};
      if (name === "./contracts") return contracts;
      if (name === "./validation") return validation;
      if (name === "./cleanup") return cleanup;
      throw new Error(name);
    },
  });
  const actual = await exports.actor!();
  assert.equal(actual.id, id);
  assert.equal(actual.session, session);
  claims.data.claims.sub = session;
  await assert.rejects(exports.actor!, /authentication_required/);
  claims.data.claims.sub = id;
  claims.data.claims.session_id = "not-a-session";
  await assert.rejects(exports.actor!, /authentication_required/);
  claims.data.claims.session_id = session;
  user = { data: { user: null }, error: new Error("revoked") };
  await assert.rejects(exports.actor!, /authentication_required/);
  assert.throws(
    () =>
      exports.sameOrigin!(
        new Request("https://site.test/api/diagnostics", {
          headers: { origin: "https://attacker.test" },
        }),
      ),
    /forbidden/,
  );
  assert.doesNotThrow(() =>
    exports.sameOrigin!(
      new Request("https://site.test/api/diagnostics", {
        headers: { origin: "https://site.test" },
      }),
    ),
  );
  const bomb = zlib.gzipSync(Buffer.alloc(contracts.DIAGNOSTICS.expandedChunkBytes + 1));
  await assert.rejects(() => exports.upload!({}, id, id, 1, bomb), /malformed_chunk/);
  assert.equal(rpcCalls, 0);
});
