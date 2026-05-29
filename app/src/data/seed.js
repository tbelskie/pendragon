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
      brief: {
        problem: "Writers want a focused drafting space, but most tools pull them back into the modern internet.",
        promise: "A charming offline-first writing quest that makes daily word count progress feel tangible.",
        pricingHypothesis: "$19 early access, with a $29 launch license if beta trust is strong.",
        primaryMilestone: "Paid Mac beta ready before the October writing-season runway.",
        strategicConstraint: "Do not ship anything that weakens save/export trust."
      },
      decisions: [
        {
          id: "decision-writing-quest-pricing",
          title: "Price early access at $19 or $29?",
          status: "open",
          context: "The beta needs enough revenue signal to matter without creating too much purchase friction.",
          options: ["$19 early access", "$29 launch license", "Free beta with paid launch"],
          chosenPath: "",
          revisitTrigger: "After the beta landing page and trust story are credible."
        }
      ],
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
      brief: {
        problem: "People working in the browser need a lightweight ritual to start focused work without adopting a heavy productivity system.",
        promise: "A tiny focus primer that helps users begin a deep work session in under a minute.",
        pricingHypothesis: "Keep free while testing retention; monetize only if users ask for deeper tracking or rituals.",
        primaryMilestone: "Understand why existing users keep it installed.",
        strategicConstraint: "Do not bloat the extension beyond its one-minute focus promise."
      },
      decisions: [
        {
          id: "decision-dot-monetization",
          title: "Is Dot a free trust-builder or a paid focus utility?",
          status: "open",
          context: "The extension has passive usage, but the paid value is not yet proven.",
          options: ["Keep it free", "Paid pro extension", "Use as portfolio proof"],
          chosenPath: "",
          revisitTrigger: "After adding a feedback path and reviewing Chrome Store conversion."
        }
      ],
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
      brief: {
        problem: "Builders need realistic fake business data, but most public fake APIs are novelty data or too shallow for serious demos.",
        promise: "Robust fake business APIs that make prototypes, tutorials, and docs feel like real software.",
        pricingHypothesis: "Free public tier with paid hosted datasets or premium vertical packs.",
        primaryMilestone: "Restore one excellent public API domain.",
        strategicConstraint: "Do not expand domains until one vertical is clean, documented, and deployed."
      },
      decisions: [
        {
          id: "decision-mockbizops-domain",
          title: "Relaunch auto shop first or rebuild around SaaS/business ops?",
          status: "open",
          context: "The old API worked, but the strongest market wedge may be practical SaaS and business operations data.",
          options: ["Restore auto shop", "Pivot to SaaS ops", "Ship both as separate packs"],
          chosenPath: "",
          revisitTrigger: "After a route/docs audit shows the fastest credible relaunch path."
        }
      ],
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
      brief: {
        problem: "Impulse shoppers need a pause at the moment of purchase, not another guilt-heavy budgeting app after the fact.",
        promise: "A respectful browser pause that helps people spend intentionally without shaming them.",
        pricingHypothesis: "Free beta first; paid mobile or companion features only after trust is proven.",
        primaryMilestone: "Validate that the pause feels helpful instead of invasive.",
        strategicConstraint: "Trust and permissions story must be clear before public launch."
      },
      decisions: [
        {
          id: "decision-vinegar-beta",
          title: "Should Vinegar be a free beta before any monetization?",
          status: "open",
          context: "The behavior-change promise depends on trust, and monetization too early may damage adoption.",
          options: ["Free beta", "Paid extension", "Donation/license model"],
          chosenPath: "",
          revisitTrigger: "After the intervention tone and permissions story are tested."
        }
      ],
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
