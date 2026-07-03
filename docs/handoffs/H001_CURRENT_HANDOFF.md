# H001_CURRENT_HANDOFF.md

## 1. Document Control

| Field | Value |
|---|---|
| Project name | **Web_Site_TTRPG / ttrpg-website** |
| Handoff ID | **H001** |
| Handoff version | **1.0** |
| Creation date | **2026-06-30** |
| Sequence position | **First project chat handoff** |
| Scope | **Only the work performed, tested, discussed, or explicitly decided in this chat: initial `next-intl` integration, localized route foundation, Dashboard/Register localization, Supabase middleware compatibility, GitHub synchronization, and Vercel deployment recovery.** |
| Repository URL | **VERIFIED:** `https://github.com/Andrey-0101/ttrpg-website` |
| Branch | **VERIFIED:** `main` |
| Chat-terminal HEAD commit | **VERIFIED (abbreviated):** `e00fa6f` — `Trigger Vercel deployment` |
| Full HEAD SHA | **UNVERIFIED:** N/A. The full SHA was not printed in this chat. |
| Code-bearing parent commit | **VERIFIED:** `e96ee5d83feb30a22e00a9113b4cbea21235f616` — `Add bilingual routing and localization` |
| Remote commit at chat close | **VERIFIED (abbreviated):** `e00fa6f` was pushed to `origin/main` |
| Working tree at chat close | **ASSUMED CLEAN:** `git status` was clean immediately before the empty trigger commit; the trigger commit changed zero files. A final `git status` after `e00fa6f` was not shown. |
| Ahead/behind at chat close | **ASSUMED:** `0/0` after successful push; not rechecked with `git status` after the empty commit. |
| Production URL | **VERIFIED:** `https://ttrpg-website-xi.vercel.app` |
| Deployment status | **VERIFIED:** production deployment was created after `e00fa6f`; the user confirmed the production site and tested localized routes successfully. |
| Secrets included | **VERIFIED:** none |

> **Snapshot rule:** This handoff describes the repository state at the end of Chat H001. A later repository HEAD must not be treated as part of this handoff.

---

## 2. Источники информации и истины

### 2.1 Использованные источники

| Source | Status | Use |
|---|---|---|
| Current chat messages | **VERIFIED** | Primary evidence for commands, code snippets, decisions, manual tests, build results, Git operations, and deployment verification. |
| User-provided command output | **VERIFIED** | `npm run build`, `git status`, `git commit`, `git push`, route lists, and middleware diagnostics. |
| User-provided screenshots | **VERIFIED** | Vercel Deployments, Git integration, GitHub checks, browser behavior, and 404/locale symptoms. |
| Attached diagnostic log `Pasted text.txt` | **VERIFIED** | Confirmed `requestLocale: undefined`, server/client locale mismatch, and browser-extension hydration attributes during diagnosis. |
| Repository history for the two H001 commits | **VERIFIED** | Confirmed `e96ee5d` and the zero-file trigger commit `e00fa6f`. |
| Production behavior reported by the user | **VERIFIED** | Confirmed `/en`, `/ru`, login routes, language switching, and deployment success. |

### 2.2 Источники, которых не было или которые не использовались

| Source | Status |
|---|---|
| `PROJECT_CONTEXT.md` | **N/A** |
| Previous handoff documents | **N/A** — H001 is the first handoff. |
| Thematic specifications | **N/A** |
| ADR files | **N/A** |
| SQL migration files | **N/A** |
| Generated database types | **N/A** |
| Database schema export | **N/A** |
| Supabase policy export | **N/A** |
| Storage bucket/policy export | **N/A** |
| Automated test suite output | **N/A** |
| Lint command output | **N/A** |
| Dedicated translation-key validation report | **N/A** |

---

## 3. Source-of-Truth Priority

The following priority must be used when continuing from this handoff:

1. **Code from later messages in Chat H001.**
2. **Factually tested Supabase and Vercel configuration and behavior from Chat H001.**
3. **Current functional specifications and ADRs, if later added and explicitly applicable.**
4. **Chat H001 narrative and decisions.**
5. **ASSUMED or UNVERIFIED information only after explicit re-verification.**

Additional rule:

- **DEPRECATED** snippets and diagnostic variants from earlier in this chat must not be restored.
- If the current repository has advanced beyond `e00fa6f`, inspect the newer code first and treat this document as a historical handoff, not as authority over later verified commits.

---

## 4. Current Project Snapshot

| Area | Snapshot |
|---|---|
| Technology stack | **VERIFIED:** Next.js `16.2.9`, App Router, TypeScript, Tailwind-style utility classes, `next-intl`, Supabase SSR/Auth integration, GitHub, Vercel. |
| Main implemented modules relevant to H001 | **IMPLEMENTED:** localized route foundation, global localized header, EN/RU switcher, localized Dashboard, localized Register page, Supabase session refresh through middleware, GitHub/Vercel deployment flow. |
| Active stage | **IMPLEMENTED / IN PROGRESS:** partial migration of an existing application to URL-prefixed bilingual routing. |
| Database state | **UNVERIFIED:** no SQL schema, migrations, generated types, constraints, indexes, or policies were inspected in this chat. Supabase Auth was functionally tested, but database structure was not. |
| Production state | **VERIFIED:** updated deployment became active and the user confirmed production routes and language switching work. |
| Current limitation | **VERIFIED:** localization and localized routing were not completed for every existing route by the end of H001. |

---

## 5. Scope of the Completed Chat

### 5.1 Initial goal

- **IMPLEMENTED:** establish bilingual site routing with `/en/...` and `/ru/...`.
- **IMPLEMENTED:** add a global language switcher.
- **IMPLEMENTED:** preserve the current route while switching languages.
- **DECIDED:** addresses without a locale prefix should use the last selected locale.

### 5.2 Additional tasks that appeared

