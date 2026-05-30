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

Routes the product room from founder answers and product signals.

Inputs:

- product name
- product type
- business model
- current goal
- inferred or overridden stage
- target date
- source link
- working prototype signal
- repo/source signal
- user access signal
- charging signal
- traction or proof note
- current focus

Output:

- stage diagnosis
- setup signal score
- missing assets
- room module mix
- readiness bias
- recommended next action stack
- default Forge surface type

In v0.14, Setup becomes an editable tab for the active product rather than a one-time onboarding screen.

In v0.15, Setup gains product creation:

- sidebar New product entry point
- create-mode setup form
- product name requirement
- stage inference from setup signals
- starter docs assets
- starter readiness rows
- first decision
- source evidence link when supplied
- immediate routing into the new Warroom

### Portfolio

Shows the current product portfolio.

For internal dogfooding, seed:

- Writing Quest
- Dot Primer
- MockBizOps
- Vinegar
- Pendragon

Locally-created products are appended to the portfolio and stored in browser local storage.

In v0.16, Portfolio becomes the command center above the product rooms:

- recommended focus product
- attention score based on readiness, gates, docs, proof, decisions, and stage mismatch
- portfolio health metrics
- ranked product cards
- direct routing into Warroom, Setup, and Forge

In v0.17, Portfolio adds the Clear First command queue:

- ranked unblock moves across products
- severity from stage mismatch, gate blockers, critical docs, Forge QA, proof, decisions, and setup gaps
- direct routing into the module where the work lives
- product cards show their top Clear First item

The portfolio view should answer:

> Which product needs my attention next?

The Clear First queue should answer:

> What should I unblock before adding more work?

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

In v0.11, Forge adds Launch Share Package:

- primary launch post
- short teaser
- founder DM
- clear-first blockers
- proof links
- next moves
- Markdown export

This gives the founder an outbound packet generated from the same room as the launch surface.

In v0.12, Forge adds Manual Publish Path:

- suggested static folder
- expected `index.html` location
- placeholder GitHub Pages URL pattern
- manual publish steps
- CTA and QA blockers
- Markdown publish guide export

This makes the generated surface publishable by hand before Pendragon automates deployments.

In v0.13, Forge adds Launch Surface History:

- local launch surface snapshots
- current-vs-latest comparison
- QA score delta
- blocker delta
- proof-link delta
- docs-ready delta
- latest snapshot trail

This turns generated launch surfaces into saved launch artifacts.

In v0.14, Forge consumes the expanded stage model:

- idea products generate validation pages
- prototype products generate prototype validation pages
- beta products generate beta pages
- launch products generate paid launch pages
- shipped, stalled, relaunch, and growth products generate relaunch or review surfaces

The stage engine lives before Forge. Forge should not guess the founder's situation from vibes.

The core job:

> Build a launch site from the product room.

### Retro

Stores launch and weekly retrospectives.

## v0.1 Navigation

Keep the shell minimal:

- Portfolio
- Setup
- Warroom
- Decisions
- Docs
- Evidence
- Gate
- Forge

Do not add a broad settings area until persistence/import/export requires it.
