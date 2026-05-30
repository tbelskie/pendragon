# Evidence Inbox

The Evidence Inbox is the lean alternative to premature integrations.

## Layout

```text
Evidence Inbox
Collect launch proof without integration debt.

[total links] [Forge proof] [trust signals]

Evidence list
---------------------------------------------------------
[Repo] Writing Quest repo                  [Forge]
Source of truth for the desktop app...
Open link

[Doc] Writing Quest launch room            [Gate]
Current planning source for beta readiness...
Open link
---------------------------------------------------------

Add Evidence
[Title]
[Link]
[Type] [Attach to]
[What this proves]
[Add link]
```

## Rules

- Evidence must be a safe `http` or `https` link.
- Evidence should capture what the source proves, not merely where it lives.
- Forge only pulls evidence attached to Forge.
- Trust signal counts come from trust-sensitive evidence notes and titles.

## Why This Exists

This keeps Pendragon connector-ready without making the app responsible for credentials, sync jobs, or third-party API weirdness yet.

The future connector question becomes:

> Can this connector produce useful evidence records?

Not:

> Can we mirror an entire external tool?