- **IMPLEMENTED:** diagnose and repair the `next-intl` + Supabase middleware conflict.
- **IMPLEMENTED:** move selected existing pages under `app/[locale]`.
- **IMPLEMENTED:** localize Dashboard and Register content.
- **VERIFIED:** test Supabase login/session persistence on localized routes.
- **IMPLEMENTED:** commit and push the work to GitHub.
- **IMPLEMENTED:** recover a missed Vercel deployment event with an empty trigger commit.
- **VERIFIED:** test the production deployment.

### 5.3 Actual end state

- **VERIFIED:** the bilingual routing foundation is deployed and functional.
- **VERIFIED:** Dashboard and Register are localized.
- **VERIFIED:** Supabase session persistence works on localized Dashboard routes.
- **VERIFIED:** GitHub → Vercel integration works, although one push event was missed and required a trigger commit.
- **PLANNED:** migrate and localize the remaining routes before adding major new features.

---

## 6. Work Completed

| Status | Change | Files | Commit | Verification |
|---|---|---|---|---|
| **IMPLEMENTED** | Installed and configured `next-intl` | `package.json`, `package-lock.json`, `next.config.ts` | `e96ee5d` | `npm run build` passed. |
| **IMPLEMENTED** | Added locale routing configuration for `en` and `ru`, default `en`, always-prefixed locale routes | `i18n/routing.ts` | `e96ee5d` | `/en` and `/ru` rendered; switcher worked after proxy fix. |
| **IMPLEMENTED** | Added locale-aware navigation helpers | `i18n/navigation.ts` | `e96ee5d` | Header links and switcher generated localized URLs. |
| **IMPLEMENTED** | Added request configuration and message loading | `i18n/request.ts`, `messages/en.json`, `messages/ru.json` | `e96ee5d` | Server/client locale resolved correctly after middleware fix. |
| **IMPLEMENTED** | Added localized layout, provider, header, and language switcher | `app/[locale]/layout.tsx`, `components/site-header.tsx`, `components/language-switcher.tsx` | `e96ee5d` | EN/RU switching tested without `/ru/ru`. |
| **IMPLEMENTED** | Converted root home route to redirect into localized routing | `app/page.tsx`, `app/layout.tsx` | `e96ee5d` | Root navigation entered localized site flow. |
| **IMPLEMENTED** | Moved Games routes under `[locale]` | `app/[locale]/games/page.tsx`, `app/[locale]/games/vampire-the-masquerade/page.tsx` | `e96ee5d` | Build listed `/[locale]/games` and VtM subroute. |
| **IMPLEMENTED** | Moved Login under `[locale]` | `app/[locale]/login/page.tsx` | `e96ee5d` | `/en/login` and `/ru/login` opened and switched correctly. |
| **IMPLEMENTED** | Moved Dashboard under `[locale]` | `app/[locale]/dashboard/page.tsx` | `e96ee5d` | Authenticated Dashboard opened for both locales. |
| **IMPLEMENTED** | Localized Dashboard content | `app/[locale]/dashboard/page.tsx`, message files | `e96ee5d` | User confirmed both language versions work. |
| **IMPLEMENTED** | Moved Register under `[locale]` | `app/[locale]/register/page.tsx` | `e96ee5d` | Build listed `/en/register` and `/ru/register`. |
| **IMPLEMENTED** | Localized Register content | `app/[locale]/register/page.tsx`, message files | `e96ee5d` | User confirmed both language versions work. |
| **IMPLEMENTED** | Combined Supabase session refresh with `next-intl` without overwriting locale middleware headers | `proxy.ts`; existing `utils/supabase/proxy.ts` retained | `e96ee5d` | Locale diagnostics, switcher, login, and Dashboard session tests passed. |
| **REMOVED** | Removed temporary locale diagnostic component and console logging | Temporary `components/locale-debug.tsx`; temporary logs in `i18n/request.ts` | `e96ee5d` final state | Final build passed without diagnostic code. |
| **VERIFIED** | Built production bundle locally | N/A | `e96ee5d` | Final shown build passed TypeScript and generated routes successfully. |
| **VERIFIED** | Pushed code-bearing localization commit | N/A | `e96ee5d` | Git push succeeded; working tree was clean immediately afterward. |
| **IMPLEMENTED** | Created zero-file commit to retrigger Vercel webhook | No files changed | `e00fa6f` | GitHub Vercel Check appeared and Vercel deployment was created. |
| **VERIFIED** | Confirmed production deployment | Vercel project | `e00fa6f` deployment of `e96ee5d` code | User confirmed production routes work. |

---

## 7. Relevant File Map

