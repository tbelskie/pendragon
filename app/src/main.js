import { loadWorkspace, resetWorkspace, saveWorkspace } from "./storage/workspace.js"
import {
  inferStageFromProfile,
  readinessPercent,
  setupOptions,
  stageDefinition,
  stageEngineResult,
  stageJobs,
  stageLabels
} from "./domain/stages.js"

let workspace = loadWorkspace()
let activeView = "warroom"
let isEditing = false
let isCreatingProduct = false
let hasUnsavedFormChanges = false
let statusMessage = "Local-only workspace"
let errorMessage = ""

const views = [
  { id: "setup", label: "Setup" },
  { id: "warroom", label: "Warroom" },
  { id: "brief", label: "Brief" },
  { id: "decisions", label: "Decisions" },
  { id: "docs", label: "Docs" },
  { id: "evidence", label: "Evidence" },
  { id: "gate", label: "Gate" },
  { id: "forge", label: "Forge" }
]

const decisionStatusLabels = {
  open: "Open",
  chosen: "Chosen",
  parked: "Parked"
}

const docsStatusLabels = {
  missing: "Missing",
  drafting: "Drafting",
  blocked: "Blocked",
  ready: "Ready"
}

const docsStatusOrder = ["missing", "drafting", "blocked", "ready"]

const evidenceTypeLabels = {
  repo: "Repo",
  doc: "Doc",
  pricing: "Pricing",
  analytics: "Analytics",
  design: "Design",
  support: "Support",
  demo: "Demo",
  waitlist: "Waitlist",
  store: "Store",
  other: "Other"
}

const evidenceAttachLabels = {
  brief: "Brief",
  docs: "Docs",
  gate: "Gate",
  forge: "Forge"
}

const evidenceTypeOrder = ["repo", "doc", "pricing", "analytics", "design", "support", "demo", "waitlist", "store", "other"]
const evidenceAttachOrder = ["brief", "docs", "gate", "forge"]

