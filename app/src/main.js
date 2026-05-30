import { loadWorkspace, resetWorkspace, saveWorkspace } from "./storage/workspace.js"
import { readinessPercent, stageJobs, stageLabels } from "./domain/stages.js"

let workspace = loadWorkspace()
let activeView = "warroom"
let isEditing = false
let hasUnsavedFormChanges = false
let statusMessage = "Local-only workspace"
let errorMessage = ""

const views = [
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

function productDocsAssets(product) {
  return Array.isArray(product.docsAssets) ? product.docsAssets : []
}

function productEvidenceSources(product) {
  return Array.isArray(product.evidenceSources) ? product.evidenceSources : []
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

  if (product.stage === "growth") {
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
  const betaLabel = product.stage === "beta" ? "paid beta" : "launch"
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

  return {
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

function canDiscardActiveWork() {
  return !(isEditing || hasUnsavedFormChanges) || window.confirm("Discard unsaved edits?")
}

function setActiveProduct(productId) {
  if (!canDiscardActiveWork()) return

  const nextWorkspace = { ...workspace, activeProductId: productId }
  isEditing = false
  hasUnsavedFormChanges = false
  commitWorkspace(nextWorkspace, "Local-only workspace")
  render()
}

function setActiveView(view) {
  if (!canDiscardActiveWork()) return

  activeView = view
  isEditing = false
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

function renderProductNav(product) {
  return workspace.products
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

  return `
    ${errorMessage ? `<p class="error-message">${escapeHtml(errorMessage)}</p>` : ""}
    ${isEditing ? renderEditor(product) : ""}

    <section class="focus-card">
      <p class="eyebrow">This Week's Launch Focus</p>
      <h2>${escapeHtml(product.currentFocus)}</h2>
      <p>${escapeHtml(stageJobs[product.stage])}</p>
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

      @media (max-width: 780px) {
        .hero,
        .facts,
        .copy,
        .grid,
        .cta {
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
          <button class="quiet-button" type="button" data-view="brief">Edit Brief</button>
          <button class="quiet-button" type="button" data-view="docs">Open Docs</button>
        </div>
      </article>

      <div class="forge-readiness">
        ${readySignals.map(renderForgeSignal).join("")}
      </div>

      ${renderForgeStrategy(surface)}

      ${renderForgeControls(product, surface)}

      ${renderLaunchSurfacePreview(product)}
    </section>
  `
}

function renderActiveView(product) {
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
  document.querySelector("[data-action='export']")?.addEventListener("click", exportWorkspace)
  document.querySelector("[data-action='export-launch-surface']")?.addEventListener("click", exportLaunchSurface)
  document.querySelector("[data-action='reset']")?.addEventListener("click", resetDemo)
  document.querySelectorAll("[data-action='cancel-edit']").forEach((button) => {
    button.addEventListener("click", cancelEdit)
  })
  document.querySelector("#room-editor")?.addEventListener("submit", saveRoom)
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
  const percent = readinessPercent(product)
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
            <p class="eyebrow">${escapeHtml(stageLabels[product.stage])} Mode</p>
            <h1>${escapeHtml(product.name)}</h1>
            <p>${escapeHtml(product.status)} - Target: ${escapeHtml(product.targetDate)}</p>
          </div>
          <div class="command-bar" aria-label="Room commands">
            ${activeView === "warroom" ? `<button class="primary-button" type="button" data-action="edit">Edit room</button>` : ""}
            <button class="quiet-button" type="button" data-action="export">Export JSON</button>
            <button class="quiet-button" type="button" data-action="reset">Reset demo</button>
          </div>
          <div class="score">
            <span>${percent}%</span>
            <small>Launch readiness</small>
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
    hasUnsavedFormChanges = false
    statusMessage = "Demo data restored"
    errorMessage = ""
    render()
  }
})

render()