| Path | Purpose | Current State | Notes |
|---|---|---|---|
| `proxy.ts` | Composes Supabase session update with `next-intl` middleware | **IMPLEMENTED / VERIFIED** | Must copy only Supabase cookies into the `next-intl` response; do not overwrite middleware headers. |
| `utils/supabase/proxy.ts` | Refreshes Supabase Auth state with `createServerClient` and `getClaims()` | **IMPLEMENTED / VERIFIED BY INTEGRATION TEST** | File content was provided in chat; it was not changed during the final fix. |
| `next.config.ts` | Enables `next-intl` plugin | **IMPLEMENTED** | Uses `./i18n/request.ts`. |
| `i18n/routing.ts` | Defines locales and locale-prefix behavior | **IMPLEMENTED** | `en`, `ru`; default `en`; `localePrefix: "always"`. |
| `i18n/navigation.ts` | Locale-aware `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname` | **IMPLEMENTED** | Prefer these helpers for localized application routes. |
| `i18n/request.ts` | Resolves request locale and loads message JSON | **IMPLEMENTED** | Temporary diagnostics were removed. |
| `messages/en.json` | English messages | **IMPLEMENTED / PARTIAL** | Confirmed namespaces: `Navigation`, `Common`, `Dashboard`, `Register`. |
| `messages/ru.json` | Russian messages | **IMPLEMENTED / PARTIAL** | Same confirmed namespaces as English. |
| `components/site-header.tsx` | Global localized header | **IMPLEMENTED / VERIFIED** | Uses locale-aware links and translated navigation labels. |
| `components/language-switcher.tsx` | EN/RU route-preserving switcher | **IMPLEMENTED / VERIFIED** | The `/ru/ru` defect is fixed. |
| `app/[locale]/layout.tsx` | Locale validation, request locale setup, provider, header | **IMPLEMENTED / VERIFIED** | Main localized layout. |
| `app/layout.tsx` | Root document layout | **IMPLEMENTED / UNVERIFIED DETAIL** | Old global header was removed. Exact final `<html lang>` handling was not re-inspected in H001. |
| `app/page.tsx` | Root route redirect | **IMPLEMENTED** | Redirects into localized site flow. |
| `app/[locale]/page.tsx` | Localized home route | **IMPLEMENTED / PARTIALLY LOCALIZED** | Home content remained English during H001 tests. |
| `app/[locale]/games/page.tsx` | Localized Games route | **IMPLEMENTED / CONTENT LOCALIZATION UNVERIFIED** | Route exists; full content translation was not completed in H001. |
| `app/[locale]/games/vampire-the-masquerade/page.tsx` | Localized VtM game route | **IMPLEMENTED / CONTENT LOCALIZATION UNVERIFIED** | Route exists; full content translation was not completed in H001. |
| `app/[locale]/login/page.tsx` | Localized Login route | **IMPLEMENTED / CONTENT LOCALIZATION UNVERIFIED** | Route and switching work; interface translation was not completed in H001. |
| `app/[locale]/dashboard/page.tsx` | Protected localized Dashboard | **IMPLEMENTED / VERIFIED** | Uses Supabase claims and `Dashboard` translations. |
| `app/[locale]/register/page.tsx` | Localized registration UI | **IMPLEMENTED / VERIFIED WITH UX RISK** | Still displays raw `error.message` from Supabase. |
| `app/auth/confirm/...` | Email-confirmation service route | **IMPLEMENTED PRE-EXISTING / UNVERIFIED IN FINAL I18N FLOW** | Kept outside `[locale]`. Exact file type and behavior were not inspected in H001. |
| `app/auth/signout/...` | Sign-out service route | **IMPLEMENTED PRE-EXISTING / UNVERIFIED IN FINAL I18N FLOW** | Kept outside `[locale]`. |
| `app/profile/...` | Existing profile routes | **IMPLEMENTED PRE-EXISTING / NOT MIGRATED** | Build showed `/profile` and `/profile/edit` outside `[locale]`. |
| `app/characters/...` | Existing character routes | **IMPLEMENTED PRE-EXISTING / NOT MIGRATED** | Build showed character routes outside `[locale]`. |
| `package.json` | Dependencies and scripts | **IMPLEMENTED** | Contains `next-intl`. |
| `package-lock.json` | Locked dependency graph | **IMPLEMENTED** | Updated with package installation. |

---

## 8. Current Data Contracts

### 8.1 Confirmed database columns

**UNVERIFIED:** N/A.

No SQL schema, table definition, migration, generated type, or Supabase schema export was provided or inspected in this chat. Do not infer columns from UI code.

### 8.2 Current TypeScript types

| Contract | Status | Definition |
|---|---|---|
| Site locale | **IMPLEMENTED** | `Locale = (typeof routing.locales)[number]` |
| Supported values | **VERIFIED** | `"en" | "ru"` |
| Locale layout params | **IMPLEMENTED** | `params: Promise<{ locale: string }>` in the shown localized layout pattern |
| Register form state | **IMPLEMENTED** | Local string states for `email`, `password`, `message`; boolean `loading` |
| Dashboard auth identity | **IMPLEMENTED** | Email read from Supabase claims if it is a string; otherwise translated fallback label |

### 8.3 Current JSON/JSONB format

#### Translation JSON

**IMPLEMENTED / VERIFIED:**

```text
messages/en.json
messages/ru.json
```

Confirmed top-level namespaces at H001 close:

```text
Navigation
Common
Dashboard
Register
```

Both locale files were replaced with matching visible key sets in this chat.

#### Database JSON/JSONB

**UNVERIFIED:** N/A.

No current JSONB data contract was inspected in H001.

### 8.4 Current `schemaVersion`

**N/A:** no application data schema version was shown.

### 8.5 Target model

| Target | Status |
|---|---|
| URL is the source of truth for site locale | **DECIDED / IMPLEMENTED** |
| Site locale is `en` or `ru` | **DECIDED / IMPLEMENTED** |
| Locale-less URLs use the last selected language | **DECIDED / VERIFIED** |
| Character sheet language must be independent from site locale | **DECIDED / NOT IMPLEMENTED IN H001** |
| Proposed persistent field for sheet language | **PLANNED / UNVERIFIED:** a future field was discussed, but no migration or column creation was verified in H001. |

### 8.6 Required migrations

- **N/A for work completed in H001:** no database migration was required or performed for site localization.
- **PLANNED:** a future migration may be required for independent character-sheet language, but the table, column name, default, constraint, and migration strategy must be verified before implementation.

### 8.7 Backward compatibility rules

| Rule | Status |
|---|---|
| New application pages should use locale-prefixed routes | **DECIDED / IMPLEMENTED PARTIALLY** |
| Old unlocalized page routes for migrated pages are removed | **IMPLEMENTED** |
| Locale-less public URLs are redirected by `next-intl` according to persisted locale detection | **VERIFIED** |
| Service auth routes remain outside `[locale]` | **DECIDED / FINAL BEHAVIOR UNVERIFIED** |
| Existing user data must not be lost during future migrations | **USER REQUIREMENT / DECIDED** |

---

## 9. Database, RLS and Storage State

