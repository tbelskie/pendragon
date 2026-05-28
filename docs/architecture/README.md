# Pendragon Platform Architecture

Pendragon is moving from a Markdown notebook into a real platform.

The notebook remains valuable as the original product brain, but the primary product surface becomes a web app: a stage-aware launch warroom for solo software founders.

## Product Definition

Pendragon is a GTM warroom for micro-SaaS founders.

It helps founders develop, document, and launch small software products by turning product context into:

- current focus
- stage-specific readiness checks
- decisions
- risks
- docs and launch assets
- retrospectives
- eventually generated launch sites through Forge

## First ICP

The first buyer/user is not every person with an idea.

The first ICP is:

> Solo founders with a working prototype trying to reach beta or first revenue.

This founder has enough product reality for Pendragon to inspect and organize, but not enough GTM structure to launch confidently.

## Operating Rule

This conversation is for thinking and decision-making.

Durable work belongs in the `tbelskie/pendragon` repo.

Every meaningful product decision, architecture choice, roadmap change, workflow, and artifact should be codified in the repo so Pendragon becomes its own source of truth.

## Architecture Principles

### Dogfood First

Every feature must help launch Writing Quest or clarify the four-product portfolio.

If a feature does not help the portfolio move toward revenue, it waits.

### Stage-Aware

A founder in idea mode should not see the same room as a founder preparing a paid beta.

Pendragon routes founders into different operating modes based on product stage.

### Decision-Centric

Pendragon is not a task manager with a chatbot.

The core objects are:

- decisions
- risks
- milestones
- launch assets
- readiness checks
- retrospectives

Tasks exist, but they serve the founder's current milestone.

### Local-First Prototype

v0.1 should run without auth, backend, billing, or integrations.

Use local storage first. Add import/export so work is not trapped.

### Backend-Ready

Even while v0.1 is local-only, the domain model should be clean enough to migrate to Postgres later.

### Forge As A Module

Forge is the future "Build Launch Site" module.

It turns a product room into a public launch surface: landing page, docs, FAQ, pricing, changelog, privacy/trust page, `llms.txt`, and deployment scaffold.

Forge is not the whole product. It is a premium output of a healthy warroom.

## Initial Build Strategy

Build Pendragon as an internal-but-real web app inside this repo.

Recommended starting architecture:

```text
archive/notebook/
app/
  src/
    components/
    data/
    domain/
    routes/
    storage/
    styles/
  public/
    brand/
docs/
  architecture/
  product/
  decisions/
```

The app starts as a Vite/React SPA hosted from GitHub Pages under `/pendragon/app/`.

## First Dogfood Product

Writing Quest is Product Room #1.

Initial stage: Beta Mode.

Current milestone: paid beta launch.

Current focus: make the paid beta trustworthy.

Top risk: save/export/install trust.

Pendragon v0.1 succeeds only if it makes Writing Quest easier to launch.

