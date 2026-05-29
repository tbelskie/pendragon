---
layout: page
title: Dot Primer
---

# Dot Primer

Chrome extension for focused deep work sessions.

## Status

Repo: `tbelskie/dot`

Known product data from Chrome Web Store dashboard:

- 53 installs
- 4 uninstalls
- 14 actual users
- roughly 10 daily users recently
- 16 weekly users in screenshot
- 468 page views
- 1.48K impressions

## Current Read

Dot Primer has weak acquisition volume but real passive usage. The most interesting signal is that people still use it despite no active development or marketing.

The repo contains a packaged Chrome extension at `dot-extension1.0.0/`, older submission folders, a public docs/marketing site under `docs/`, and a separate Vite/React mobile-style prototype in `src/`.

## Current Bet

Can listing optimization, basic analytics, and a small product polish pass turn passive usage into clearer retention and monetization signal?

## Known Risks

- Repo contains multiple historical extension bundles, which makes the source of truth unclear.
- `package.json` describes a `dot-ios-app`, while the shipped product is a Chrome extension.
- Extension requests broad host access and injects a floating sidebar on all pages.
- Current focus copy can feel harsh or performance-bro-y in places.
- Build command currently cannot run without installing dependencies.

## Launch Lessons

- Chrome Web Store discovery
- extension positioning
- retention and enablement
- lightweight product analytics
- focus/productivity market differentiation

## Files

- [Product Brief](product-brief.md)
- [Launch Room](launch-room.md)
- [Docs Plan](docs-plan.md)
- [Pricing](pricing.md)
- [Experiments](experiments.md)
- [Retrospective](retro.md)