| Area | State |
|---|---|
| Existing tables | **UNVERIFIED:** N/A |
| Confirmed columns | **UNVERIFIED:** N/A |
| Constraints | **UNVERIFIED:** N/A |
| Indexes | **UNVERIFIED:** N/A |
| RLS enabled/disabled state | **UNVERIFIED:** N/A |
| Confirmed RLS policies | **UNVERIFIED:** N/A |
| Missing/unverified policies | **UNVERIFIED:** all database policies were outside H001 evidence |
| Storage buckets | **UNVERIFIED:** N/A |
| Storage policies | **UNVERIFIED:** N/A |
| Storage path conventions | **UNVERIFIED:** N/A |
| Generated database types | **N/A** |
| SQL migrations | **N/A** |
| Supabase Dashboard-only settings | **UNVERIFIED:** environment integration exists and Auth works, but Dashboard settings were not enumerated in H001 |
| Supabase Auth behavior | **VERIFIED:** login succeeded and session was retained on `/en/dashboard` and `/ru/dashboard` |
| Environment variables | **IMPLEMENTED / VALUES REDACTED:** the local build detected `.env.local`; no variable names or values should be reconstructed from this handoff |

---

## 10. Confirmed Architectural Decisions

| Decision | Status | Reason | Related Files or ADR |
|---|---|---|---|
| Use URL-prefixed localization: `/en/...`, `/ru/...` | **DECIDED / IMPLEMENTED** | Stable, shareable URLs and explicit locale context. | `i18n/routing.ts`; ADR: **N/A** |
| Always include locale prefix on localized application routes | **DECIDED / IMPLEMENTED** | Avoid ambiguous route state. | `i18n/routing.ts` |
| Remember the last selected locale for URLs without a prefix | **DECIDED / VERIFIED** | User explicitly selected this behavior. | `i18n/routing.ts`, `proxy.ts` |
| Use `@/i18n/navigation` for locale-aware application navigation | **DECIDED / IMPLEMENTED** | Prevent manual locale concatenation and duplicate prefixes. | `i18n/navigation.ts` |
| One localized layout provides the global header and provider | **DECIDED / IMPLEMENTED** | Avoid duplicating header/switcher logic on every page. | `app/[locale]/layout.tsx`, `components/site-header.tsx` |
| Run Supabase session refresh and `next-intl` in one root proxy | **DECIDED / IMPLEMENTED** | Both Auth cookies and locale routing are required on the same requests. | `proxy.ts`, `utils/supabase/proxy.ts` |
| Copy only Supabase cookies into the `next-intl` response | **DECIDED / VERIFIED** | Copying middleware headers overwrote locale routing state and caused `requestLocale` to be undefined. | `proxy.ts` |
| Do not copy Supabase middleware override headers over `next-intl` headers | **DEPRECATED OLD APPROACH / VERIFIED FIX** | It caused English content on `/ru` and `/ru/ru` navigation. | `proxy.ts` |
| Keep site locale independent from future character-sheet language | **DECIDED / NOT IMPLEMENTED** | A user may use the site in one language and a sheet in another. | ADR: **N/A** |
| Keep `/auth/confirm` and `/auth/signout` outside `[locale]` for now | **DECIDED / FINAL BEHAVIOR UNVERIFIED** | They are service routes; exact locale-preservation behavior still requires testing. | `app/auth/...`, `proxy.ts` |
| Stabilize existing localization before major new features | **DECIDED / PLANNED** | Reduces routing, Auth, and data-loss risk. | Roadmap document: **N/A** |

---

## 11. Functional Requirements Preserved

### 11.1 Functionality

- **IMPLEMENTED:** EN/RU language switching must preserve the current localized route.
- **IMPLEMENTED:** authenticated Dashboard must remain accessible after language switching.
- **IMPLEMENTED:** registration and login routes must exist under both locale prefixes.
- **PLANNED:** remaining profile and character routes must be moved under `[locale]`.
- **PLANNED:** remaining visible interface text must be moved into dictionaries.
- **PLANNED:** character-sheet language must be independently selectable in the future.

### 11.2 UX

- **USER REQUIREMENT:** instructions should proceed in small, sequential steps with verification before the next change.
- **IMPLEMENTED:** the active language button is disabled/visually selected.
- **DECIDED:** locale-less URLs should open in the last selected locale.
- **USER REQUIREMENT:** raw backend errors must not be shown to end users.
- **KNOWN GAP:** Register currently uses Supabase `error.message` directly.

### 11.3 Constraints

- **USER REQUIREMENT:** do not lose existing user data.
- **USER REQUIREMENT:** inspect the current file before replacing it.
- **USER REQUIREMENT:** use complete file versions for larger changes.
- **DECIDED:** service routes and application routes must not be mixed without explicit middleware testing.

### 11.4 Localization

- **IMPLEMENTED:** supported locales are English and Russian.
- **IMPLEMENTED:** localized routes use explicit prefixes.
- **IMPLEMENTED PARTIALLY:** Navigation, Dashboard, and Register have dictionary entries.
- **PLANNED:** Home, Games, VtM page, Login, Profile, and Characters require full localization.
- **DECIDED:** site locale does not automatically dictate character-sheet language.

### 11.5 Security

- **VERIFIED:** Supabase session remained available after middleware composition.
- **USER REQUIREMENT:** never expose secrets or `.env` values.
- **USER REQUIREMENT:** do not display raw backend errors.
- **UNVERIFIED:** database RLS and Storage policies were not inspected in H001.

### 11.6 Data handling

- **USER REQUIREMENT:** preserve existing user data during route, schema, and UI migrations.
- **PLANNED:** any future character-sheet language migration must define a backward-compatible default and preserve existing records.
- **UNVERIFIED:** current database JSON/JSONB contracts were not inspected.

### 11.7 Mobile adaptation

- **UNVERIFIED:** no mobile-specific acceptance test was performed in H001.
- **IMPLEMENTED PARTIALLY:** header uses flex wrapping, but responsive behavior was not formally verified.

### 11.8 Preparation for future functions

- **DECIDED:** complete and stabilize localization before adding large new modules.
- **PLANNED:** independent sheet language, remaining route migration, and later application features are outside H001 implementation scope.

---

## 12. User Requirements and Working Preferences

The following are durable project-working rules:

1. **USER REQUIREMENT:** the user works in **Windows CMD**.
2. **USER REQUIREMENT:** instructions must be sequential and broken into small verified steps.
3. **USER REQUIREMENT:** after each significant change, run an appropriate check before continuing.
4. **USER REQUIREMENT:** for large edits, provide full file content rather than fragmented patches.
5. **USER REQUIREMENT:** all code and comments inside code blocks must be in English.
6. **USER REQUIREMENT:** before replacing a file, inspect or request its current version.
7. **USER REQUIREMENT:** do not expose raw backend errors to end users.
8. **USER REQUIREMENT:** implement the functional foundation before detailed visual design.
9. **USER REQUIREMENT:** do not lose existing user data.
10. **USER REQUIREMENT:** do not expose secrets, API keys, passwords, service-role keys, tokens, or `.env` values.
11. **USER REQUIREMENT:** do not assume planned database columns or policies exist.
12. **USER REQUIREMENT:** when a problem appears, isolate and test it before making broad changes.
13. **USER REQUIREMENT:** the project should retain clear version/history boundaries across chats and handoffs.

---

## 13. Localization State

### 13.1 Supported locales

| Locale | Status |
|---|---|
| `en` | **IMPLEMENTED / VERIFIED** |
| `ru` | **IMPLEMENTED / VERIFIED** |

### 13.2 Routing behavior

| Behavior | Status |
|---|---|
| `localePrefix: "always"` | **IMPLEMENTED** |
| Default locale is `en` | **IMPLEMENTED** |
| `/en/...` and `/ru/...` routes | **VERIFIED** |
| Language switch preserves page path | **VERIFIED** on tested localized routes |
| Duplicate `/ru/ru` prevention | **VERIFIED** |
| Locale-less URL uses persisted last locale | **DECIDED / VERIFIED** using `/login` → `/ru/login` |
| Production locale routing | **VERIFIED** |

### 13.3 Dictionary structure

Confirmed namespaces:

```text
Navigation
Common
Dashboard
Register
```

- **IMPLEMENTED:** `messages/en.json`
- **IMPLEMENTED:** `messages/ru.json`
- **UNVERIFIED:** no automated parity checker was run.
- **VERIFIED MANUALLY:** the full files provided in H001 contained matching keys for the confirmed namespaces.

### 13.4 Metadata

- **UNVERIFIED:** localized metadata was not implemented or tested in H001.
- **UNVERIFIED:** root document language handling was not re-inspected after the final implementation.
- **PLANNED:** metadata and `<html lang>` should be verified in a later step.

### 13.5 Localized content

| Page/area | State |
|---|---|
| Global navigation | **IMPLEMENTED / VERIFIED** |
| Dashboard | **IMPLEMENTED / VERIFIED** |
| Register | **IMPLEMENTED / VERIFIED** |
| Home | **ROUTE IMPLEMENTED / CONTENT NOT LOCALIZED IN H001** |
| Games | **ROUTE IMPLEMENTED / CONTENT LOCALIZATION UNVERIFIED** |
| VtM game page | **ROUTE IMPLEMENTED / CONTENT LOCALIZATION UNVERIFIED** |
| Login | **ROUTE IMPLEMENTED / CONTENT LOCALIZATION UNVERIFIED** |
| Profile | **NOT MIGRATED / NOT LOCALIZED IN H001** |
| Characters | **NOT MIGRATED / NOT LOCALIZED IN H001** |

### 13.6 Site locale vs sheet language

- **DECIDED:** site locale and character-sheet language are independent concepts.
- **NOT IMPLEMENTED:** no verified database field, migration, type, selector, or persistence mechanism for sheet language exists in H001.
- **BLOCKED:** implementation requires inspection of the actual character schema and generated types, if any.

### 13.7 Missing translations and key checks

- **KNOWN MISSING:** Home page visible text.
- **UNVERIFIED / LIKELY MISSING:** Games, VtM page, and Login visible text.
- **NOT STARTED IN H001:** Profile and Characters translations.
- **N/A:** no automated missing-key report.

---

## 14. Verification Evidence

### 14.1 Commands executed

- **VERIFIED:** `npm run dev`
- **VERIFIED:** repeated `npm run build`
- **VERIFIED:** `git status`
- **VERIFIED:** `git branch --show-current`
- **VERIFIED:** `git remote -v`
- **VERIFIED:** `git add -A`
- **VERIFIED:** `git commit -m "Add bilingual routing and localization"`
- **VERIFIED:** `git push origin main`
- **VERIFIED:** `git commit --allow-empty -m "Trigger Vercel deployment"`
- **VERIFIED:** second `git push origin main`
- **VERIFIED:** `.next` cache removal after route moves when stale generated route types caused a build error.

### 14.2 Build result

- **VERIFIED:** final shown build after Dashboard/Register localization succeeded.
- **VERIFIED:** TypeScript check completed successfully.
- **VERIFIED:** route generation included:
  - `/[locale]`
  - `/[locale]/dashboard`
  - `/[locale]/games`
  - `/[locale]/games/vampire-the-masquerade`
  - `/[locale]/login`
  - `/[locale]/register`
  - `/auth/confirm`
  - `/auth/signout`
  - non-localized Profile and Characters routes

### 14.3 Significant resolved build error

- **RESOLVED:** after moving Login, `.next/dev/types/validator.ts` still referenced `app/login/page.js`.
- **Mitigation used:** stop dev server, delete `.next`, rebuild.
- **Final status:** **VERIFIED FIXED**.

### 14.4 Static checks

| Check | Result |
|---|---|
| TypeScript through `next build` | **VERIFIED PASS** |
| Next.js production build | **VERIFIED PASS** |
| ESLint | **N/A** |
| Unit tests | **N/A** |
| Integration test suite | **N/A** |
| Translation key parity automation | **N/A** |
| Database type generation | **N/A** |

### 14.5 Routes manually verified locally

- **VERIFIED:** `/en`
- **VERIFIED:** `/ru`
- **VERIFIED:** `/en/login`
- **VERIFIED:** `/ru/login`
- **VERIFIED:** `/en/dashboard`
- **VERIFIED:** `/ru/dashboard`
- **VERIFIED:** `/en/register`
- **VERIFIED:** `/ru/register`
- **VERIFIED:** localized Games route appeared in logs and was opened during diagnosis.
- **VERIFIED:** switching EN/RU did not create a duplicate locale prefix after the proxy fix.
- **VERIFIED:** `/login` redirected to the last selected locale (`/ru/login` in the test).