function activeProduct() {
  return workspace.products.find((product) => product.id === workspace.activeProductId) ?? workspace.products[0]
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function safeProofLink(value) {
  const link = String(value ?? "").trim()
  return /^https?:\/\//i.test(link) ? link : ""
}

function fallbackText(value, fallback) {
  const text = String(value ?? "").trim()
  return text || fallback
}

function trimSentenceEnd(value) {
  return String(value ?? "").trim().replace(/[.!?]+$/g, "")
}

function slugifyFilename(value) {
  const slug = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  return slug || "product"
}

function numberValue(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeReadiness(doneValue, totalValue) {
  const total = Math.max(1, numberValue(totalValue, 1))
  const done = Math.min(total, Math.max(0, numberValue(doneValue, 0)))
  return { done, total }
}

function uniqueProductId(name) {
  const base = slugifyFilename(name)
  let candidate = base
  let index = 2

  while (workspace.products.some((product) => product.id === candidate)) {
    candidate = `${base}-${index}`
    index += 1
  }

  return candidate
}

function renderOptions(options, currentValue) {
  return Object.entries(options)
    .map(([value, label]) => `
      <option value="${escapeHtml(value)}" ${value === currentValue ? "selected" : ""}>${escapeHtml(label)}</option>
    `)
    .join("")
}

function productDocsAssets(product) {
  return Array.isArray(product.docsAssets) ? product.docsAssets : []
}

function productEvidenceSources(product) {
  return Array.isArray(product.evidenceSources) ? product.evidenceSources : []
}

function productLaunchSnapshots(product) {
  return Array.isArray(product.launchSnapshots) ? product.launchSnapshots : []
}

function docsStats(product) {
  const assets = productDocsAssets(product)
  const ready = assets.filter((asset) => asset.status === "ready").length
  const drafting = assets.filter((asset) => asset.status === "drafting").length
  const blocked = assets.filter((asset) => asset.status === "blocked").length
  const missing = assets.filter((asset) => asset.status === "missing").length
  const criticalOpen = assets.filter((asset) => asset.priority === "Critical" && asset.status !== "ready").length
  const percent = assets.length ? Math.round((ready / assets.length) * 100) : 0

  return { assets, ready, drafting, blocked, missing, criticalOpen, percent }
}

function evidenceStats(product) {
  const sources = productEvidenceSources(product)
  const safeSources = sources.filter((source) => safeProofLink(source.url))
  const forgeSources = safeSources.filter((source) => source.attachedTo === "forge")
  const trustSources = safeSources.filter((source) => /trust|privacy|support|install|save|export|security/i
    .test(`${source.title} ${source.note} ${source.type}`))

  return {
    forgeSources,
    safeSources,
    sources,
    trustSources
  }
}

function docsPriorityRank(priority) {
  return ({ Critical: 0, High: 1, Medium: 2, Low: 3 })[priority] ?? 4
}

function surfaceTemplateForProduct(product) {
  if (product.stage === "idea") {
    return {
      ctaDetail: "Use this CTA to collect proof before the founder spends more build energy.",
      goal: "Validate the promise, audience, and problem before the product hardens.",
      id: "validation",
      label: "Validation page",
      offerLabel: "Validation offer",
      primaryCta: "Join the validation sprint",
      proofLabel: "Problem proof",
      questionLabel: "Validation questions",
      risk: "The page has to learn whether anyone wants the promise badly enough to keep going."
    }
  }

  if (product.stage === "prototype") {
    return {
      ctaDetail: "Use this CTA to recruit early evaluators before pretending the product is broadly ready.",
      goal: "Turn a working prototype into a focused early-user test.",
      id: "prototype-validation",
      label: "Prototype validation page",
      offerLabel: "Prototype offer",
      primaryCta: "Try the prototype",
      proofLabel: "Prototype proof",
      questionLabel: "Prototype questions",
      risk: "The founder has to prove the MVP is useful without overpromising completeness."
    }
  }

  if (product.stage === "beta") {
    return {
      ctaDetail: "Use this CTA only when the trust story, install path, and support loop are honest enough for paid early access.",
      goal: "Convert qualified early users into paid beta customers without hiding what is still unfinished.",
      id: "paid-beta",
      label: "Paid beta page",
      offerLabel: "Beta offer",
      primaryCta: "Join paid beta",
      proofLabel: "Beta trust",
      questionLabel: "Buyer questions",
      risk: "A stranger has to believe the product is useful, safe enough, and worth paying for now."
    }
  }

  if (product.stage === "launch") {
    return {
      ctaDetail: "Use this CTA when the offer, pricing, and support path are explicit enough for public traffic.",
      goal: "Convert launch attention into the first credible customer action.",
      id: "paid-launch",
      label: "Paid launch page",
      offerLabel: "Launch offer",
      primaryCta: "Buy now",
      proofLabel: "Launch proof",
      questionLabel: "Buyer questions",
      risk: "A visitor has to understand why the product is worth paying for now."
    }
  }

  if (["shipped", "stalled", "relaunch", "growth"].includes(product.stage)) {
    return {
      ctaDetail: "Use this CTA when the relaunch promise is sharper than the old listing, page, or onboarding flow.",
      goal: "Restart attention from retained users and turn passive usage into clearer product signal.",
      id: "relaunch",
      label: "Relaunch page",
      offerLabel: "Relaunch offer",
      primaryCta: "Try the relaunch",
      proofLabel: "Retention proof",
      questionLabel: "Relaunch questions",
      risk: "Users need to understand why this is newly worth their attention."
    }
  }

  return {
    ctaDetail: "Use this CTA to collect signal before pretending the product is ready for a broad launch.",
    goal: "Validate the promise, audience, and trust hurdle before the founder overbuilds.",
    id: "validation",
    label: "Validation page",
    offerLabel: "Validation offer",
    primaryCta: "Join the waitlist",
    proofLabel: "Credibility proof",
    questionLabel: "Validation questions",
    risk: "The page has to learn whether anyone wants the promise badly enough to keep going."
  }
}

function trustSensitiveAsset(asset) {
  return /trust|privacy|permission|support|feedback|save|export|install|local data|security/i
    .test(`${asset.title} ${asset.purpose} ${asset.id}`)
}

function launchSurfaceQuestions(product, gate, openAssets) {
  const questions = []

  if (gate.revenue < 40) {
    questions.push("What exactly does the user pay, and what do they receive today?")
  }

  if (gate.trust < 70 || openAssets.some(trustSensitiveAsset)) {
    questions.push("Can a cautious user trust the product with their time, money, and data?")
  }

  if (!supportAssetIsReady(product)) {
    questions.push("Where does the user go when install, purchase, or usage breaks?")
  }

  const criticalAsset = openAssets.find((asset) => asset.priority === "Critical")
  if (criticalAsset) {
    questions.push(`What must be true before publishing ${criticalAsset.title}?`)
  }

  const unresolved = gate.unresolved[0]
  if (unresolved) {
    questions.push(`Which path are we choosing for: ${unresolved.title}`)
  }

  if (!questions.length) {
    questions.push("What proof would make this surface stronger before the next launch push?")
  }

  return questions.slice(0, 5)
}

function productSurfaceSettings(product) {
  return product.surfaceSettings ?? {}
}

function launchSurfaceControls(product, template) {
  const settings = productSurfaceSettings(product)

  return {
    ctaLabel: fallbackText(settings.ctaLabel, template.primaryCta),
    ctaUrl: safeProofLink(settings.ctaUrl),
    launchNote: fallbackText(settings.launchNote, ""),
    offer: fallbackText(settings.offer, product.brief?.pricingHypothesis ?? ""),
    supportUrl: safeProofLink(settings.supportUrl),
    trustClaim: fallbackText(settings.trustClaim, "")
  }
}

function launchSurfaceQa(product, surface) {
  const proofCount = surface.proofAssets.length + surface.evidence.forgeSources.length
  const criticalOpen = surface.gate.docs.assets.filter((asset) => asset.priority === "Critical" && asset.status !== "ready")
  const checks = [
    {
      detail: surface.controls.offer
        ? "The offer is explicit enough for a visitor to understand what is being offered."
        : "Add the exact offer before sharing the surface.",
      label: "Offer",
      passed: Boolean(surface.controls.offer)
    },
    {
      detail: surface.controls.ctaLabel && surface.controls.ctaUrl
        ? "The CTA has a label and a destination."
        : "Add a CTA URL before using this as a public launch page.",
      label: "CTA",
      passed: Boolean(surface.controls.ctaLabel && surface.controls.ctaUrl)
    },
    {
      detail: proofCount
        ? `${proofCount} proof link${proofCount === 1 ? "" : "s"} attached to the launch surface.`
        : "Attach at least one proof link through Evidence or Docs.",
      label: "Proof",
      passed: proofCount > 0
    },
    {
      detail: surface.controls.trustClaim
        ? "The page states an explicit trust claim."
        : "Add the most honest trust claim you can make today.",
      label: "Trust claim",
      passed: Boolean(surface.controls.trustClaim)
    },
    {
      detail: surface.supportReady || surface.controls.supportUrl
        ? "The surface has a support path or support asset."
        : "Add a support URL or ready support docs asset before inviting users.",
      label: "Support path",
      passed: Boolean(surface.supportReady || surface.controls.supportUrl)
    },
    {
      detail: criticalOpen.length
        ? `${criticalOpen.length} critical launch docs asset${criticalOpen.length === 1 ? "" : "s"} still open.`
        : "No critical docs assets are open.",
      label: "Critical docs",
      passed: criticalOpen.length === 0
    },
    {
      detail: surface.gate.level === "ready"
        ? "The readiness gate is clear."
        : `Gate verdict is still ${surface.gate.verdict}.`,
      label: "Readiness gate",
      passed: surface.gate.level === "ready"
    }
  ]
  const passed = checks.filter((check) => check.passed).length
  const score = Math.round((passed / checks.length) * 100)
  const blockers = checks.filter((check) => !check.passed)
  const level = blockers.length >= 3 ? "blocked" : blockers.length ? "at-risk" : "ready"
  const verdict = level === "ready"
    ? "Shareable draft"
    : level === "at-risk"
      ? "Share with caution"
      : "Not ready to share"
  const summary = level === "ready"
    ? `${product.name} has the basics needed for a public launch surface.`
    : `${product.name} still has ${blockers.length} publishability gap${blockers.length === 1 ? "" : "s"} before this should go wide.`

  return {
    blockers,
    checks,
    level,
    passed,
    score,
    summary,
    verdict
  }
}

function launchSharePackage(surface, qa) {
  const offer = surface.controls.offer || surface.pricing
  const audience = trimSentenceEnd(surface.audience)
  const offerSentence = trimSentenceEnd(offer)
  const ctaLine = surface.controls.ctaUrl
    ? `${surface.controls.ctaLabel}: ${surface.controls.ctaUrl}`
    : `CTA needed: ${surface.controls.ctaLabel} has no URL yet.`
  const clearFirst = qa.blockers.map((blocker) => ({
    detail: blocker.detail,
    label: blocker.label
  }))
  const shareWarning = qa.level === "ready"
    ? "Share this with qualified users and keep the room current as responses come in."
    : `Do not share wide until these are clear: ${clearFirst.map((item) => item.label).join(", ")}.`
  const proofLinks = [
    ...surface.evidence.forgeSources.map((source) => ({
      detail: source.note || "Evidence link attached to Forge.",
      label: source.title,
      type: evidenceTypeLabels[source.type] ?? source.type,
      url: safeProofLink(source.url)
    })),
    ...surface.proofAssets.map((asset) => ({
      detail: asset.purpose,
      label: asset.title,
      type: asset.priority,
      url: safeProofLink(asset.proofLink)
    }))
  ].filter((item) => item.url)
  const primaryPost = [
    `${surface.name} is preparing a ${surface.template.label.toLowerCase()} for ${audience}.`,
    surface.oneLiner,
    `Offer: ${offer}`,
    `Why it matters: ${surface.promise}`,
    ctaLine,
    `Status: ${qa.verdict} (${qa.score}%). ${shareWarning}`
  ].join("\n\n")
  const shortTeaser = [
    `${surface.name}: ${surface.oneLiner}`,
    `Current offer: ${offer}`,
    surface.controls.ctaUrl ? surface.controls.ctaUrl : "CTA link is still needed before public sharing."
  ].join("\n\n")
  const founderDm = [
    `Hey - I am putting together the first ${surface.template.label.toLowerCase()} for ${surface.name}.`,
    surface.oneLiner,
    `I am looking for feedback from ${audience}.`,
    `The current offer is ${offerSentence}.`,
    ctaLine
  ].join("\n\n")
  const copyBlocks = [
    { key: "primaryPost", label: "Primary launch post", text: primaryPost },
    { key: "shortTeaser", label: "Short teaser", text: shortTeaser },
    { key: "founderDm", label: "Founder DM", text: founderDm }
  ]
  const nextMoves = [
    ...clearFirst.map((item) => `${item.label}: ${item.detail}`),
    ...surface.nextActions
  ].filter(Boolean).slice(0, 7)

  return {
    clearFirst,
    copyBlocks,
    nextMoves,
    proofLinks,
    shareWarning
  }
}

function launchPublishPath(surface, qa) {
  const slug = slugifyFilename(surface.name)
  const folder = `launch/${slug}`
  const publicUrl = `https://<github-user>.github.io/<repo>/${folder}/`
  const level = qa.level === "ready" ? "ready" : qa.level === "at-risk" ? "at-risk" : "blocked"
  const verdict = level === "ready"
    ? "Manual publish path ready"
    : level === "at-risk"
      ? "Manual publish with caution"
      : "Hold before public publish"
  const summary = level === "ready"
    ? "The generated HTML can move into a static host once the founder reviews the claims."
    : "Use this as a private staging path until the clear-first items are resolved."
  const steps = [
    {
      detail: "Export the standalone launch page from Forge.",
      label: "Download HTML draft",
      status: "ready"
    },
    {
      detail: `Rename the downloaded file to index.html and place it at ${folder}/index.html.`,
      label: "Stage static file",
      status: "ready"
    },
    {
      detail: "Commit the file to a GitHub Pages, Netlify, Vercel, or product-site repo.",
      label: "Commit to static host",
      status: "ready"
    },
    {
      detail: `Expected public URL pattern: ${publicUrl}`,
      label: "Confirm public URL",
      status: "ready"
    },
    {
      detail: surface.controls.ctaUrl
        ? "CTA destination already exists. Recheck it after publishing."
        : "Add the final CTA URL in Launch Surface Controls before sending traffic.",
      label: "Wire CTA",
      status: surface.controls.ctaUrl ? "ready" : "blocked"
    },
    {
      detail: qa.blockers.length
        ? `Resolve before broad distribution: ${qa.blockers.map((blocker) => blocker.label).join(", ")}.`
        : "No publishability blockers surfaced.",
      label: "Final QA",
      status: qa.blockers.length ? "blocked" : "ready"
    }
  ]

  return {
    folder,
    level,
    publicUrl,
    slug,
    steps,
    summary,
    verdict
  }
}

function launchSnapshotFromSurface(surface) {
  const proofCount = surface.proofAssets.length + surface.evidence.forgeSources.length

  return {
    blockers: surface.qa.blockers.map((blocker) => blocker.label),
    createdAt: new Date().toISOString(),
    ctaLabel: surface.controls.ctaLabel,
    ctaReady: Boolean(surface.controls.ctaUrl),
    docsReady: surface.gate.docs.ready,
    docsTotal: surface.gate.docs.assets.length,
    gateScore: surface.gate.gateScore,
    gateVerdict: surface.gate.verdict,
    id: `snapshot-${Date.now()}`,
    offer: surface.controls.offer || surface.pricing,
    oneLiner: surface.oneLiner,
    proofCount,
    publishFolder: surface.publishPath.folder,
    qaLevel: surface.qa.level,
    qaScore: surface.qa.score,
    qaVerdict: surface.qa.verdict,
    stageLabel: surface.stageLabel,
    surfaceLabel: surface.template.label,
    targetDate: surface.targetDate
  }
}

function compareSnapshots(current, previous) {
  if (!previous) {
    return {
      blockersDelta: 0,
      docsDelta: 0,
      proofDelta: 0,
      scoreDelta: 0,
      summary: "No previous snapshot yet.",
      tone: "neutral"
    }
  }

  const scoreDelta = current.qaScore - previous.qaScore
  const blockersDelta = current.blockers.length - previous.blockers.length
  const proofDelta = current.proofCount - previous.proofCount
  const docsDelta = current.docsReady - previous.docsReady
  const improved = scoreDelta > 0 || blockersDelta < 0 || proofDelta > 0 || docsDelta > 0
  const regressed = scoreDelta < 0 || blockersDelta > 0
  const tone = improved && !regressed ? "improved" : regressed ? "regressed" : "neutral"
  const summary = tone === "improved"
    ? "The current surface is stronger than the latest saved snapshot."
    : tone === "regressed"
      ? "The current surface has drifted backward against the latest saved snapshot."
      : "The current surface is roughly unchanged from the latest saved snapshot."

  return {
    blockersDelta,
    docsDelta,
    proofDelta,
    scoreDelta,
    summary,
    tone
  }
}

function readinessSection(product, name) {
  return product.readiness?.find((section) => section.name === name) ?? { name, done: 0, total: 1 }
}

function readinessSectionPercent(product, name) {
  const section = readinessSection(product, name)
  return Math.round((section.done / Math.max(1, section.total)) * 100)
}

function unresolvedDecisions(product) {
  return (product.decisions ?? []).filter((decision) => decision.status !== "chosen")
}

function supportAssetIsReady(product) {
  return productDocsAssets(product).some((asset) => (
    asset.status === "ready" && /support|feedback/i.test(`${asset.title} ${asset.id}`)
  ))
}

function starterReadiness(profile) {
  return [
    { name: "Build", done: profile.hasPrototype === "yes" ? 2 : 0, total: 6 },
    { name: "Docs", done: 0, total: 5 },
    { name: "Launch", done: profile.currentGoal === "launch" ? 1 : 0, total: 6 },
    { name: "Trust", done: profile.usersHaveAccess === "yes" ? 1 : 0, total: 5 },
    { name: "Revenue", done: profile.isCharging === "yes" || profile.businessModel !== "unknown" ? 1 : 0, total: 5 }
  ]
}

function starterDocsAssets(stage, name, productType, sourceLink) {
  const normalizedType = setupOptions.productTypes[productType] ?? "Product"
  const baseAssets = [
    {
      id: `${slugifyFilename(name)}-positioning`,
      title: "Positioning brief",
      status: "missing",
      priority: "Critical",
      purpose: "Define the first audience, problem, promise, and why-now story.",
      nextStep: "Fill the brief from the new product setup.",
      evidence: ""
    },
    {
      id: `${slugifyFilename(name)}-source-of-truth`,
      title: "Source of truth",
      status: sourceLink ? "ready" : "missing",
      priority: "High",
      purpose: `Attach the repo, docs, or canonical source for this ${normalizedType.toLowerCase()}.`,
      nextStep: sourceLink ? "Keep the source link current." : "Add a repo, docs, or product source link.",
      proofLink: sourceLink,
      evidence: sourceLink ? "Created from setup source link" : ""
    },
    {
      id: `${slugifyFilename(name)}-support-path`,
      title: "Support and feedback path",
      status: "missing",
      priority: "High",
      purpose: "Give early users one obvious place to send bugs, confusion, and interest.",
      nextStep: "Choose the support or feedback channel before inviting users.",
      evidence: ""
    }
  ]
  const stageAsset = {
    idea: {
      id: `${slugifyFilename(name)}-validation-plan`,
      title: "Validation sprint plan",
      status: "missing",
      priority: "High",
      purpose: "Define what would prove this idea deserves more build time.",
      nextStep: "Write the first validation sprint and kill criteria.",
      evidence: ""
    },
    prototype: {
      id: `${slugifyFilename(name)}-mvp-scope`,
      title: "MVP scope note",
      status: "missing",
      priority: "Critical",
      purpose: "Protect the smallest useful version from shapeless building.",
      nextStep: "Name the demo path and the explicit not-yet list.",
      evidence: ""
    },
    beta: {
      id: `${slugifyFilename(name)}-beta-page`,
      title: "Beta landing page",
      status: "missing",
      priority: "Critical",
      purpose: "Explain who the beta is for, what they get, and what is unfinished.",
      nextStep: "Draft the beta offer, CTA, support path, and trust story.",
      evidence: ""
    },
    launch: {
      id: `${slugifyFilename(name)}-launch-page`,
      title: "Paid launch page",
      status: "missing",
      priority: "Critical",
      purpose: "Convert launch attention into a clear customer action.",
      nextStep: "Draft the offer, price, CTA, and proof blocks.",
      evidence: ""
    },
    shipped: {
      id: `${slugifyFilename(name)}-traction-baseline`,
      title: "Traction baseline",
      status: "missing",
      priority: "Critical",
      purpose: "Capture what is already working before changing the product.",
      nextStep: "Record users, installs, revenue, usage, and support signals.",
      evidence: ""
    },
    stalled: {
      id: `${slugifyFilename(name)}-restart-brief`,
      title: "Restart brief",
      status: "missing",
      priority: "Critical",
      purpose: "Explain why progress stopped and what move could restart signal.",
      nextStep: "Name the smallest credible restart move.",
      evidence: ""
    },
    relaunch: {
      id: `${slugifyFilename(name)}-relaunch-page`,
      title: "Relaunch page",
      status: "missing",
      priority: "Critical",
      purpose: "Explain what is newly true and why attention should restart.",
      nextStep: "Draft the relaunch angle, proof, CTA, and feedback loop.",
      evidence: ""
    },
    growth: {
      id: `${slugifyFilename(name)}-growth-experiment`,
      title: "Growth experiment note",
      status: "missing",
      priority: "High",
      purpose: "Turn usage signal into one measurable next experiment.",
      nextStep: "Choose the conversion, retention, or feedback experiment.",
      evidence: ""
    }
  }[stage] ?? {
    id: `${slugifyFilename(name)}-launch-page`,
    title: "Launch page",
    status: "missing",
    priority: "Critical",
    purpose: "Turn the product room into a public-facing surface.",
    nextStep: "Draft the first public surface.",
    evidence: ""
  }

  return [...baseAssets, stageAsset]
}

function gateTargetLabel(stage) {
  return ({
    beta: "paid beta",
    growth: "growth push",
    idea: "validation sprint",
    launch: "paid launch",
    prototype: "prototype test",
    relaunch: "relaunch",
    shipped: "revenue review",
    stalled: "restart"
  })[stage] ?? "launch"
}

function gateStatus(product) {
  const docs = docsStats(product)
  const readiness = readinessPercent(product)
  const build = readinessSectionPercent(product, "Build")
  const trust = readinessSectionPercent(product, "Trust")
  const launch = readinessSectionPercent(product, "Launch")
  const revenue = readinessSectionPercent(product, "Revenue")
  const unresolved = unresolvedDecisions(product)
  const criticalDocs = docs.assets.filter((asset) => asset.priority === "Critical" && asset.status !== "ready")
  const blockedDocs = docs.assets.filter((asset) => asset.status === "blocked")
  const gateScore = Math.round((readiness + docs.percent + build + trust + launch + revenue) / 6)
  const criteria = [
    {
      title: "Critical launch docs",
      status: criticalDocs.length ? "blocked" : "ready",
      detail: criticalDocs.length
        ? `${criticalDocs.length} critical docs asset${criticalDocs.length === 1 ? "" : "s"} still open.`
        : "Critical docs are ready.",
      next: criticalDocs[0]?.nextStep ?? "Keep launch docs current."
    },
    {
      title: "Decision ledger",
      status: unresolved.length ? "blocked" : "ready",
      detail: unresolved.length
        ? `${unresolved.length} decision${unresolved.length === 1 ? "" : "s"} still need a chosen path.`
        : "No unresolved launch decisions.",
      next: unresolved[0]?.title ?? "Capture new launch decisions when they appear."
    },
    {
      title: "Trust proof",
      status: trust < 70 || blockedDocs.length ? "blocked" : trust < 85 ? "at-risk" : "ready",
      detail: blockedDocs.length
        ? `${blockedDocs.length} docs asset${blockedDocs.length === 1 ? "" : "s"} blocked, including trust-sensitive work.`
        : `Trust readiness is ${trust}%.`,
      next: blockedDocs[0]?.nextStep ?? "Raise Trust readiness above 70% before taking payment."
    },
    {
      title: "Build stability",
      status: build < 70 ? "at-risk" : "ready",
      detail: `Build readiness is ${build}%.`,
      next: build < 70 ? "Clear build blockers before expanding beta access." : "Keep beta build notes current."
    },
    {
      title: "Launch surface",
      status: launch < 60 || docs.percent < 50 ? "at-risk" : "ready",
      detail: `Launch readiness is ${launch}% and docs readiness is ${docs.percent}%.`,
      next: "Push the landing page, beta instructions, FAQ, and trust story toward ready."
    },
    {
      title: "Revenue path",
      status: revenue < 40 ? "at-risk" : "ready",
      detail: `Revenue readiness is ${revenue}%.`,
      next: revenue < 40 ? "Decide the paid beta price and purchase path." : "Keep pricing evidence attached to the launch room."
    },
    {
      title: "Support loop",
      status: supportAssetIsReady(product) ? "ready" : "at-risk",
      detail: supportAssetIsReady(product)
        ? "Support and feedback path is ready."
        : "Support path is not ready yet.",
      next: "Give beta users one obvious way to report bugs and confusion."
    }
  ]
  const blockers = criteria.filter((item) => item.status === "blocked")
  const risks = criteria.filter((item) => item.status === "at-risk")
  const level = blockers.length ? "blocked" : risks.length ? "at-risk" : "ready"
  const betaLabel = gateTargetLabel(product.stage)
  const verdict = level === "ready"
    ? `Ready for ${betaLabel}`
    : level === "at-risk"
      ? `${betaLabel} at risk`
      : `${betaLabel} blocked`
  const summary = level === "ready"
    ? `${product.name} has enough proof to move forward.`
    : level === "at-risk"
      ? `${product.name} can keep preparing, but ${risks.length} risk${risks.length === 1 ? "" : "s"} need attention.`
      : `${product.name} has ${blockers.length} blocker${blockers.length === 1 ? "" : "s"} before ${betaLabel}.`
  const nextMoves = [
    ...blockers.map((item) => item.next),
    ...risks.map((item) => item.next)
  ].filter(Boolean).slice(0, 5)

  return {
    betaLabel,
    blockers,
    build,
    criteria,
    docs,
    gateScore,
    launch,
    level,
    nextMoves,
    readiness,
    revenue,
    risks,
    summary,
    trust,
    unresolved,
    verdict
  }
}

function launchSurfaceModel(product) {
  const brief = product.brief ?? {}
  const gate = gateStatus(product)
  const nextActions = (product.nextActions ?? []).filter(Boolean)
  const readyAssets = gate.docs.assets.filter((asset) => asset.status === "ready")
  const proofAssets = gate.docs.assets.filter((asset) => safeProofLink(asset.proofLink))
  const evidence = evidenceStats(product)
  const template = surfaceTemplateForProduct(product)
  const controls = launchSurfaceControls(product, template)
  const openAssets = gate.docs.assets
    .filter((asset) => asset.status !== "ready")
    .sort((left, right) => docsPriorityRank(left.priority) - docsPriorityRank(right.priority))
  const trustAssets = gate.docs.assets
    .filter(trustSensitiveAsset)
    .sort((left, right) => docsPriorityRank(left.priority) - docsPriorityRank(right.priority))
  const launchGaps = [
    ...openAssets.map((asset) => ({
      detail: asset.nextStep || asset.purpose,
      label: "Doc",
      title: asset.title
    })),
    ...gate.unresolved.map((decision) => ({
      detail: decision.context || decision.revisitTrigger,
      label: "Decision",
      title: decision.title
    }))
  ].slice(0, 6)

  const surface = {
    audience: fallbackText(product.user, "Early users who need the clearest possible product promise."),
    evidence,
    gate,
    controls,
    launchGaps,
    milestone: fallbackText(brief.primaryMilestone, product.targetDate || "First credible launch milestone."),
    name: fallbackText(product.name, "Untitled Product"),
    nextActions,
    oneLiner: fallbackText(product.oneLiner, "A focused product launch surface."),
    openAssets,
    pricing: fallbackText(brief.pricingHypothesis, "Pricing hypothesis not captured yet."),
    problem: fallbackText(brief.problem, "The launch room has not captured the core problem yet."),
    proofAssets,
    questions: launchSurfaceQuestions(product, gate, openAssets),
    promise: fallbackText(brief.promise, "The launch room has not captured the product promise yet."),
    readyAssets,
    stageLabel: stageLabels[product.stage] ?? product.stage,
    strategicConstraint: fallbackText(brief.strategicConstraint, "No strategic constraint captured yet."),
    supportReady: supportAssetIsReady(product),
    template,
    targetDate: fallbackText(product.targetDate, "Target date not set"),
    trustAssets
  }

  const qa = launchSurfaceQa(product, surface)

  return {
    ...surface,
    qa,
    publishPath: launchPublishPath(surface, qa),
    sharePackage: launchSharePackage(surface, qa)
  }
}

function syncDocsReadiness(product, docsAssets) {
  const done = docsAssets.filter((asset) => asset.status === "ready").length
  const total = Math.max(1, docsAssets.length)
  let hasDocsSection = false
  const readiness = (Array.isArray(product.readiness) ? product.readiness : []).map((section) => {
    if (section.name !== "Docs") return section

    hasDocsSection = true
    return { ...section, done, total }
  })

  return hasDocsSection ? readiness : [...readiness, { name: "Docs", done, total }]
}

function activeProductIndex() {
  return workspace.products.findIndex((product) => product.id === workspace.activeProductId)
}

function workspaceWithActiveProduct(nextProduct) {
  const productIndex = activeProductIndex()
  if (productIndex < 0) return workspace

  const products = [...workspace.products]
  products[productIndex] = nextProduct
  return { ...workspace, products }
}

function commitWorkspace(nextWorkspace, nextStatus) {
  saveWorkspace(nextWorkspace)
  workspace = nextWorkspace
  statusMessage = nextStatus
  errorMessage = ""
}

function setupProfileFromForm(form) {
  return {
    businessModel: String(form.get("businessModel") ?? "unknown"),
    currentGoal: String(form.get("currentGoal") ?? "validate"),
    hasPrototype: String(form.get("hasPrototype") ?? "unknown"),
    hasRepo: String(form.get("hasRepo") ?? "unknown"),
    isCharging: String(form.get("isCharging") ?? "unknown"),
    productType: String(form.get("productType") ?? "other"),
    sourceLink: String(form.get("sourceLink") ?? "").trim(),
    stageOverride: String(form.get("stageOverride") ?? "auto"),
    traction: String(form.get("traction") ?? "").trim(),
    usersHaveAccess: String(form.get("usersHaveAccess") ?? "unknown")
  }
}

function canDiscardActiveWork() {
  return !(isEditing || hasUnsavedFormChanges) || window.confirm("Discard unsaved edits?")
}

function setActiveProduct(productId) {
  if (!canDiscardActiveWork()) return

  const nextWorkspace = { ...workspace, activeProductId: productId }
  isEditing = false
  isCreatingProduct = false
  hasUnsavedFormChanges = false
  commitWorkspace(nextWorkspace, "Local-only workspace")
  render()
}

function setActiveView(view) {
  if (!canDiscardActiveWork()) return

  activeView = view
  isEditing = false
  if (view !== "setup") {
    isCreatingProduct = false
  }
  hasUnsavedFormChanges = false
  errorMessage = ""
  render()
}

function editRoom() {
  isEditing = true
  hasUnsavedFormChanges = false
  errorMessage = ""
  render()
}

function startCreateProduct() {
  if (!canDiscardActiveWork()) return

  activeView = "setup"
  isEditing = false
  isCreatingProduct = true
  hasUnsavedFormChanges = false
  statusMessage = "New product draft"
  errorMessage = ""
  render()
}

function cancelCreateProduct() {
  isCreatingProduct = false
  hasUnsavedFormChanges = false
  statusMessage = "No product created"
  errorMessage = ""
  render()
}

function saveBrief(event) {
  event.preventDefault()

  const product = activeProduct()
  const form = new FormData(event.currentTarget)
  const nextProduct = {
    ...product,
    oneLiner: String(form.get("oneLiner") ?? "").trim(),
    user: String(form.get("user") ?? "").trim(),
    brief: {
      ...(product.brief ?? {}),
      problem: String(form.get("problem") ?? "").trim(),
      promise: String(form.get("promise") ?? "").trim(),
      pricingHypothesis: String(form.get("pricingHypothesis") ?? "").trim(),
      primaryMilestone: String(form.get("primaryMilestone") ?? "").trim(),
      strategicConstraint: String(form.get("strategicConstraint") ?? "").trim()
    }
  }

  try {
    commitWorkspace(workspaceWithActiveProduct(nextProduct), `Brief saved at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`)
    hasUnsavedFormChanges = false
  } catch {
    errorMessage = "Could not save the brief locally. Keep this tab open and try again."
  }

  render()
}

function saveSetup(event) {
  event.preventDefault()

  const product = activeProduct()
  const form = new FormData(event.currentTarget)
  const setupProfile = setupProfileFromForm(form)
  const sourceLink = setupProfile.sourceLink

  if (sourceLink && !safeProofLink(sourceLink)) {
    errorMessage = "Use a full http or https link for the source link."
    render()
    return
  }

  const nextStage = inferStageFromProfile(setupProfile, product.stage)
  const definition = stageDefinition(nextStage)
  const currentFocus = String(form.get("currentFocus") ?? "").trim()
  const nextProduct = {
    ...product,
    currentFocus: currentFocus || definition.focus,
    name: String(form.get("name") ?? "").trim() || product.name,
    repoUrl: sourceLink,
    setupProfile,
    stage: nextStage,
    status: String(form.get("status") ?? "").trim() || definition.defaultStatus,
    targetDate: String(form.get("targetDate") ?? "").trim() || "TBD"
  }

  try {
    commitWorkspace(workspaceWithActiveProduct(nextProduct), `Setup saved at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`)
    hasUnsavedFormChanges = false
  } catch {
    errorMessage = "Could not save the setup locally. Keep this tab open and try again."
  }

  render()
}

function createProduct(event) {
  event.preventDefault()

  const form = new FormData(event.currentTarget)
  const name = String(form.get("name") ?? "").trim()

  if (!name) {
    errorMessage = "Product name is required."
    render()
    return
  }

  const setupProfile = setupProfileFromForm(form)
  const sourceLink = setupProfile.sourceLink

  if (sourceLink && !safeProofLink(sourceLink)) {
    errorMessage = "Use a full http or https link for the source link."
    render()
    return
  }

  const stage = inferStageFromProfile(setupProfile, "prototype")
  const definition = stageDefinition(stage)
  const oneLiner = String(form.get("oneLiner") ?? "").trim()
  const audience = String(form.get("user") ?? "").trim()
  const problem = String(form.get("problem") ?? "").trim()
  const promise = String(form.get("promise") ?? "").trim()
  const pricingHypothesis = String(form.get("pricingHypothesis") ?? "").trim()
  const currentFocus = String(form.get("currentFocus") ?? "").trim()
  const topRisk = String(form.get("topRisk") ?? "").trim()
  const status = String(form.get("status") ?? "").trim()
  const targetDate = String(form.get("targetDate") ?? "").trim()
  const productId = uniqueProductId(name)
  const docsAssets = starterDocsAssets(stage, name, setupProfile.productType, sourceLink)
  const evidenceSources = sourceLink ? [{
    attachedTo: "brief",
    id: `evidence-${productId}-source`,
    note: "Source of truth captured during product setup.",
    title: `${name} source`,
    type: setupProfile.hasRepo === "yes" ? "repo" : "doc",
    url: sourceLink
  }] : []
  const starterProduct = {
    id: productId,
    name,
    stage,
    status: status || definition.defaultStatus,
    targetDate: targetDate || "TBD",
    setupProfile,
    repoUrl: sourceLink,
    oneLiner: oneLiner || "A new product being shaped in Pendragon.",
    user: audience || "The first useful audience is still being defined.",
    currentFocus: currentFocus || definition.focus,
    decisionNeeded: `What must be true before ${definition.surfaceLabel.toLowerCase()}?`,
    topRisk: topRisk || "The riskiest assumption has not been named yet.",
    brief: {
      problem: problem || "The core problem is not sharp enough yet.",
      promise: promise || "The product promise is still being shaped.",
      pricingHypothesis: pricingHypothesis || "Pricing hypothesis not captured yet.",
      primaryMilestone: targetDate || definition.defaultStatus,
      strategicConstraint: "Keep the scope honest until the room has stronger proof."
    },
    decisions: [
      {
        id: `decision-${productId}-stage-gate`,
        title: `What must be true before ${definition.surfaceLabel.toLowerCase()}?`,
        status: "open",
        context: "Created with the product room so the first stage-defining decision is visible.",
        options: ["Ship the next surface", "Collect more proof", "Cut scope"],
        chosenPath: "",
        revisitTrigger: "When the stage engine and readiness gate agree the product is ready."
      }
    ],
    docsAssets,
    evidenceSources,
    nextActions: definition.actionStack.slice(0, 3),
    readiness: syncDocsReadiness({ readiness: starterReadiness(setupProfile) }, docsAssets),
    launchSnapshots: []
  }
  const engine = stageEngineResult(starterProduct)
  const nextProduct = {
    ...starterProduct,
    nextActions: engine.nextActions.slice(0, 3)
  }
  const nextWorkspace = {
    ...workspace,
    activeProductId: nextProduct.id,
    products: [...workspace.products, nextProduct]
  }

  try {
    isCreatingProduct = false
    activeView = "warroom"
    commitWorkspace(nextWorkspace, `${nextProduct.name} room created at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`)
    hasUnsavedFormChanges = false
  } catch {
    errorMessage = "Could not create the product locally. Keep this tab open and try again."
  }

  render()
}

function addDecision(event) {
  event.preventDefault()

  const product = activeProduct()
  const form = new FormData(event.currentTarget)
  const title = String(form.get("title") ?? "").trim()

  if (!title) {
    errorMessage = "Decision title is required."
    render()
    return
  }

  const options = String(form.get("options") ?? "")
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean)

  const decision = {
    id: `decision-${Date.now()}`,
    title,
    status: String(form.get("status") ?? "open"),
    context: String(form.get("context") ?? "").trim(),
    options,
    chosenPath: String(form.get("chosenPath") ?? "").trim(),
    revisitTrigger: String(form.get("revisitTrigger") ?? "").trim()
  }

  const nextProduct = {
    ...product,
    decisions: [...(product.decisions ?? []), decision]
  }

  try {
    commitWorkspace(workspaceWithActiveProduct(nextProduct), `Decision added at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`)
    hasUnsavedFormChanges = false
  } catch {
    errorMessage = "Could not save the decision locally. Keep this tab open and try again."
  }

  render()
}

function saveDocsAssets(event) {
  event.preventDefault()

  const product = activeProduct()
  const form = new FormData(event.currentTarget)
  const docsAssets = productDocsAssets(product).map((asset) => ({
    ...asset,
    status: String(form.get(`doc-${asset.id}-status`) ?? asset.status),
    nextStep: String(form.get(`doc-${asset.id}-nextStep`) ?? "").trim(),
    proofLink: String(form.get(`doc-${asset.id}-proofLink`) ?? "").trim(),
    evidence: String(form.get(`doc-${asset.id}-evidence`) ?? "").trim()
  }))
  const nextProduct = {
    ...product,
    docsAssets,
    readiness: syncDocsReadiness(product, docsAssets)
  }

  try {
    commitWorkspace(workspaceWithActiveProduct(nextProduct), `Docs tracker saved at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`)
    hasUnsavedFormChanges = false
  } catch {
    errorMessage = "Could not save the docs tracker locally. Keep this tab open and try again."
  }

  render()
}

function addEvidenceSource(event) {
  event.preventDefault()

  const product = activeProduct()
  const form = new FormData(event.currentTarget)
  const title = String(form.get("title") ?? "").trim()
  const url = String(form.get("url") ?? "").trim()

  if (!title || !url) {
    errorMessage = "Evidence title and link are required."
    render()
    return
  }

  if (!safeProofLink(url)) {
    errorMessage = "Use a full http or https link for evidence."
    render()
    return
  }

  const evidenceSource = {
    attachedTo: String(form.get("attachedTo") ?? "forge"),
    id: `evidence-${Date.now()}`,
    note: String(form.get("note") ?? "").trim(),
    title,
    type: String(form.get("type") ?? "doc"),
    url
  }
  const nextProduct = {
    ...product,
    evidenceSources: [...productEvidenceSources(product), evidenceSource]
  }

  try {
    commitWorkspace(workspaceWithActiveProduct(nextProduct), `Evidence link added at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`)
    hasUnsavedFormChanges = false
  } catch {
    errorMessage = "Could not save the evidence link locally. Keep this tab open and try again."
  }

  render()
}

function saveForgeControls(event) {
  event.preventDefault()

  const product = activeProduct()
  const form = new FormData(event.currentTarget)
  const ctaUrl = String(form.get("ctaUrl") ?? "").trim()
  const supportUrl = String(form.get("supportUrl") ?? "").trim()

  if (ctaUrl && !safeProofLink(ctaUrl)) {
    errorMessage = "Use a full http or https link for the CTA URL."
    render()
    return
  }

  if (supportUrl && !safeProofLink(supportUrl)) {
    errorMessage = "Use a full http or https link for the support URL."
    render()
    return
  }

  const nextProduct = {
    ...product,
    surfaceSettings: {
      ...(product.surfaceSettings ?? {}),
      ctaLabel: String(form.get("ctaLabel") ?? "").trim(),
      ctaUrl,
      launchNote: String(form.get("launchNote") ?? "").trim(),
      offer: String(form.get("offer") ?? "").trim(),
      supportUrl,
      trustClaim: String(form.get("trustClaim") ?? "").trim()
    }
  }

  try {
    commitWorkspace(workspaceWithActiveProduct(nextProduct), `Forge controls saved at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`)
    hasUnsavedFormChanges = false
  } catch {
    errorMessage = "Could not save the Forge controls locally. Keep this tab open and try again."
  }

  render()
}

function saveLaunchSurfaceSnapshot() {
  const product = activeProduct()
  const surface = launchSurfaceModel(product)
  const snapshot = launchSnapshotFromSurface(surface)
  const snapshots = [snapshot, ...productLaunchSnapshots(product)].slice(0, 10)
  const nextProduct = {
    ...product,
    launchSnapshots: snapshots
  }

  try {
    commitWorkspace(workspaceWithActiveProduct(nextProduct), `Launch surface snapshot saved at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`)
  } catch {
    errorMessage = "Could not save the launch surface snapshot locally. Keep this tab open and try again."
  }

  render()
}

function cancelEdit() {
  isEditing = false
  hasUnsavedFormChanges = false
  errorMessage = ""
  statusMessage = "No changes saved"
  render()
}

function saveRoom(event) {
  event.preventDefault()

  const product = activeProduct()
  const form = new FormData(event.currentTarget)
  const nextActions = [0, 1, 2].map((index) => String(form.get(`action-${index}`) ?? "").trim())
  const readiness = product.readiness.map((section, index) => {
    const counts = normalizeReadiness(
      form.get(`readiness-${index}-done`),
      form.get(`readiness-${index}-total`)
    )
    return { ...section, ...counts }
  })

  const nextProduct = {
    ...product,
    currentFocus: String(form.get("currentFocus") ?? "").trim(),
    decisionNeeded: String(form.get("decisionNeeded") ?? "").trim(),
    topRisk: String(form.get("topRisk") ?? "").trim(),
    nextActions,
    readiness
  }

  try {
    const nextWorkspace = workspaceWithActiveProduct(nextProduct)
    commitWorkspace(nextWorkspace, `Saved locally at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`)
    isEditing = false
    hasUnsavedFormChanges = false
  } catch {
    errorMessage = "Could not save locally. Keep this editor open and try again."
  }

  render()
}

function resetDemo() {
  if (!window.confirm("Reset demo data? This will discard local edits in this browser.")) return

  workspace = resetWorkspace()
  isEditing = false
  isCreatingProduct = false
  hasUnsavedFormChanges = false
  statusMessage = "Demo data restored"
  errorMessage = ""
  render()
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }

  const textarea = document.createElement("textarea")

  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.left = "-9999px"
  textarea.style.position = "fixed"
  document.body.append(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  const copied = document.execCommand("copy")

  textarea.remove()
  return copied ? Promise.resolve() : Promise.reject(new Error("Clipboard unavailable"))
}

function exportWorkspace() {
  const date = new Date().toISOString().slice(0, 10)

  downloadFile(
    JSON.stringify(workspace, null, 2),
    `pendragon-workspace-${date}.json`,
    "application/json"
  )

  statusMessage = "Workspace JSON exported"
  errorMessage = ""
  render()
}

function exportLaunchSurface() {
  const product = activeProduct()
  const date = new Date().toISOString().slice(0, 10)
  const filename = `pendragon-launch-surface-${slugifyFilename(product.name)}-${date}.html`

  downloadFile(buildLaunchSurfaceHtml(product), filename, "text/html")

  statusMessage = `${product.name} launch surface HTML exported`
  errorMessage = ""
  render()
}

function markdownList(items, fallback) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${fallback}`
}

function buildLaunchShareMarkdown(product) {
  const surface = launchSurfaceModel(product)
  const share = surface.sharePackage
  const publish = surface.publishPath
  const generatedAt = new Date().toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })
  const proofLinks = share.proofLinks.map((item) => `${item.label} (${item.type}): ${item.url}`)
  const qaChecks = surface.qa.checks.map((check) => `${check.passed ? "[x]" : "[ ]"} ${check.label}: ${check.detail}`)
  const publishSteps = publish.steps.map((step) => `${step.status === "ready" ? "[x]" : "[ ]"} ${step.label}: ${step.detail}`)

  return `# ${surface.name} Launch Share Package

Generated by Pendragon on ${generatedAt}

Status: ${surface.qa.verdict} (${surface.qa.score}%)
Surface: ${surface.template.label}
Target: ${surface.targetDate}

## Primary Launch Post

${share.copyBlocks.find((block) => block.key === "primaryPost")?.text ?? ""}

## Short Teaser

${share.copyBlocks.find((block) => block.key === "shortTeaser")?.text ?? ""}

## Founder DM

${share.copyBlocks.find((block) => block.key === "founderDm")?.text ?? ""}

## Clear First

${markdownList(share.clearFirst.map((item) => `${item.label}: ${item.detail}`), "No publishability blockers surfaced.")}

## Launch QA

${markdownList(qaChecks, "No QA checks generated.")}

## Proof Links

${markdownList(proofLinks, "No proof links attached yet.")}

## Manual Publish Path

Verdict: ${publish.verdict}

Suggested folder: ${publish.folder}/

Expected URL pattern: ${publish.publicUrl}

${markdownList(publishSteps, "No publish steps generated.")}

## Next Moves

${markdownList(share.nextMoves, "Capture the next launch move in the warroom.")}
`
}

function buildLaunchPublishGuideMarkdown(product) {
  const surface = launchSurfaceModel(product)
  const publish = surface.publishPath
  const generatedAt = new Date().toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })
  const steps = publish.steps.map((step, index) => `${index + 1}. ${step.label}\n   - Status: ${step.status}\n   - ${step.detail}`)

  return `# ${surface.name} Manual Publish Guide

Generated by Pendragon on ${generatedAt}

Verdict: ${publish.verdict}

${publish.summary}

## Static Path

- Local folder: ${publish.folder}/
- Page file: ${publish.folder}/index.html
- Expected URL pattern: ${publish.publicUrl}

## Steps

${steps.join("\n\n")}

## Publish Rule

Do not send broad traffic until Launch Surface QA says the page is shareable or the founder intentionally accepts the remaining risk.
`
}

function exportLaunchSharePackage() {
  const product = activeProduct()
  const date = new Date().toISOString().slice(0, 10)
  const filename = `pendragon-share-package-${slugifyFilename(product.name)}-${date}.md`

  downloadFile(buildLaunchShareMarkdown(product), filename, "text/markdown")

  statusMessage = `${product.name} share package Markdown exported`
  errorMessage = ""
  render()
}

function exportLaunchPublishGuide() {
  const product = activeProduct()
  const date = new Date().toISOString().slice(0, 10)
  const filename = `pendragon-publish-guide-${slugifyFilename(product.name)}-${date}.md`

  downloadFile(buildLaunchPublishGuideMarkdown(product), filename, "text/markdown")

  statusMessage = `${product.name} publish guide Markdown exported`
  errorMessage = ""
  render()
}

function copySharePackageItem(key) {
  const product = activeProduct()
  const block = launchSurfaceModel(product).sharePackage.copyBlocks.find((item) => item.key === key)

  if (!block) return

  copyText(block.text)
    .then(() => {
      statusMessage = `${block.label} copied`
      errorMessage = ""
      render()
    })
    .catch(() => {
      statusMessage = "Clipboard unavailable"
      errorMessage = "Download the Markdown share package instead."
      render()
    })
}

function renderSetupAsset(asset) {
  return `
    <li>
      <span>${escapeHtml(asset.label)}</span>
      <p>${escapeHtml(asset.next)}</p>
    </li>
  `
}

function renderSetupModule(module) {
  return `<span>${escapeHtml(module)}</span>`
}

function renderSetupAction(action, index) {
  return `
    <li>
      <span>${index + 1}</span>
      <p>${escapeHtml(action)}</p>
    </li>
  `
}

function renderCreateProduct() {
  const profile = {
    businessModel: "unknown",
    currentGoal: "validate",
    hasPrototype: "unknown",
    hasRepo: "unknown",
    isCharging: "unknown",
    productType: "other",
    sourceLink: "",
    stageOverride: "auto",
    traction: "",
    usersHaveAccess: "unknown"
  }
  const stage = inferStageFromProfile(profile, "prototype")
  const definition = stageDefinition(stage)
  const draftProduct = {
    brief: {},
    currentFocus: definition.focus,
    decisions: [],
    docsAssets: [],
    evidenceSources: [],
    id: "new-product",
    name: "New product",
    nextActions: definition.actionStack,
    oneLiner: "",
    readiness: starterReadiness(profile),
    setupProfile: profile,
    stage,
    status: definition.defaultStatus,
    targetDate: "TBD",
    user: ""
  }
  const engine = stageEngineResult(draftProduct)

  return `
    ${errorMessage ? `<p class="error-message">${escapeHtml(errorMessage)}</p>` : ""}
    <section class="setup-surface create-product-surface">
      <article class="setup-hero">
        <div>
          <p class="eyebrow">Create Product Room</p>
          <h2>Start with the product truth we know today.</h2>
          <p>Pendragon will infer the first mode, create starter launch assets, and route the new room from these setup signals.</p>
        </div>
        <aside class="setup-verdict">
          <span>${engine.completeness}%</span>
          <strong>Starter signal</strong>
          <small>${escapeHtml(definition.surfaceLabel)}</small>
        </aside>
      </article>

      <form id="create-product-form" class="editor-form setup-form create-product-form">
        <div class="surface-heading">
          <div>
            <p class="eyebrow">New Product Intake</p>
            <h2>Create a room that is usable on day one.</h2>
          </div>
          <div class="form-actions">
            <button class="primary-button" type="submit">Create room</button>
            <button class="quiet-button" type="button" data-action="cancel-create-product">Cancel</button>
          </div>
        </div>

        <div class="setup-form__grid">
          <label for="createName">
            <span>Product name</span>
            <input id="createName" name="name" placeholder="Example: Launch Ledger" />
          </label>
          <label for="createProductType">
            <span>Product type</span>
            <select id="createProductType" name="productType">
              ${renderOptions(setupOptions.productTypes, profile.productType)}
            </select>
          </label>
          <label for="createBusinessModel">
            <span>Business model</span>
            <select id="createBusinessModel" name="businessModel">
              ${renderOptions(setupOptions.businessModels, profile.businessModel)}
            </select>
          </label>
          <label for="createGoal">
            <span>Current goal</span>
            <select id="createGoal" name="currentGoal">
              ${renderOptions(setupOptions.currentGoals, profile.currentGoal)}
            </select>
          </label>
          <label for="createStageOverride">
            <span>Stage</span>
            <select id="createStageOverride" name="stageOverride">
              ${renderOptions(setupOptions.stageOverrides, profile.stageOverride)}
            </select>
          </label>
          <label for="createTargetDate">
            <span>Target date</span>
            <input id="createTargetDate" name="targetDate" placeholder="TBD" />
          </label>
          <label for="createStatus">
            <span>Status</span>
            <input id="createStatus" name="status" placeholder="${escapeHtml(definition.defaultStatus)}" />
          </label>
          <label for="createSourceLink">
            <span>Source link</span>
            <input id="createSourceLink" name="sourceLink" inputmode="url" placeholder="https://github.com/..." />
          </label>
        </div>

        <div class="create-product-form__brief">
          <label for="createOneLiner">
            <span>One-liner</span>
            <textarea id="createOneLiner" name="oneLiner" rows="2" placeholder="What is this product in one sentence?"></textarea>
          </label>
          <label for="createAudience">
            <span>Audience</span>
            <textarea id="createAudience" name="user" rows="2" placeholder="Who is the first useful user?"></textarea>
          </label>
          <label for="createProblem">
            <span>Problem</span>
            <textarea id="createProblem" name="problem" rows="3" placeholder="What painful or valuable problem does it solve?"></textarea>
          </label>
          <label for="createPromise">
            <span>Promise</span>
            <textarea id="createPromise" name="promise" rows="3" placeholder="What outcome should the product create?"></textarea>
          </label>
        </div>

        <div class="setup-form__signals">
          <label for="createHasPrototype">
            <span>Working prototype?</span>
            <select id="createHasPrototype" name="hasPrototype">
              ${renderOptions(setupOptions.signals, profile.hasPrototype)}
            </select>
          </label>
          <label for="createHasRepo">
            <span>Repo or source?</span>
            <select id="createHasRepo" name="hasRepo">
              ${renderOptions(setupOptions.signals, profile.hasRepo)}
            </select>
          </label>
          <label for="createUsersAccess">
            <span>Users have access?</span>
            <select id="createUsersAccess" name="usersHaveAccess">
              ${renderOptions(setupOptions.signals, profile.usersHaveAccess)}
            </select>
          </label>
          <label for="createCharging">
            <span>Charging?</span>
            <select id="createCharging" name="isCharging">
              ${renderOptions(setupOptions.signals, profile.isCharging)}
            </select>
          </label>
        </div>

        <div class="create-product-form__brief">
          <label for="createPricing">
            <span>Pricing hypothesis</span>
            <textarea id="createPricing" name="pricingHypothesis" rows="2" placeholder="Free, beta price, license, subscription, services, usage-based..."></textarea>
          </label>
          <label for="createTraction">
            <span>Traction or proof note</span>
            <textarea id="createTraction" name="traction" rows="2" placeholder="Users, installs, waitlist, revenue, interviews, demos, or observed demand."></textarea>
          </label>
          <label for="createCurrentFocus">
            <span>Current focus</span>
            <textarea id="createCurrentFocus" name="currentFocus" rows="2" placeholder="${escapeHtml(definition.focus)}"></textarea>
          </label>
          <label for="createTopRisk">
            <span>Top risk</span>
            <textarea id="createTopRisk" name="topRisk" rows="2" placeholder="What could make this fail?"></textarea>
          </label>
        </div>
      </form>

      <article class="setup-panel setup-panel--wide">
        <div class="preview-section-heading">
          <p class="eyebrow">What Pendragon Creates</p>
          <span>Starter room</span>
        </div>
        <ol class="question-list">
          <li><span>1</span><p>A stage-aware product room routed by the setup signals.</p></li>
          <li><span>2</span><p>Starter docs assets, a first decision, readiness rows, and evidence link when supplied.</p></li>
          <li><span>3</span><p>A Forge surface type that matches the inferred stage.</p></li>
        </ol>
      </article>
    </section>
  `
}

function renderSetup(product) {
  const engine = stageEngineResult(product)
  const profile = engine.profile
  const inferredLabel = stageLabels[engine.inferredStage] ?? engine.inferredStage
  const currentLabel = stageLabels[engine.stage] ?? engine.stage
  const savedLabel = stageLabels[engine.savedStage] ?? engine.savedStage
  const stageNote = engine.stageChanged
    ? `Signals point to ${inferredLabel}; saved room is ${savedLabel}.`
    : `${currentLabel} fits the current setup signals.`
  const missingAssets = engine.missingAssets.length
    ? engine.missingAssets.map(renderSetupAsset).join("")
    : `
      <li>
        <span>Clear</span>
        <p>No major setup gaps surfaced for this stage.</p>
      </li>
    `

  return `
    ${errorMessage ? `<p class="error-message">${escapeHtml(errorMessage)}</p>` : ""}
    <section class="setup-surface">
      <article class="setup-hero">
        <div>
          <p class="eyebrow">Product Setup</p>
          <h2>Route the room from product reality.</h2>
          <p>${escapeHtml(stageNote)}</p>
        </div>
        <aside class="setup-verdict">
          <span>${engine.completeness}%</span>
          <strong>Setup signal</strong>
          <small>${escapeHtml(engine.definition.surfaceLabel)}</small>
        </aside>
      </article>

      <div class="setup-diagnosis">
        <article>
          <span>Mode</span>
          <strong>${escapeHtml(currentLabel)}</strong>
          <p>${escapeHtml(engine.definition.focus)}</p>
        </article>
        <article>
          <span>Surface</span>
          <strong>${escapeHtml(engine.definition.surfaceLabel)}</strong>
          <p>${escapeHtml(surfaceTemplateForProduct({ ...product, stage: engine.stage }).goal)}</p>
        </article>
        <article>
          <span>Goal</span>
          <strong>${escapeHtml(setupOptions.currentGoals[profile.currentGoal] ?? profile.currentGoal)}</strong>
          <p>${escapeHtml(profile.traction || "No traction note captured yet.")}</p>
        </article>
      </div>

      <form id="setup-form" class="editor-form setup-form">
        <div class="surface-heading">
          <div>
            <p class="eyebrow">Stage Engine Inputs</p>
            <h2>Product, stage, model, and signal.</h2>
          </div>
          <button class="primary-button" type="submit">Save setup</button>
        </div>

        <div class="setup-form__grid">
          <label for="setupName">
            <span>Product name</span>
            <input id="setupName" name="name" value="${escapeHtml(product.name)}" />
          </label>
          <label for="setupProductType">
            <span>Product type</span>
            <select id="setupProductType" name="productType">
              ${renderOptions(setupOptions.productTypes, profile.productType)}
            </select>
          </label>
          <label for="setupBusinessModel">
            <span>Business model</span>
            <select id="setupBusinessModel" name="businessModel">
              ${renderOptions(setupOptions.businessModels, profile.businessModel)}
            </select>
          </label>
          <label for="setupGoal">
            <span>Current goal</span>
            <select id="setupGoal" name="currentGoal">
              ${renderOptions(setupOptions.currentGoals, profile.currentGoal)}
            </select>
          </label>
          <label for="setupStageOverride">
            <span>Stage</span>
            <select id="setupStageOverride" name="stageOverride">
              ${renderOptions(setupOptions.stageOverrides, profile.stageOverride)}
            </select>
          </label>
          <label for="setupTargetDate">
            <span>Target date</span>
            <input id="setupTargetDate" name="targetDate" value="${escapeHtml(product.targetDate)}" placeholder="TBD" />
          </label>
          <label for="setupStatus">
            <span>Status</span>
            <input id="setupStatus" name="status" value="${escapeHtml(product.status)}" placeholder="${escapeHtml(engine.definition.defaultStatus)}" />
          </label>
          <label for="setupSourceLink">
            <span>Source link</span>
            <input id="setupSourceLink" name="sourceLink" inputmode="url" value="${escapeHtml(profile.sourceLink)}" placeholder="https://github.com/..." />
          </label>
        </div>

        <div class="setup-form__signals">
          <label for="setupHasPrototype">
            <span>Working prototype?</span>
            <select id="setupHasPrototype" name="hasPrototype">
              ${renderOptions(setupOptions.signals, profile.hasPrototype)}
            </select>
          </label>
          <label for="setupHasRepo">
            <span>Repo or source?</span>
            <select id="setupHasRepo" name="hasRepo">
              ${renderOptions(setupOptions.signals, profile.hasRepo)}
            </select>
          </label>
          <label for="setupUsersAccess">
            <span>Users have access?</span>
            <select id="setupUsersAccess" name="usersHaveAccess">
              ${renderOptions(setupOptions.signals, profile.usersHaveAccess)}
            </select>
          </label>
          <label for="setupCharging">
            <span>Charging?</span>
            <select id="setupCharging" name="isCharging">
              ${renderOptions(setupOptions.signals, profile.isCharging)}
            </select>
          </label>
        </div>

        <label for="setupTraction">
          <span>Traction or proof note</span>
          <textarea id="setupTraction" name="traction" rows="3" placeholder="Users, installs, waitlist, revenue, interviews, demos, or observed demand.">${escapeHtml(profile.traction)}</textarea>
        </label>

        <label for="setupCurrentFocus">
          <span>Current focus</span>
          <textarea id="setupCurrentFocus" name="currentFocus" rows="3">${escapeHtml(product.currentFocus || engine.definition.focus)}</textarea>
        </label>
      </form>

      <div class="setup-engine-grid">
        <article class="setup-panel">
          <div class="preview-section-heading">
            <p class="eyebrow">Missing Assets</p>
            <span>${engine.missingAssets.length} surfaced</span>
          </div>
          <ul class="setup-missing-list">
            ${missingAssets}
          </ul>
        </article>
        <article class="setup-panel">
          <div class="preview-section-heading">
            <p class="eyebrow">Room Mix</p>
            <span>${engine.definition.modules.length} modules</span>
          </div>
          <div class="setup-module-list">
            ${engine.definition.modules.map(renderSetupModule).join("")}
          </div>
          <div class="setup-bias">
            ${engine.definition.readinessBias.map(renderSetupModule).join("")}
          </div>
        </article>
        <article class="setup-panel setup-panel--wide">
          <div class="preview-section-heading">
            <p class="eyebrow">Recommended Stack</p>
            <span>${engine.nextActions.length} moves</span>
          </div>
          <ol class="question-list">
            ${engine.nextActions.map(renderSetupAction).join("")}
          </ol>
        </article>
      </div>
    </section>
  `
}

function renderProductNav(product) {
  const productButtons = workspace.products
    .map((item) => {
      const active = item.id === product.id ? " active" : ""
      return `
        <button class="product-nav__item${active}" data-product-id="${escapeHtml(item.id)}">
          <span>${escapeHtml(item.name)}</span>
          <small>${escapeHtml(stageLabels[item.stage])}</small>
        </button>
      `
    })
    .join("")

  return `
    ${productButtons}
    <button class="product-nav__item product-nav__item--new${isCreatingProduct ? " active" : ""}" type="button" data-action="new-product">
      <span>New product</span>
      <small>Create a room</small>
    </button>
  `
}

function renderViewNav() {
  return views
    .map((view) => {
      const active = view.id === activeView ? " active" : ""
      return `
        <button class="nav__link${active}" type="button" data-view="${view.id}">
          ${escapeHtml(view.label)}
        </button>
      `
    })
    .join("")
}

function renderReadiness(product) {
  return product.readiness
    .map((section) => {
      const percent = Math.round((section.done / section.total) * 100)
      return `
        <article class="readiness-item">
          <div>
            <strong>${escapeHtml(section.name)}</strong>
            <span>${section.done}/${section.total}</span>
          </div>
          <div class="meter" aria-label="${escapeHtml(section.name)} readiness ${percent}%">
            <span style="width: ${percent}%"></span>
          </div>
        </article>
      `
    })
    .join("")
}

function renderActions(product) {
  return product.nextActions
    .map((action, index) => `
      <li>
        <span>${index + 1}</span>
        <p>${escapeHtml(action)}</p>
      </li>
    `)
    .join("")
}

function renderEditor(product) {
  const actionAt = (index) => product.nextActions[index] ?? ""

  return `
    <section class="editor-panel" aria-label="Room editor">
      <div class="editor-panel__header">
        <div>
          <p class="eyebrow">Room Editor</p>
          <h2>Sharpen ${escapeHtml(product.name)}</h2>
          <p>Local-only edits. Save when the room feels true.</p>
        </div>
        <button class="quiet-button" type="button" data-action="cancel-edit">Cancel</button>
      </div>

      <form id="room-editor" class="editor-form">
        <label for="currentFocus">
          <span>This week's focus</span>
          <textarea id="currentFocus" name="currentFocus" rows="3">${escapeHtml(product.currentFocus)}</textarea>
        </label>

        <fieldset>
          <legend>Next three actions</legend>
          <input aria-label="Action 1" name="action-0" value="${escapeHtml(actionAt(0))}" />
          <input aria-label="Action 2" name="action-1" value="${escapeHtml(actionAt(1))}" />
          <input aria-label="Action 3" name="action-2" value="${escapeHtml(actionAt(2))}" />
        </fieldset>

        <label for="decisionNeeded">
          <span>Decision needed</span>
          <textarea id="decisionNeeded" name="decisionNeeded" rows="3">${escapeHtml(product.decisionNeeded)}</textarea>
        </label>

        <label for="topRisk">
          <span>Top risk</span>
          <textarea id="topRisk" name="topRisk" rows="3">${escapeHtml(product.topRisk)}</textarea>
        </label>

        <fieldset class="readiness-edit">
          <legend>Readiness</legend>
          ${product.readiness.map((section, index) => `
            <label>
              <span>${escapeHtml(section.name)}</span>
              <input
                aria-label="${escapeHtml(section.name)} done"
                inputmode="numeric"
                min="0"
                name="readiness-${index}-done"
                type="number"
                value="${section.done}"
              />
              <em>/</em>
              <input
                aria-label="${escapeHtml(section.name)} total"
                inputmode="numeric"
                min="1"
                name="readiness-${index}-total"
                type="number"
                value="${section.total}"
              />
            </label>
          `).join("")}
        </fieldset>

        <div class="form-actions">
          <button class="primary-button" type="submit">Save changes</button>
          <button class="quiet-button" type="button" data-action="cancel-edit">Cancel</button>
        </div>
      </form>
    </section>
  `
}

function renderWarroom(product) {
  const percent = readinessPercent(product)
  const engine = stageEngineResult(product)

  return `
    ${errorMessage ? `<p class="error-message">${escapeHtml(errorMessage)}</p>` : ""}
    ${isEditing ? renderEditor(product) : ""}

    <section class="focus-card">
      <p class="eyebrow">This Week's Launch Focus</p>
      <h2>${escapeHtml(product.currentFocus)}</h2>
      <p>${escapeHtml(engine.definition.focus || stageJobs[product.stage])}</p>
      <ol class="actions">
        ${renderActions(product)}
      </ol>
    </section>

    <section class="grid">
      <article class="panel readiness">
        <div class="panel__heading">
          <p class="eyebrow">Readiness</p>
          <strong>${percent}%</strong>
        </div>
        ${renderReadiness(product)}
      </article>

      <article class="panel">
        <p class="eyebrow">Decision Needed</p>
        <h3>${escapeHtml(product.decisionNeeded)}</h3>
        <div class="choice-row">
          <button>Decide now</button>
          <button class="secondary">Park it</button>
        </div>
      </article>

      <article class="panel risk">
        <p class="eyebrow">Top Risk</p>
        <h3>${escapeHtml(product.topRisk)}</h3>
        <p>Risks stay visible until they are mitigated, accepted, or turned into launch work.</p>
      </article>

      <article class="panel forge">
        <p class="eyebrow">Forge</p>
        <h3>Build Launch Site</h3>
        <p>Generate a first launch surface from the brief, docs, decisions, and readiness gate.</p>
        <button type="button" data-view="forge">Open Forge</button>
      </article>

      <article class="panel setup-summary">
        <p class="eyebrow">Stage Engine</p>
        <h3>${escapeHtml(engine.definition.surfaceLabel)}</h3>
        <p>${escapeHtml(engine.stageChanged ? `Signals point to ${stageLabels[engine.inferredStage]}.` : `${engine.completeness}% setup signal captured.`)}</p>
        <button type="button" data-view="setup">Open Setup</button>
      </article>
    </section>
  `
}

function renderBrief(product) {
  const brief = product.brief ?? {}

  return `
    ${errorMessage ? `<p class="error-message">${escapeHtml(errorMessage)}</p>` : ""}
    <section class="launch-surface">
      <article class="brief-hero">
        <p class="eyebrow">Product Brief</p>
        <h2>${escapeHtml(product.oneLiner)}</h2>
        <p>${escapeHtml(brief.promise)}</p>
        <div class="brief-facts">
          <span><strong>Audience</strong>${escapeHtml(product.user)}</span>
          <span><strong>Milestone</strong>${escapeHtml(brief.primaryMilestone)}</span>
          <span><strong>Pricing</strong>${escapeHtml(brief.pricingHypothesis)}</span>
        </div>
      </article>

      <form id="brief-form" class="editor-form brief-form">
        <label for="briefOneLiner">
          <span>One-liner</span>
          <textarea id="briefOneLiner" name="oneLiner" rows="2">${escapeHtml(product.oneLiner)}</textarea>
        </label>
        <label for="briefUser">
          <span>Audience</span>
          <textarea id="briefUser" name="user" rows="2">${escapeHtml(product.user)}</textarea>
        </label>
        <label for="briefProblem">
          <span>Problem</span>
          <textarea id="briefProblem" name="problem" rows="3">${escapeHtml(brief.problem)}</textarea>
        </label>
        <label for="briefPromise">
          <span>Promise</span>
          <textarea id="briefPromise" name="promise" rows="3">${escapeHtml(brief.promise)}</textarea>
        </label>
        <label for="briefPricing">
          <span>Pricing hypothesis</span>
          <textarea id="briefPricing" name="pricingHypothesis" rows="2">${escapeHtml(brief.pricingHypothesis)}</textarea>
        </label>
        <label for="briefMilestone">
          <span>Primary milestone</span>
          <textarea id="briefMilestone" name="primaryMilestone" rows="2">${escapeHtml(brief.primaryMilestone)}</textarea>
        </label>
        <label for="briefConstraint">
          <span>Strategic constraint</span>
          <textarea id="briefConstraint" name="strategicConstraint" rows="2">${escapeHtml(brief.strategicConstraint)}</textarea>
        </label>
        <div class="form-actions">
          <button class="primary-button" type="submit">Save brief</button>
        </div>
      </form>
    </section>
  `
}

function renderDecisionCard(decision) {
  const options = decision.options?.length
    ? decision.options.map((option) => `<li>${escapeHtml(option)}</li>`).join("")
    : "<li>No options captured yet.</li>"

  return `
    <article class="decision-card">
      <div class="decision-card__header">
        <span class="status-chip status-chip--${escapeHtml(decision.status)}">${escapeHtml(decisionStatusLabels[decision.status] ?? decision.status)}</span>
        <h3>${escapeHtml(decision.title)}</h3>
      </div>
      <p>${escapeHtml(decision.context)}</p>
      <div class="decision-card__body">
        <div>
          <strong>Options</strong>
          <ul>${options}</ul>
        </div>
        <div>
          <strong>Chosen path</strong>
          <p>${escapeHtml(decision.chosenPath || "Not chosen yet.")}</p>
        </div>
        <div>
          <strong>Revisit trigger</strong>
          <p>${escapeHtml(decision.revisitTrigger || "No trigger captured.")}</p>
        </div>
      </div>
    </article>
  `
}

function renderDecisions(product) {
  const decisions = product.decisions ?? []

  return `
    ${errorMessage ? `<p class="error-message">${escapeHtml(errorMessage)}</p>` : ""}
    <section class="launch-surface">
      <div class="surface-heading">
        <div>
          <p class="eyebrow">Decision Ledger</p>
          <h2>Stop relitigating. Start deciding.</h2>
        </div>
        <span>${decisions.length} captured</span>
      </div>

      <div class="decision-list">
        ${decisions.length ? decisions.map(renderDecisionCard).join("") : `
          <article class="empty-state">
            <p class="eyebrow">No Decisions Yet</p>
            <h3>Capture the choice before it becomes launch fog.</h3>
          </article>
        `}
      </div>

      <form id="decision-form" class="editor-form decision-form">
        <p class="eyebrow">Add Decision</p>
        <label for="decisionTitle">
          <span>Title</span>
          <input id="decisionTitle" name="title" placeholder="What needs to be decided?" />
        </label>
        <label for="decisionStatus">
          <span>Status</span>
          <select id="decisionStatus" name="status">
            <option value="open">Open</option>
            <option value="chosen">Chosen</option>
            <option value="parked">Parked</option>
          </select>
        </label>
        <label for="decisionContext">
          <span>Context</span>
          <textarea id="decisionContext" name="context" rows="3" placeholder="Why does this decision matter?"></textarea>
        </label>
        <label for="decisionOptions">
          <span>Options</span>
          <textarea id="decisionOptions" name="options" rows="3" placeholder="One option per line"></textarea>
        </label>
        <label for="decisionChosenPath">
          <span>Chosen path</span>
          <textarea id="decisionChosenPath" name="chosenPath" rows="2" placeholder="Leave blank if still open"></textarea>
        </label>
        <label for="decisionRevisit">
          <span>Revisit trigger</span>
          <textarea id="decisionRevisit" name="revisitTrigger" rows="2" placeholder="What evidence would reopen this?"></textarea>
        </label>
        <div class="form-actions">
          <button class="primary-button" type="submit">Add decision</button>
        </div>
      </form>
    </section>
  `
}

function renderDocsStatusOptions(currentStatus) {
  return docsStatusOrder
    .map((status) => `
      <option value="${status}" ${status === currentStatus ? "selected" : ""}>${escapeHtml(docsStatusLabels[status])}</option>
    `)
    .join("")
}

function renderDocAsset(asset) {
  const proofLink = safeProofLink(asset.proofLink)

  return `
    <article class="doc-asset doc-asset--${escapeHtml(asset.status)}">
      <div class="doc-asset__header">
        <div>
          <span class="doc-chip doc-chip--${escapeHtml(asset.status)}">${escapeHtml(docsStatusLabels[asset.status] ?? asset.status)}</span>
          <h3>${escapeHtml(asset.title)}</h3>
        </div>
        <div class="doc-asset__meta">
          <span class="priority-pill">${escapeHtml(asset.priority)}</span>
          ${proofLink ? `<a class="proof-link" href="${escapeHtml(proofLink)}" rel="noreferrer" target="_blank">Open proof</a>` : ""}
        </div>
      </div>
      <p>${escapeHtml(asset.purpose)}</p>
      <div class="doc-asset__fields">
        <label for="doc-${escapeHtml(asset.id)}-status">
          <span>Status</span>
          <select id="doc-${escapeHtml(asset.id)}-status" name="doc-${escapeHtml(asset.id)}-status">
            ${renderDocsStatusOptions(asset.status)}
          </select>
        </label>
        <label for="doc-${escapeHtml(asset.id)}-nextStep">
          <span>Next move</span>
          <textarea id="doc-${escapeHtml(asset.id)}-nextStep" name="doc-${escapeHtml(asset.id)}-nextStep" rows="2">${escapeHtml(asset.nextStep)}</textarea>
        </label>
        <label for="doc-${escapeHtml(asset.id)}-proofLink">
          <span>Proof link</span>
          <input id="doc-${escapeHtml(asset.id)}-proofLink" name="doc-${escapeHtml(asset.id)}-proofLink" inputmode="url" value="${escapeHtml(asset.proofLink)}" placeholder="https://docs.google.com/..." />
        </label>
        <label for="doc-${escapeHtml(asset.id)}-evidence">
          <span>Evidence note</span>
          <input id="doc-${escapeHtml(asset.id)}-evidence" name="doc-${escapeHtml(asset.id)}-evidence" value="${escapeHtml(asset.evidence)}" placeholder="Draft, repo note, or decision" />
        </label>
      </div>
    </article>
  `
}

function renderDocs(product) {
  const stats = docsStats(product)

  return `
    ${errorMessage ? `<p class="error-message">${escapeHtml(errorMessage)}</p>` : ""}
    <section class="launch-surface">
      <div class="surface-heading">
        <div>
          <p class="eyebrow">Docs Surface</p>
          <h2>${escapeHtml(product.name)} launch knowledge map</h2>
        </div>
        <span>${stats.percent}% docs ready</span>
      </div>

      <div class="docs-command">
        <article>
          <strong>${stats.ready}/${stats.assets.length}</strong>
          <span>Assets ready</span>
        </article>
        <article>
          <strong>${stats.criticalOpen}</strong>
          <span>Critical open</span>
        </article>
        <article>
          <strong>${stats.blocked}</strong>
          <span>Blocked</span>
        </article>
        <article>
          <strong>${stats.drafting}</strong>
          <span>Drafting</span>
        </article>
      </div>

      <form id="docs-form" class="docs-form">
        <div class="docs-tracker">
          ${stats.assets.map(renderDocAsset).join("")}
        </div>
        <div class="form-actions">
          <button class="primary-button" type="submit">Save tracker</button>
        </div>
      </form>
    </section>
  `
}

function renderEvidenceTypeOptions(currentType = "doc") {
  return evidenceTypeOrder
    .map((type) => `
      <option value="${type}" ${type === currentType ? "selected" : ""}>${escapeHtml(evidenceTypeLabels[type] ?? type)}</option>
    `)
    .join("")
}

function renderEvidenceAttachOptions(currentAttach = "forge") {
  return evidenceAttachOrder
    .map((attach) => `
      <option value="${attach}" ${attach === currentAttach ? "selected" : ""}>${escapeHtml(evidenceAttachLabels[attach] ?? attach)}</option>
    `)
    .join("")
}

function renderEvidenceSource(source) {
  const link = safeProofLink(source.url)

  return `
    <article class="evidence-card">
      <div>
        <span>${escapeHtml(evidenceTypeLabels[source.type] ?? source.type)}</span>
        <h3>${escapeHtml(source.title)}</h3>
        <p>${escapeHtml(source.note || "No proof note captured yet.")}</p>
      </div>
      <div class="evidence-card__meta">
        <small>${escapeHtml(evidenceAttachLabels[source.attachedTo] ?? source.attachedTo ?? "Forge")}</small>
        ${link ? `<a href="${escapeHtml(link)}" rel="noreferrer" target="_blank">Open link</a>` : ""}
      </div>
    </article>
  `
}

function renderEvidence(product) {
  const stats = evidenceStats(product)

  return `
    ${errorMessage ? `<p class="error-message">${escapeHtml(errorMessage)}</p>` : ""}
    <section class="launch-surface evidence-surface">
      <div class="surface-heading">
        <div>
          <p class="eyebrow">Evidence Inbox</p>
          <h2>Collect launch proof without integration debt.</h2>
        </div>
        <span>${stats.safeSources.length} usable links</span>
      </div>

      <div class="evidence-command">
        <article>
          <strong>${stats.sources.length}</strong>
          <span>Total links</span>
        </article>
        <article>
          <strong>${stats.forgeSources.length}</strong>
          <span>Forge proof</span>
        </article>
        <article>
          <strong>${stats.trustSources.length}</strong>
          <span>Trust signals</span>
        </article>
      </div>

      <div class="evidence-grid">
        <section class="evidence-list">
          ${stats.sources.length ? stats.sources.map(renderEvidenceSource).join("") : `
            <article class="empty-state">
              <p class="eyebrow">No Evidence Yet</p>
              <h3>Paste the proof before building connectors.</h3>
            </article>
          `}
        </section>

        <form id="evidence-form" class="editor-form evidence-form">
          <p class="eyebrow">Add Evidence</p>
          <label for="evidenceTitle">
            <span>Title</span>
            <input id="evidenceTitle" name="title" placeholder="GitHub repo, pricing doc, demo video..." />
          </label>
          <label for="evidenceUrl">
            <span>Link</span>
            <input id="evidenceUrl" name="url" inputmode="url" placeholder="https://..." />
          </label>
          <div class="evidence-form__row">
            <label for="evidenceType">
              <span>Type</span>
              <select id="evidenceType" name="type">
                ${renderEvidenceTypeOptions()}
              </select>
            </label>
            <label for="evidenceAttach">
              <span>Attach to</span>
              <select id="evidenceAttach" name="attachedTo">
                ${renderEvidenceAttachOptions()}
              </select>
            </label>
          </div>
          <label for="evidenceNote">
            <span>What this proves</span>
            <textarea id="evidenceNote" name="note" rows="4" placeholder="Why should this source influence the launch surface?"></textarea>
          </label>
          <div class="form-actions">
            <button class="primary-button" type="submit">Add link</button>
          </div>
        </form>
      </div>
    </section>
  `
}

function renderGateCriterion(criterion) {
  return `
    <article class="gate-criterion gate-criterion--${escapeHtml(criterion.status)}">
      <div>
        <span class="gate-chip gate-chip--${escapeHtml(criterion.status)}">${escapeHtml(criterion.status === "at-risk" ? "At risk" : criterion.status)}</span>
        <h3>${escapeHtml(criterion.title)}</h3>
      </div>
      <p>${escapeHtml(criterion.detail)}</p>
      <small>${escapeHtml(criterion.next)}</small>
    </article>
  `
}

function renderGateMetric(label, value, note) {
  return `
    <article>
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(note)}</small>
    </article>
  `
}

function renderGate(product) {
  const gate = gateStatus(product)
  const nextMoves = gate.nextMoves.length
    ? gate.nextMoves.map((move, index) => `
      <li>
        <span>${index + 1}</span>
        <p>${escapeHtml(move)}</p>
      </li>
    `).join("")
    : `
      <li>
        <span>1</span>
        <p>Keep shipping and capture the next launch risk when it appears.</p>
      </li>
    `

  return `
    <section class="launch-surface gate-surface">
      <article class="gate-hero gate-hero--${escapeHtml(gate.level)}">
        <div>
          <p class="eyebrow">Beta Readiness Gate</p>
          <h2>${escapeHtml(gate.verdict)}</h2>
          <p>${escapeHtml(gate.summary)}</p>
        </div>
        <div class="gate-verdict">
          <span>${gate.gateScore}%</span>
          <strong>Gate score</strong>
          <small>${gate.blockers.length} blockers / ${gate.risks.length} risks</small>
        </div>
      </article>

      <div class="gate-metrics">
        ${renderGateMetric("Overall readiness", `${gate.readiness}%`, "Room score")}
        ${renderGateMetric("Build", `${gate.build}%`, "Beta stability")}
        ${renderGateMetric("Trust", `${gate.trust}%`, "User confidence")}
        ${renderGateMetric("Docs", `${gate.docs.percent}%`, `${gate.docs.ready}/${gate.docs.assets.length} ready`)}
        ${renderGateMetric("Decisions", `${gate.unresolved.length}`, "Unresolved")}
      </div>

      <div class="gate-grid">
        <section class="gate-panel">
          <div class="surface-heading">
            <div>
              <p class="eyebrow">Gate Criteria</p>
              <h2>What must be true before ${escapeHtml(gate.betaLabel)}?</h2>
            </div>
          </div>
          <div class="gate-criteria">
            ${gate.criteria.map(renderGateCriterion).join("")}
          </div>
        </section>

        <aside class="gate-panel gate-next">
          <div>
            <p class="eyebrow">Next Moves</p>
            <h2>Clear these first.</h2>
          </div>
          <ol class="actions">
            ${nextMoves}
          </ol>
          <div class="gate-actions">
            <button class="quiet-button" type="button" data-view="docs">Open Docs</button>
            <button class="quiet-button" type="button" data-view="decisions">Open Decisions</button>
            <button class="quiet-button" type="button" data-view="warroom">Open Warroom</button>
          </div>
        </aside>
      </div>
    </section>
  `
}

function renderForgeSignal(signal) {
  return `
    <article class="${signal.ready ? "ready" : ""}">
      <span>${escapeHtml(signal.status)}</span>
      <strong>${escapeHtml(signal.label)}</strong>
      <small>${escapeHtml(signal.detail)}</small>
    </article>
  `
}

function renderLaunchGap(gap) {
  return `
    <li>
      <span>${escapeHtml(gap.label)}</span>
      <div>
        <strong>${escapeHtml(gap.title)}</strong>
        <p>${escapeHtml(gap.detail || "Capture the next move before launch.")}</p>
      </div>
    </li>
  `
}

function renderProofAsset(asset) {
  const proofLink = safeProofLink(asset.proofLink)

  return `
    <article>
      <span>${escapeHtml(asset.priority)}</span>
      <strong>${escapeHtml(asset.title)}</strong>
      <p>${escapeHtml(asset.purpose)}</p>
      ${proofLink ? `<a href="${escapeHtml(proofLink)}" rel="noreferrer" target="_blank">Open proof</a>` : ""}
    </article>
  `
}

function renderEvidenceProof(source) {
  const proofLink = safeProofLink(source.url)

  return `
    <article>
      <span>${escapeHtml(evidenceTypeLabels[source.type] ?? source.type)}</span>
      <strong>${escapeHtml(source.title)}</strong>
      <p>${escapeHtml(source.note || "Evidence link attached to the launch room.")}</p>
      ${proofLink ? `<a href="${escapeHtml(proofLink)}" rel="noreferrer" target="_blank">Open evidence</a>` : ""}
    </article>
  `
}

function renderTrustAsset(asset) {
  const proofLink = safeProofLink(asset.proofLink)

  return `
    <li>
      <span class="doc-chip doc-chip--${escapeHtml(asset.status)}">${escapeHtml(docsStatusLabels[asset.status] ?? asset.status)}</span>
      <div>
        <strong>${escapeHtml(asset.title)}</strong>
        <p>${escapeHtml(asset.nextStep || asset.purpose)}</p>
        ${proofLink ? `<a href="${escapeHtml(proofLink)}" rel="noreferrer" target="_blank">Open proof</a>` : ""}
      </div>
    </li>
  `
}

function renderSurfaceQuestion(question, index) {
  return `
    <li>
      <span>${index + 1}</span>
      <p>${escapeHtml(question)}</p>
    </li>
  `
}

function renderForgeStrategy(surface) {
  return `
    <div class="forge-strategy">
      <article>
        <span>Surface Type</span>
        <strong>${escapeHtml(surface.template.label)}</strong>
        <p>${escapeHtml(surface.template.goal)}</p>
      </article>
      <article>
        <span>Primary CTA</span>
        <strong>${escapeHtml(surface.template.primaryCta)}</strong>
        <p>${escapeHtml(surface.template.ctaDetail)}</p>
      </article>
      <article>
        <span>Hard Truth</span>
        <strong>${escapeHtml(surface.template.proofLabel)}</strong>
        <p>${escapeHtml(surface.template.risk)}</p>
      </article>
    </div>
  `
}

function renderForgeControls(product, surface) {
  const settings = productSurfaceSettings(product)

  return `
    <form id="forge-controls-form" class="editor-form forge-controls-form">
      <div class="surface-heading">
        <div>
          <p class="eyebrow">Launch Surface Controls</p>
          <h2>Make the generated page publishable.</h2>
        </div>
        <button class="primary-button" type="submit">Save controls</button>
      </div>
      <label for="surfaceOffer">
        <span>Offer</span>
        <textarea id="surfaceOffer" name="offer" rows="2" placeholder="${escapeHtml(surface.pricing)}">${escapeHtml(settings.offer ?? "")}</textarea>
      </label>
      <div class="forge-controls-form__row">
        <label for="surfaceCtaLabel">
          <span>CTA label</span>
          <input id="surfaceCtaLabel" name="ctaLabel" value="${escapeHtml(settings.ctaLabel ?? "")}" placeholder="${escapeHtml(surface.template.primaryCta)}" />
        </label>
        <label for="surfaceCtaUrl">
          <span>CTA URL</span>
          <input id="surfaceCtaUrl" name="ctaUrl" inputmode="url" value="${escapeHtml(settings.ctaUrl ?? "")}" placeholder="https://..." />
        </label>
      </div>
      <div class="forge-controls-form__row">
        <label for="surfaceSupportUrl">
          <span>Support URL</span>
          <input id="surfaceSupportUrl" name="supportUrl" inputmode="url" value="${escapeHtml(settings.supportUrl ?? "")}" placeholder="https://..." />
        </label>
        <label for="surfaceTrustClaim">
          <span>Trust claim</span>
          <input id="surfaceTrustClaim" name="trustClaim" value="${escapeHtml(settings.trustClaim ?? "")}" placeholder="What can you honestly promise?" />
        </label>
      </div>
      <label for="surfaceLaunchNote">
        <span>Founder note</span>
        <textarea id="surfaceLaunchNote" name="launchNote" rows="2" placeholder="What should you remember before publishing this draft?">${escapeHtml(settings.launchNote ?? "")}</textarea>
      </label>
    </form>
  `
}

function renderLaunchQaCheck(check) {
  const status = check.passed ? "Pass" : "Fix"
  const modifier = check.passed ? "ready" : "blocked"

  return `
    <li class="launch-qa-check launch-qa-check--${modifier}">
      <span>${status}</span>
      <div>
        <strong>${escapeHtml(check.label)}</strong>
        <p>${escapeHtml(check.detail)}</p>
      </div>
    </li>
  `
}

function renderLaunchSurfaceQa(surface) {
  const blockerItems = surface.qa.blockers.length
    ? surface.qa.blockers.map((blocker) => `<li>${escapeHtml(blocker.label)}</li>`).join("")
    : "<li>No publishability blockers surfaced.</li>"

  return `
    <article class="launch-qa launch-qa--${escapeHtml(surface.qa.level)}">
      <div class="launch-qa__hero">
        <div>
          <p class="eyebrow">Launch Surface QA</p>
          <h2>${escapeHtml(surface.qa.verdict)}</h2>
          <p>${escapeHtml(surface.qa.summary)}</p>
        </div>
        <aside class="launch-qa__score">
          <span>${surface.qa.score}%</span>
          <strong>${surface.qa.passed}/${surface.qa.checks.length} checks</strong>
          <small>Publishability score</small>
        </aside>
      </div>
      <ul class="launch-qa__checks">
        ${surface.qa.checks.map(renderLaunchQaCheck).join("")}
      </ul>
      <div class="launch-qa__blockers">
        <span>Clear First</span>
        <ul>
          ${blockerItems}
        </ul>
      </div>
    </article>
  `
}

function renderShareCopyBlock(block) {
  return `
    <article class="share-copy">
      <header>
        <span>${escapeHtml(block.label)}</span>
        <button class="quiet-button" type="button" data-share-copy="${escapeHtml(block.key)}">Copy</button>
      </header>
      <pre>${escapeHtml(block.text)}</pre>
    </article>
  `
}

function renderLaunchSharePackage(surface) {
  const share = surface.sharePackage
  const proofLinks = share.proofLinks.length
    ? share.proofLinks.map((item) => `
      <li>
        <span>${escapeHtml(item.type)}</span>
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.detail)}</p>
          <a href="${escapeHtml(item.url)}" rel="noreferrer" target="_blank">Open proof</a>
        </div>
      </li>
    `).join("")
    : `
      <li>
        <span>Missing</span>
        <div>
          <strong>No proof links attached yet.</strong>
          <p>Add Forge evidence before sending this packet to anyone serious.</p>
        </div>
      </li>
    `
  const clearFirst = share.clearFirst.length
    ? share.clearFirst.map((item) => `
      <li>
        <span>Fix</span>
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.detail)}</p>
        </div>
      </li>
    `).join("")
    : `
      <li>
        <span>Clear</span>
        <div>
          <strong>No publishability blockers surfaced.</strong>
          <p>This packet is ready for qualified users if the founder agrees with the claims.</p>
        </div>
      </li>
    `
  const nextMoves = share.nextMoves.length
    ? share.nextMoves.map((move, index) => `<li><span>${index + 1}</span><p>${escapeHtml(move)}</p></li>`).join("")
    : "<li><span>1</span><p>Capture the next launch move in the warroom.</p></li>"

  return `
    <article class="share-package">
      <div class="share-package__hero">
        <div>
          <p class="eyebrow">Launch Share Package</p>
          <h2>Give the founder launch copy, not another blank page.</h2>
          <p>${escapeHtml(share.shareWarning)}</p>
        </div>
        <button class="primary-button" type="button" data-action="export-share-package">Download Markdown</button>
      </div>
      <div class="share-package__copy-grid">
        ${share.copyBlocks.map(renderShareCopyBlock).join("")}
      </div>
      <div class="share-package__grid">
        <section>
          <div class="preview-section-heading">
            <p class="eyebrow">Clear First</p>
            <span>${share.clearFirst.length} blockers</span>
          </div>
          <ul class="share-list">
            ${clearFirst}
          </ul>
        </section>
        <section>
          <div class="preview-section-heading">
            <p class="eyebrow">Proof Links</p>
            <span>${share.proofLinks.length} attached</span>
          </div>
          <ul class="share-list">
            ${proofLinks}
          </ul>
        </section>
      </div>
      <section class="share-package__moves">
        <div class="preview-section-heading">
          <p class="eyebrow">Next Moves</p>
          <span>${share.nextMoves.length} queued</span>
        </div>
        <ol class="question-list">
          ${nextMoves}
        </ol>
      </section>
    </article>
  `
}

function renderPublishStep(step, index) {
  const modifier = step.status === "ready" ? "ready" : "blocked"

  return `
    <li class="publish-step publish-step--${modifier}">
      <span>${index + 1}</span>
      <div>
        <strong>${escapeHtml(step.label)}</strong>
        <p>${escapeHtml(step.detail)}</p>
      </div>
    </li>
  `
}

function renderManualPublishPath(surface) {
  const publish = surface.publishPath

  return `
    <article class="publish-path publish-path--${escapeHtml(publish.level)}">
      <div class="publish-path__hero">
        <div>
          <p class="eyebrow">Manual Publish Path</p>
          <h2>${escapeHtml(publish.verdict)}</h2>
          <p>${escapeHtml(publish.summary)}</p>
        </div>
        <button class="primary-button" type="button" data-action="export-publish-guide">Download Publish Guide</button>
      </div>
      <div class="publish-path__facts">
        <span><strong>Static folder</strong>${escapeHtml(publish.folder)}/</span>
        <span><strong>Page file</strong>${escapeHtml(publish.folder)}/index.html</span>
        <span><strong>URL pattern</strong>${escapeHtml(publish.publicUrl)}</span>
      </div>
      <ol class="publish-path__steps">
        ${publish.steps.map(renderPublishStep).join("")}
      </ol>
    </article>
  `
}

function formatSnapshotDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Unknown time"

  return date.toLocaleString([], {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short"
  })
}

function formatDelta(value, suffix = "") {
  if (!value) return `0${suffix}`
  return `${value > 0 ? "+" : ""}${value}${suffix}`
}

function renderHistoryMetric(label, value, detail) {
  return `
    <span>
      <strong>${escapeHtml(label)}</strong>
      ${escapeHtml(value)}
      <small>${escapeHtml(detail)}</small>
    </span>
  `
}

function renderSnapshotItem(snapshot, index) {
  const blockers = snapshot.blockers.length ? snapshot.blockers.join(", ") : "No blockers"

  return `
    <li>
      <div>
        <span>${escapeHtml(index === 0 ? "Latest" : `Snapshot ${index + 1}`)}</span>
        <strong>${escapeHtml(snapshot.qaVerdict)} / ${snapshot.qaScore}%</strong>
        <p>${escapeHtml(formatSnapshotDate(snapshot.createdAt))} - ${escapeHtml(snapshot.surfaceLabel)} - ${escapeHtml(snapshot.publishFolder)}/</p>
      </div>
      <small>${escapeHtml(blockers)}</small>
    </li>
  `
}

function renderLaunchSurfaceHistory(product, surface) {
  const snapshots = productLaunchSnapshots(product)
  const currentSnapshot = launchSnapshotFromSurface(surface)
  const latestSnapshot = snapshots[0]
  const comparison = compareSnapshots(currentSnapshot, latestSnapshot)
  const snapshotList = snapshots.length
    ? snapshots.map(renderSnapshotItem).join("")
    : `
      <li>
        <div>
          <span>Empty</span>
          <strong>No saved launch surface snapshots yet.</strong>
          <p>Save the current surface before you change the offer, CTA, docs, or gate posture.</p>
        </div>
        <small>Local only</small>
      </li>
    `

  return `
    <article class="surface-history surface-history--${escapeHtml(comparison.tone)}">
      <div class="surface-history__hero">
        <div>
          <p class="eyebrow">Launch Surface History</p>
          <h2>Keep a trail of the launch surface as it changes.</h2>
          <p>${escapeHtml(comparison.summary)}</p>
        </div>
        <button class="primary-button" type="button" data-action="save-surface-snapshot">Save Snapshot</button>
      </div>
      <div class="surface-history__metrics">
        ${renderHistoryMetric("QA score", `${currentSnapshot.qaScore}%`, `${formatDelta(comparison.scoreDelta, "%")} vs latest`)}
        ${renderHistoryMetric("Blockers", `${currentSnapshot.blockers.length}`, `${formatDelta(comparison.blockersDelta)} vs latest`)}
        ${renderHistoryMetric("Proof links", `${currentSnapshot.proofCount}`, `${formatDelta(comparison.proofDelta)} vs latest`)}
        ${renderHistoryMetric("Docs ready", `${currentSnapshot.docsReady}/${currentSnapshot.docsTotal}`, `${formatDelta(comparison.docsDelta)} vs latest`)}
      </div>
      <ul class="surface-history__list">
        ${snapshotList}
      </ul>
    </article>
  `
}

function renderLaunchSurfacePreview(product) {
  const surface = launchSurfaceModel(product)
  const proofItems = [
    ...surface.evidence.forgeSources.map(renderEvidenceProof),
    ...surface.proofAssets.map(renderProofAsset)
  ]
  const proofAssets = proofItems.length
    ? proofItems.join("")
    : `
      <article>
        <span>Proof</span>
        <strong>No Forge proof links attached yet.</strong>
        <p>Add evidence links or docs proof links when a source exists in GitHub, Google Docs, or another public draft.</p>
      </article>
    `
  const readyAssets = surface.readyAssets.length
    ? surface.readyAssets.slice(0, 4).map((asset) => `<li>${escapeHtml(asset.title)}</li>`).join("")
    : "<li>No ready docs assets yet.</li>"
  const trustAssets = surface.trustAssets.length
    ? surface.trustAssets.slice(0, 4).map(renderTrustAsset).join("")
    : `
      <li>
        <span class="doc-chip doc-chip--missing">Missing</span>
        <div>
          <strong>No trust-sensitive assets mapped yet.</strong>
          <p>Add privacy, support, install, save, export, or permissions docs before publishing.</p>
        </div>
      </li>
    `
  const gaps = surface.launchGaps.length
    ? surface.launchGaps.map(renderLaunchGap).join("")
    : `
      <li>
        <span>Clear</span>
        <div>
          <strong>No major launch gaps surfaced.</strong>
          <p>Keep the room current as new launch risks appear.</p>
        </div>
      </li>
    `
  const nextActions = surface.nextActions.length
    ? surface.nextActions.map((action, index) => `
      <li>
        <span>${index + 1}</span>
        <p>${escapeHtml(action)}</p>
      </li>
    `).join("")
    : `
      <li>
        <span>1</span>
        <p>Capture the next launch move in the warroom.</p>
      </li>
    `

  return `
    <article class="launch-preview" aria-label="Generated launch surface preview">
      <header class="launch-preview__hero">
        <div>
          <p class="eyebrow">Generated Launch Surface</p>
          <h2>${escapeHtml(surface.name)}</h2>
          <p>${escapeHtml(surface.oneLiner)}</p>
        </div>
        <div class="launch-preview__status launch-preview__status--${escapeHtml(surface.gate.level)}">
          <span>${surface.gate.gateScore}%</span>
          <strong>${escapeHtml(surface.gate.verdict)}</strong>
          <small>${surface.gate.blockers.length} blockers / ${surface.gate.risks.length} risks</small>
        </div>
      </header>

      <div class="launch-preview__facts">
        <span><strong>Audience</strong>${escapeHtml(surface.audience)}</span>
        <span><strong>Surface</strong>${escapeHtml(surface.template.label)}</span>
        <span><strong>Target</strong>${escapeHtml(surface.targetDate)}</span>
      </div>

      <section class="launch-preview__offer">
        <div>
          <p class="eyebrow">${escapeHtml(surface.template.offerLabel)}</p>
          <h3>${escapeHtml(surface.controls.offer || surface.pricing)}</h3>
          <p>${escapeHtml(surface.template.goal)}</p>
        </div>
        <aside>
          <span>Primary CTA</span>
          <strong>${escapeHtml(surface.controls.ctaLabel)}</strong>
          ${surface.controls.ctaUrl
            ? `<a class="surface-cta-link" href="${escapeHtml(surface.controls.ctaUrl)}" rel="noreferrer" target="_blank">Open CTA link</a>`
            : `<p>${escapeHtml(surface.template.ctaDetail)}</p>`}
        </aside>
      </section>

      <div class="launch-preview__copy">
        <section>
          <p class="eyebrow">Problem</p>
          <h3>${escapeHtml(surface.problem)}</h3>
        </section>
        <section>
          <p class="eyebrow">Promise</p>
          <h3>${escapeHtml(surface.promise)}</h3>
        </section>
        <section>
          <p class="eyebrow">Milestone</p>
          <p>${escapeHtml(surface.milestone)}</p>
        </section>
        <section>
          <p class="eyebrow">Pricing</p>
          <p>${escapeHtml(surface.controls.offer || surface.pricing)}</p>
        </section>
        <section class="wide">
          <p class="eyebrow">Strategic Constraint</p>
          <p>${escapeHtml(surface.strategicConstraint)}</p>
        </section>
        <section class="wide">
          <p class="eyebrow">Trust Claim</p>
          <p>${escapeHtml(surface.controls.trustClaim || "No explicit trust claim saved yet.")}</p>
        </section>
      </div>

      <div class="launch-preview__split">
        <section>
          <div class="preview-section-heading">
            <p class="eyebrow">${escapeHtml(surface.template.proofLabel)}</p>
            <span>${surface.readyAssets.length}/${surface.gate.docs.assets.length} ready</span>
          </div>
          <div class="proof-grid">
            ${proofAssets}
          </div>
          <ul class="trust-list">
            ${trustAssets}
          </ul>
          <ul class="ready-list">
            ${readyAssets}
          </ul>
        </section>

        <section>
          <div class="preview-section-heading">
            <p class="eyebrow">Still Missing</p>
            <span>${surface.launchGaps.length} surfaced</span>
          </div>
          <ul class="gap-list">
            ${gaps}
          </ul>
        </section>
      </div>

      <section class="launch-preview__questions">
        <div class="preview-section-heading">
          <p class="eyebrow">${escapeHtml(surface.template.questionLabel)}</p>
          <span>${surface.questions.length} to answer</span>
        </div>
        <ol class="question-list">
          ${surface.questions.map(renderSurfaceQuestion).join("")}
        </ol>
      </section>

      <footer class="launch-preview__footer">
        <div>
          <p class="eyebrow">Next Actions</p>
          <ol class="actions">
            ${nextActions}
          </ol>
        </div>
        <aside>
          <strong>${surface.supportReady ? "Support path ready" : "Support path not ready"}</strong>
          <p>${surface.supportReady
            ? "The launch surface can point users toward feedback and support."
            : "Add a ready support or feedback docs asset before inviting beta users."}</p>
          ${surface.controls.supportUrl ? `<a class="surface-support-link" href="${escapeHtml(surface.controls.supportUrl)}" rel="noreferrer" target="_blank">Open support link</a>` : ""}
        </aside>
      </footer>
      ${surface.controls.launchNote ? `
        <section class="launch-preview__note">
          <p class="eyebrow">Founder Note</p>
          <p>${escapeHtml(surface.controls.launchNote)}</p>
        </section>
      ` : ""}
    </article>
  `
}

function buildLaunchSurfaceHtml(product) {
  const surface = launchSurfaceModel(product)
  const generatedAt = new Date().toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })
  const evidenceProofItems = surface.evidence.forgeSources.map((source) => `
        <article class="card">
          <span>${escapeHtml(evidenceTypeLabels[source.type] ?? source.type)}</span>
          <h3>${escapeHtml(source.title)}</h3>
          <p>${escapeHtml(source.note || "Evidence link attached to the launch room.")}</p>
          <a href="${escapeHtml(safeProofLink(source.url))}" rel="noreferrer" target="_blank">Open evidence</a>
        </article>
      `)
  const docsProofItems = surface.proofAssets.map((asset) => {
      const proofLink = safeProofLink(asset.proofLink)

      return `
        <article class="card">
          <span>${escapeHtml(asset.priority)}</span>
          <h3>${escapeHtml(asset.title)}</h3>
          <p>${escapeHtml(asset.purpose)}</p>
          ${proofLink ? `<a href="${escapeHtml(proofLink)}" rel="noreferrer" target="_blank">Open proof</a>` : ""}
        </article>
      `
    })
  const proofItems = [...evidenceProofItems, ...docsProofItems].length
    ? [...evidenceProofItems, ...docsProofItems].join("")
    : `
      <article class="card">
        <span>Proof</span>
        <h3>No Forge proof links attached yet.</h3>
        <p>Add evidence links or docs proof links before publishing this surface.</p>
      </article>
    `
  const gapItems = surface.launchGaps.length
    ? surface.launchGaps.map((gap) => `
      <li>
        <span>${escapeHtml(gap.label)}</span>
        <strong>${escapeHtml(gap.title)}</strong>
        <p>${escapeHtml(gap.detail || "Capture the next move before launch.")}</p>
      </li>
    `).join("")
    : `
      <li>
        <span>Clear</span>
        <strong>No major launch gaps surfaced.</strong>
        <p>Keep the room current as new launch risks appear.</p>
      </li>
    `
  const actionItems = surface.nextActions.length
    ? surface.nextActions.map((action, index) => `<li><span>${index + 1}</span>${escapeHtml(action)}</li>`).join("")
    : "<li><span>1</span>Capture the next launch move in Pendragon.</li>"
  const trustItems = surface.trustAssets.length
    ? surface.trustAssets.slice(0, 4).map((asset) => {
      const proofLink = safeProofLink(asset.proofLink)

      return `
        <li>
          <span>${escapeHtml(docsStatusLabels[asset.status] ?? asset.status)}</span>
          <strong>${escapeHtml(asset.title)}</strong>
          <p>${escapeHtml(asset.nextStep || asset.purpose)}</p>
          ${proofLink ? `<a href="${escapeHtml(proofLink)}" rel="noreferrer" target="_blank">Open proof</a>` : ""}
        </li>
      `
    }).join("")
    : `
      <li>
        <span>Missing</span>
        <strong>No trust-sensitive assets mapped yet.</strong>
        <p>Add privacy, support, install, save, export, or permissions docs before publishing.</p>
      </li>
    `
  const questionItems = surface.questions
    .map((question, index) => `<li><span>${index + 1}</span>${escapeHtml(question)}</li>`)
    .join("")
  const qaItems = surface.qa.checks.map((check) => `
      <li class="${check.passed ? "passed" : "blocked"}">
        <span>${check.passed ? "Pass" : "Fix"}</span>
        <strong>${escapeHtml(check.label)}</strong>
        <p>${escapeHtml(check.detail)}</p>
      </li>
    `).join("")
  const ctaLink = surface.controls.ctaUrl
    ? `<a class="cta-link" href="${escapeHtml(surface.controls.ctaUrl)}" rel="noreferrer" target="_blank">${escapeHtml(surface.controls.ctaLabel)}</a>`
    : `<p>${escapeHtml(surface.template.ctaDetail)}</p>`
  const supportLink = surface.controls.supportUrl
    ? `<a href="${escapeHtml(surface.controls.supportUrl)}" rel="noreferrer" target="_blank">Open support link</a>`
    : ""
  const founderNote = surface.controls.launchNote
    ? `
      <section class="section">
        <p class="eyebrow">Founder Note</p>
        <p>${escapeHtml(surface.controls.launchNote)}</p>
      </section>
    `
    : ""

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(surface.name)} Launch Surface</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --bg: #050608;
        --surface: #0d1017;
        --line: rgba(255, 255, 255, 0.12);
        --text: #f5f2ed;
        --muted: #a4a9b5;
        --dim: #6d7482;
        --ember: #ff5c1e;
        --green: #5bcf84;
      }

      * { box-sizing: border-box; }

      body {
        background: radial-gradient(circle at 78% 0%, rgba(255, 92, 30, 0.14), transparent 34%), var(--bg);
        color: var(--text);
        margin: 0;
      }

      main {
        display: grid;
        gap: 28px;
        margin: 0 auto;
        max-width: 1040px;
        padding: 42px 22px 56px;
      }

      .eyebrow {
        color: var(--dim);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        margin: 0;
        text-transform: uppercase;
      }

      .hero,
      .section {
        background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018));
        border: 1px solid var(--line);
        border-radius: 10px;
      }

      .hero {
        display: grid;
        gap: 24px;
        grid-template-columns: minmax(0, 1fr) 210px;
        padding: 34px;
      }

      h1 {
        font-size: 48px;
        letter-spacing: 0;
        line-height: 1;
        margin: 10px 0;
      }

      .hero p:not(.eyebrow),
      .section p,
      li p {
        color: var(--muted);
      }

      .status {
        border: 1px solid var(--line);
        border-radius: 10px;
        display: grid;
        gap: 6px;
        padding: 18px;
      }

      .status span {
        color: var(--ember);
        font-size: 40px;
        font-weight: 900;
      }

      .facts,
      .copy,
      .grid,
      .cta {
        display: grid;
        gap: 14px;
      }

      .facts,
      .grid,
      .cta {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .facts span,
      .card,
      .copy section,
      .cta article,
      .actions li,
      .gaps li,
      .questions li,
      .qa li,
      .trust li {
        background: rgba(255,255,255,0.035);
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 16px;
      }

      .facts strong,
      .card span,
      .gaps span,
      .actions span,
      .questions span,
      .qa span,
      .trust span,
      .cta span {
        color: var(--ember);
        display: block;
        font-size: 12px;
        font-weight: 900;
        margin-bottom: 7px;
        text-transform: uppercase;
      }

      .section {
        display: grid;
        gap: 16px;
        padding: 24px;
      }

      .section h2 {
        font-size: 28px;
        line-height: 1.1;
        margin: 0;
      }

      .copy {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .copy .wide {
        grid-column: 1 / -1;
      }

      .card h3,
      .copy h3 {
        font-size: 20px;
        line-height: 1.2;
        margin: 0;
      }

      .card a,
      .cta-link,
      .section a {
        color: var(--ember);
        font-weight: 800;
        text-decoration: none;
      }

      .cta article:first-child {
        grid-column: span 2;
      }

      .cta h2 {
        font-size: 28px;
        line-height: 1.1;
        margin: 8px 0;
      }

      .cta strong {
        display: block;
        font-size: 24px;
        line-height: 1.1;
        margin: 8px 0;
      }

      .gaps,
      .actions,
      .questions,
      .qa,
      .trust {
        display: grid;
        gap: 10px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      footer {
        color: var(--dim);
        font-size: 13px;
      }

      .qa {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .qa li.passed span {
        color: var(--green);
      }

      .qa li.blocked span {
        color: var(--ember);
      }

      @media (max-width: 780px) {
        .hero,
        .facts,
        .copy,
        .grid,
        .cta,
        .qa {
          grid-template-columns: 1fr;
        }

        .cta article:first-child {
          grid-column: auto;
        }

        h1 {
          font-size: 38px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header class="hero">
        <div>
          <p class="eyebrow">${escapeHtml(surface.stageLabel)} / ${escapeHtml(surface.targetDate)}</p>
          <h1>${escapeHtml(surface.name)}</h1>
          <p>${escapeHtml(surface.oneLiner)}</p>
        </div>
        <aside class="status">
          <span>${surface.gate.gateScore}%</span>
          <strong>${escapeHtml(surface.gate.verdict)}</strong>
          <small>${surface.gate.blockers.length} blockers / ${surface.gate.risks.length} risks</small>
        </aside>
      </header>

      <section class="facts">
        <span><strong>Audience</strong>${escapeHtml(surface.audience)}</span>
        <span><strong>Surface</strong>${escapeHtml(surface.template.label)}</span>
        <span><strong>Milestone</strong>${escapeHtml(surface.milestone)}</span>
      </section>

      <section class="section">
        <p class="eyebrow">Launch Surface QA</p>
        <h2>${escapeHtml(surface.qa.verdict)} (${surface.qa.score}%)</h2>
        <p>${escapeHtml(surface.qa.summary)}</p>
        <ul class="qa">
          ${qaItems}
        </ul>
      </section>

      <section class="cta">
        <article>
          <span>${escapeHtml(surface.template.offerLabel)}</span>
          <h2>${escapeHtml(surface.controls.offer || surface.pricing)}</h2>
          <p>${escapeHtml(surface.template.goal)}</p>
        </article>
        <article>
          <span>Primary CTA</span>
          <strong>${escapeHtml(surface.controls.ctaLabel)}</strong>
          ${ctaLink}
        </article>
      </section>

      <section class="section">
        <p class="eyebrow">Launch Story</p>
        <h2>The clearest version of the product today.</h2>
        <div class="copy">
          <section>
            <p class="eyebrow">Problem</p>
            <h3>${escapeHtml(surface.problem)}</h3>
          </section>
          <section>
            <p class="eyebrow">Promise</p>
            <h3>${escapeHtml(surface.promise)}</h3>
          </section>
          <section class="wide">
            <p class="eyebrow">Constraint</p>
            <p>${escapeHtml(surface.strategicConstraint)}</p>
          </section>
          <section class="wide">
            <p class="eyebrow">Trust Claim</p>
            <p>${escapeHtml(surface.controls.trustClaim || "No explicit trust claim saved yet.")}</p>
          </section>
        </div>
      </section>

      <section class="section">
        <p class="eyebrow">${escapeHtml(surface.template.proofLabel)}</p>
        <h2>What can be trusted or inspected right now.</h2>
        <div class="grid">
          ${proofItems}
        </div>
        <ul class="trust">
          ${trustItems}
        </ul>
      </section>

      <section class="section">
        <p class="eyebrow">${escapeHtml(surface.template.questionLabel)}</p>
        <h2>Questions to answer before this surface goes wider.</h2>
        <ol class="questions">
          ${questionItems}
        </ol>
      </section>

      <section class="section">
        <p class="eyebrow">Launch Gaps</p>
        <h2>What must get clearer before this goes wider.</h2>
        <ul class="gaps">
          ${gapItems}
        </ul>
      </section>

      <section class="section">
        <p class="eyebrow">Next Actions</p>
        <h2>The current launch moves.</h2>
        <ol class="actions">
          ${actionItems}
        </ol>
        ${supportLink}
      </section>

      ${founderNote}

      <footer>
        Draft generated by Pendragon on ${escapeHtml(generatedAt)}. Review before publishing.
      </footer>
    </main>
  </body>
</html>`
}

