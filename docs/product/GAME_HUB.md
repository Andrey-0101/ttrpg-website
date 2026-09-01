# Game System Hubs

## Status

**Phase 8 planned. No complete game-system hub is implemented.**

The current application has catalogue/game landing surfaces and an implemented public Dice Rollers hub at `/[locale]/dice-rollers`. The VtM V5 personal roller and Custom Dice Pool are available; this does not constitute a complete Vampire Game Hub.

## Approved order

1. Phase 8A — Call of Cthulhu 7e;
2. Phase 8B — Delta Green;
3. Phase 8C — Vampire: The Masquerade.

Each phase begins only after that system's relevant product tools exist. The current generic CoC campaign shell does not imply CoC dice or character support, and Delta Green is currently a catalogue entry only.

## Purpose

A Game System Hub organizes already implemented system information and entry points:

- concise system landing information;
- getting-started guidance;
- character guidance for implemented character support;
- quick reference;
- reviewed official and community resources;
- links to implemented characters, campaigns, dice, and other tools.

A hub must not create new mechanics, persistence, campaign capabilities, or platform features merely to complete its navigation.

## Separation of concerns

### Game System Hub

Public or generally accessible information and links to tools already available for one system.

### Campaign and Game Room

Private group tools authorized through campaign membership. Campaign images, system-aware dice, linked characters, video, and notes remain campaign capabilities rather than hub content.

These areas must retain separate navigation and authorization boundaries.

## Content architecture

Long-form content should use reviewed Markdown/MDX or another appropriate content model, not large article bodies inside `messages/en.json` and `messages/ru.json`.

Requirements:

- EN/RU content;
- metadata and stable content identifiers;
- coherent navigation hierarchy;
- original concise references rather than copied rulebook text;
- clear attribution and source policy;
- tool links that reflect actual availability and never expose fake routes.

## Shared hub contract

The common hub layer may own layout, navigation, metadata, accessibility, and content loading. Each game-system package owns its terminology, content, tool availability, and theme hooks.

Exact visual themes remain a Phase 6 decision. Phase 8 should apply the accepted visual system rather than decide it independently.

## Completion criteria

For each Phase 8 hub:

1. the system's required underlying tools already exist;
2. EN/RU content and navigation are implemented;
3. links expose only available capabilities;
4. long-form content uses the approved content model;
5. copyright, trademark, and attribution handling is reviewed;
6. metadata, accessibility, and responsive behavior pass the relevant gates;
7. no new system mechanic or platform capability is introduced as hidden hub scope.
