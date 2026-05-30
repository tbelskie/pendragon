# Launch Surface History

Launch Surface History is a compact artifact trail inside Forge.

It should feel like a launch log, not a source-control interface.

## Layout

```text
Manual Publish Path
...

Launch Surface History                            [Save Snapshot]
Keep a trail of the launch surface as it changes.
No previous snapshot yet.

QA score        Blockers        Proof links       Docs ready
57%             3               1                 2/7
0% vs latest    0 vs latest     0 vs latest       0 vs latest

Latest snapshots
[Empty] No saved launch surface snapshots yet.
```

After saving:

```text
Launch Surface History                            [Save Snapshot]
The current surface is roughly unchanged...

QA score        Blockers        Proof links       Docs ready
57%             3               1                 2/7
0% vs latest    0 vs latest     0 vs latest       0 vs latest

Latest
Not ready to share / 57%
May 30, 1:58 PM - Paid beta page - launch/writing-quest/
CTA, Critical docs, Readiness gate
```

## Snapshot Contents

Each snapshot stores:

- timestamp
- surface type
- target date
- one-liner
- offer
- CTA label and readiness
- QA verdict, level, score, and blockers
- gate verdict and score
- proof link count
- docs ready count
- publish folder

## Rules

- Keep snapshots local-only.
- Keep only the ten newest snapshots.
- Do not include generated HTML blobs.
- Do not include full share package text.
- Compare current generated state against the latest saved snapshot.

## Why This Exists

Launch pages mutate under pressure.

History helps the founder see whether the launch story is actually improving, and it creates a small artifact trail for future retrospectives.
