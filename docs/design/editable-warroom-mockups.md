# Editable Warroom Design Mockups

This document defines the v0.2 visual target before implementation.

The static mockup lives at:

```text
app/mockups/editable-warroom/
```

When published on GitHub Pages, it can be viewed at:

```text
https://tbelskie.github.io/pendragon/app/mockups/editable-warroom/
```

## Design Goal

Pendragon should feel like premium founder infrastructure from day one, even while the product is local-only and backend-free.

The UI should communicate:

- control
- taste
- urgency
- calm
- launch discipline

It should not feel like:

- a generic dashboard template
- a Notion clone
- an admin settings page
- a toy prototype
- a form builder

## Visual Direction

### Name

Lava Glass Warroom

### System

- near-black app shell
- ember-orange primary actions
- dark red glass surfaces
- sharp 8px radii
- restrained borders
- dense but breathable spacing
- no decorative blobs
- no fake analytics clutter
- no oversized marketing hero behavior inside the product

## Mocked States

### State 1: Command View

The founder reads the room.

Key elements:

- product identity and stage
- launch readiness score
- current focus
- next three actions
- readiness meters
- decision needed
- top risk
- command bar with Edit, Export, Reset

### State 2: Edit Drawer

The founder sharpens the room.

Key elements:

- same product context remains visible
- editor appears as a premium command panel
- fields are grouped by launch focus, actions, decision, risk, and readiness
- Save is primary
- Cancel is secondary
- local-only data note is visible

## Interaction Direction

Editing should be explicit, not accidental.

Preferred flow:

1. User clicks "Edit room".
2. A contained editor opens.
3. User changes fields.
4. User clicks "Save changes".
5. App persists to local storage.
6. App exits edit mode and shows "Saved locally".

## Copy Rules

- Use product-language labels, not database labels.
- Say "focus", not "currentFocus".
- Say "top risk", not "risk field".
- Say "saved locally", not "synced".
- Avoid pretending there is a backend.

## Implementation Notes

The mockup is intentionally static. It is not the app source of truth.

Implementation should borrow the visual hierarchy and control placement, but keep the production app simple until real usage exposes the next need.
