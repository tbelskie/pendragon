import { loadWorkspace, resetWorkspace, saveWorkspace } from "./storage/workspace.js"
import { readinessPercent, stageJobs, stageLabels } from "./domain/stages.js"

let workspace = loadWorkspace()
let isEditing = false
let statusMessage = "Local-only workspace"
let errorMessage = ""

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

function setActiveProduct(productId) {
  const nextWorkspace = { ...workspace, activeProductId: productId }
  isEditing = false
  commitWorkspace(nextWorkspace, "Local-only workspace")
  render()
}

function editRoom() {
  isEditing = true
  errorMessage = ""
  render()
}

function cancelEdit() {
  isEditing = false
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
  } catch {
    errorMessage = "Could not save locally. Keep this editor open and try again."
  }

  render()
}

function resetDemo() {
  if (!window.confirm("Reset demo data? This will discard local edits in this browser.")) return

  workspace = resetWorkspace()
  isEditing = false
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

function bindEvents() {
  document.querySelectorAll("[data-product-id]").forEach((button) => {
    button.addEventListener("click", () => setActiveProduct(button.dataset.productId))
  })

  document.querySelector("[data-action='edit']")?.addEventListener("click", editRoom)
  document.querySelector("[data-action='export']")?.addEventListener("click", exportWorkspace)
  document.querySelector("[data-action='reset']")?.addEventListener("click", resetDemo)
  document.querySelectorAll("[data-action='cancel-edit']").forEach((button) => {
    button.addEventListener("click", cancelEdit)
  })
  document.querySelector("#room-editor")?.addEventListener("submit", saveRoom)
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
          <a class="nav__link active" href="#">Warroom</a>
          <a class="nav__link" href="#">Brief</a>
          <a class="nav__link" href="#">Decisions</a>
          <a class="nav__link" href="#">Docs</a>
          <a class="nav__link" href="#">Forge</a>
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
            <button class="primary-button" type="button" data-action="edit">Edit room</button>
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
      </main>
    </div>
  `

  bindEvents()
}

window.addEventListener("keydown", (event) => {
  if (event.key === "R" && event.shiftKey && event.metaKey) {
    workspace = resetWorkspace()
    isEditing = false
    statusMessage = "Demo data restored"
    errorMessage = ""
    render()
  }
})

render()