### 14.6 User scenarios verified

| Scenario | Result |
|---|---|
| Switch English → Russian on localized page | **VERIFIED PASS** |
| Switch Russian → English | **VERIFIED PASS** |
| Repeated switch without `/ru/ru` | **VERIFIED PASS** |
| Login with existing Supabase account | **VERIFIED PASS** |
| Redirect after successful login to localized home | **VERIFIED PASS** |
| Open localized Dashboard while authenticated | **VERIFIED PASS** |
| Preserve session while switching Dashboard locale | **VERIFIED PASS** |
| View localized Dashboard content | **VERIFIED PASS** |
| View localized Register content | **VERIFIED PASS** |
| Registration submission with a new account | **NOT TESTED** |
| Email confirmation in final localized architecture | **NOT TESTED / UNVERIFIED** |
| Sign-out in final localized architecture | **UNVERIFIED AS A FINAL ACCEPTANCE TEST** |
| Profile routes | **NOT TESTED IN LOCALIZED FORM** |
| Character routes | **NOT TESTED IN LOCALIZED FORM** |
| Mobile layout | **NOT TESTED** |

### 14.7 Production verification

- **VERIFIED:** Vercel deployment was created after trigger commit `e00fa6f`.
- **VERIFIED:** user confirmed production site works.
- **VERIFIED:** production `/en`, `/ru`, `/en/login`, and `/ru/login` were requested for verification and reported working.
- **VERIFIED:** production language switcher works.
- **UNVERIFIED:** complete production regression for auth confirmation, sign-out, Profile, and Characters.

### 14.8 Warnings

- **OBSERVED / EXTERNAL:** hydration mismatch attributes such as `bis_register`, `bis_skin_checked`, and `__processed_...`.
- **DIAGNOSIS:** caused by a browser extension modifying HTML before React hydration.
- **STATUS:** not treated as an application defect; incognito behavior had previously been reported as normal.
- **N/A:** no unresolved build warning was preserved as a blocker in the final build.

---

## 15. Git State

| Field | State |
|---|---|
| Branch | **VERIFIED:** `main` |
| H001 chat-terminal HEAD | **VERIFIED abbreviated:** `e00fa6f` |
| Full HEAD SHA | **UNVERIFIED:** N/A |
| Code-bearing commit | **VERIFIED full SHA:** `e96ee5d83feb30a22e00a9113b4cbea21235f616` |
| Last commit message | **VERIFIED:** `Trigger Vercel deployment` |
| Last commit file changes | **VERIFIED:** zero files changed |
| Remote | **VERIFIED:** `origin` → `https://github.com/Andrey-0101/ttrpg-website.git` |
| Remote branch | **VERIFIED:** `origin/main` |
| Push | **VERIFIED:** completed successfully |
| Ahead/behind | **ASSUMED:** `0/0`; not reprinted after the empty commit |
| Working tree | **ASSUMED CLEAN:** no file changes were made after the previously clean status; final status was not printed after `e00fa6f` |
| Changed files at close | **N/A / none expected** |
| Untracked files at close | **N/A / none expected** |
| Deployment | **VERIFIED:** created and production tested |

### Commit chain relevant to H001

```text
e00fa6f  Trigger Vercel deployment
e96ee5d  Add bilingual routing and localization
2a0da52  Prior baseline commit visible in this chat
```

Only `e96ee5d` contains the H001 code changes. `e00fa6f` exists solely to retrigger deployment.

---

## 16. Known Problems and Risks

| Severity | Problem | Impact | Mitigation | Status |
|---|---|---|---|---|
| High | Profile and Characters routes remained outside `[locale]` at H001 close | Locale-aware navigation can lead to `/en/...` or `/ru/...` routes that do not exist, causing 404s | Inspect and migrate each route incrementally; update locale-aware links and redirects | **OPEN / PLANNED** |
| High | Final behavior of `/auth/confirm` and `/auth/signout` with locale middleware was not fully accepted | Email confirmation or sign-out may lose locale or route incorrectly | Test service routes before migrating more pages; adjust matcher/redirect behavior only after inspection | **OPEN / BLOCKING NEXT TASK** |
| High | Register displays `error.message` from Supabase directly | Raw backend error text can leak technical details and produces inconsistent localization | Introduce safe user-facing error mapping; log technical details only in an appropriate non-user channel | **OPEN** |
| Medium | Home content remained English on `/ru` during H001 | Partial localization and inconsistent UX | Move Home strings into dictionaries | **OPEN** |
| Medium | Games, VtM page, and Login content localization was not completed | Mixed-language interface | Inspect current files and add namespaces/keys | **OPEN / UNVERIFIED DETAILS** |
| Medium | Root `<html lang>` behavior was not re-verified | Accessibility and SEO metadata may be wrong on Russian pages | Inspect final root/localized layouts and test rendered HTML | **OPEN / UNVERIFIED** |
| Medium | No automated translation-key parity check | Missing keys may surface only at runtime/build | Add a lightweight validation script later | **OPEN / PLANNED** |
| Medium | No database/RLS/Storage audit in H001 | Future work may make incorrect assumptions | Require schema/migration/generated-type inspection before DB changes | **OPEN / BLOCKING DATABASE WORK** |
| Low | Vercel missed one push event | Production could remain on an older commit | Verify Vercel Check after each important push; use a zero-file trigger commit only when necessary | **MITIGATED / MONITOR** |
| Low | Browser extension caused hydration mismatch warnings | Noisy diagnostics can be mistaken for app bugs | Reproduce in incognito before changing app code | **EXTERNAL / MITIGATED** |
| Low | Stale `.next` route types after moving folders | Build can reference deleted routes | Stop dev server and delete `.next` after route moves when stale-type errors appear | **MITIGATED** |
| Medium | Responsive/mobile behavior not tested | Header/forms may have layout issues on small screens | Add explicit viewport tests after functional localization | **OPEN / UNVERIFIED** |