function renderForge(product) {
  const brief = product.brief ?? {}
  const surface = launchSurfaceModel(product)
  const proofCount = surface.proofAssets.length + surface.evidence.forgeSources.length
  const readySignals = [
    {
      detail: "One-liner and promise",
      label: "Brief",
      ready: Boolean(product.oneLiner && brief.promise),
      status: product.oneLiner && brief.promise ? "Ready" : "Missing"
    },
    {
      detail: `${surface.gate.docs.ready}/${surface.gate.docs.assets.length} docs ready`,
      label: "Docs",
      ready: surface.gate.docs.ready > 0,
      status: surface.gate.docs.ready > 0 ? "Ready" : "Missing"
    },
    {
      detail: `${proofCount} external proof link${proofCount === 1 ? "" : "s"}`,
      label: "Proof",
      ready: proofCount > 0,
      status: proofCount > 0 ? "Attached" : "Missing"
    },
    {
      detail: surface.gate.summary,
      label: "Gate",
      ready: surface.gate.level !== "blocked",
      status: surface.gate.level === "ready" ? "Ready" : surface.gate.level === "at-risk" ? "At risk" : "Blocked"
    }
  ]

  return `
    <section class="launch-surface forge-surface">
      <article class="forge-hero">
        <div>
          <p class="eyebrow">Forge / ${escapeHtml(surface.template.label)}</p>
          <h2>Build the first launch surface from the room.</h2>
          <p>Forge turns the brief, docs tracker, decisions, and readiness gate into a stage-aware launch-page draft you can inspect and export.</p>
        </div>
        <div class="forge-actions">
          <button class="primary-button" type="button" data-action="export-launch-surface">Download HTML draft</button>
          <button class="quiet-button" type="button" data-action="export-share-package">Download Share Package</button>
          <button class="quiet-button" type="button" data-view="brief">Edit Brief</button>
          <button class="quiet-button" type="button" data-view="docs">Open Docs</button>
        </div>
      </article>

      <div class="forge-readiness">
        ${readySignals.map(renderForgeSignal).join("")}
      </div>

      ${renderForgeStrategy(surface)}

      ${renderForgeControls(product, surface)}

      ${renderLaunchSurfaceQa(surface)}

      ${renderLaunchSharePackage(surface)}

      ${renderManualPublishPath(surface)}

      ${renderLaunchSurfaceHistory(product, surface)}

      ${renderLaunchSurfacePreview(product)}
    </section>
  `
}

