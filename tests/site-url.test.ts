import assert from "node:assert/strict";
import test from "node:test";

import {
  createCampaignInvitationPath,
  createRegistrationCallbackUrl,
  createSiteUrl,
  normalizeSiteOrigin,
  resolveSiteOrigin,
} from "../lib/site-url";

test("a valid configured production URL is preferred", () => {
  assert.equal(
    resolveSiteOrigin("https://ttrpg.fans", "http://localhost:3000"),
    "https://ttrpg.fans",
  );
});

test("configured credentials, path, query, fragment, and trailing slash are removed", () => {
  assert.equal(
    normalizeSiteOrigin(
      "https://user:password@ttrpg.fans/catalogue/?view=all#systems",
    ),
    "https://ttrpg.fans",
  );
});

test("non-HTTP protocols and malformed URLs are rejected", () => {
  assert.equal(normalizeSiteOrigin("javascript:alert(1)"), null);
  assert.equal(normalizeSiteOrigin("not a URL"), null);
  assert.equal(
    resolveSiteOrigin("ftp://example.com", "http://localhost:3000"),
    "http://localhost:3000",
  );
});

test("missing configuration and origin return null without throwing", () => {
  assert.equal(resolveSiteOrigin(undefined, undefined), null);
  assert.equal(createSiteUrl("/auth/confirm", undefined, undefined), null);
});

test("invalid supplied browser origins are rejected", () => {
  assert.equal(resolveSiteOrigin(undefined, "not a URL"), null);
  assert.equal(resolveSiteOrigin(undefined, "ftp://localhost:3000"), null);
  assert.equal(
    createSiteUrl("/auth/confirm", "javascript:alert(1)", undefined),
    null,
  );
});

test("local and Vercel Preview origins are selected as URL fallbacks", () => {
  assert.equal(
    resolveSiteOrigin(undefined, "http://localhost:3000/path"),
    "http://localhost:3000",
  );
  assert.equal(
    resolveSiteOrigin(undefined, "https://example-git-branch.vercel.app/path"),
    "https://example-git-branch.vercel.app",
  );
});

test("the English production registration callback is exact", () => {
  assert.equal(
    createRegistrationCallbackUrl(
      "en",
      "http://localhost:3000",
      "https://ttrpg.fans/configuration/path/",
    )?.toString(),
    "https://ttrpg.fans/auth/confirm?locale=en",
  );
});

test("the Russian production registration callback is exact", () => {
  assert.equal(
    createRegistrationCallbackUrl(
      "ru",
      "http://localhost:3000",
      "https://ttrpg.fans/configuration/path/",
    )?.toString(),
    "https://ttrpg.fans/auth/confirm?locale=ru",
  );
});

test("the complete local registration callback uses the browser origin", () => {
  assert.equal(
    createRegistrationCallbackUrl(
      "en",
      "http://127.0.0.1:3000/unexpected/path",
      null,
    )?.toString(),
    "http://127.0.0.1:3000/auth/confirm?locale=en",
  );
});

test("the complete Preview registration callback uses the browser origin", () => {
  assert.equal(
    createRegistrationCallbackUrl(
      "ru",
      "https://example-git-branch.vercel.app/unexpected/path",
      null,
    )?.toString(),
    "https://example-git-branch.vercel.app/auth/confirm?locale=ru",
  );
});

test("unsafe application paths are rejected", () => {
  const currentOrigin = "http://localhost:3000";
  const configuredSiteUrl = "https://ttrpg.fans";
  const unsafePaths = [
    "https://attacker.example/auth/confirm",
    "https://ttrpg.fans/auth/confirm",
    "https://user:password@ttrpg.fans/auth/confirm",
    "//attacker.example/auth/confirm",
    String.raw`\\attacker.example\auth\confirm`,
    String.raw`/\attacker.example/auth/confirm`,
    String.raw`/auth\confirm`,
    "auth/confirm",
  ];

  for (const unsafePath of unsafePaths) {
    assert.equal(
      createSiteUrl(unsafePath, currentOrigin, configuredSiteUrl),
      null,
      unsafePath,
    );
  }
});

test("safe query strings and fragments remain intact", () => {
  const url = createSiteUrl(
    "/auth/confirm?locale=ru#complete",
    "http://localhost:3000",
    "https://ttrpg.fans",
  );

  assert.equal(
    url?.toString(),
    "https://ttrpg.fans/auth/confirm?locale=ru#complete",
  );
});

test("campaign invitation tokens are encoded by the shared path builder", () => {
  const joinPath = createCampaignInvitationPath(
    "en",
    "token/with?query#fragment% space Ж",
  );
  assert.equal(
    joinPath,
    "/en/campaigns/join/token%2Fwith%3Fquery%23fragment%25%20space%20%D0%96",
  );

  const invitationUrl = createSiteUrl(
    joinPath,
    "https://preview.vercel.app",
    "https://ttrpg.fans",
  );

  assert.equal(
    invitationUrl?.toString(),
    "https://ttrpg.fans/en/campaigns/join/token%2Fwith%3Fquery%23fragment%25%20space%20%D0%96",
  );
  assert.equal(invitationUrl?.search, "");
  assert.equal(invitationUrl?.hash, "");
  assert.equal(invitationUrl?.toString().includes("ttrpg.fans//"), false);
});
