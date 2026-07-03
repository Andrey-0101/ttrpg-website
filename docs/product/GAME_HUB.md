# Game Hub

## Status

Proposed content and tool architecture.

The current application already has a VtM game route, but the full VtM Game Hub is not implemented.

## Separation of concerns

### Game Hub

General game-system area:

- information;
- getting started;
- guides;
- quick reference;
- resources;
- links to tools.

### Campaign Workspace

Private group area:

- members;
- characters;
- dice feed;
- video;
- handouts;
- NPCs;
- sessions;
- notes.

These must remain separate navigation and authorization domains.

## Proposed VtM V5 structure

### Landing

- concise description;
- intended style of play;
- current available tools;
- entry points.

Primary actions:

```text
Create Character
My Characters
Create Campaign
My Campaigns
Open Dice Roller
```

Only show actions that are implemented.

### Getting Started

- what is needed to play;
- how the site workflow works;
- creating an account;
- creating a character;
- creating or joining a campaign;
- using dice and video.

### Character Creation Guide

- character creation sequence;
- explanation of major sheet sections;
- examples;
- links into the character creator.

### Quick Reference

Potential subjects:

- dice pools;
- Difficulty;
- Hunger;
- Humanity;
- Stains;
- Health;
- Willpower;
- common result terminology;
- session reminders.

Content must be an original concise reference, not a reproduction of copyrighted rulebook text.

### Resources

- official game resources;
- legally appropriate external links;
- GM resources;
- books and tools;
- community resources after review.

### Tools

- characters;
- campaigns;
- VtM dice roller;
- future campaign video;
- future NPC tools.

## Content architecture

Long-form content should use structured Markdown/MDX or another reviewed content model.

Requirements:

- EN/RU versions;
- metadata;
- navigation hierarchy;
- stable content IDs;
- clear source/attribution policy;
- separation from UI dictionary files.

Do not place large articles in `messages/en.json` and `messages/ru.json`.

## Legal and content principles

Before public release:

- add a clear unofficial/fan-made notice;
- review trademarks and logos;
- avoid copying substantial protected text;
- prefer original summaries;
- link to official sources;
- define user-uploaded content responsibilities;
- add a takedown/contact process if public uploads are introduced.

## Future multi-system behavior

Each game system may provide:

```text
landing metadata
getting-started content
character guide
quick reference
resource list
tool links
theme
```

The common hub controls layout and navigation. The system package controls terminology and content.

## Completion criteria for VtM Game Hub

1. Structure approved.
2. EN/RU content model implemented.
3. Main landing complete.
4. Getting Started complete.
5. Character guide complete.
6. Quick reference complete.
7. Resources reviewed.
8. Tool links reflect actual availability.
9. Mobile, metadata, and accessibility reviewed.
10. Copyright/trademark approach reviewed before broad publication.
