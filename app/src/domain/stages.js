export const stageLabels = {
  idea: "Idea",
  prototype: "Prototype",
  beta: "Beta",
  launch: "Launch",
  shipped: "Shipped",
  stalled: "Stalled",
  relaunch: "Relaunch",
  growth: "Growth"
}

export const stageJobs = {
  idea: "Clarify the product and define a validation sprint.",
  prototype: "Prevent shapeless building and protect the smallest lovable v1.",
  beta: "Make the product trustworthy enough for real users.",
  launch: "Turn the product into a sellable launch.",
  shipped: "Turn a shipped product into a revenue and learning system.",
  stalled: "Find the smallest credible move that can restart product signal.",
  relaunch: "Restart attention with a sharper promise, proof loop, and conversion path.",
  growth: "Turn launch signal into a repeatable learning loop."
}

export const setupOptions = {
  businessModels: {
    unknown: "Unknown",
    free: "Free",
    "one-time-license": "One-time license",
    subscription: "Subscription",
    "usage-based": "Usage-based",
    services: "Services",
    marketplace: "Marketplace"
  },
  currentGoals: {
    validate: "Validate demand",
    prototype: "Shape the MVP",
    beta: "Prepare beta",
    launch: "Launch",
    monetize: "Monetize",
    relaunch: "Relaunch",
    grow: "Grow"
  },
  productTypes: {
    "web-app": "Web app",
    "desktop-app": "Desktop app",
    "chrome-extension": "Chrome extension",
    "mobile-app": "Mobile app",
    api: "API",
    "content-product": "Content product",
    services: "Services",
    other: "Other"
  },
  signals: {
    unknown: "Unknown",
    no: "No",
    yes: "Yes"
  },
  stageOverrides: {
    auto: "Infer from signals",
    idea: "Idea",
    prototype: "Prototype",
    beta: "Beta",
    launch: "Launch",
    shipped: "Shipped",
    stalled: "Stalled",
    relaunch: "Relaunch",
    growth: "Growth"
  }
}

export const stageDefinitions = {
  idea: {
    actionStack: [
      "Write the sharpest problem and audience hypothesis.",
      "Define the validation sprint and kill criteria.",
      "Collect three proof links that show the problem exists."
    ],
    defaultStatus: "Validation sprint",
    focus: "Turn the idea into a testable product brief.",
    modules: ["Brief", "Evidence", "Decisions", "Forge"],
    surfaceLabel: "Validation page",
    readinessBias: ["Problem", "Audience", "Proof", "Scope"]
  },
  prototype: {
    actionStack: [
      "Name the smallest lovable v1.",
      "Cut scope until the demo path is obvious.",
      "Write the first docs and support promises before beta."
    ],
    defaultStatus: "Prototype build",
    focus: "Prevent shapeless building and protect the MVP.",
    modules: ["Warroom", "Brief", "Docs", "Gate", "Forge"],
    surfaceLabel: "Prototype validation page",
    readinessBias: ["Build", "Docs", "Scope", "Trust"]
  },
  beta: {
    actionStack: [
      "Clear the highest-trust beta blocker.",
      "Make support and feedback paths obvious.",
      "Lock the beta offer before sending traffic."
    ],
    defaultStatus: "Beta prep",
    focus: "Make the product trustworthy enough for real users.",
    modules: ["Warroom", "Docs", "Evidence", "Gate", "Forge"],
    surfaceLabel: "Beta page",
    readinessBias: ["Trust", "Support", "Docs", "Offer"]
  },
  launch: {
    actionStack: [
      "Resolve the pricing and CTA path.",
      "Finish critical launch docs.",
      "Build the first public launch surface."
    ],
    defaultStatus: "Launch prep",
    focus: "Turn the product into a sellable launch.",
    modules: ["Warroom", "Decisions", "Docs", "Gate", "Forge"],
    surfaceLabel: "Paid launch page",
    readinessBias: ["Offer", "CTA", "Proof", "Revenue"]
  },
  shipped: {
    actionStack: [
      "Capture the current traction baseline.",
      "Find the retained-user reason to believe.",
      "Decide whether this product deserves monetization or maintenance."
    ],
    defaultStatus: "Shipped product review",
    focus: "Turn a shipped product into a revenue and learning system.",
    modules: ["Warroom", "Evidence", "Docs", "Gate", "Forge"],
    surfaceLabel: "Revenue review page",
    readinessBias: ["Traction", "Retention", "Feedback", "Pricing"]
  },
  stalled: {
    actionStack: [
      "Name why progress stopped.",
      "Choose the smallest credible restart move.",
      "Cut every task that does not restore product signal."
    ],
    defaultStatus: "Restart sprint",
    focus: "Restart product signal without pretending momentum exists.",
    modules: ["Warroom", "Decisions", "Evidence", "Gate"],
    surfaceLabel: "Restart brief",
    readinessBias: ["Focus", "Risk", "Scope", "Signal"]
  },
  relaunch: {
    actionStack: [
      "Rewrite the promise around what is newly true.",
      "Attach usage, proof, or retention evidence.",
      "Ship the relaunch surface before adding more features."
    ],
    defaultStatus: "Relaunch prep",
    focus: "Restart attention with a sharper promise and proof loop.",
    modules: ["Warroom", "Brief", "Evidence", "Docs", "Forge"],
    surfaceLabel: "Relaunch page",
    readinessBias: ["Positioning", "Proof", "Store/page", "Feedback"]
  },
  growth: {
    actionStack: [
      "Identify the strongest real usage signal.",
      "Choose one conversion or retention experiment.",
      "Turn feedback into the next product iteration."
    ],
    defaultStatus: "Growth loop",
    focus: "Turn launch signal into a repeatable learning loop.",
    modules: ["Warroom", "Evidence", "Docs", "Gate", "Forge"],
    surfaceLabel: "Growth experiment page",
    readinessBias: ["Retention", "Conversion", "Feedback", "Iteration"]
  }
}

