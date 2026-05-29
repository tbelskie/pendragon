import { workspaceSeed } from "../data/seed.js"

const STORAGE_KEY = "pendragon.workspace.v1"

export function loadWorkspace() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return structuredClone(workspaceSeed)
    return JSON.parse(stored)
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
