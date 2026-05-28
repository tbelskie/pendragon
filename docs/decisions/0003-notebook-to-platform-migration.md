# 0003: Notebook To Platform Migration

Date: 2026-05-28

## Decision

The Markdown notebook should be archived, not deleted.

The app becomes the primary Pendragon surface, but the notebook remains preserved as the original product brain.

## Context

The notebook captured the first coherent vision:

- portfolio operating system
- Writing Quest, Dot Primer, MockBizOps, Vinegar
- launch rooms
- docs plans
- product decisions
- templates
- playbooks

However, Pendragon needs to become a real platform to dogfood alongside Writing Quest.

## Migration Plan

Move current notebook content into:

```text
archive/notebook/
```

Create the app under:

```text
app/
```

Keep durable architecture, decisions, and product scope under:

```text
docs/
```

## Consequences

- GitHub Pages should eventually route the homepage toward the app or app landing page.
- The notebook remains available for reference.
- Future work should prioritize app development over expanding Markdown templates.

## Status

Accepted.

