# Current and Target Site Structure

## Summary

The current site is a bilingual private VtM character and campaign manager.

The target site is a bilingual multi-system TTRPG hub with trusted dice tools, private video rooms, campaign content, complete game hubs, and later public-readiness support.

## Structural comparison

| Area | Current | Target |
|---|---|---|
| Home | Implemented localized landing | Expanded entry point and relevant calls to action |
| Games catalogue | Basic | Multi-system catalogue |
| VtM area | Basic game page | Complete Game Hub |
| CoC area | Registered only | Complete later Game Hub and tools |
| Authentication | Implemented | Recovery, security, and complete account lifecycle |
| Dashboard | Implemented links to Campaigns and Characters | Personal cross-system overview |
| Characters | Complete VtM owner workflow plus campaign read-only sharing | Multi-system characters and approved optional sharing |
| Campaigns | Foundation complete | Full private campaign workspace |
| Invitations | Single-use seven-day links, revocation, login return | Retained and hardened |
| Members | GM/Player model, leave/remove | Retained and extended only by explicit decisions |
| Campaign Characters | Link/unlink and shared read-only sheets | Retained across future campaign tools |
| Campaign Management | Edit, complete, delete | Richer archive/settings only if approved |
| Dice | Not implemented | Personal system roller and server-authoritative shared feed |
| Video | Not implemented | Campaign-gated managed video room |
| Handouts | Not implemented | Private campaign library with visibility controls |
| NPCs | Not implemented | Simple and optional full-sheet NPC support |
| Sessions | Not implemented | First-class session records |
| Notes | Not implemented | Shared and GM-private campaign notes |
| Profile | Implemented | Clear separation from account settings |
| Account | Basic | Security, privacy, export, and deletion |
| Help/legal | Not implemented | Help, About, Contact, Privacy, Terms |
| Public character sharing | Not implemented | Optional, policy-controlled, later |
| Localization | EN/RU implemented | EN/RU retained across new areas |

## Completed transition

The project has already moved:

- from owner-only independent characters;
- to campaign membership as a shared-access boundary;
- to invitation, membership, lifecycle, and campaign character workflows.

## Remaining transition

The next architectural transition is:

- from asynchronous campaign management;
- to trusted system-specific dice execution;
- to persisted realtime campaign dice;
- to campaign-gated video;
- to remaining campaign content;
- then to public-readiness and additional systems.

## Recommended implementation order

1. Synchronize documentation after Campaign Foundation.
2. Accept the VtM dice result contract.
3. Build a pure personal VtM dice engine and roller.
4. Add server-authoritative persisted campaign dice.
5. Add a scoped realtime campaign feed.
6. Compare managed video providers and run a disposable spike.
7. Add the minimal campaign video room.
8. Add Handouts, NPCs, Sessions, and Notes.
9. Run a real friend-group campaign session.
10. Complete visual identity.
11. Expand the VtM Game Hub.
12. Complete Public Readiness.
13. Add Call of Cthulhu 7e.
