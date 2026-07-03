
# TTRPG Hub — Target Project Folder Structure

> This is the recommended target repository structure.
> It combines the current application, the approved documentation set, the target site map, Campaigns, Game Room, Dice Roller, Video Rooms, and the future Call of Cthulhu 7e extension.
>
> Not every listed folder or file exists yet. Planned and deferred areas should be created only when their milestone begins.

## Status legend

- `[CURRENT]` — already exists or has an implemented equivalent.
- `[NEXT]` — expected in the next one or two milestones.
- `[PLANNED]` — part of the approved target architecture.
- `[PUBLIC]` — required mainly for Public Readiness.
- `[COC]` — introduced during the Call of Cthulhu 7e milestone.
- `[OPTIONAL]` — create only if the implementation needs it.

## Recommended target repository tree

## Target navigation decision

The target structure does **not** include a Dashboard section.

The current repository may still contain `/[locale]/dashboard`. When the target navigation is implemented, that route should be reviewed and either:

- removed;
- redirected to `/[locale]/characters`;
- redirected to `/[locale]/campaigns` for registered users;
- or repurposed only after a separate product decision.

It should not be treated as part of the approved target site map.

```text
ttrpg-website/
├── .github/
│   └── workflows/
│       ├── build.yml                              [PLANNED]
│       ├── test.yml                               [PUBLIC]
│       └── translation-parity.yml                 [PUBLIC]
│
├── .vscode/
│   └── settings.json                              [CURRENT]
│
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                             [CURRENT]
│   │   ├── page.tsx                               [CURRENT]
│   │   ├── loading.tsx                            [PLANNED]
│   │   ├── error.tsx                              [PLANNED]
│   │   ├── not-found.tsx                          [CURRENT]
│   │   │
│   │   ├── [...rest]/
│   │   │   └── page.tsx                           [CURRENT]
│   │   │
│   │   ├── games/
│   │   │   ├── page.tsx                           [CURRENT]
│   │   │   │
│   │   │   ├── vampire-the-masquerade/
│   │   │   │   ├── page.tsx                       [CURRENT]
│   │   │   │   ├── getting-started/
│   │   │   │   │   └── page.tsx                   [PLANNED]
│   │   │   │   ├── character-creation/
│   │   │   │   │   └── page.tsx                   [PLANNED]
│   │   │   │   ├── game-system/
│   │   │   │   │   └── page.tsx                   [PLANNED]
│   │   │   │   ├── base-rules/
│   │   │   │   │   └── page.tsx                   [PLANNED]
│   │   │   │   ├── quick-reference/
│   │   │   │   │   └── page.tsx                   [PLANNED]
│   │   │   │   ├── resources/
│   │   │   │   │   └── page.tsx                   [PLANNED]
│   │   │   │   └── tools/
│   │   │   │       ├── page.tsx                   [PLANNED]
│   │   │   │       └── dice/
│   │   │   │           └── page.tsx               [PLANNED]
│   │   │   │
│   │   │   └── call-of-cthulhu-7e/
│   │   │       ├── page.tsx                       [COC]
│   │   │       ├── getting-started/
│   │   │       │   └── page.tsx                   [COC]
│   │   │       ├── character-creation/
│   │   │       │   └── page.tsx                   [COC]
│   │   │       ├── game-system/
│   │   │       │   └── page.tsx                   [COC]
│   │   │       ├── base-rules/
│   │   │       │   └── page.tsx                   [COC]
│   │   │       ├── quick-reference/
│   │   │       │   └── page.tsx                   [COC]
│   │   │       ├── resources/
│   │   │       │   └── page.tsx                   [COC]
│   │   │       └── tools/
│   │   │           ├── page.tsx                   [COC]
│   │   │           └── dice/
│   │   │               └── page.tsx               [COC]
│   │   │
│   │   ├── characters/
│   │   │   ├── page.tsx                           [CURRENT]
│   │   │   ├── loading.tsx                        [NEXT]
│   │   │   ├── new/
│   │   │   │   ├── page.tsx                       [CURRENT]
│   │   │   │   └── [system]/
│   │   │   │       └── page.tsx                   [CURRENT]
│   │   │   └── [id]/
│   │   │       └── page.tsx                       [CURRENT]
│   │   │
│   │   ├── campaigns/
│   │   │   ├── page.tsx                           [NEXT]
│   │   │   ├── new/
│   │   │   │   └── page.tsx                       [NEXT]
│   │   │   ├── completed/
│   │   │   │   └── page.tsx                       [PLANNED]
│   │   │   └── [campaignId]/
│   │   │       ├── layout.tsx                     [NEXT]
│   │   │       ├── page.tsx                       [NEXT]
│   │   │       ├── game-room/
│   │   │       │   └── page.tsx                   [PLANNED]
│   │   │       ├── members/
│   │   │       │   └── page.tsx                   [NEXT]
│   │   │       ├── characters/
│   │   │       │   └── page.tsx                   [NEXT]
│   │   │       ├── handouts/
│   │   │       │   ├── page.tsx                   [PLANNED]
│   │   │       │   └── [handoutId]/
│   │   │       │       └── page.tsx               [PLANNED]
│   │   │       ├── npcs/
│   │   │       │   ├── page.tsx                   [PLANNED]
│   │   │       │   └── [npcId]/
│   │   │       │       └── page.tsx               [PLANNED]
│   │   │       ├── chronicle/
│   │   │       │   ├── page.tsx                   [PLANNED]
│   │   │       │   └── [sessionId]/
│   │   │       │       └── page.tsx               [PLANNED]
│   │   │       ├── notes/
│   │   │       │   └── page.tsx                   [PLANNED]
│   │   │       └── settings/
│   │   │           └── page.tsx                   [PLANNED]
│   │   │
│   │   ├── dice/
│   │   │   └── page.tsx                           [PLANNED]
│   │   │
│   │   ├── video-rooms/
│   │   │   └── page.tsx                           [PLANNED]
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                           [CURRENT]
│   │   ├── register/
│   │   │   └── page.tsx                           [CURRENT]
│   │   ├── account/
│   │   │   ├── page.tsx                           [CURRENT]
│   │   │   ├── security/
│   │   │   │   └── page.tsx                       [PUBLIC]
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx                       [PUBLIC]
│   │   │   └── data/
│   │   │       └── page.tsx                       [PUBLIC]
│   │   ├── profile/
│   │   │   ├── page.tsx                           [CURRENT]
│   │   │   └── edit/
│   │   │       └── page.tsx                       [CURRENT]
│   │   │
│   │   ├── help/
│   │   │   └── page.tsx                           [PUBLIC]
│   │   ├── about/
│   │   │   └── page.tsx                           [PUBLIC]
│   │   ├── contact/
│   │   │   └── page.tsx                           [PUBLIC]
│   │   ├── privacy/
│   │   │   └── page.tsx                           [PUBLIC]
│   │   └── terms/
│   │       └── page.tsx                           [PUBLIC]
│   │
│   ├── auth/
│   │   ├── confirm/
│   │   │   └── route.ts                           [CURRENT]
│   │   ├── reset-password/
│   │   │   └── page.tsx                           [PUBLIC]
│   │   └── update-password/
│   │       └── page.tsx                           [PUBLIC]
│   │
│   ├── api/
│   │   ├── dice/
│   │   │   └── roll/
│   │   │       └── route.ts                       [PLANNED]
│   │   ├── video/
│   │   │   └── token/
│   │   │       └── route.ts                       [PLANNED]
│   │   └── uploads/
│   │       └── handouts/
│   │           └── route.ts                       [OPTIONAL]
│   │
│   ├── globals.css                                [CURRENT]
│   └── layout.tsx                                 [CURRENT]
│
├── components/
│   ├── layout/
│   │   ├── site-header.tsx                        [CURRENT OR NEXT]
│   │   ├── public-navigation.tsx                  [NEXT]
│   │   ├── authenticated-navigation.tsx           [NEXT]
│   │   ├── campaign-navigation.tsx                [NEXT]
│   │   ├── language-switcher.tsx                  [CURRENT]
│   │   └── site-footer.tsx                        [PLANNED]
│   │
│   ├── ui/
│   │   ├── button.tsx                             [PLANNED]
│   │   ├── link-button.tsx                        [PLANNED]
│   │   ├── card.tsx                               [PLANNED]
│   │   ├── field.tsx                              [PLANNED]
│   │   ├── textarea.tsx                           [PLANNED]
│   │   ├── select.tsx                             [PLANNED]
│   │   ├── dialog.tsx                             [PLANNED]
│   │   ├── alert.tsx                              [PLANNED]
│   │   ├── tabs.tsx                               [PLANNED]
│   │   ├── loading-state.tsx                      [NEXT]
│   │   ├── empty-state.tsx                        [NEXT]
│   │   └── error-state.tsx                        [NEXT]
│   │
│   ├── auth/
│   │   ├── login-form.tsx                         [CURRENT]
│   │   ├── register-form.tsx                      [CURRENT]
│   │   └── logout-button.tsx                      [CURRENT]
│   │
│   ├── account/
│   │   ├── profile-form.tsx                       [CURRENT]
│   │   ├── security-form.tsx                      [PUBLIC]
│   │   ├── privacy-form.tsx                       [PUBLIC]
│   │   └── data-management.tsx                    [PUBLIC]
│   │
│   ├── characters/
│   │   ├── character-creator.tsx                  [CURRENT]
│   │   ├── character-editor.tsx                   [CURRENT]
│   │   ├── character-summary-card.tsx             [CURRENT]
│   │   ├── delete-character-button.tsx            [CURRENT]
│   │   ├── character-list.tsx                     [NEXT]
│   │   ├── save-status.tsx                        [NEXT]
│   │   ├── unsaved-changes-guard.tsx              [NEXT]
│   │   └── sheets/
│   │       ├── shared/
│   │       │   ├── rating-control.tsx              [CURRENT OR NEXT]
│   │       │   ├── damage-track.tsx                [CURRENT OR NEXT]
│   │       │   └── sheet-actions.tsx               [NEXT]
│   │       ├── vtm-v5/
│   │       │   ├── vtm-character-sheet.tsx         [CURRENT]
│   │       │   ├── a4-sheet-page.tsx               [CURRENT]
│   │       │   ├── core-sheet-page.tsx             [CURRENT]
│   │       │   ├── background-sheet-page.tsx       [CURRENT]
│   │       │   ├── character-identity-card.tsx     [CURRENT]
│   │       │   ├── character-portrait-field.tsx    [CURRENT]
│   │       │   ├── attributes-section.tsx          [CURRENT]
│   │       │   ├── skills-section.tsx              [CURRENT]
│   │       │   ├── health-willpower-section.tsx    [CURRENT]
│   │       │   ├── trackers-section.tsx            [CURRENT]
│   │       │   ├── disciplines-section.tsx         [CURRENT]
│   │       │   ├── advantages-section.tsx          [CURRENT]
│   │       │   ├── biography-section.tsx           [CURRENT]
│   │       │   └── background-principles-section.tsx [CURRENT]
│   │       └── coc-7e/
│   │           ├── coc-character-sheet.tsx         [COC]
│   │           ├── investigator-details.tsx        [COC]
│   │           ├── characteristics-section.tsx     [COC]
│   │           ├── skills-section.tsx              [COC]
│   │           ├── combat-section.tsx              [COC]
│   │           ├── sanity-section.tsx              [COC]
│   │           └── background-section.tsx          [COC]
│   │
│   ├── campaigns/
│   │   ├── campaign-card.tsx                       [NEXT]
│   │   ├── campaign-list.tsx                       [NEXT]
│   │   ├── campaign-create-form.tsx                [NEXT]
│   │   ├── campaign-overview.tsx                   [NEXT]
│   │   ├── campaign-members.tsx                    [NEXT]
│   │   ├── campaign-characters.tsx                 [NEXT]
│   │   ├── campaign-settings.tsx                   [PLANNED]
│   │   ├── completed-campaign-card.tsx             [PLANNED]
│   │   ├── handouts/
│   │   │   ├── handout-list.tsx                    [PLANNED]
│   │   │   ├── handout-card.tsx                    [PLANNED]
│   │   │   ├── handout-form.tsx                    [PLANNED]
│   │   │   └── handout-preview.tsx                 [PLANNED]
│   │   ├── npcs/
│   │   │   ├── npc-list.tsx                        [PLANNED]
│   │   │   ├── npc-card.tsx                        [PLANNED]
│   │   │   └── npc-form.tsx                        [PLANNED]
│   │   ├── chronicle/
│   │   │   ├── chronicle-list.tsx                  [PLANNED]
│   │   │   ├── session-card.tsx                    [PLANNED]
│   │   │   ├── session-form.tsx                    [PLANNED]
│   │   │   └── session-detail.tsx                  [PLANNED]
│   │   └── notes/
│   │       ├── shared-notes.tsx                    [PLANNED]
│   │       └── gm-private-notes.tsx                [PLANNED]
│   │
│   ├── game-room/
│   │   ├── game-room.tsx                           [PLANNED]
│   │   ├── game-room-layout.tsx                    [PLANNED]
│   │   ├── participant-list.tsx                    [PLANNED]
│   │   ├── current-session-context.tsx             [PLANNED]
│   │   ├── quick-notes.tsx                         [PLANNED]
│   │   ├── handout-preview-window.tsx              [PLANNED]
│   │   └── active-character-strip.tsx              [PLANNED]
│   │
│   ├── dice/
│   │   ├── dice-roller.tsx                         [PLANNED]
│   │   ├── dice-pool-builder.tsx                   [PLANNED]
│   │   ├── dice-result.tsx                         [PLANNED]
│   │   ├── dice-history.tsx                        [PLANNED]
│   │   ├── vtm-v5-dice-roller.tsx                 [PLANNED]
│   │   └── coc-7e-dice-roller.tsx                 [COC]
│   │
│   ├── video/
│   │   ├── video-room.tsx                          [PLANNED]
│   │   ├── video-controls.tsx                      [PLANNED]
│   │   ├── participant-tile.tsx                    [PLANNED]
│   │   ├── device-selector.tsx                     [PLANNED]
│   │   └── connection-state.tsx                    [PLANNED]
│   │
│   └── games/
│       ├── game-card.tsx                           [CURRENT OR NEXT]
│       ├── game-hub-layout.tsx                     [PLANNED]
│       ├── game-section-navigation.tsx             [PLANNED]
│       ├── resource-list.tsx                       [PLANNED]
│       └── quick-reference.tsx                     [PLANNED]
│
├── content/
│   ├── en/
│   │   └── games/
│   │       ├── vtm-v5/
│   │       │   ├── overview-and-setting.mdx        [PLANNED]
│   │       │   ├── getting-started.mdx             [PLANNED]
│   │       │   ├── game-system.mdx                 [PLANNED]
│   │       │   ├── character-creation.mdx          [PLANNED]
│   │       │   ├── base-rules.mdx                  [PLANNED]
│   │       │   ├── quick-reference.mdx             [PLANNED]
│   │       │   └── resources.mdx                   [PLANNED]
│   │       └── coc-7e/
│   │           ├── overview-and-setting.mdx        [COC]
│   │           ├── getting-started.mdx             [COC]
│   │           ├── game-system.mdx                 [COC]
│   │           ├── character-creation.mdx          [COC]
│   │           ├── base-rules.mdx                  [COC]
│   │           ├── quick-reference.mdx             [COC]
│   │           └── resources.mdx                   [COC]
│   └── ru/
│       └── games/
│           ├── vtm-v5/
│           │   ├── overview-and-setting.mdx        [PLANNED]
│           │   ├── getting-started.mdx             [PLANNED]
│           │   ├── game-system.mdx                 [PLANNED]
│           │   ├── character-creation.mdx          [PLANNED]
│           │   ├── base-rules.mdx                  [PLANNED]
│           │   ├── quick-reference.mdx             [PLANNED]
│           │   └── resources.mdx                   [PLANNED]
│           └── coc-7e/
│               ├── overview-and-setting.mdx        [COC]
│               ├── getting-started.mdx             [COC]
│               ├── game-system.mdx                 [COC]
│               ├── character-creation.mdx          [COC]
│               ├── base-rules.mdx                  [COC]
│               ├── quick-reference.mdx             [COC]
│               └── resources.mdx                   [COC]
│
├── docs/
│   ├── README.md                                   [NEXT]
│   ├── README.ru.md                                [NEXT]
│   │
│   ├── architecture/
│   │   ├── ARCHITECTURE.md                         [NEXT]
│   │   ├── ARCHITECTURE.ru.md                      [NEXT]
│   │   ├── DATABASE.md                             [NEXT]
│   │   ├── DATABASE.ru.md                          [NEXT]
│   │   ├── I18N.md                                 [NEXT]
│   │   ├── I18N.ru.md                              [NEXT]
│   │   ├── CHARACTER_SHEETS.md                     [NEXT]
│   │   ├── CHARACTER_SHEETS.ru.md                  [NEXT]
│   │   ├── DESIGN_SYSTEM.md                        [NEXT]
│   │   ├── DESIGN_SYSTEM.ru.md                     [NEXT]
│   │   ├── SECURITY.md                             [NEXT]
│   │   └── SECURITY.ru.md                          [NEXT]
│   │
│   ├── product/
│   │   ├── ROADMAP.md                              [NEXT]
│   │   ├── ROADMAP.ru.md                           [NEXT]
│   │   ├── CAMPAIGNS.md                            [NEXT]
│   │   ├── CAMPAIGNS.ru.md                         [NEXT]
│   │   ├── DICE_ROLLS.md                           [NEXT]
│   │   ├── DICE_ROLLS.ru.md                        [NEXT]
│   │   ├── VIDEO_ROOMS.md                          [NEXT]
│   │   ├── VIDEO_ROOMS.ru.md                       [NEXT]
│   │   ├── GAME_HUB.md                             [NEXT]
│   │   ├── GAME_HUB.ru.md                          [NEXT]
│   │   ├── SITE_STRUCTURE_CURRENT.md               [NEXT]
│   │   ├── SITE_STRUCTURE_CURRENT.ru.md            [NEXT]
│   │   ├── SITE_STRUCTURE_TARGET.md                [NEXT]
│   │   ├── SITE_STRUCTURE_TARGET.ru.md             [NEXT]
│   │   ├── SITE_STRUCTURE_COMPARISON.md            [NEXT]
│   │   ├── SITE_STRUCTURE_COMPARISON.ru.md         [NEXT]
│   │   ├── SITE_MAP.md                             [NEXT]
│   │   └── SITE_MAP.ru.md                          [NEXT]
│   │
│   ├── decisions/
│   │   ├── README.md                               [NEXT]
│   │   ├── README.ru.md                            [NEXT]
│   │   ├── ADR-001-system-specific-versioned-jsonb.md
│   │   ├── ADR-001-system-specific-versioned-jsonb.ru.md
│   │   ├── ADR-002-private-character-portrait-storage.md
│   │   ├── ADR-002-private-character-portrait-storage.ru.md
│   │   ├── ADR-003-independent-character-sheet-language.md
│   │   ├── ADR-003-independent-character-sheet-language.ru.md
│   │   ├── ADR-004-a4-responsive-character-sheet-rendering.md
│   │   ├── ADR-004-a4-responsive-character-sheet-rendering.ru.md
│   │   ├── ADR-005-url-prefixed-localization.md
│   │   ├── ADR-005-url-prefixed-localization.ru.md
│   │   ├── ADR-006-next-intl-supabase-proxy-composition.md
│   │   ├── ADR-006-next-intl-supabase-proxy-composition.ru.md
│   │   ├── ADR-007-campaign-foundation-before-shared-realtime-tools.md
│   │   ├── ADR-007-campaign-foundation-before-shared-realtime-tools.ru.md
│   │   ├── ADR-008-game-system-domain-boundaries.md
│   │   ├── ADR-008-game-system-domain-boundaries.ru.md
│   │   ├── ADR-009-managed-video-infrastructure.md
│   │   └── ADR-009-managed-video-infrastructure.ru.md
│   │
│   ├── handoffs/
│   │   ├── H001_CURRENT_HANDOFF.md                 [HISTORICAL]
│   │   ├── H002_CURRENT_HANDOFF.md                 [HISTORICAL]
│   │   ├── H003_CURRENT_HANDOFF.md                 [HISTORICAL]
│   │   ├── H004_CURRENT_HANDOFF.md                 [NEXT]
│   │   └── H004_CURRENT_HANDOFF.ru.md              [NEXT]
│   │
│   └── assets/
│       └── VtM-V5_character-sheet-template/
│           ├── *.pdf                               [CURRENT]
│           ├── *.jpg                               [CURRENT]
│           └── *.docx                              [CURRENT]
│
├── i18n/
│   ├── navigation.ts                               [CURRENT]
│   ├── request.ts                                  [CURRENT]
│   └── routing.ts                                  [CURRENT]
│
├── lib/
│   ├── auth/
│   │   ├── errors.ts                               [CURRENT OR NEXT]
│   │   └── permissions.ts                          [NEXT]
│   │
│   ├── characters/
│   │   ├── registry.ts                             [CURRENT OR NEXT]
│   │   ├── portrait.ts                             [CURRENT]
│   │   ├── visibility.ts                           [NEXT]
│   │   ├── vtm-v5/
│   │   │   ├── schema.ts                           [CURRENT]
│   │   │   ├── editor-draft.ts                     [CURRENT]
│   │   │   ├── validation.ts                       [NEXT]
│   │   │   └── summary.ts                          [NEXT]
│   │   └── coc-7e/
│   │       ├── schema.ts                           [COC]
│   │       ├── editor-draft.ts                     [COC]
│   │       ├── validation.ts                       [COC]
│   │       └── summary.ts                          [COC]
│   │
│   ├── game-systems/
│   │   ├── types.ts                                [NEXT]
│   │   ├── registry.ts                             [NEXT]
│   │   ├── vtm-v5/
│   │   │   ├── definition.ts                       [NEXT]
│   │   │   ├── dice-engine.ts                      [PLANNED]
│   │   │   └── theme.ts                            [PLANNED]
│   │   └── coc-7e/
│   │       ├── definition.ts                       [COC]
│   │       ├── dice-engine.ts                      [COC]
│   │       └── theme.ts                            [COC]
│   │
│   ├── campaigns/
│   │   ├── types.ts                                [NEXT]
│   │   ├── permissions.ts                          [NEXT]
│   │   ├── queries.ts                              [NEXT]
│   │   ├── mutations.ts                            [NEXT]
│   │   ├── invitations.ts                          [NEXT]
│   │   ├── completion.ts                           [PLANNED]
│   │   └── validation.ts                           [NEXT]
│   │
│   ├── dice/
│   │   ├── types.ts                                [PLANNED]
│   │   ├── random.ts                               [PLANNED]
│   │   ├── execute-roll.ts                         [PLANNED]
│   │   └── persistence.ts                          [PLANNED]
│   │
│   ├── video/
│   │   ├── provider.ts                             [PLANNED]
│   │   ├── token.ts                                [PLANNED]
│   │   ├── permissions.ts                          [PLANNED]
│   │   └── room-mapping.ts                         [PLANNED]
│   │
│   ├── handouts/
│   │   ├── storage.ts                              [PLANNED]
│   │   ├── validation.ts                           [PLANNED]
│   │   └── permissions.ts                          [PLANNED]
│   │
│   ├── content/
│   │   ├── loader.ts                               [PLANNED]
│   │   ├── metadata.ts                             [PLANNED]
│   │   └── navigation.ts                           [PLANNED]
│   │
│   ├── errors/
│   │   ├── safe-error.ts                           [NEXT]
│   │   └── error-codes.ts                          [NEXT]
│   │
│   └── utils/
│       ├── dates.ts                                [NEXT]
│       ├── ids.ts                                  [NEXT]
│       └── strings.ts                              [NEXT]
│
├── messages/
│   ├── en.json                                     [CURRENT]
│   ├── ru.json                                     [CURRENT]
│   ├── en/
│   │   ├── vtm-v5.json                             [CURRENT]
│   │   ├── campaigns.json                          [NEXT]
│   │   ├── dice.json                               [PLANNED]
│   │   ├── video.json                              [PLANNED]
│   │   └── coc-7e.json                             [COC]
│   └── ru/
│       ├── vtm-v5.json                             [CURRENT]
│       ├── campaigns.json                          [NEXT]
│       ├── dice.json                               [PLANNED]
│       ├── video.json                              [PLANNED]
│       └── coc-7e.json                             [COC]
│
├── public/
│   ├── images/
│   │   ├── platform/
│   │   │   ├── logo.svg                            [PLANNED]
│   │   │   └── backgrounds/                        [PLANNED]
│   │   └── games/
│   │       ├── vtm-v5/
│   │       │   ├── backgrounds/                    [PLANNED]
│   │       │   ├── frames/                         [PLANNED]
│   │       │   └── icons/                          [PLANNED]
│   │       └── coc-7e/
│   │           ├── backgrounds/                    [COC]
│   │           ├── frames/                         [COC]
│   │           └── icons/                          [COC]
│   └── favicon.ico                                 [CURRENT OR NEXT]
│
├── scripts/
│   ├── check-translations.mjs                      [PUBLIC]
│   ├── check-doc-links.mjs                         [PUBLIC]
│   ├── generate-database-types.cmd                 [NEXT]
│   ├── verify-migrations.cmd                       [NEXT]
│   └── cleanup-orphan-portraits.mjs                [PUBLIC]
│
├── supabase/
│   ├── migrations/
│   │   ├── 20260630143000_initial_schema.sql       [CURRENT]
│   │   ├── 20260702150000_character_portraits.sql [CURRENT]
│   │   ├── YYYYMMDDHHMMSS_campaign_foundation.sql [NEXT]
│   │   ├── YYYYMMDDHHMMSS_campaign_characters.sql [NEXT]
│   │   ├── YYYYMMDDHHMMSS_dice_rolls.sql          [PLANNED]
│   │   ├── YYYYMMDDHHMMSS_handouts.sql            [PLANNED]
│   │   ├── YYYYMMDDHHMMSS_npcs.sql                [PLANNED]
│   │   ├── YYYYMMDDHHMMSS_chronicle_sessions.sql  [PLANNED]
│   │   └── YYYYMMDDHHMMSS_campaign_notes.sql      [PLANNED]
│   ├── functions/
│   │   └── cleanup-orphan-portraits/
│   │       └── index.ts                            [OPTIONAL]
│   └── seed.sql                                    [OPTIONAL]
│
├── tests/
│   ├── unit/
│   │   ├── characters/
│   │   │   ├── vtm-v5-normalizer.test.ts           [PUBLIC]
│   │   │   └── portrait-validation.test.ts         [PUBLIC]
│   │   ├── campaigns/
│   │   │   └── permissions.test.ts                 [PUBLIC]
│   │   └── dice/
│   │       ├── vtm-v5-dice-engine.test.ts          [PUBLIC]
│   │       └── coc-7e-dice-engine.test.ts          [COC]
│   ├── integration/
│   │   ├── character-access.test.ts                [PUBLIC]
│   │   ├── campaign-membership.test.ts             [PUBLIC]
│   │   ├── storage-policies.test.ts                [PUBLIC]
│   │   └── video-token-access.test.ts              [PUBLIC]
│   └── e2e/
│       ├── auth.spec.ts                             [PUBLIC]
│       ├── characters.spec.ts                       [PUBLIC]
│       ├── campaigns.spec.ts                        [PUBLIC]
│       ├── dice.spec.ts                             [PUBLIC]
│       └── video.spec.ts                            [PUBLIC]
│
├── types/
│   ├── database.types.ts                           [CURRENT]
│   ├── content.types.ts                            [PLANNED]
│   ├── campaign.types.ts                           [NEXT]
│   └── video.types.ts                              [PLANNED]
│
├── utils/
│   └── supabase/
│       ├── client.ts                               [CURRENT]
│       ├── server.ts                               [CURRENT]
│       └── proxy.ts                                [CURRENT]
│
├── AGENTS.md                                       [CURRENT]
├── PROJECT_CONTEXT.md                              [NEXT]
├── PROJECT_CONTEXT.ru.md                           [NEXT]
├── README.md                                       [NEXT]
├── README.ru.md                                    [NEXT]
├── proxy.ts                                        [CURRENT]
├── next.config.ts                                  [CURRENT]
├── package.json                                    [CURRENT]
├── package-lock.json                               [CURRENT]
├── postcss.config.mjs                              [CURRENT]
├── tsconfig.json                                   [CURRENT]
├── eslint.config.mjs                               [CURRENT]
├── .env.example                                    [PUBLIC]
├── .gitignore                                      [CURRENT]
└── vercel.json                                     [OPTIONAL]
```

