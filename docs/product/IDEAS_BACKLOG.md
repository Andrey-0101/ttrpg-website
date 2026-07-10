# Product Ideas Backlog

## Purpose

This document captures product and user-experience ideas that arise during development, testing, and real campaign use.

Items in this document are not commitments and are not automatically part of the approved roadmap. An idea enters `ROADMAP.md` or a feature specification only after explicit review and acceptance.

## Statuses

- **Inbox** — captured but not yet reviewed.
- **Under review** — currently being evaluated.
- **Accepted** — approved for future roadmap placement or feature specification.
- **Deferred** — useful and accepted in principle, but intentionally postponed.
- **Rejected** — reviewed and not planned.
- **Implemented** — completed and retained for historical reference.

## Review process

1. Capture the idea with a stable identifier.
2. Describe the observed problem and the proposed improvement.
3. Record open questions, dependencies, and risks.
4. Review the idea before assigning scope or priority.
5. Move accepted work into the relevant product specification and roadmap milestone.
6. Create an implementation issue only when the work is sufficiently defined.

## Backlog index

| ID | Idea | Area | Status | Suggested milestone |
|---|---|---|---|---|
| IDEA-001 | Campaign edit mode activated by a button | Campaigns / User interface | Inbox | Milestone 5 — Friend Campaign Alpha, subject to review |
| IDEA-002 | Move campaign invitations below players and characters | Campaigns / Page structure | Inbox | Milestone 5 — Friend Campaign Alpha, subject to review |
| IDEA-003 | Combine players and characters into one list | Campaigns / Members / Characters | Inbox | Milestone 5 — Friend Campaign Alpha, subject to review |
| IDEA-004 | Interactive character portrait preparation | Characters / Portraits / Image upload | Deferred | Milestone 6 — Visual Identity, subject to review |

---

## Campaign UX

### IDEA-001 — Campaign edit mode activated by a button

- **Status:** Inbox
- **Area:** Campaigns / User interface
- **Added:** 2026-07-10
- **Suggested milestone:** Milestone 5 — Friend Campaign Alpha, subject to review
- **Priority:** Unassigned
- **Source:** Observation during Campaign Management testing
- **Related documents:**
  - `docs/product/CAMPAIGNS.md`
  - `docs/product/ROADMAP.md`

#### Problem

The campaign management section is permanently displayed as an open editing form. This makes the page look visually overloaded, while the campaign name, description, and other settings appear as fields that the Game Master is expected to edit constantly.

#### Idea

Display campaign information in a read-only view mode by default.

Add an **Edit** button for the Game Master. After the button is selected:

- the campaign name becomes an editable field;
- the campaign description becomes an editable field;
- other editable campaign settings also enter edit mode;
- **Save** and **Cancel** buttons appear.

After saving or cancelling, the page returns to the standard view mode.

The **Complete campaign** and **Delete campaign** actions should remain separate from ordinary campaign editing.

#### Why it may be useful

- Reduces visual clutter on the Campaign Overview page.
- Makes viewing the campaign the default state.
- Reduces the risk of accidental changes.
- Separates ordinary editing from destructive lifecycle actions.
- Makes the interface clearer for the Game Master.

#### Risks or questions

- Where should the **Edit** button be placed?
- Should all campaign settings be edited together or in separate sections?
- Should other campaign actions be disabled while edit mode is active?
- How should edit mode appear on mobile screens?
- Should unsaved-change protection remain active only while edit mode is open?

#### Decision

Not reviewed.

---

### IDEA-002 — Move campaign invitations below players and characters

- **Status:** Inbox
- **Area:** Campaigns / Page structure
- **Added:** 2026-07-10
- **Suggested milestone:** Milestone 5 — Friend Campaign Alpha, subject to review
- **Priority:** Unassigned
- **Source:** Observation during Campaign Overview testing
- **Related documents:**
  - `docs/product/CAMPAIGNS.md`
  - `docs/product/ROADMAP.md`

#### Problem

The invitation section is displayed above campaign members and characters.

During regular campaign use, it is more important to see:

- who is participating in the campaign;
- which characters are linked to the campaign;
- the current composition of the group.

Invitations are an administrative tool and are normally used less frequently.

#### Idea

Change the order of sections on the Campaign Overview page.

Suggested order:

1. Campaign information.
2. Players and characters.
3. Invitations.
4. Campaign management.

The invitation section should continue to be visible only to the Game Master.

#### Why it may be useful

- The most important campaign information appears first.
- The Game Master can see the group composition and linked characters more quickly.
- The page better reflects typical campaign usage.
- Administrative tools do not distract from the current campaign state.

#### Risks or questions

- Should the section order be different for the Game Master and Players?
- Should the invitation section be collapsible?
- Should the section heading show the number of active invitations?
- Should expired or revoked invitations remain visible in the same location?

#### Decision

Not reviewed.

---

### IDEA-003 — Combine players and characters into one list

