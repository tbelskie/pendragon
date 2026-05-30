# Beta Readiness Gate Mockups

These are implementation notes for the v0.5 Gate tab.

## Desktop

```text
Beta Readiness Gate                         41%
paid beta blocked                           Gate score
Writing Quest has 3 blockers before paid beta.

+-----------+-------+-------+------+-----------+
| 47%       | 67%   | 57%   | 29% | 1         |
| Overall   | Build | Trust | Docs| Unresolved|
+-----------+-------+-------+------+-----------+

Gate Criteria                         Next Moves
What must be true before paid beta?   Clear these first.

[BLOCKED] Critical launch docs        1. Confirm save/export behavior
2 critical docs assets still open.    2. Price early access at $19 or $29?
                                      3. Raise Trust readiness above 70%
[BLOCKED] Decision ledger             4. Clear build blockers
1 decision still needs chosen path.

[BLOCKED] Trust proof
1 docs asset blocked, including
trust-sensitive work.

[AT RISK] Build stability
Build readiness is 67%.
```

## Mobile

```text
Beta Readiness Gate
paid beta blocked

41%
Gate score

[metrics stack]
[criteria stack]
[next moves]
Open Docs / Open Decisions / Open Warroom
```

## Design Rules

- The gate verdict should be the first thing visible.
- Use compact metrics to make the judgment inspectable.
- Keep criteria cards scannable and sober.
- Put next moves beside the criteria on desktop and below them on mobile.
- Do not add optimistic language when blockers exist.

## Product Meaning

The Gate is Pendragon becoming opinionated.

It does not replace founder judgment. It prevents a founder from lying to themselves about launch readiness.
