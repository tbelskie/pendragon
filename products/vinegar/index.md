---
layout: page
title: Vinegar
---

# Vinegar

Impulse-shopping blocker for intentional spending.

## Status

Repo: `tbelskie/vinegar`

Current read: clean, vanilla Chrome extension structure with no build tools required. The concept is strong and the repo is much tidier than Dot, but it is not Chrome Store ready yet. A core visit-intervention path appears to reference a commented-out `quotes` array, which would break the breathing intervention.

## Current Bet

Can a browser-first intervention help users interrupt impulse purchases without feeling shamed, judged, or blocked from legitimate buying?

## Known Risks

- Release-blocking JS bug in breathing intervention quote selection.
- Broad `<all_urls>` host access and page injection will require a very clear privacy and permissions story.
- Popup-blocking CSS may interfere with merchant sites beyond shopping intervention intent.
- Premium/custom-sites behavior is simulated, not monetized.
- README says v1.0/public release, but user install path says Chrome Web Store is coming soon.

## Launch Lessons

- behavior-change UX
- privacy and trust positioning
- browser extension path
- consumer willingness to pay
- mobile expansion questions

## Files

- [Product Brief](product-brief.md)
- [Launch Room](launch-room.md)
- [Docs Plan](docs-plan.md)
- [Pricing](pricing.md)
- [Experiments](experiments.md)
- [Retrospective](retro.md)
