# Issue tracker: Local Markdown

Issues and specs live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- Spec: `.scratch/<feature-slug>/spec.md`.
- Tickets: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`,
  numbered from `01`, one file per ticket.
- Record triage state in a `Status:` line near the top.
  Use the role strings in `triage-labels.md`.
- Append conversation under a `## Comments` heading.

## Publishing and reading

When a skill says “publish to the issue tracker,” create a file
at the appropriate spec or ticket path above.

When a skill says “fetch the relevant ticket,” read the referenced
file. Resolve ticket numbers within the relevant feature directory.

## Wayfinding operations

- Map: `.scratch/<effort>/map.md`, containing Notes,
  Decisions-so-far, and Fog.
- Child ticket: `.scratch/<effort>/issues/NN-<slug>.md`.
  Record its type in `Type:`: research, prototype, grilling, or task.
- Blocking: list ticket numbers in `Blocked by: NN, NN`.
  A ticket is unblocked when every listed blocker is resolved.
- Frontier: select the first ticket by number that is open,
  unblocked, and unclaimed.
- Claim: set `Status: claimed` and save before working.
- Resolve: append the answer under `## Answer`, set
  `Status: resolved`, and add a summary and link to the map’s
  Decisions-so-far.

Wayfinding uses claimed/resolved as lifecycle statuses; ordinary
triage uses the roles in `triage-labels.md`.
