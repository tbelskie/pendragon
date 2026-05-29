export const stageLabels = {
  idea: "Idea",
  prototype: "Prototype",
  beta: "Beta",
  launch: "Launch",
  growth: "Growth"
}

export const stageJobs = {
  idea: "Clarify the product and define a validation sprint.",
  prototype: "Prevent shapeless building and protect the smallest lovable v1.",
  beta: "Make the product trustworthy enough for real users.",
  launch: "Turn the product into a sellable launch.",
  growth: "Turn launch signal into a repeatable learning loop."
}

export function readinessPercent(product) {
  const totals = product.readiness.reduce(
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
