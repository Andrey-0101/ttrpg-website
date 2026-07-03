# TTRPG Hub — Current and Target Site Maps

        > Editable schematic site maps in Mermaid and plain-text tree formats.
        > The target map reflects the approved terminology and structural decisions.

        ## 1. Current Site Map

```mermaid
flowchart TD
    ROOT["/[locale] — Home"]

    ROOT --> GAMES["/[locale]/games — Games"]
    GAMES --> VTM["/[locale]/games/vampire-the-masquerade — VtM Game Page"]

    ROOT --> AUTH["Authentication"]
    AUTH --> LOGIN["/[locale]/login — Log In"]
    AUTH --> REGISTER["/[locale]/register — Register"]
    AUTH --> CONFIRM["/auth/confirm — Email Confirmation"]

    ROOT --> DASHBOARD["/[locale]/dashboard — Dashboard"]

    ROOT --> CHARACTERS["/[locale]/characters — My Characters"]
    CHARACTERS --> CHARACTER_NEW["/[locale]/characters/new — Select Game System"]
    CHARACTER_NEW --> CHARACTER_NEW_SYSTEM["/[locale]/characters/new/[system] — Create Character"]
    CHARACTERS --> CHARACTER_DETAIL["/[locale]/characters/[id] — View and Edit Character"]

    ROOT --> PROFILE["/[locale]/profile — Profile"]
    PROFILE --> PROFILE_EDIT["/[locale]/profile/edit — Edit Profile"]

    ROOT --> ACCOUNT["/[locale]/account — Account"]

    ROOT --> SYSTEM["System Routes"]
    SYSTEM --> NOT_FOUND["/[locale]/[...rest] — Localized Catch-All / Not Found"]
```

### Current structure summary

```text
/[locale]
├── games
│   └── vampire-the-masquerade
├── login
├── register
├── dashboard
├── characters
│   ├── new
│   │   └── [system]
│   └── [id]
├── profile
│   └── edit
├── account
└── [...rest]

/auth
└── confirm
```

### Current access model

| Area | Current access |
|---|---|
| Home | Public |
| Games | Public |
| VtM game page | Public |
| Log in and Register | Public |
| Dashboard | Authenticated user |
| Profile and Account | Authenticated user |
| Character list | Character owner |
| Character detail | Character owner |
| Character portraits | Character owner through private Storage and signed URLs |

### Current scope

Implemented:

- bilingual locale-prefixed routes;
- authentication and user profiles;
- owner-only character management;
- complete VtM V5 character sheet;
- private portraits;
- responsive desktop, tablet, and mobile layouts.

Not implemented:

- campaigns;
- campaign memberships and invitations;
- shared dice rolls;
- video rooms;
- handouts;
- NPCs;
- sessions;
- campaign notes;
- Call of Cthulhu 7e tools;
- public-ready account, legal, and support pages.

---

        ---

        ## 2. Revised Target Site Map

> Editable schematic site map in Mermaid and plain-text tree formats.
> The diagrams can be edited directly in Markdown and rendered by GitHub and other Mermaid-compatible tools.

---

## 1. Access Model

```mermaid
flowchart TD
    HOME["Home Page"]

    HOME --> PUBLIC["Public Access"]
    HOME --> REGISTERED["Registered User Access"]

    PUBLIC --> GAMES["Games"]
    PUBLIC --> PUBLIC_DICE["Dice Roller (optional public access)"]
    PUBLIC --> LOGIN["Log In"]
    PUBLIC --> REGISTER["Register"]

    REGISTERED --> GAMES_AUTH["Games"]
    REGISTERED --> CAMPAIGNS["Campaigns"]
    REGISTERED --> CHARACTERS["Characters"]
    REGISTERED --> DICE["Dice Roller"]
    REGISTERED --> VIDEO_SHORTCUTS["Video Rooms"]
    REGISTERED --> ACCOUNT["Account"]
```

### Access rule

- Unregistered users can access **Games** and, if approved, the standalone **Dice Roller**.
- Registered users can also access **Campaigns**, **Characters**, **Video Rooms**, and **Account**.
- Campaign-specific video and dice tools are available inside the campaign **Game Room**.

---

## 2. Top-Level Site Map

```mermaid
flowchart TD
    HOME["Home Page"]

    HOME --> GAMES["Games"]
    HOME --> CAMPAIGNS["Campaigns"]
    HOME --> CHARACTERS["Characters"]
    HOME --> DICE["Dice Roller"]
    HOME --> VIDEO["Video Rooms"]
    HOME --> ACCOUNT["Account"]
    HOME --> HELP["Help and Information"]
```

