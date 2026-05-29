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
  { id: "forge", label: "Forge" }
]

const decisionStatusLabels = {
  open: "Open",
  chosen: "Chosen",
  parked: "Parked"
}

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

function numberValue(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeReadiness(doneValue, totalValue) {
  const total = Math.max(1, numberValue(totalValue, 1))
  const done = Math.min(total, Math.max(0, numberValue(doneValue, 0)))
  return { done, total }
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

function exportWorkspace() {
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const date = new Date().toISOString().slice(0, 10)

  link.href = url
  link.download = `pendragon-workspace-${date}.json`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)

  statusMessage = "Workspace JSON exported"
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
        <p>Future module: turn this product room into a landing page, docs, FAQ, pricing, changelog, and trust surface.</p>
        <button disabled>Coming next</button>
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

function renderDocs(product) {
  const assets = [
    "Landing page",
    "Beta instructions",
    "Privacy/trust",
    "FAQ",
    "Changelog",
    "Support/contact"
  ]

  return `
    <section class="launch-surface">
      <div class="surface-heading">
        <div>
          <p class="eyebrow">Docs Surface</p>
          <h2>${escapeHtml(product.name)} launch knowledge map</h2>
        </div>
        <span>Tracker next</span>
      </div>
      <div class="asset-grid">
        ${assets.map((asset) => `
          <article class="asset-card">
            <strong>${escapeHtml(asset)}</strong>
            <p>Needed for a credible launch surface.</p>
          </article>
        `).join("")}
      </div>
    </section>
  `
}

function renderForge(product) {
  const brief = product.brief ?? {}
  const readySignals = [
    ["Brief", product.oneLiner && brief.promise],
    ["Decision", product.decisions?.length],
    ["Docs", product.readiness?.find((section) => section.name === "Docs")?.done > 0],
    ["Trust", product.readiness?.find((section) => section.name === "Trust")?.done > 0]
  ]

  return `
    <section class="launch-surface forge-surface">
      <div>
        <p class="eyebrow">Forge</p>
        <h2>Build the launch surface from the room.</h2>
        <p>Forge will eventually turn the product room into a landing page, docs, FAQ, pricing, changelog, and trust page.</p>
      </div>
      <div class="forge-readiness">
        ${readySignals.map(([label, ready]) => `
          <article class="${ready ? "ready" : ""}">
            <span>${ready ? "Ready" : "Missing"}</span>
            <strong>${escapeHtml(label)}</strong>
          </article>
        `).join("")}
      </div>
      <button class="primary-button" type="button" disabled>Forge not unlocked yet</button>
    </section>
  `
}

function renderActiveView(product) {
  if (activeView === "brief") return renderBrief(product)
  if (activeView === "decisions") return renderDecisions(product)
  if (activeView === "docs") return renderDocs(product)
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
  document.querySelector("[data-action='reset']")?.addEventListener("click", resetDemo)
  document.querySelectorAll("[data-action='cancel-edit']").forEach((button) => {
    button.addEventListener("click", cancelEdit)
  })
  document.querySelector("#room-editor")?.addEventListener("submit", saveRoom)
  document.querySelector("#brief-form")?.addEventListener("submit", saveBrief)
  document.querySelector("#decision-form")?.addEventListener("submit", addDecision)
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("input", () => {
      hasUnsavedFormChanges = true
    })
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
