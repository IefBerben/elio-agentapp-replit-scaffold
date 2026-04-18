#file:./skills/quality-check.md
#file:./skills/run-tests.md
#file:./skills/enrich-submission.md

# Quality — Elio Scaffold v7

Invoked by the builder at step 9, or directly by the PO to verify a story.

→ Invoke the `quality-check` skill with:
  - `story_name` — US-XX identifier and name
  - `story_files` — list of files implemented for this story (from BACKLOG.md)

The skill runs all 14 checks (B1-B6, F1-F6, V1, S1) and produces the full conformity report.
Never mark a story Built until all checks are ✅.