---

## 3. Games Section

```mermaid
flowchart TD
    GAMES["Games"]

    GAMES --> VTM["Vampire: The Masquerade V5"]
    GAMES --> COC["Call of Cthulhu 7e"]

    VTM --> VTM_OVERVIEW["Overview and Setting"]
    VTM --> VTM_START["Getting Started"]
    VTM --> VTM_SYSTEM["Game System"]
    VTM --> VTM_CREATION["Character Creation"]
    VTM --> VTM_RULES["Base Rules"]
    VTM --> VTM_REFERENCE["Quick Reference"]
    VTM --> VTM_RESOURCES["Resources"]
    VTM --> VTM_TOOLS["Tools"]
    VTM_TOOLS --> VTM_CREATE_CHARACTER["Create Character"]
    VTM_TOOLS --> VTM_DICE["Dice Roller"]

    COC --> COC_OVERVIEW["Overview and Setting"]
    COC --> COC_START["Getting Started"]
    COC --> COC_SYSTEM["Game System"]
    COC --> COC_CREATION["Character Creation"]
    COC --> COC_RULES["Base Rules"]
    COC --> COC_REFERENCE["Quick Reference"]
    COC --> COC_RESOURCES["Resources"]
    COC --> COC_TOOLS["Tools"]
    COC_TOOLS --> COC_CREATE_CHARACTER["Create Character"]
    COC_TOOLS --> COC_DICE["Dice Roller"]
```

### Notes

- **Vampire: The Masquerade V5** is the first complete game section.
- **Call of Cthulhu 7e** follows the same target structure but remains a later milestone.
- Game pages contain general information and system-specific tools.
- Private campaign data does not belong inside the Games section.

---

## 4. Campaigns Section

```mermaid
flowchart TD
    CAMPAIGNS["Campaigns"]

    CAMPAIGNS --> CREATE["Create Campaign"]
    CREATE --> CREATE_DETAILS["Campaign Details"]
    CREATE --> CREATE_SYSTEM["Select Game System"]
    CREATE --> CREATE_GM["Confirm Game Master"]
    CREATE --> CREATE_PLAYERS["Invite Players"]

    CAMPAIGNS --> ACTIVE["Active Campaigns"]
    ACTIVE --> CAMPAIGN_01["Campaign 01"]
    ACTIVE --> CAMPAIGN_02["Campaign 02"]
    ACTIVE --> CAMPAIGN_03["Campaign 03"]
    ACTIVE --> CAMPAIGN_N["Campaign N"]

    CAMPAIGNS --> COMPLETED["Completed Campaigns"]
    COMPLETED --> COMPLETED_01["Completed Campaign 01"]
    COMPLETED --> COMPLETED_02["Completed Campaign 02"]
    COMPLETED --> COMPLETED_03["Completed Campaign 03"]
    COMPLETED --> COMPLETED_N["Completed Campaign N"]
```

### Campaign creation

Player invitations are sent during campaign creation. There is no separate global Campaign Invitations section in the initial structure.

---

## 5. Active Campaign Structure

```mermaid
flowchart TD
    CAMPAIGN["Active Campaign"]

    CAMPAIGN --> OVERVIEW["Overview"]
    CAMPAIGN --> GAME_ROOM["Game Room"]
    CAMPAIGN --> MEMBERS["Members"]
    CAMPAIGN --> CHARACTERS["Characters"]
    CAMPAIGN --> HANDOUTS["Handouts"]
    CAMPAIGN --> NPCS["NPCs"]
    CAMPAIGN --> CHRONICLE["Chronicle"]
    CAMPAIGN --> NOTES["Notes"]
    CAMPAIGN --> SETTINGS["Settings"]

    MEMBERS --> GM["Game Master"]
    MEMBERS --> PLAYERS["Players"]

    CHRONICLE --> SESSION_01["Session 01"]
    CHRONICLE --> SESSION_02["Session 02"]
    CHRONICLE --> SESSION_03["Session 03"]
    CHRONICLE --> SESSION_N["Session N"]

    NOTES --> SHARED_NOTES["Shared Notes"]
    NOTES --> GM_NOTES["GM Private Notes"]

    SETTINGS --> CAMPAIGN_DETAILS["Campaign Details"]
    SETTINGS --> COMPLETE_CAMPAIGN["Complete Campaign"]
    SETTINGS --> DELETE_CAMPAIGN["Delete Campaign"]
```

### Active campaign overview

The campaign Overview may show:

- campaign name and description;
- game system;
- Game Master;
- players;
- next or current session;
- active characters;
- recent Chronicle entries;
- quick entry to the Game Room.