---

## 17. Superseded Approaches

| Approach | Status | Replacement |
|---|---|---|
| Copy all Supabase response headers, including internal middleware override headers, into the `next-intl` response | **DEPRECATED** | Copy only Supabase cookies into the response returned by `next-intl`. |
| Treat `/ru` returned by navigation as a normal pathname when middleware locale context is missing | **DEPRECATED** | Ensure `next-intl` middleware runs correctly so locale-aware `usePathname()` returns the locale-stripped path. |
| Use the combined proxy variant that produced `requestLocale: undefined` | **DEPRECATED** | Use the verified proxy composition from `e96ee5d`. |
| Keep migrated pages at both old unlocalized and new localized routes | **DEPRECATED FOR MIGRATED PAGES** | Move the route under `app/[locale]` and remove the old route. |
| Manually hard-code `/en` or `/ru` into every application link | **DEPRECATED** | Use helpers from `@/i18n/navigation`. |
| Keep temporary `LocaleDebug` UI and `[i18n]` console logs | **DEPRECATED / REMOVED** | Use only for targeted diagnosis, then remove before commit. |
| Assume a future character-sheet language column already exists | **DEPRECATED ASSUMPTION** | Verify the actual schema and create a migration before using such a field. |
| Use site locale as the character-sheet language | **DEPRECATED ARCHITECTURAL DIRECTION** | Keep site locale and sheet language independent. |
| Redeploy the old Vercel deployment to obtain new code | **DEPRECATED FOR MISSED PUSH EVENTS** | Trigger a new commit/push so the deployment is tied to the current repository state. |

> Raw backend errors are a **known current gap**, not a completed superseded approach. Do not claim this is already fixed.

---

## 18. Open Questions

| Question | Blocking | Current Options | Recommended Decision Point |
|---|---|---|---|
| How should `/auth/confirm` preserve or recover locale? | **Yes** for reliable registration flow | Query parameter, cookie-based redirect, locale in callback URL, or service route resolving locale | Decide after inspecting the actual route code and Supabase callback configuration |
| Should `/auth/signout` remain outside `[locale]` or become locale-aware? | **Yes** for reliable logout UX | Keep service route and redirect by cookie; pass locale; move to localized route | Decide after local tests with the current proxy |
| Does root `<html lang>` change with locale? | No for routing, yes for accessibility/SEO | Dynamic locale-aware document language or another supported Next.js layout pattern | Decide after inspecting rendered HTML and current layouts |
| How should Supabase errors be mapped to safe localized messages? | Yes for production UX/security | Local error-code map, generic safe messages, server-side logging | Decide before testing registration failures publicly |
| Which remaining route group should migrate first after auth stabilization? | No | Profile first; Characters first; one route at a time | Recommended: Profile, then Characters |
| What is the exact current database schema? | **Yes** for any DB change | SQL export, migration history, generated types, Dashboard inspection | Obtain before schema work |
| How should independent character-sheet language be stored? | **Yes** for that feature | Dedicated column, nested data field, user preference default + per-character override | Decide only after inspecting current schema/contracts |
| Should translation-key parity be automated? | No | Script, type-safe messages, CI check | Add after remaining namespaces stabilize |
| Is mobile behavior acceptable? | No for current backend work | Manual viewport test or automated browser test | Test after route/localization completion |

---

## 19. Exact Next Task

### Task

**Verify and stabilize the non-localized service routes `/auth/confirm` and `/auth/signout` under the current `next-intl` + Supabase proxy before migrating Profile or Characters.**

### Status

**BLOCKED until current files are inspected.**

### Goal

Ensure email confirmation and sign-out:

- remain functional;
- do not produce localized 404 routes;
- preserve or deterministically restore the intended locale;
- do not break Supabase cookies/session handling;
- do not expose raw backend errors.

### Required input

1. Current `proxy.ts`.
2. Current `utils/supabase/proxy.ts`.
3. Actual files implementing:
   - `app/auth/confirm`
   - `app/auth/signout`
4. Current localized Login and Register code.
5. Supabase redirect URL behavior/configuration, only if available without exposing secrets.
6. Current repository status and HEAD.

### Files to inspect first

```text
proxy.ts
utils/supabase/proxy.ts
app/auth/confirm/*
app/auth/signout/*
app/[locale]/login/page.tsx
app/[locale]/register/page.tsx
i18n/routing.ts
i18n/navigation.ts
```

### Dependencies

- Current build must pass before changes.
- Supabase test account access is required for manual login/logout.
- Email confirmation test may require a disposable new account.
- No database migration is expected for this task.

### Completion criteria

1. `npm run build` passes.
2. `/auth/signout` works from both `/en/dashboard` and `/ru/dashboard`.
3. After logout, the user lands on a valid page in the expected locale.
4. A new registration confirmation link reaches `/auth/confirm` without 404.
5. Confirmation redirects to a valid localized page.
6. No `/en/auth/...` or `/ru/auth/...` 404 appears unless explicitly designed.
7. No duplicate locale prefixes appear.
8. No raw backend error is shown to the user.
9. Local behavior is documented before production deployment.
10. Changes, if any, are committed only after verification.

### Out of scope

- Migrating Profile.
- Migrating Characters.
- Character-sheet language.
- Database schema changes.
- Detailed visual redesign.
- Campaigns, PDF, dice, rooms, or other new modules.

---

## 20. Resume Procedure

