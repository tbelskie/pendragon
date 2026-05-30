# Domain Model

This model should work in local storage for v0.1 and migrate cleanly to a database later.

## Product

```ts
type Product = {
  id: string
  name: string
  stage: FounderStage
  oneLiner: string
  user: string
  problem: string
  promise: string
  repoUrl?: string
  setupProfile?: ProductSetupProfile
  revenueGoal?: string
  currentMilestoneId?: string
  targetDate?: string
  createdAt: string
  updatedAt: string
}
```

## FounderStage

```ts
type FounderStage =
  | "idea"
  | "prototype"
  | "beta"
  | "launch"
  | "shipped"
  | "stalled"
  | "relaunch"
  | "growth"
```

## ProductSetupProfile

```ts
type ProductSetupProfile = {
  productType:
    | "web-app"
    | "desktop-app"
    | "chrome-extension"
    | "mobile-app"
    | "api"
    | "content-product"
    | "services"
    | "other"
  businessModel:
    | "unknown"
    | "free"
    | "one-time-license"
    | "subscription"
    | "usage-based"
    | "services"
    | "marketplace"
  currentGoal:
    | "validate"
    | "prototype"
    | "beta"
    | "launch"
    | "monetize"
    | "relaunch"
    | "grow"
  stageOverride?: FounderStage | "auto"
  hasPrototype?: "yes" | "no" | "unknown"
  hasRepo?: "yes" | "no" | "unknown"
  usersHaveAccess?: "yes" | "no" | "unknown"
  isCharging?: "yes" | "no" | "unknown"
  sourceLink?: string
  traction?: string
}
```

## Milestone

```ts
type Milestone = {
  id: string
  productId: string
  name: string
  stage: FounderStage
  targetDate?: string
  status: "planned" | "active" | "complete" | "paused"
}
```

## Warroom

```ts
type Warroom = {
  productId: string
  thisWeeksFocus: string
  decisionNeeded?: string
  topRisk?: string
  nextActions: ActionItem[]
  readiness: ReadinessSection[]
}
```

## ActionItem

```ts
type ActionItem = {
  id: string
  productId: string
  label: string
  status: "todo" | "doing" | "done"
  category: "build" | "docs" | "launch" | "trust" | "revenue"
}
```

## ReadinessSection

```ts
type ReadinessSection = {
  id: string
  productId: string
  name: "Build" | "Docs" | "Launch" | "Trust" | "Revenue"
  items: ReadinessItem[]
}
```

## ReadinessItem

```ts
type ReadinessItem = {
  id: string
  label: string
  status: "todo" | "done"
  severity?: "low" | "medium" | "high"
}
```

## Decision

```ts
type Decision = {
  id: string
  productId: string
  date: string
  decision: string
  context: string
  options: string[]
  chosenPath?: string
  revisitTrigger?: string
}
```

## Risk

```ts
type Risk = {
  id: string
  productId: string
  label: string
  severity: "low" | "medium" | "high"
  mitigation?: string
  status: "open" | "mitigated" | "accepted"
}
```

## LaunchAsset

```ts
type LaunchAsset = {
  id: string
  productId: string
  type:
    | "landing-page"
    | "docs"
    | "faq"
    | "privacy"
    | "pricing"
    | "changelog"
    | "demo"
    | "announcement"
  status: "needed" | "drafting" | "ready" | "published"
  source?: string
  output?: string
}
```

## Persistence

v0.1 should persist all data to browser local storage under a versioned key.

Required operations:

- load workspace
- save workspace
- reset demo data
- export JSON
- import JSON

Suggested key:

```text
pendragon.workspace.v1
```