---

## 6. Game Room

The **Game Room** is the virtual table for the current session.

```mermaid
flowchart TD
    GAME_ROOM["Game Room"]

    GAME_ROOM --> VIDEO["Video"]
    GAME_ROOM --> DICE["Dice Roller"]
    GAME_ROOM --> HANDOUT_PREVIEW["Handout Preview"]
    GAME_ROOM --> PARTICIPANTS["Participant List"]
    GAME_ROOM --> QUICK_NOTES["Quick Notes"]
    GAME_ROOM --> CURRENT_CONTEXT["Current Session Context"]

    CURRENT_CONTEXT --> CURRENT_CHARACTERS["Active Characters"]
    CURRENT_CONTEXT --> CURRENT_NPCS["Current NPCs"]
    CURRENT_CONTEXT --> CURRENT_HANDOUTS["Selected Handouts"]
```

### Game Room principle

The Game Room combines the live-session tools in one place:

- video communication;
- campaign dice roller;
- handout preview;
- participant list;
- current characters and NPCs;
- temporary quick notes.

Permanent campaign content remains stored in:

- Characters;
- Handouts;
- NPCs;
- Chronicle;
- Notes.

---

## 7. Completed Campaign Structure

```mermaid
flowchart TD
    COMPLETED_CAMPAIGN["Completed Campaign"]

    COMPLETED_CAMPAIGN --> OVERVIEW["Overview"]
    COMPLETED_CAMPAIGN --> MEMBERS["Members"]
    COMPLETED_CAMPAIGN --> CHARACTERS["Characters"]
    COMPLETED_CAMPAIGN --> HANDOUTS["Handouts"]
    COMPLETED_CAMPAIGN --> NPCS["NPCs"]
    COMPLETED_CAMPAIGN --> CHRONICLE["Chronicle"]
    COMPLETED_CAMPAIGN --> NOTES["Notes"]
    COMPLETED_CAMPAIGN --> SETTINGS["Settings"]

    SETTINGS --> RESTORE["Restore Campaign"]
    SETTINGS --> DELETE["Delete Campaign"]
```

### Completed campaign behavior

- Completed campaigns are primarily read-only archives.
- The Game Room is not active.
- The GM may restore a campaign if the project supports reopening completed campaigns.

---

## 8. Characters Section

```mermaid
flowchart TD
    CHARACTERS["Characters"]

    CHARACTERS --> MY_CHARACTERS["My Characters"]
    CHARACTERS --> CREATE_CHARACTER["Create Character"]

    MY_CHARACTERS --> CHARACTER_01["Character 01"]
    MY_CHARACTERS --> CHARACTER_02["Character 02"]
    MY_CHARACTERS --> CHARACTER_N["Character N"]

    CHARACTER_01 --> VIEW_01["View"]
    CHARACTER_01 --> EDIT_01["Edit"]

    CHARACTER_02 --> VIEW_02["View"]
    CHARACTER_02 --> EDIT_02["Edit"]

    CHARACTER_N --> VIEW_N["View"]
    CHARACTER_N --> EDIT_N["Edit"]

    CREATE_CHARACTER --> SELECT_SYSTEM["Select Game System"]
    SELECT_SYSTEM --> CHARACTER_FORM["Character Form"]
```

### Character principle

- View and Edit are contained inside **My Characters**.
- There is no separate Character Details or Character Settings section.
- Campaign assignment and other character changes are handled through the existing character editing flow when those functions are introduced.

---

## 9. Standalone Dice Roller

```mermaid
flowchart TD
    DICE["Dice Roller"]

    DICE --> VTM["Vampire: The Masquerade V5"]
    DICE --> COC["Call of Cthulhu 7e"]
    DICE --> CUSTOM["Build a Dice Pool"]
```

### Dice Roller distinction

- The standalone Dice Roller is a general tool outside a campaign.
- The Game Room contains the campaign/session Dice Roller.
- Both may reuse the same game-system dice engine.

---

## 10. Video Rooms

```mermaid
flowchart TD
    VIDEO_ROOMS["Video Rooms"]

    VIDEO_ROOMS --> AVAILABLE["Available Rooms"]
    AVAILABLE --> ROOM_01["Campaign 01 — Game Room"]
    AVAILABLE --> ROOM_02["Campaign 02 — Game Room"]
    AVAILABLE --> ROOM_N["Campaign N — Game Room"]
```

### Video Rooms principle

The top-level Video Rooms section is a shortcut to Game Rooms that the registered user can currently access. The actual video room belongs to a campaign Game Room.

---

## 11. Account Section