1. **Open and read `H001_CURRENT_HANDOFF.md` completely.**
2. **Do not write code immediately.**
3. In Windows CMD, navigate to the repository.
4. Verify the active branch, current HEAD, remote, and working tree.
5. Compare current HEAD with H001 snapshot commit `e00fa6f`.
6. If HEAD differs, inspect the intervening commits and prefer newer verified code.
7. Confirm `npm run build` passes before starting.
8. Inspect the exact current contents of the files listed in Section 19.
9. Reproduce current `/auth/signout` behavior locally from both locales.
10. Inspect confirmation route logic before creating a new registration.
11. Form a minimal change plan.
12. Change one file group at a time.
13. Rebuild and manually test after each meaningful change.
14. Do not migrate Profile or Characters until the auth service-route task meets its completion criteria.
15. Before committing, run `git diff`, `npm run build`, and `git status`.
16. After push, confirm a Vercel Check and deployment are created.

---

## 21. Useful Commands

Run from Windows CMD:

```cmd
cd /d D:\TT_games\00_TTRPG_web\Projects\ttrpg-website
```

```cmd
git status
git branch --show-current
git rev-parse HEAD
git log -1 --oneline
git remote -v
```

```cmd
git fetch origin
git status
```

```cmd
npm run build
```

```cmd
npm run dev
```

When stale generated route types reference a moved/deleted route:

```cmd
rmdir /s /q .next
npm run build
```

Before committing:

```cmd
git diff
git status
```

After verified changes:

```cmd
git add -A
git commit -m "Describe the verified change"
git push origin main
git status
```

Do not use an empty deployment-trigger commit unless a normal pushed commit receives no Vercel Check or deployment.

---

## 22. References

| Reference | Value |
|---|---|
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Production | `https://ttrpg-website-xi.vercel.app` |
| H001 code-bearing commit | `e96ee5d83feb30a22e00a9113b4cbea21235f616` |
| H001 deployment-trigger commit | `e00fa6f` abbreviated; full SHA **UNVERIFIED** |
| `PROJECT_CONTEXT.md` | **N/A** |
| `CURRENT_HANDOFF.md` | This file: `H001_CURRENT_HANDOFF.md` |
| Thematic specifications | **N/A** |
| Database documentation | **N/A** |
| Migrations | **N/A** |
| Generated database types | **N/A** |
| Relevant ADRs | **N/A** |
| Attached diagnostic log | `Pasted text.txt` from Chat H001 |
| Build evidence | User-provided `npm run build` outputs in Chat H001 |
| Deployment evidence | User-provided Vercel/GitHub screenshots and final production confirmation in Chat H001 |

---

## 23. Suggested Updates to Permanent Documents

| Document | Recommendation |
|---|---|
| `PROJECT_CONTEXT.md` | **UPDATE:** record the deployed EN/RU routing foundation; H001 snapshot commit; production URL; partial migration state; next priority. |
| `ARCHITECTURE.md` | **UPDATE:** document root proxy composition order and the rule to copy only Supabase cookies into the `next-intl` response. |
| `DATABASE.md` | **NO CHANGE:** H001 made no verified database changes. Add an explicit “schema not audited in H001” note only if useful. |
| `I18N.md` | **CREATE OR UPDATE:** locales, route-prefix policy, persisted locale behavior, navigation helpers, dictionary namespaces, migrated routes, remaining routes, auth-service-route open question. |
| `CHARACTER_SHEETS.md` | **UPDATE:** add only the confirmed decision that site locale and sheet language are independent; mark persistence as not implemented. |
| `ROADMAP.md` | **UPDATE:** mark localization foundation, Dashboard, and Register complete; prioritize auth service routes, Profile migration, Characters migration, remaining translations, metadata, and mobile verification. |
| ADR files | **CREATE RECOMMENDED:** one ADR for URL-prefixed localization and one ADR for `next-intl` + Supabase proxy composition. |
| Security/error-handling document | **CREATE OR UPDATE RECOMMENDED:** prohibit raw backend errors in UI and define localized safe error mapping. |

---

## 24. Suggested Opening Message for the Next Chat

```text
Продолжаем проект Web_Site_TTRPG.

Repository: https://github.com/Andrey-0101/ttrpg-website
H001 handoff snapshot commit: e00fa6f
Code-bearing localization commit: e96ee5d83feb30a22e00a9113b4cbea21235f616
Context document: H001_CURRENT_HANDOFF.md

Текущий этап: стабилизация двухъязычной маршрутизации Next.js/next-intl вместе с Supabase Auth после успешного production deployment.

Первая точная задача: проверить и стабилизировать /auth/confirm и /auth/signout для английской и русской локалей, не начиная перенос Profile или Characters.

Сначала проверь актуальный git status, HEAD, build и фактическое содержимое proxy.ts, utils/supabase/proxy.ts и auth route files. Не предлагай код до проверки текущих файлов и источников истины. Не используй устаревший вариант proxy, который копировал middleware headers Supabase поверх next-intl.
```

---

## 25. Handoff Quality Check

| Check | Result |
|---|---|
| Commit matches described code state | **PASS:** code changes are assigned to `e96ee5d`; `e00fa6f` is explicitly identified as zero-file deployment trigger. |
| Planned work mislabeled as implemented | **PASS:** remaining routes, sheet language, metadata, DB work, and auth service-route stabilization are marked planned/unverified. |
| Architectural decisions preserved | **PASS:** URL locale, persisted locale, locale-aware navigation, independent sheet language, and proxy composition are recorded. |
| Deprecated code excluded | **PASS:** broken header-copying proxy is marked DEPRECATED and not reproduced as current code. |
| Database assumptions identified | **PASS:** database/RLS/Storage state is explicitly UNVERIFIED/N/A. |
| Deployment assumptions identified | **PASS:** deployment is VERIFIED; full trigger SHA is UNVERIFIED. |
| One exact next task provided | **PASS:** auth confirmation/sign-out stabilization. |
| Sufficient to continue without full chat | **PASS:** files, decisions, tests, risks, commands, and completion criteria are included. |
| Secrets included | **PASS:** none. |
| `.env` values included | **PASS:** none. |
| Other chats mixed into this handoff | **PASS BY DESIGN:** document is scoped to H001 only. |
| Current vs target state separated | **PASS.** |
| User requirements separated from recommendations | **PASS.** |
| Temporary diagnostics separated from final architecture | **PASS.** |

---

**End of H001 handoff.**
