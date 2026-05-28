# 0001: Repo As Source Of Truth

Date: 2026-05-28

## Decision

The `tbelskie/pendragon` repo is the durable source of truth for Pendragon.

Conversation can remain the place for exploration, but product decisions, architecture, roadmap, assets, and operating rules must be codified in the repo.

## Context

Pendragon is moving from a notebook and conversation thread into a real product.

If decisions only live in chat, the product will drift and the team will re-litigate the same questions.

## Consequences

- Meaningful decisions should become docs or ADRs.
- Product architecture should live under `docs/architecture/`.
- Product scope should live under `docs/product/`.
- Brand assets should live under `assets/brand/`.
- Future app code should live under `app/`.

## Status

Accepted.