function renderActiveView(product) {
  if (activeView === "setup" && isCreatingProduct) return renderCreateProduct()
  if (activeView === "setup") return renderSetup(product)
  if (activeView === "brief") return renderBrief(product)
  if (activeView === "decisions") return renderDecisions(product)
  if (activeView === "docs") return renderDocs(product)
  if (activeView === "evidence") return renderEvidence(product)
  if (activeView === "gate") return renderGate(product)
  if (activeView === "forge") return renderForge(product)
  return renderWarroom(product)
}

function bindEvents() {
  document.querySelectorAll("[data-product-id]").forEach((button) => {
    button.addEventListener("click", () => setActiveProduct(button.dataset.productId))
  })
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view))
  })

  document.querySelector("[data-action='edit']")?.addEventListener("click", editRoom)
  document.querySelector("[data-action='new-product']")?.addEventListener("click", startCreateProduct)
  document.querySelector("[data-action='export']")?.addEventListener("click", exportWorkspace)
  document.querySelector("[data-action='export-launch-surface']")?.addEventListener("click", exportLaunchSurface)
  document.querySelectorAll("[data-action='export-share-package']").forEach((button) => {
    button.addEventListener("click", exportLaunchSharePackage)
  })
  document.querySelectorAll("[data-action='export-publish-guide']").forEach((button) => {
    button.addEventListener("click", exportLaunchPublishGuide)
  })
  document.querySelector("[data-action='save-surface-snapshot']")?.addEventListener("click", saveLaunchSurfaceSnapshot)
  document.querySelector("[data-action='reset']")?.addEventListener("click", resetDemo)
  document.querySelectorAll("[data-share-copy]").forEach((button) => {
    button.addEventListener("click", () => copySharePackageItem(button.dataset.shareCopy))
  })
  document.querySelectorAll("[data-action='cancel-edit']").forEach((button) => {
    button.addEventListener("click", cancelEdit)
  })
  document.querySelector("[data-action='cancel-create-product']")?.addEventListener("click", cancelCreateProduct)
  document.querySelector("#room-editor")?.addEventListener("submit", saveRoom)
  document.querySelector("#setup-form")?.addEventListener("submit", saveSetup)
  document.querySelector("#create-product-form")?.addEventListener("submit", createProduct)
  document.querySelector("#brief-form")?.addEventListener("submit", saveBrief)
  document.querySelector("#decision-form")?.addEventListener("submit", addDecision)
  document.querySelector("#docs-form")?.addEventListener("submit", saveDocsAssets)
  document.querySelector("#evidence-form")?.addEventListener("submit", addEvidenceSource)
  document.querySelector("#forge-controls-form")?.addEventListener("submit", saveForgeControls)
  document.querySelectorAll("form").forEach((form) => {
    const markDirty = () => {
      hasUnsavedFormChanges = true
    }

    form.addEventListener("input", markDirty)
    form.addEventListener("change", markDirty)
  })
}

