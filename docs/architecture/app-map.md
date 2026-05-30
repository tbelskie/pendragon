# Application Map

Pendragon v0.1 should be small enough to build quickly and real enough to dogfood against Writing Quest.

## Routes

```text
/app
/app/setup
/app/portfolio
/app/products/:id
/app/products/:id/warroom
/app/products/:id/brief
/app/products/:id/decisions
/app/products/:id/docs
/app/products/:id/evidence
/app/products/:id/gate
/app/products/:id/forge
/app/products/:id/retro
```

## Screens

### Setup

Creates the first product room.

Inputs:

- product name
- stage
- one-liner
- user
- current milestone
- target date
- repo URL
- biggest worry

Output:

- product brief
- current focus
- readiness checklist
- decision needed
- top risk

### Portfolio

Shows the current product portfolio.

For internal dogfooding, seed:

- Writing Quest
- Dot Primer
- MockBizOps
- Vinegar
- Pendragon

### Product Warroom

The main screen.

Core panels:

- this week's focus
- next actions
- readiness by Build, Docs, Launch, Trust, Revenue
- decision needed
- top risk
- current milestone

The warroom should answer:

> What matters this week?

### Product Brief

Stores the product's one-liner, user, problem, promise, stage, milestone, and strategic constraints.

### Decisions

Captures durable choices and prevents re-litigating the same questions without new evidence.

### Docs

Tracks the product's public knowledge surface:

- landing page
- getting started
- FAQ
- privacy/trust
- changelog
- support
- API reference, if needed

In v0.4, Docs becomes an editable tracker. Each docs asset has status, priority, purpose, next move, proof link, and evidence. Saving the tracker syncs the product's Docs readiness row.

### Evidence

Collects manual evidence links before Pendragon invests in real connectors.

In v0.8, each evidence source has:

- title
- link
- type
- attachment target
- proof note

Evidence is the connector contract:

> What does this source prove, and where should Pendragon use it?

Forge uses safe evidence links attached to Forge as launch proof.

### Gate

Synthesizes the product room into a launch readiness verdict.

Inputs:

- readiness rows
- docs assets
- decision ledger
- support path

Outputs:

- blocked, at-risk, or ready verdict
- gate score
- criteria status
- next moves

For Writing Quest, the first gate asks:

> Can this product credibly enter paid beta yet?

### Forge

Generates the first external launch surface from the product room.

In v0.6, Forge creates:

- in-app launch surface preview
- standalone HTML draft export
- readiness signals for brief, docs, proof, and gate
- proof links from docs assets when safe external links exist
- missing-surface prompts based on open docs and unresolved decisions

In v0.7, Forge becomes stage-aware:

- beta products generate a paid beta page
- growth products generate a relaunch page
- prototype products generate a validation page
- each surface gets a conversion goal, CTA, trust frame, and buyer questions

In v0.9, Forge adds Launch Surface Controls:

- offer
- CTA label
- CTA URL
- support URL
- trust claim
- founder note

These controls keep Forge editable without turning it into a full page builder.

In v0.10, Forge adds Launch Surface QA:

- publishability score
- shareable, caution, or blocked verdict
- seven checks for offer, CTA, proof, trust, support, critical docs, and readiness
- clear-first blockers
- matching QA section in exported HTML

This keeps the launch surface honest before a founder shares it.

The core job:

> Build a launch site from the product room.

### Retro

Stores launch and weekly retrospectives.

## v0.1 Navigation

Keep the shell minimal:

- Portfolio
- Warroom
- Decisions
- Docs
- Evidence
- Gate
- Forge

Do not add a broad settings area until persistence/import/export requires it.
