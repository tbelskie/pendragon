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
      docsAssets: [
        {
          id: "writing-quest-positioning",
          title: "Product positioning brief",
          status: "ready",
          priority: "High",
          purpose: "Anchor the launch story around cozy offline drafting, not generic productivity.",
          nextStep: "Keep the promise tight while the beta page takes shape.",
          evidence: "Product brief"
        },
        {
          id: "writing-quest-beta-page",
          title: "Beta landing page",
          status: "drafting",
          priority: "Critical",
          purpose: "Convert interested writers into paid beta users before the October runway.",
          nextStep: "Add price, demo GIF, supported platforms, and beta expectations.",
          evidence: ""
        },
        {
          id: "writing-quest-save-export",
          title: "Save and export trust page",
          status: "blocked",
          priority: "Critical",
          purpose: "Explain where writing lives, how export works, and what happens if the app closes.",
          nextStep: "Confirm the final save/export behavior from the app before publishing claims.",
          evidence: ""
        },
        {
          id: "writing-quest-local-data",
          title: "Local data promise",
          status: "drafting",
          priority: "High",
          purpose: "Make the offline-first privacy posture explicit and reassuring.",
          nextStep: "Write the plain-English data handling promise.",
          evidence: ""
        },
        {
          id: "writing-quest-beta-instructions",
          title: "Beta install instructions",
          status: "missing",
          priority: "High",
          purpose: "Help non-technical writers install, launch, and trust the Mac beta.",
          nextStep: "Capture the install flow after the beta build is stable.",
          evidence: ""
        },
        {
          id: "writing-quest-faq",
          title: "Writer FAQ",
          status: "missing",
          priority: "Medium",
          purpose: "Answer purchase, license, platform, offline, and export questions before support load appears.",
          nextStep: "Draft from the landing page objections.",
          evidence: ""
        },
        {
          id: "writing-quest-support",
          title: "Support and feedback path",
          status: "ready",
          priority: "Medium",
          purpose: "Give beta users a clear place to send bugs, fear, delight, and confusion.",
          nextStep: "Connect the support promise to the beta page.",
          evidence: "Support/contact decision"
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
      docsAssets: [
        {
          id: "dot-primer-store-listing",
          title: "Chrome Store listing",
          status: "drafting",
          priority: "Critical",
          purpose: "Explain the one-minute focus ritual clearly enough to improve conversion.",
          nextStep: "Rewrite screenshots and benefits around retained-user behavior.",
          evidence: ""
        },
        {
          id: "dot-primer-feedback",
          title: "Feedback path",
          status: "missing",
          priority: "High",
          purpose: "Learn why existing users keep Dot installed.",
          nextStep: "Add a low-friction feedback link from the extension and listing.",
          evidence: ""
        },
        {
          id: "dot-primer-privacy",
          title: "Privacy and permissions note",
          status: "drafting",
          priority: "High",
          purpose: "Make the extension feel safe despite living inside the browser.",
          nextStep: "Document what Dot does and does not read.",
          evidence: ""
        },
        {
          id: "dot-primer-onboarding",
          title: "First-run onboarding copy",
          status: "missing",
          priority: "Medium",
          purpose: "Help users understand the ritual without turning Dot into a heavy system.",
          nextStep: "Draft the first sixty seconds of product copy.",
          evidence: ""
        },
        {
          id: "dot-primer-changelog",
          title: "Relaunch changelog",
          status: "missing",
          priority: "Medium",
          purpose: "Show active care before relaunching a dormant extension.",
          nextStep: "Capture the first relaunch fixes.",
          evidence: ""
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
      docsAssets: [
        {
          id: "mockbizops-api-reference",
          title: "API reference",
          status: "blocked",
          priority: "Critical",
          purpose: "Make the public demo usable without reading source code.",
          nextStep: "Audit active routes before documenting examples.",
          evidence: ""
        },
        {
          id: "mockbizops-dataset-guide",
          title: "Dataset guide",
          status: "drafting",
          priority: "High",
          purpose: "Explain why the data feels realistic and what scenarios it supports.",
          nextStep: "Choose the first vertical and document entities.",
          evidence: ""
        },
        {
          id: "mockbizops-quickstart",
          title: "Quickstart tutorial",
          status: "missing",
          priority: "High",
          purpose: "Help builders ship a convincing prototype in minutes.",
          nextStep: "Write one frontend demo path after the API domain is chosen.",
          evidence: ""
        },
        {
          id: "mockbizops-hosting-status",
          title: "Hosting and status note",
          status: "missing",
          priority: "Medium",
          purpose: "Set expectations for uptime, rate limits, and public demo reliability.",
          nextStep: "Confirm deployment target.",
          evidence: ""
        },
        {
          id: "mockbizops-pricing",
          title: "Premium packs hypothesis",
          status: "ready",
          priority: "Medium",
          purpose: "Keep monetization tied to vertical packs instead of a vague API subscription.",
          nextStep: "Revisit after one domain is clean.",
          evidence: "Product brief"
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
      docsAssets: [
        {
          id: "vinegar-permissions",
          title: "Permissions story",
          status: "blocked",
          priority: "Critical",
          purpose: "Explain exactly why the extension needs page access and how it behaves.",
          nextStep: "Confirm the narrowest permission model before public claims.",
          evidence: ""
        },
        {
          id: "vinegar-tone-guide",
          title: "Intervention tone guide",
          status: "drafting",
          priority: "High",
          purpose: "Keep the pause helpful and nonjudgmental.",
          nextStep: "Write example copy for the checkout pause.",
          evidence: ""
        },
        {
          id: "vinegar-beta-page",
          title: "Beta landing page",
          status: "missing",
          priority: "High",
          purpose: "Frame Vinegar as mindful spending support, not punishment.",
          nextStep: "Draft after the intervention bug is fixed.",
          evidence: ""
        },
        {
          id: "vinegar-privacy",
          title: "Privacy note",
          status: "missing",
          priority: "High",
          purpose: "Make trust legible before asking users to install a shopping intervention.",
          nextStep: "Document data collection and storage choices.",
          evidence: ""
        },
        {
          id: "vinegar-feedback",
          title: "Beta feedback path",
          status: "missing",
          priority: "Medium",
          purpose: "Learn whether the pause feels useful or annoying.",
          nextStep: "Add one feedback route before public beta.",
          evidence: ""
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
    },
    {
      id: "pendragon",
      name: "Pendragon",
      stage: "prototype",
      status: "Internal beta build",
      targetDate: "Alongside Writing Quest beta",
      oneLiner: "A premium launch room for solo founders turning small software products into documented, sellable releases.",
      user: "Solo software founders with a working prototype and no reliable launch operating system.",
      currentFocus: "Make the launch room useful enough to run Writing Quest.",
      decisionNeeded: "When is Pendragon ready for outside founder beta?",
      topRisk: "Building meta-infrastructure instead of shipping revenue-generating products.",
      brief: {
        problem: "Solo founders can build products, but launch work splinters across notes, repos, docs, pricing guesses, and unresolved decisions.",
        promise: "Pendragon turns product context into a calm launch room: focus, decisions, docs, risks, readiness, and eventually generated launch assets.",
        pricingHypothesis: "Free internal dogfood first; paid founder beta only after Writing Quest proves the workflow creates launch momentum.",
        primaryMilestone: "Run Writing Quest beta planning inside Pendragon without falling back to scattered Markdown.",
        strategicConstraint: "Writing Quest remains the primary proof object; Pendragon work must make that launch easier."
      },
      decisions: [
        {
          id: "decision-pendragon-beta-readiness",
          title: "When is Pendragon ready for outside founder beta?",
          status: "open",
          context: "Pendragon should not invite outside founders until it proves useful on Writing Quest and at least one secondary portfolio product.",
          options: ["After Writing Quest paid beta", "After Docs tracker ships", "After Forge can generate a first launch site"],
          chosenPath: "",
          revisitTrigger: "When Writing Quest can be planned, documented, and launched from the app without reverting to the notebook."
        }
      ],
      docsAssets: [
        {
          id: "pendragon-positioning",
          title: "Founder positioning brief",
          status: "ready",
          priority: "High",
          purpose: "Keep Pendragon pointed at solo founders with real launch work.",
          nextStep: "Refine after Writing Quest dogfood proves the workflow.",
          evidence: "Architecture docs"
        },
        {
          id: "pendragon-beta-readiness",
          title: "Outside beta readiness criteria",
          status: "drafting",
          priority: "Critical",
          purpose: "Prevent inviting founders before the product creates launch momentum.",
          nextStep: "Define the readiness threshold from Writing Quest usage.",
          evidence: ""
        },
        {
          id: "pendragon-writing-quest-case",
          title: "Writing Quest dogfood case study",
          status: "missing",
          priority: "Critical",
          purpose: "Turn internal launch work into Pendragon proof.",
          nextStep: "Capture before/after launch artifacts as the beta comes together.",
          evidence: ""
        },
        {
          id: "pendragon-docs-tracker",
          title: "Docs tracker product note",
          status: "drafting",
          priority: "High",
          purpose: "Explain why docs readiness is a launch primitive, not a content chore.",
          nextStep: "Publish v0.4 product plan and design note.",
          evidence: ""
        },
        {
          id: "pendragon-forge-spec",
          title: "Forge generation spec",
          status: "missing",
          priority: "Medium",
          purpose: "Define what Build Launch Site eventually produces.",
          nextStep: "Wait until the docs tracker proves the asset model.",
          evidence: ""
        }
      ],
      nextActions: [
        "Dogfood Writing Quest launch room",
        "Add docs asset tracker",
        "Define outside beta readiness"
      ],
      readiness: [
        { name: "Build", done: 4, total: 9 },
        { name: "Docs", done: 4, total: 8 },
        { name: "Launch", done: 1, total: 8 },
        { name: "Trust", done: 2, total: 7 },
        { name: "Revenue", done: 0, total: 5 }
      ]
    }
  ]
}
