---
# ─── Elio deployment manifest ─────────────────────────────────────────────
# Single source of truth for packaging + platform deployment.
# Filled in by the `package-agent` skill after the app is built.
# Reviewed and edited by the consultant; consumed by Elio deploy automation.
# ──────────────────────────────────────────────────────────────────────────

# Identity
agent_id: ""              # kebab-case, must match AGENTS_MAP prefix, e.g. "meeting-minutes"
version: "0.1.0"          # semver — bumped by consultant on each submission
scaffold_version: "9.9.0" # scaffold this app was built on (auto-filled from SCAFFOLD_VERSION)

display_name:
  fr: ""
  en: ""

description:
  fr: ""                  # one-line, shown in the Elio marketplace card
  en: ""

author:
  name: ""
  email: ""

# Backend endpoints — one entry per step function registered in AGENTS_MAP.
# `key` must match back/main.py AGENTS_MAP, `module` is the dotted path.
endpoints:
  - key: ""               # e.g. "meeting-minutes-step-1"
    module: ""            # e.g. "agents.meeting_minutes.step1_extract"
    function: ""          # e.g. "meeting_minutes_step_1_stream"
    step: 1

# Runtime dependencies
models:                   # LLM deployments used by get_llm()
  - gpt-5-chat
features:
  file_upload:
    enabled: false
    accepted_types: []    # e.g. ["pdf", "docx", "pptx", "xlsx", "audio/mp3"]
  doc_generation:
    enabled: false
    formats: []           # e.g. ["docx", "pptx"]
  bilingual: true         # fr + en — required by platform
  audio_transcription: false

# Frontend wiring
frontend:
  page: ""                # e.g. "front/src/pages/MeetingMinutesAgentAppPage.tsx"
  store: ""               # e.g. "front/src/stores/agent-apps/meetingMinutesStore.ts"
  route: ""               # e.g. "/apps/meeting-minutes"
  i18n_namespace: ""      # e.g. "meetingMinutes" — top-level key in fr.json / en.json

# Shared DTOs added to packages/shared-types/src/index.ts
shared_types:
  - ""                    # e.g. "MeetingMinutesInput"
  - ""                    # e.g. "MeetingMinutesOutput"

# Package contents — the delta to copy into the deploy bundle.
# Globs relative to repo root. Auto-populated by the package script;
# edit if you need to include extra assets (fixtures, sample files).
package_includes:
  - "back/agents/{agent_id_snake}/**"
  - "front/src/pages/{AgentIdPascal}AgentAppPage.tsx"
  - "front/src/stores/agent-apps/{agentIdCamel}Store.ts"
  - "packages/shared-types/src/index.ts"   # diff-extracted at deploy time
  - "front/src/i18n/locales/fr.json"       # diff-extracted at deploy time
  - "front/src/i18n/locales/en.json"       # diff-extracted at deploy time
  - "back/main.py"                         # diff-extracted at deploy time (AGENTS_MAP entry)

# Platform submission metadata
submission:
  acceptance_criteria_source: "backlog.md"
  screenshots: []         # relative paths under .agents/submission/
  demo_video: ""          # optional
---

# {display_name.fr}

<!--
Free-form notes for the Elio review team. The YAML block above is the
machine-readable contract; this section is for humans.
-->

## Purpose
<!-- One paragraph — what problem this agent solves, for whom. -->

## Workflow
<!-- Bullet list of the steps the user takes in the UI. -->

## Known limitations
<!-- Anything the review team should know: data the agent can't handle,
     models it's tuned for, latency expectations, etc. -->
