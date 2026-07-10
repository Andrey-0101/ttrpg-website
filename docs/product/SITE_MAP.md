# Site Map

## Status

This document contains:

1. the implemented site map at `main` commit `a1c3a61381a2b7cddab9dd8fb620af56342209a9`;
2. the next-stage map for VtM dice and video;
3. the later campaign-workspace direction.

The longer-term planning reference remains `SITE_MAP_TARGET.md`.

## 1. Current implemented site map

```mermaid
flowchart TD
    ROOT["/[locale] — Home"]

    ROOT --> GAMES["/[locale]/games — Games"]
    GAMES --> VTM["/[locale]/games/vampire-the-masquerade — VtM"]

    ROOT --> DASHBOARD["/[locale]/dashboard — Dashboard"]
    DASHBOARD --> CAMPAIGNS["/[locale]/campaigns — My Campaigns"]
    DASHBOARD --> CHARACTERS["/[locale]/characters — My Characters"]

    ROOT --> LOGIN["/[locale]/login — Login"]
    ROOT --> REGISTER["/[locale]/register — Register"]
    ROOT --> PROFILE["/[locale]/profile — Profile"]
    PROFILE --> PROFILE_EDIT["/[locale]/profile/edit — Edit Profile"]
    ROOT --> ACCOUNT["/[locale]/account — Account"]

    CHARACTERS --> CHARACTER_NEW["/[locale]/characters/new — Select System"]
    CHARACTER_NEW --> CHARACTER_NEW_SYSTEM["/[locale]/characters/new/[system] — Create Character"]
    CHARACTERS --> CHARACTER_DETAIL["/[locale]/characters/[id] — View/Edit Character"]

    CAMPAIGNS --> CAMPAIGN_NEW["/[locale]/campaigns/new — Create Campaign"]
    CAMPAIGNS --> CAMPAIGN_DETAIL["/[locale]/campaigns/[id] — Campaign Overview"]
    CAMPAIGN_DETAIL --> SHARED_CHARACTER["/[locale]/campaigns/[id]/characters/[characterId] — Shared Read-Only Character"]

    INVITE["/[locale]/campaigns/join/[token] — Accept Invitation"]
    LOGIN --> INVITE
    INVITE --> CAMPAIGN_DETAIL

    CONFIRM["/auth/confirm — Technical Auth Callback"]
    REGISTER --> CONFIRM
```

## 2. Current campaign overview structure

The current Campaign Foundation uses one integrated overview route rather than separate subroutes for every section.

```mermaid
flowchart TD
    CAMPAIGN["Campaign Overview"]

    CAMPAIGN --> IDENTITY["Identity and Status"]
    CAMPAIGN --> MANAGEMENT["GM Management"]
    CAMPAIGN --> INVITATIONS["Invitations"]
    CAMPAIGN --> MEMBERS["Game Master and Players"]
    CAMPAIGN --> CHARACTERS["Linked and Eligible Characters"]

    MANAGEMENT --> EDIT["Edit Name and Description"]
    MANAGEMENT --> COMPLETE["Complete Campaign"]
    MANAGEMENT --> DELETE["Delete Campaign"]

    INVITATIONS --> CREATE_INVITE["Create One-Time Invitation"]
    INVITATIONS --> REVOKE_INVITE["Revoke Invitation"]

    MEMBERS --> LEAVE["Player Leaves"]
    MEMBERS --> REMOVE["GM Removes Player"]

    CHARACTERS --> LINK["Owner Links Eligible Character"]
    CHARACTERS --> OPEN["Participant Opens Read-Only Sheet"]
    CHARACTERS --> UNLINK["Owner or GM Unlinks"]
```

## 3. Current access map

```mermaid
flowchart LR
    USER["Authenticated User"]

    USER --> OWN_CHARACTER["Own Character: Read/Edit/Delete"]
    USER --> PRIVATE_PORTRAIT["Own Portrait: Read/Upload/Replace/Delete"]

    GM["Campaign Game Master"]
    PLAYER["Campaign Player"]
    OUTSIDER["Outsider"]

    GM --> CAMPAIGN["Campaign Overview"]
    PLAYER --> CAMPAIGN
    OUTSIDER -. denied .-> CAMPAIGN

    GM --> SHARED["Linked Character: Read Only"]
    PLAYER --> SHARED
    OUTSIDER -. denied .-> SHARED

    OWNER["Character Owner"] --> EDIT["Character Edit"]
    GM -. no edit unless owner .-> EDIT
    PLAYER -. no edit unless owner .-> EDIT
```

## 4. Next-stage VtM dice map

Recommended personal route:

```text
/[locale]/games/vampire-the-masquerade/tools/dice
```

Recommended shared campaign route:

```text
/[locale]/campaigns/[id]/dice
```

```mermaid
flowchart TD
    VTM["VtM Game Area"] --> PERSONAL_DICE["Personal VtM Dice"]
    CAMPAIGN["Campaign Overview"] --> CAMPAIGN_DICE["Shared Campaign Dice"]

    PERSONAL_DICE --> LOCAL_RESULT["Structured Local Result"]

    CAMPAIGN_DICE --> SERVER_ROLL["Server-Authoritative Roll"]
    SERVER_ROLL --> DATABASE["Persisted dice_rolls"]
    DATABASE --> REALTIME["Campaign Realtime Feed"]
```

Personal dice should be implemented first without persistence.

The same deterministic VtM evaluator should later be reused by the server-authoritative campaign roll path.

## 5. Video map after the dice phases

Recommended campaign route:

```text
/[locale]/campaigns/[id]/video
```

```mermaid
flowchart TD
    CAMPAIGN["Campaign Overview"] --> VIDEO["Campaign Video"]
    VIDEO --> AUTH["Server Membership Check"]
    AUTH --> TOKEN["Short-Lived Provider Token"]
    TOKEN --> ROOM["Managed Video Room"]
```

There should be no permanent public room link.

ADR-009 remains Proposed until a provider comparison and disposable spike are complete.

## 6. Later Friend Campaign Alpha map

```mermaid
flowchart TD
    CAMPAIGN["Campaign Workspace"]

    CAMPAIGN --> OVERVIEW["Overview"]
    CAMPAIGN --> MEMBERS["Members"]
    CAMPAIGN --> CHARACTERS["Characters"]
    CAMPAIGN --> DICE["Dice"]
    CAMPAIGN --> VIDEO["Video"]
    CAMPAIGN --> HANDOUTS["Handouts"]
    CAMPAIGN --> NPCS["NPCs"]
    CAMPAIGN --> SESSIONS["Sessions / Chronicle"]
    CAMPAIGN --> NOTES["Shared and GM-Private Notes"]
    CAMPAIGN --> SETTINGS["Settings"]
```

Only implemented areas should appear as active navigation.

## 7. Current versus planned

Implemented now:

- Home;
- Games and basic VtM page;
- Auth;
- Dashboard;
- Profile and Account;
- Characters;
- Campaigns;
- invitation acceptance;
- membership controls;
- character sharing;
- campaign management.

Planned next:

- personal VtM dice;
- shared campaign dice;
- realtime campaign dice feed;
- campaign video.

Planned later:

- handouts;
- NPCs;
- sessions;
- notes;
- full VtM Game Hub;
- Public Readiness;
- Call of Cthulhu 7e.