- **Status:** Inbox
- **Area:** Campaigns / Members / Characters
- **Added:** 2026-07-10
- **Suggested milestone:** Milestone 5 — Friend Campaign Alpha, subject to review
- **Priority:** Unassigned
- **Source:** Observation during Campaign Members and Campaign Characters testing
- **Related documents:**
  - `docs/product/CAMPAIGNS.md`
  - `docs/product/ROADMAP.md`

#### Problem

Players and characters are currently displayed in separate sections.

To understand the composition of the group, the user must review:

- the campaign member list;
- the linked character list;
- the owner of each character.

The connection between a player and their campaign character is not immediately visible.

#### Idea

Combine players and characters into one section, for example **Members and Characters**.

Display each member in a single row or card:

```text
Player name | Role | Character | Actions
```

Example:

```text
Anna | Player | Varvara — Tremere | Open character
```

For a player without a linked character, display:

```text
No character selected
```

The Game Master should also appear in the same list with a clear GM role indicator. When the Game Master has linked their own character, it should be displayed alongside their account.

#### Why it may be useful

- The complete group composition is visible immediately.
- The relationship between an account and a character is clear.
- The Game Master can quickly identify players without linked characters.
- The number of separate page sections is reduced.
- Member and character actions can be placed together.

#### Risks or questions

- Can one Player link multiple characters to the same campaign?
- Should one character be marked as the primary or active character?
- How should multiple characters belonging to one player be displayed?
- Where should the **Remove player** and **Unlink character** actions be placed?
- Should former members who have left the campaign remain visible?
- How should the combined row or card appear on mobile screens?
- How should unassigned campaign characters be displayed?

#### Decision

Not reviewed.

---

## Character UX

### IDEA-004 — Interactive character portrait preparation

- **Status:** Deferred
- **Area:** Characters / Portraits / Image upload
- **Added:** 2026-07-10
- **Suggested milestone:** Milestone 6 — Visual Identity, subject to review
- **Priority:** Unassigned
- **Source:** Observation during character sheet testing
- **Related documents:**
  - `docs/architecture/CHARACTER_SHEETS.md`
  - `docs/product/ROADMAP.md`

#### Problem

A user may upload an image whose aspect ratio does not match the portrait area used on the character sheet or character card.

Automatic cropping may remove an important part of the image. The user currently cannot choose:

- which part of the image should remain visible;
- how far the portrait should be zoomed in;
- how far it should be zoomed out;
- how the image should be positioned within the final crop area.

Very large images may also have unnecessarily high dimensions and consume excessive Storage space.

#### Idea

Add an interactive portrait preparation step after the user selects an image.

##### Interface requirements

Before uploading or permanently saving the portrait:

1. Show the recommended portrait aspect ratio.
2. Display a fixed crop frame with the required aspect ratio.
3. Allow the user to move the image within the frame.
4. Allow the user to adjust the image scale:
   - zoom in;
   - zoom out;
   - bring the required area closer;
   - move the image further away when its dimensions allow it.
5. Show a preview of the final crop.
6. Save the image only after the user confirms the result.

##### Image processing

For images that are too large:

1. Reduce the physical image dimensions to a reasonable maximum before cropping.
2. Preserve the original image proportions during resizing.
3. Apply the user-selected:
   - position;
   - scale;
   - crop area.
4. Generate the final image with the required aspect ratio and resolution.

Automatic cropping without user input should be used only as a fallback.

#### Why it may be useful

- Important parts of the portrait are not accidentally removed.
- The user controls the final composition.
- Portraits have a more consistent appearance.
- Excessively large files are reduced before being stored.
- Portrait presentation improves across cards, sheets, and mobile layouts.
- It establishes a consistent visual standard for character portraits.

#### Risks or questions

- What exact aspect ratio should be used for the main portrait?
- Should character cards and character sheets use the same aspect ratio?
- Should the application generate multiple image sizes?
- Should the original image be retained, or only the processed version?
- Should processing happen in the browser, on the server, or through an external image service?
- What maximum file dimensions and size should be allowed?
- What minimum resolution should be considered acceptable?
- Should crop position and scale values be stored for later editing?
- Should users be able to change the crop without uploading the image again?
- How should the editor work on touchscreens?

#### Possible minimum first version

- One fixed aspect ratio.
- Image movement with a mouse or finger.
- A zoom slider.
- A crop preview.
- Reduction of excessively large images.
- Saving one processed and cropped image.

#### Decision

The broad portrait crop and focal-point capability is already listed as deferred in `ROADMAP.md`. This detailed interaction proposal remains unscoped and should be reviewed before implementation.

---

## Idea template

### IDEA-XXX — Short idea name

- **Status:** Inbox
- **Area:** Characters / Campaigns / Dice / Video / Platform
- **Added:** YYYY-MM-DD
- **Suggested milestone:** Unassigned
- **Priority:** Unassigned
- **Source:** Development observation / User feedback / Friend test
- **Related documents:**
  - `docs/product/...`

#### Problem

Describe the observed problem or inconvenience.

#### Idea

Describe the proposed change, addition, or improvement.

#### Why it may be useful

Describe the expected user or project benefit.

#### Risks or questions

List the points that must be clarified before acceptance.

#### Decision

Not reviewed.