function render() {
  const product = activeProduct()
  const percent = isCreatingProduct ? 0 : readinessPercent(product)
  const headerStage = isCreatingProduct ? "Setup" : (stageLabels[product.stage] ?? product.stage)
  const headerName = isCreatingProduct ? "New product" : product.name
  const headerStatus = isCreatingProduct ? "Create a local product room" : `${product.status} - Target: ${product.targetDate}`
  const scoreLabel = isCreatingProduct ? "Starter readiness" : "Launch readiness"
  const app = document.querySelector("#app")

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="../">
          <img src="./public/brand/pendragon-lava-glass-horizontal-lockup-transparent.png" alt="Pendragon" />
        </a>
        <nav class="nav">
          ${renderViewNav()}
        </nav>
        <section class="product-nav" aria-label="Products">
          <p>Portfolio</p>
          ${renderProductNav(product)}
        </section>
      </aside>

      <main class="warroom">
        <header class="topbar">
          <div>
            <p class="eyebrow">${escapeHtml(headerStage)} Mode</p>
            <h1>${escapeHtml(headerName)}</h1>
            <p>${escapeHtml(headerStatus)}</p>
          </div>
          <div class="command-bar" aria-label="Room commands">
            ${activeView === "warroom" && !isCreatingProduct ? `<button class="primary-button" type="button" data-action="edit">Edit room</button>` : ""}
            <button class="quiet-button" type="button" data-action="export">Export JSON</button>
            <button class="quiet-button" type="button" data-action="reset">Reset demo</button>
          </div>
          <div class="score">
            <span>${percent}%</span>
            <small>${escapeHtml(scoreLabel)}</small>
          </div>
        </header>

        <div class="save-status" role="status">
          <span>${escapeHtml(statusMessage)}</span>
          <small>Data is stored in this browser for now.</small>
        </div>

        ${renderActiveView(product)}
      </main>
    </div>
  `

  bindEvents()
}

window.addEventListener("keydown", (event) => {
  if (event.key === "R" && event.shiftKey && event.metaKey) {
    workspace = resetWorkspace()
    isEditing = false
    isCreatingProduct = false
    hasUnsavedFormChanges = false
    statusMessage = "Demo data restored"
    errorMessage = ""
    render()
  }
})

render()