function signalValue(value, fallback = "unknown") {
  const normalized = String(value ?? "").trim()
  return normalized || fallback
}

function hasText(value) {
  return Boolean(String(value ?? "").trim())
}

function evidenceSources(product) {
  return Array.isArray(product.evidenceSources) ? product.evidenceSources : []
}

function docsAssets(product) {
  return Array.isArray(product.docsAssets) ? product.docsAssets : []
}

function goalFromStage(stage) {
  if (stage === "idea") return "validate"
  if (stage === "prototype") return "prototype"
  if (stage === "beta") return "beta"
  if (stage === "launch") return "launch"
  if (stage === "relaunch" || stage === "stalled") return "relaunch"
  if (stage === "shipped" || stage === "growth") return "grow"
  return "validate"
}

export function stageDefinition(stage) {
  return stageDefinitions[stage] ?? stageDefinitions.prototype
}

export function setupProfileForProduct(product = {}) {
  const profile = product.setupProfile ?? {}
  const stage = product.stage ?? "prototype"
  const sourceLink = profile.sourceLink ?? product.repoUrl ?? evidenceSources(product).find((source) => source.type === "repo")?.url ?? ""

  return {
    businessModel: signalValue(profile.businessModel, "unknown"),
    currentGoal: signalValue(profile.currentGoal, goalFromStage(stage)),
    hasPrototype: signalValue(profile.hasPrototype, stage === "idea" ? "no" : "yes"),
    hasRepo: signalValue(profile.hasRepo, sourceLink ? "yes" : "unknown"),
    isCharging: signalValue(profile.isCharging, "unknown"),
    productType: signalValue(profile.productType, "other"),
    sourceLink,
    stageOverride: signalValue(profile.stageOverride, "auto"),
    traction: profile.traction ?? "",
    usersHaveAccess: signalValue(profile.usersHaveAccess, ["beta", "launch", "shipped", "stalled", "relaunch", "growth"].includes(stage) ? "yes" : "unknown")
  }
}