## Documentation placement map

The documents already prepared should be placed as follows:

| Prepared document | Recommended target path |
|---|---|
| `README.md` | `/README.md` |
| `README.ru.md` | `/README.ru.md` |
| `PROJECT_CONTEXT.md` | `/PROJECT_CONTEXT.md` |
| `PROJECT_CONTEXT.ru.md` | `/PROJECT_CONTEXT.ru.md` |
| `ARCHITECTURE.md` | `/docs/architecture/ARCHITECTURE.md` |
| `DATABASE.md` | `/docs/architecture/DATABASE.md` |
| `I18N.md` | `/docs/architecture/I18N.md` |
| `CHARACTER_SHEETS.md` | `/docs/architecture/CHARACTER_SHEETS.md` |
| `DESIGN_SYSTEM.md` | `/docs/architecture/DESIGN_SYSTEM.md` |
| `SECURITY.md` | `/docs/architecture/SECURITY.md` |
| `ROADMAP.md` | `/docs/product/ROADMAP.md` |
| `CAMPAIGNS.md` | `/docs/product/CAMPAIGNS.md` |
| `DICE_ROLLS.md` | `/docs/product/DICE_ROLLS.md` |
| `VIDEO_ROOMS.md` | `/docs/product/VIDEO_ROOMS.md` |
| `GAME_HUB.md` | `/docs/product/GAME_HUB.md` |
| `SITE_STRUCTURE_CURRENT.md` | `/docs/product/SITE_STRUCTURE_CURRENT.md` |
| `SITE_STRUCTURE_TARGET.md` | `/docs/product/SITE_STRUCTURE_TARGET.md` |
| `SITE_STRUCTURE_COMPARISON.md` | `/docs/product/SITE_STRUCTURE_COMPARISON.md` |
| Revised site map | `/docs/product/SITE_MAP.md` |
| ADR files | `/docs/decisions/` |
| `H004_CURRENT_HANDOFF.md` | `/docs/handoffs/H004_CURRENT_HANDOFF.md` |
| Russian H004 handoff | `/docs/handoffs/H004_CURRENT_HANDOFF.ru.md` |

