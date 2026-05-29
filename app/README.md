# Pendragon App

This is the first app scaffold for Pendragon.

It is intentionally static and Pages-friendly for now. It can be opened directly at `/app/` on GitHub Pages without a build pipeline.

The scaffold is designed so it can grow into a Vite/React app later, but the immediate goal is dogfooding:

> Use Pendragon to manage the launch of Writing Quest.

## Local Preview

From this directory:

```bash
npm install
npm run dev
```

The current source is plain ES modules, so it can also be served by any static file server.

## Current Scope

- Lava Glass branded shell.
- Seeded four-product portfolio.
- Stage-aware product metadata.
- Writing Quest as the primary dogfood room.
- Warroom preview panels.
- Local editable state for the active product room.

## Design Mockups

- [Editable Warroom](mockups/editable-warroom/)

## Not Yet

- Auth.
- Backend.
- AI generation.
- GitHub integration.
- Real Forge generation.
