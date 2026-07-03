# Current and Target Site Structure

## Summary

The current site is a bilingual private VtM character manager.

The target site is a bilingual multi-system TTRPG hub with private campaign workspaces, dice tools, video rooms, campaign content, game hubs, and later public-readiness support.

## Structural comparison

| Area | Current | Target |
|---|---|---|
| Home | Implemented | Expanded entry point and relevant calls to action |
| Games catalogue | Basic | Multi-system catalogue |
| VtM area | Basic game page | Complete Game Hub |
| CoC area | Registered only | Complete later Game Hub and tools |
| Authentication | Implemented | Expanded recovery and security lifecycle |
| Dashboard | Basic | Personal cross-system overview |
| Characters | Complete VtM owner-only flow | Multi-system characters, settings, campaign assignment, optional sharing |
| Campaigns | Not implemented | Private campaign workspace |
| Dice | Not implemented | Personal system roller and shared campaign feed |
| Video | Not implemented | Campaign-gated managed video room |
| Handouts | Not implemented | Campaign library with visibility controls |
| NPCs | Not implemented | Simple and full-sheet NPC support |
| Sessions | Not implemented | First-class session records |
| Notes | Not implemented | Shared and GM-private campaign notes |
| Profile | Implemented | Clear separation from account settings |
| Account | Basic | Security, privacy, export, deletion |
| Help/legal | Not implemented | Help, About, Contact, Privacy, Terms |
| Public sharing | Not implemented | Optional, policy-controlled, later |
| Localisation | EN/RU implemented | EN/RU retained across all new areas |

## Main transition

The principal architectural transition is:

- from owner-only characters;
- to campaign membership as the shared-access boundary;
- then to campaign tools and content;
- then to public-readiness and additional game systems.

## Recommended implementation order

1. Keep and improve the existing Characters area.
2. Add Campaign Foundation.
3. Add personal VtM Dice.
4. Add shared Campaign Dice.
5. Add campaign-gated Video.
6. Add Handouts, NPCs, Sessions, and Notes.
7. Complete visual identity.
8. Expand the VtM Game Hub.
9. Add public-readiness pages and controls.
10. Add Call of Cthulhu 7e.
