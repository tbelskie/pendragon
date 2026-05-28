---
layout: page
title: Decisions
---

# Decision Ledger

## 2026-05-28: Pendragon Starts As A Notebook

Decision: start Pendragon as a Markdown-first GitHub Pages notebook instead of building a web app first.

Context: the product vision is still forming, but the portfolio needs an operating system immediately.

Why: Markdown is fast, repo-native, easy to review, and directly useful for docs-as-code practice.

Revisit when: repeated workflows become obvious enough to justify software.

## 2026-05-28: Four-Product Portfolio

Decision: use Writing Quest, Dot Primer, Vinegar, and MockBizOps as the first Pendragon portfolio.

Context: each product teaches a different launch pattern and creates real proof for the future Pendragon product.

Why: the portfolio turns scattered ideas into a testbed.

Revisit when: one product shows enough signal to demand sustained focus.

## 2026-05-28: Writing Quest Uses Pendragon As Launch Warroom

Decision: use `products/writing-quest` in Pendragon as the canonical product and launch memory for Writing Quest.

Context: Writing Quest implementation work is moving quickly in `tbelskie/writing-quest`, but launch scope, risks, pricing, docs, and GTM decisions need to survive across PRs.

Why: Pendragon should hold the strategic state above repo-native implementation so the product does not drift while code changes land.

Revisit when: Pendragon becomes a productized app or the workflow creates more maintenance than clarity.

## 2026-05-28: Writing Quest Paid Beta Scope

Decision: smallest lovable paid beta is the offline writing loop with local projects, companion choice, quest sessions, autosave/recovery trust, three-stage companion evolution, TXT/Markdown export, and honest local-first positioning.

Context: the product can be delightful without production DOCX/EPUB export, cloud sync, AI, telemetry, deep RPG systems, or Steam launch work.

Why: paid beta needs to prove that writers want the ritual. Extra systems before proof would increase launch risk and dilute the emotional center.

Revisit when: beta testers consistently ask for the same missing capability or export limitations block paid use.

## 2026-05-28: Writing Quest Defers In-App Licensing

Decision: remove visible trial limits, license-key entry, and unfinished encryption promises from the paid beta app path.

Context: the current launch bet is a simple paid desktop download. In-app license verification and security toggles were placeholder-level and made the product feel less trustworthy.

Why: writers should meet a calm writing ritual, not unfinished commerce plumbing. Sales/download access can be handled outside the app until the beta proves demand.

Revisit when: the direct-sales channel requires in-app activation or piracy/support risk becomes more expensive than the added complexity.

## 2026-05-28: Writing Quest Requires Real DOCX For Paid V1

Decision: real DOCX export is required for paid v1. TXT and Markdown remain supported baseline exports, and EPUB is a validation-gated stretch or post-launch feature.

Context: serious writers expect to move manuscript text into Word-first workflows for editing, sharing, and submission. The old DOCX/EPUB code was placeholder output wired to legacy drafts, so Writing Quest PR #27 removed that fake surface and opened `tbelskie/writing-quest` issues #25 and #26.

Why: export is a trust moment. Fake manuscript formats would make the app feel like a toy precisely when a writer needs confidence.

Revisit when: real DOCX is implemented and beta writers can test actual manuscript handoff.
