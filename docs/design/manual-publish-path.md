# Manual Publish Path

Manual Publish Path is the bridge between Forge output and a real static page.

It should feel like a launch checklist with a file path, not a hosting product.

## Layout

```text
Launch Share Package
...

Manual Publish Path
Hold before public publish                         [Download Publish Guide]
Use this as a private staging path until...

Static folder       Page file                       URL pattern
launch/writing...   launch/writing.../index.html    https://<github-user>...

1  Download HTML draft
2  Stage static file
3  Commit to static host
4  Confirm public URL
5  Wire CTA
6  Final QA
```

## Rules

- Do not pretend Pendragon can deploy yet.
- Keep the path static-host agnostic.
- Make GitHub Pages the mental model because the repo already uses it.
- Carry QA blockers forward.
- Make missing CTA painfully visible.
- Export a Markdown guide so the founder can keep the instructions outside Pendragon.

## Why This Exists

The founder's next question after generating a launch surface is:

> Fine, how do I actually put this somewhere?

Manual Publish Path answers that question without pulling the product into premature integration work.

The manual path also teaches Pendragon what should eventually be automated.
