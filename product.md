# Product — Consulting Assistant

## Vision

A two-step AI agent that helps Onepoint consultants structure any subject quickly.
The consultant submits a topic or question plus optional context; the agent produces
a structured analysis (summary + key points), which the consultant can edit before
expanding into concrete recommendations and next steps.

## Users

**Primary:** Onepoint consultants (all levels)
**Context:** Preparing client meetings, structuring first-pass research, framing a delivery
**Frequency:** Daily, on-demand

## Problem solved

Consultants spend 20–40 minutes structuring a first-pass analysis of any new topic.
This agent reduces that to under 2 minutes by producing a bilingual, structured output
they can edit directly and present to clients.

## Core workflow

1. Consultant enters a topic or question (required) and optional context
2. Agent generates a summary and 3–5 key points — Step 1
3. Consultant reviews and edits the key points if needed
4. Agent expands the edited key points into recommendations, next steps, and a conclusion — Step 2
5. Consultant uses the output in a presentation or document

## Output format

Structured JSON displayed as:
- **Step 1:** summary card + editable key points list
- **Step 2:** recommendations list + next steps list + conclusion paragraph

## Constraints

- Bilingual: French and English (user selects language via toggle)
- No file upload in MVP
- Output stays on screen — no export in MVP
- Results must stream progressively with visible progress

## Platform fit

Standalone Agent App for the Elio marketplace.
Backend logic is the deliverable; UI will be adapted by the Elio team for production integration.

## Success criteria

- Step 1 completes in under 15 seconds
- Step 2 completes in under 20 seconds
- Key points from Step 1 are editable by the user before Step 2 runs
- App works correctly in both French and English
- All platform conformity checks pass (B1–B10, F1–F10, I1–I3)
