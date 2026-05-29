import { loadWorkspace, resetWorkspace, saveWorkspace } from "./storage/workspace.js"
import { readinessPercent, stageJobs, stageLabels } from "./domain/stages.js"

let workspace = loadWorkspace()

function activeProduct() {
  return workspace.products.find((product) => product.id === workspace.activeProductId) ?? workspace.products[0]
}

function setActiveProduct(productId) {
  workspace = { ...workspace, activeProductId: productId }
  saveWorkspace(workspace)
  render()
}

function renderProductNav(product) {
  return workspace.products
    .map((item) => {
      const active = item.id === product.id ? " active" : ""
      return `
        <button class="product-nav__item${active}" data-product-id="${item.id}">
          <span>${item.name}</span>
          <small>${stageLabels[item.stage]}</small>
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
            <strong>${section.name}</strong>
            <span>${section.done}/${section.total}</span>
          </div>
          <div class="meter" aria-label="${section.name} readiness ${percent}%">
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
        <p>${action}</p>
      </li>
    `)
    .join("")
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
            <p class="eyebrow">${stageLabels[product.stage]} Mode</p>
            <h1>${product.name}</h1>
            <p>${product.status} · Target: ${product.targetDate}</p>
          </div>
          <div class="score">
            <span>${percent}%</span>
            <small>Launch readiness</small>
          </div>
        </header>

        <section class="focus-card">
          <p class="eyebrow">This Week's Launch Focus</p>
          <h2>${product.currentFocus}</h2>
          <p>${stageJobs[product.stage]}</p>
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
            <h3>${product.decisionNeeded}</h3>
            <div class="choice-row">
              <button>Decide now</button>
              <button class="secondary">Park it</button>
            </div>
          </article>

          <article class="panel risk">
            <p class="eyebrow">Top Risk</p>
            <h3>${product.topRisk}</h3>
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

  document.querySelectorAll("[data-product-id]").forEach((button) => {
    button.addEventListener("click", () => setActiveProduct(button.dataset.productId))
  })
}

window.addEventListener("keydown", (event) => {
  if (event.key === "R" && event.shiftKey && event.metaKey) {
    workspace = resetWorkspace()
    render()
  }
})

render()
