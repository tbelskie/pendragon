# Product Setup And Stage Engine

The Setup tab is the room router.

It should feel like a founder command intake, not a settings page. The founder is not configuring software. They are telling Pendragon what kind of product reality it is dealing with.

## Layout

The screen has four parts:

1. Stage verdict hero
2. Diagnosis cards
3. Setup form
4. Engine output panels

## Hero

The hero shows:

- Product Setup eyebrow
- stage diagnosis summary
- setup signal score
- recommended launch surface

The tone should be direct. The engine should be allowed to say when the saved room stage disagrees with the product signals.

## Diagnosis Cards

Three cards answer:

- What mode is this product in?
- What launch surface should Forge generate?
- What is the current goal?

These cards make the Setup tab useful even before the founder edits anything.

## Form

The form captures:

- product name
- product type
- business model
- current goal
- stage mode
- target date
- status
- source link
- prototype/repo/users/charging signals
- traction or proof note
- current focus

Do not add a full product-creation flow yet. v0.14 edits the active product only.

## Engine Output

The lower panels show:

- missing assets
- room module mix
- readiness bias
- recommended action stack

This keeps the stage engine visible. If the engine is wrong, the founder can understand why and edit the setup fields.

## Interaction Rules

- Setup saves to browser local storage.
- Source links must be full `http` or `https` URLs.
- Explicit stage override wins over inference.
- Auto stage inference updates the saved product stage on save.
- The current focus falls back to the stage definition if the field is blank.

## Product Feel

This screen should feel premium but calm:

- dark warroom surface
- compact cards
- direct labels
- no wizard ceremony
- no big blank onboarding flow

The founder should be able to answer the setup fields in under two minutes and immediately see how the room changes.
