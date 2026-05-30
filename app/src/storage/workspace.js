import { workspaceSeed } from "../data/seed.js"

const STORAGE_KEY = "pendragon.workspace.v1"

function mergeItemsById(seedItems = [], storedItems = []) {
  const storedById = new Map(storedItems.map((item) => [item.id, item]))
  const mergedSeedItems = seedItems.map((seedItem) => ({
    ...seedItem,
    ...(storedById.get(seedItem.id) ?? {})
  }))
  const extraItems = storedItems.filter((item) => !seedItems.some((seedItem) => seedItem.id === item.id))

  return [...mergedSeedItems, ...extraItems]
}

function mergeProduct(seedProduct, storedProduct = {}) {
  return {
    ...seedProduct,
    ...storedProduct,
    brief: {
      ...seedProduct.brief,
      ...(storedProduct.brief ?? {})
    },
    surfaceSettings: {
      ...(seedProduct.surfaceSettings ?? {}),
      ...(storedProduct.surfaceSettings ?? {})
    },
    setupProfile: {
      ...(seedProduct.setupProfile ?? {}),
      ...(storedProduct.setupProfile ?? {})
    },
    decisions: Array.isArray(storedProduct.decisions)
      ? storedProduct.decisions
      : structuredClone(seedProduct.decisions ?? []),
    docsAssets: mergeItemsById(
      structuredClone(seedProduct.docsAssets ?? []),
      Array.isArray(storedProduct.docsAssets) ? storedProduct.docsAssets : []
    ).map((asset) => ({
      proofLink: "",
      ...asset
    })),
    evidenceSources: mergeItemsById(
      structuredClone(seedProduct.evidenceSources ?? []),
      Array.isArray(storedProduct.evidenceSources) ? storedProduct.evidenceSources : []
    ).map((source) => ({
      attachedTo: "forge",
      note: "",
      type: "doc",
      url: "",
      ...source
    })),
    launchSnapshots: Array.isArray(storedProduct.launchSnapshots)
      ? storedProduct.launchSnapshots
      : structuredClone(seedProduct.launchSnapshots ?? [])
  }
}

export function normalizeWorkspace(workspace) {
  const storedProducts = Array.isArray(workspace?.products) ? workspace.products : []
  const products = workspaceSeed.products.map((seedProduct) => {
    const storedProduct = storedProducts.find((product) => product.id === seedProduct.id)
    return mergeProduct(seedProduct, storedProduct)
  })
  const extraProducts = storedProducts
    .filter((product) => !products.some((seedProduct) => seedProduct.id === product.id))
    .map((product) => mergeProduct({
      ...product,
      brief: {},
      decisions: []
    }, product))

  return {
    ...workspaceSeed,
    ...workspace,
    activeProductId: workspace?.activeProductId ?? workspaceSeed.activeProductId,
    products: [...products, ...extraProducts]
  }
}

export function loadWorkspace() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return structuredClone(workspaceSeed)
    return normalizeWorkspace(JSON.parse(stored))
  } catch {
    return structuredClone(workspaceSeed)
  }
}

export function saveWorkspace(workspace) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
}

export function resetWorkspace() {
  const workspace = structuredClone(workspaceSeed)
  saveWorkspace(workspace)
  return workspace
}