Russian versions use the same location with `.ru.md`.

## Recommended immediate repository scope

Do not create the complete target tree now.

For the Architecture Baseline pull request, add only:

```text
README.md
README.ru.md
PROJECT_CONTEXT.md
PROJECT_CONTEXT.ru.md

docs/
├── README.md
├── README.ru.md
├── architecture/
│   ├── ARCHITECTURE.md
│   ├── ARCHITECTURE.ru.md
│   ├── DATABASE.md
│   ├── DATABASE.ru.md
│   ├── I18N.md
│   ├── I18N.ru.md
│   ├── CHARACTER_SHEETS.md
│   ├── CHARACTER_SHEETS.ru.md
│   ├── DESIGN_SYSTEM.md
│   ├── DESIGN_SYSTEM.ru.md
│   ├── SECURITY.md
│   └── SECURITY.ru.md
├── product/
│   ├── ROADMAP.md
│   ├── ROADMAP.ru.md
│   ├── CAMPAIGNS.md
│   ├── CAMPAIGNS.ru.md
│   ├── DICE_ROLLS.md
│   ├── DICE_ROLLS.ru.md
│   ├── VIDEO_ROOMS.md
│   ├── VIDEO_ROOMS.ru.md
│   ├── GAME_HUB.md
│   ├── GAME_HUB.ru.md
│   ├── SITE_STRUCTURE_CURRENT.md
│   ├── SITE_STRUCTURE_CURRENT.ru.md
│   ├── SITE_STRUCTURE_TARGET.md
│   ├── SITE_STRUCTURE_TARGET.ru.md
│   ├── SITE_STRUCTURE_COMPARISON.md
│   ├── SITE_STRUCTURE_COMPARISON.ru.md
│   ├── SITE_MAP.md
│   └── SITE_MAP.ru.md
├── decisions/
│   ├── README.md
│   ├── README.ru.md
│   ├── ADR-001-...
│   ├── ADR-001-....ru.md
│   ├── ...
│   ├── ADR-009-...
│   └── ADR-009-....ru.md
└── handoffs/
    ├── H004_CURRENT_HANDOFF.md
    └── H004_CURRENT_HANDOFF.ru.md
```

The application, Campaign, Dice, Video, Content, Tests, and Public Readiness folders should be introduced only as their corresponding milestones begin.

## Important implementation rule

The target folder structure is an architectural guide, not a reason to move working code immediately.

Do not reorganize existing VtM files solely to match this tree. Move or extract code only when a real feature requires the change and the migration can be verified safely.
