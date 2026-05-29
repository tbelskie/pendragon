export const workspaceSeed = {
  activeProductId: "writing-quest",
  products: [
    {
      id: "writing-quest",
      name: "Writing Quest",
      stage: "beta",
      status: "Paid beta launch",
      targetDate: "October 2026",
      oneLiner: "A cozy offline writing app that makes drafting feel like booting up an old handheld adventure.",
      user: "Indie writers, hobbyists, and November writing challenge participants.",
      currentFocus: "Make the paid beta trustworthy.",
      decisionNeeded: "Price early access at $19 or $29?",
      topRisk: "Export and save trust are still the launch blockers.",
      nextActions: [
        "Finish Mac beta build",
        "Publish local-data promise",
        "Record 30-sec demo GIF"
      ],
      readiness: [
        { name: "Build", done: 6, total: 9 },
        { name: "Docs", done: 3, total: 7 },
        { name: "Launch", done: 2, total: 8 },
        { name: "Trust", done: 4, total: 7 },
        { name: "Revenue", done: 1, total: 5 }
      ]
    },
    {
      id: "dot-primer",
      name: "Dot Primer",
      stage: "growth",
      status: "Chrome extension relaunch",
      targetDate: "TBD",
      oneLiner: "A one-minute focus primer for people who work in the browser.",
      user: "Browser-based knowledge workers who need a lightweight focus ritual.",
      currentFocus: "Understand why retained users keep it installed.",
      decisionNeeded: "Is Dot a free trust-builder or a paid focus utility?",
      topRisk: "The product may be too small to monetize directly.",
      nextActions: [
        "Clean source-of-truth folder",
        "Review Chrome Store listing",
        "Add feedback path"
      ],
      readiness: [
        { name: "Build", done: 5, total: 7 },
        { name: "Docs", done: 2, total: 5 },
        { name: "Launch", done: 3, total: 6 },
        { name: "Trust", done: 3, total: 5 },
        { name: "Revenue", done: 0, total: 4 }
      ]
    },
    {
      id: "mockbizops",
      name: "MockBizOps",
      stage: "prototype",
      status: "Public demo relaunch",
      targetDate: "TBD",
      oneLiner: "Realistic fake business APIs for serious prototypes, demos, tutorials, and docs.",
      user: "Frontend developers, technical writers, tutorial creators, and AI app builders.",
      currentFocus: "Make one public API domain excellent again.",
      decisionNeeded: "Relaunch auto shop first or rebuild around SaaS/business ops?",
      topRisk: "Docs and routes have drifted.",
      nextActions: [
        "Fix seed scripts",
        "Restore API reference",
        "Deploy public demo"
      ],
      readiness: [
        { name: "Build", done: 4, total: 8 },
        { name: "Docs", done: 2, total: 8 },
        { name: "Launch", done: 1, total: 6 },
        { name: "Trust", done: 2, total: 5 },
        { name: "Revenue", done: 1, total: 5 }
      ]
    },
    {
      id: "vinegar",
      name: "Vinegar",
      stage: "prototype",
      status: "Validation sprint",
      targetDate: "TBD",
      oneLiner: "A browser extension that creates a mindful pause before impulse purchases.",
      user: "People who want to spend more intentionally without a judgmental finance app.",
      currentFocus: "Prove the pause feels helpful, not invasive.",
      decisionNeeded: "Should Vinegar be a free beta before any monetization?",
      topRisk: "Broad permissions and page injection create a trust hurdle.",
      nextActions: [
        "Fix breathing intervention bug",
        "Write permissions story",
        "Test intervention tone"
      ],
      readiness: [
        { name: "Build", done: 3, total: 7 },
        { name: "Docs", done: 1, total: 6 },
        { name: "Launch", done: 1, total: 6 },
        { name: "Trust", done: 1, total: 7 },
        { name: "Revenue", done: 0, total: 4 }
      ]
    }
  ]
}