```mermaid
flowchart TD
    ACCOUNT["Account"]

    ACCOUNT --> GUEST["Guest"]
    ACCOUNT --> USER["Registered User"]

    GUEST --> LOGIN["Log In"]
    GUEST --> REGISTER["Register"]

    USER --> PROFILE["Profile"]
    USER --> EDIT_PROFILE["Edit Profile"]
    USER --> SECURITY["Security"]
    USER --> PREFERENCES["Preferences"]
    USER --> LOGOUT["Log Out"]
```

Potential public-readiness additions:

- Privacy;
- Export Data;
- Delete Account.

---

## 12. Help and Information

```mermaid
flowchart TD
    HELP["Help and Information"]

    HELP --> HELP_CENTER["Help"]
    HELP --> ABOUT["About"]
    HELP --> CONTACT["Contact"]
    HELP --> PRIVACY["Privacy"]
    HELP --> TERMS["Terms"]
```

These pages may be introduced during the Public Readiness milestone.

---

## 13. Complete Plain-Text Target Tree

```text
Home Page
├── Games
│   ├── Vampire: The Masquerade V5
│   │   ├── Overview and Setting
│   │   ├── Getting Started
│   │   ├── Game System
│   │   ├── Character Creation
│   │   ├── Base Rules
│   │   ├── Quick Reference
│   │   ├── Resources
│   │   └── Tools
│   │       ├── Create Character
│   │       └── Dice Roller
│   └── Call of Cthulhu 7e
│       ├── Overview and Setting
│       ├── Getting Started
│       ├── Game System
│       ├── Character Creation
│       ├── Base Rules
│       ├── Quick Reference
│       ├── Resources
│       └── Tools
│           ├── Create Character
│           └── Dice Roller
├── Campaigns
│   ├── Create Campaign
│   │   ├── Campaign Details
│   │   ├── Select Game System
│   │   ├── Confirm Game Master
│   │   └── Invite Players
│   ├── Active Campaigns
│   │   └── Campaign
│   │       ├── Overview
│   │       ├── Game Room
│   │       │   ├── Video
│   │       │   ├── Dice Roller
│   │       │   ├── Handout Preview
│   │       │   ├── Participant List
│   │       │   ├── Quick Notes
│   │       │   └── Current Session Context
│   │       ├── Members
│   │       │   ├── Game Master
│   │       │   └── Players
│   │       ├── Characters
│   │       ├── Handouts
│   │       ├── NPCs
│   │       ├── Chronicle
│   │       │   └── Sessions
│   │       ├── Notes
│   │       │   ├── Shared Notes
│   │       │   └── GM Private Notes
│   │       └── Settings
│   │           ├── Campaign Details
│   │           ├── Complete Campaign
│   │           └── Delete Campaign
│   └── Completed Campaigns
│       └── Completed Campaign
│           ├── Overview
│           ├── Members
│           ├── Characters
│           ├── Handouts
│           ├── NPCs
│           ├── Chronicle
│           ├── Notes
│           └── Settings
│               ├── Restore Campaign
│               └── Delete Campaign
├── Characters
│   ├── My Characters
│   │   └── Character
│   │       ├── View
│   │       └── Edit
│   └── Create Character
│       ├── Select Game System
│       └── Character Form
├── Dice Roller
│   ├── Vampire: The Masquerade V5
│   ├── Call of Cthulhu 7e
│   └── Build a Dice Pool
├── Video Rooms
│   └── Available Game Rooms
├── Account
│   ├── Guest
│   │   ├── Log In
│   │   └── Register
│   └── Registered User
│       ├── Profile
│       ├── Edit Profile
│       ├── Security
│       ├── Preferences
│       └── Log Out
└── Help and Information
    ├── Help
    ├── About
    ├── Contact
    ├── Privacy
    └── Terms
```

---

## 14. Naming Applied

| Previous label | Revised label |
|---|---|
| Dice Pull | Dice Roller |
| Build Your Own Set | Build a Dice Pool |
| Legacy | Completed Campaigns |
| History | Chronicle |
| Useful sources | Resources |
| Lore Description | Overview and Setting |
| Playground | Game Room |

---

## 15. Editing Notes

- The diagram intentionally does not include a Dashboard.
- Player invitations are part of Create Campaign.
- Members contain only Game Master and Players.
- Campaign dice and video are inside the Game Room.
- View and Edit are inside My Characters.
- Character Settings is not included.
- Unregistered users see only Games, Account authentication actions, and optionally the standalone Dice Roller.
- The top-level Video Rooms section is only a shortcut to available campaign Game Rooms.