export function inferStageFromProfile(profile = {}, fallbackStage = "prototype") {
  if (profile.stageOverride && profile.stageOverride !== "auto") return profile.stageOverride
  if (profile.currentGoal === "relaunch") return profile.traction ? "relaunch" : "stalled"
  if (profile.currentGoal === "grow") return "growth"
  if (profile.currentGoal === "monetize" && profile.usersHaveAccess === "yes") return "launch"
  if (profile.currentGoal === "launch") return profile.hasPrototype === "yes" ? "launch" : "prototype"
  if (profile.currentGoal === "beta") return profile.hasPrototype === "yes" ? "beta" : "prototype"
  if (profile.currentGoal === "prototype") return profile.hasPrototype === "yes" ? "prototype" : "idea"
  if (profile.currentGoal === "validate") return profile.hasPrototype === "yes" ? "prototype" : "idea"
  if (profile.usersHaveAccess === "yes" && profile.isCharging === "yes") return "growth"
  if (profile.usersHaveAccess === "yes") return "beta"
  if (profile.hasPrototype === "yes") return "prototype"
  return fallbackStage
}

function setupCompleteness(profile) {
  const checks = [
    profile.productType !== "other",
    profile.businessModel !== "unknown",
    hasText(profile.currentGoal),
    profile.hasPrototype !== "unknown",
    profile.usersHaveAccess !== "unknown",
    profile.isCharging !== "unknown",
    hasText(profile.traction),
    hasText(profile.sourceLink)
  ]
  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}

function hasSupportPath(product) {
  return docsAssets(product).some((asset) => /support|feedback/i.test(`${asset.title} ${asset.id}`))
}

function hasProof(product, profile) {
  return hasText(profile.traction) || evidenceSources(product).some((source) => source.url)
}

function missingAssetsForStage(product, profile, stage) {
  const missing = []
  const brief = product.brief ?? {}

  if (!hasText(product.oneLiner)) {
    missing.push({ label: "Positioning", next: "Write the one-line product promise." })
  }

  if (!hasText(product.user)) {
    missing.push({ label: "Audience", next: "Name the specific first user." })
  }

  if (profile.businessModel !== "free" && !hasText(brief.pricingHypothesis)) {
    missing.push({ label: "Pricing", next: "Capture the current pricing hypothesis." })
  }

  if (profile.hasRepo === "yes" && !hasText(profile.sourceLink)) {
    missing.push({ label: "Source link", next: "Attach the repo, docs, or source-of-truth link." })
  }

  if (["beta", "launch", "shipped", "relaunch", "growth"].includes(stage) && !hasSupportPath(product)) {
    missing.push({ label: "Support path", next: "Add support or feedback docs before inviting users." })
  }

  if (["launch", "shipped", "relaunch", "growth"].includes(stage) && !hasProof(product, profile)) {
    missing.push({ label: "Proof", next: "Attach traction, usage, demo, or customer evidence." })
  }

  if (["beta", "launch", "relaunch"].includes(stage) && !docsAssets(product).some((asset) => asset.priority === "Critical")) {
    missing.push({ label: "Critical docs", next: "Name the launch docs that can break trust." })
  }

  return missing.slice(0, 6)
}

export function stageEngineResult(product = {}) {
  const profile = setupProfileForProduct(product)
  const inferredStage = inferStageFromProfile(profile, product.stage ?? "prototype")
  const savedStage = product.stage ?? inferredStage
  const stage = inferredStage
  const definition = stageDefinition(stage)
  const missingAssets = missingAssetsForStage(product, profile, stage)
  const missingActions = missingAssets.map((asset) => asset.next)

  return {
    completeness: setupCompleteness(profile),
    definition,
    inferredStage,
    missingAssets,
    profile,
    savedStage,
    stage,
    stageChanged: inferredStage !== savedStage,
    nextActions: [...missingActions, ...definition.actionStack].filter(Boolean).slice(0, 6)
  }
}

export function readinessPercent(product) {
  const readiness = Array.isArray(product.readiness) ? product.readiness : []
  const totals = readiness.reduce(
    (acc, section) => {
      acc.done += section.done
      acc.total += section.total
      return acc
    },
    { done: 0, total: 0 }
  )

  if (!totals.total) return 0
  return Math.round((totals.done / totals.total) * 100)
}
