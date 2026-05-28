# Writing Quest Launch Room

Last updated: 2026-05-28

## Launch

Working launch: paid beta.

Target window: October 2026, ahead of the fall writing season.

## Goal

First paid licenses and proof that writers respond to the retro writing quest positioning.

## Offer

One-time early access license. No subscription, cloud account, AI layer, or telemetry.

Pricing hypothesis: $19 early access, $29 launch price. Revisit only after beta feedback or a clear channel constraint.

## Product Thesis

Writing Quest should feel like booting up an old handheld game to write your novel: cozy, private, low-pressure, and quietly motivating.

## Current State

Writing Quest is now past skeleton stage. The app has a working desktop core loop: create project, choose companion, write in the editor, enter quest sessions, save locally, track progress, and evolve companions.

Recently shipped in `tbelskie/writing-quest`:

- Writing Quest brand cleanup across app/repo surfaces.
- TXT and Markdown export path.
- Quest completion/session persistence.
- Autosave, recovery, and close-save trust states.
- Project Library picker with safer project switching.
- Browser-preview persistence fallback for local QA.
- Three-stage writer-elemental companion model: base, first evolution, final evolution.
- Staged sprite sheet support for companion forms.
- Verified macOS DMG build on Apple Silicon.
- Core writing-loop copy polish: softer onboarding, quest start, pause/end states, save/export language, settings copy, and removal of unfinished trial/license/encryption/extras surfaces from the visible app.
- Export truth pass: removed fake legacy DOCX/EPUB commands, clarified TXT/Markdown as the current baseline, and opened real DOCX/EPUB tracking issues.
- Initial real DOCX export: current-project `.docx` package generation, Word Document export menu item, and automated package tests.
- Production art direction: Writing Quest PR #29 turned the final companion/icon/font quality bar into a concrete art brief and updated issue #12.

Open product truth: the generated art is not launch-quality. The sprite/icon pipeline and art direction now exist, but final companion/logo/font assets still need production execution.

## Smallest Lovable Paid Beta

Ship a charming, stable, offline writing ritual.

Include:

- Local project creation and project library.
- Companion choice with 1 base form and 2 evolutions.
- Focused editor with trustworthy autosave/recovery.
- Quest sessions with clear start, pause, completion, and progress feedback.
- Progress/evolution that feels encouraging, not judgmental.
- TXT, Markdown, and DOCX export with honest copy.
- Basic settings.
- Local-first privacy messaging.
- macOS build first, with Windows verification before broader sales claims.

Defer:

- EPUB unless it passes real package validation before launch.
- Cloud sync, accounts, collaboration, or web app behavior.
- AI writing features.
- Telemetry or productivity dashboards.
- Deep RPG systems, currencies, shops, streak pressure, or chore loops.
- Steam launch work until direct/itch/Gumroad beta signal exists.

## Readiness Checklist

- [x] Rename cleanup complete for the app/repo beta path.
- [x] Project creation works.
- [x] Project Library and safer project switching exist.
- [x] Editor autosave/recovery states are implemented.
- [x] TXT/Markdown export path exists.
- [x] Initial real DOCX export path exists.
- [x] Companion evolution model is scoped to three stages.
- [x] Core loop tone avoids shame, punishment, and productivity-theater language.
- [x] Unfinished in-app trial/license/encryption surfaces are hidden from the paid beta path.
- [x] macOS DMG build verifies on Apple Silicon.
- [x] Export copy clearly avoids overpromising DOCX/EPUB.
- [x] Production art direction brief exists.
- [ ] Desktop beta soak confirms save/export trust with real writing sessions.
- [ ] Real DOCX export is manually QA'd in Word-equivalent apps.
- [ ] Final companion/logo art is production-grade.
- [ ] Pixel font decision is resolved.
- [ ] Windows installer is built and verified.
- [ ] EPUB launch/post-launch decision is made.
- [ ] Paid beta sales/download/license behavior is defined outside the app.
- [ ] Landing page exists.
- [ ] Privacy/local-first messaging exists.
- [ ] Demo GIF/video exists.
- [ ] Support/contact path exists.
- [ ] Launch posts drafted.

## Active Risks

- Art quality is the biggest delight risk. The direction should be lo-fi but high-quality, closer to polished 90s handheld RPG craft than generated placeholder art.
- Real desktop beta testing has not yet produced enough evidence around long-session autosave, switching projects, quitting, and reopening.
- License/trial behavior is still undefined; it could distract from beta distribution if overbuilt too early.
- Initial real DOCX exists, but it still needs manual validation in Microsoft Word, Apple Pages, Google Docs import, and LibreOffice before launch claims harden.
- EPUB should not be sold as production-ready until proven with real manuscripts and validation.
- Windows packaging is still a launch-readiness gap.
- Distribution order needs discipline: direct paid beta first, then itch/Gumroad, then consider Steam after signal.
- Local build tooling has a machine-specific esbuild process issue; validation currently works by pointing `ESBUILD_BINARY_PATH` at a clean copied binary. This should be cleared with a local restart before packaging work.

## Next Build Priority

DOCX validation pass: run real desktop export QA, open/import generated files in Word-equivalent apps, and harden any formatting or compatibility issues.

## Next Docs/GTM Priority

Draft the one-page paid beta landing page, but keep DOCX copy cautious until issue #25 completes manual validation. The page should include promise, screenshots/GIF target, local-first trust, one-time price, support path, and honest beta caveats.

## Next Implementation Slices

1. DOCX validation pass: desktop export, Word/Pages/Google Docs/LibreOffice open/import QA, and fixes from that pass.
2. Production art execution: final companion sheets, app icon, boot emblem, and font decision from the art brief.
3. License/beta distribution decision: simple paid download first, avoid building a heavy licensing system before signal.
4. Landing page draft and demo capture plan.
5. Clear local esbuild process issue before the next packaging/build slice.
