# Agent guidance

- Before exploring the codebase, read [domain guidance](docs/agents/domain.md).
- When implementing or reviewing code, read [coding standards](CODING_STANDARDS.md).
- For tasks that change code, use a feature branch. Commit and push the completed work to that branch, merge it into `main` with a merge commit, then push `main`. Verify both remote branches contain the intended commits before marking the task complete. If any step is blocked, report the task as incomplete and explain what remains.
- Before Android builds or tests, check the [local toolchain setup](README.md#local-setup), including the existing JDK location.
- When creating or updating tickets, read [issue tracker conventions](docs/agents/issue-tracker.md).
- When assigning triage status, read [triage labels](docs/agents/triage-labels.md).

## Task completion

- Continue working until the requested outcome and its verification are complete.
- Do not end a turn merely because work remains, a step is inconvenient, or additional tools, time, or investigation are needed.
- Pause only when a required action needs user input or approval, or when a concrete blocker prevents further progress. First complete all independent work, then state the blocker, what was attempted, and exactly what remains.
- Never describe work as complete until all requested checks and repository workflow steps have succeeded. Report any unfinished work explicitly.
