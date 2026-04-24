# Product — Elio Minutes

## Vision
An AI assistant in 2 steps that helps consultants and managers turn raw meeting transcripts into clear, structured and optionally bilingual minutes, by first extracting a structured view of key information, decisions and actions, then generating polished minutes and ready-to-send emails at the chosen synthesis level.

## Users
**Primary:** Consultants, engagement managers, project leaders  
**Context:** Just after a client or internal meeting, with a Teams (or similar) transcript available, using a browser on laptop or tablet  
**Frequency:** Several times per week for important meetings (steering committees, project reviews, key workshops)

## Problem solved
Writing proper minutes often takes 30–60 minutes, so consultants frequently skip them. This leads to forgotten decisions and actions, misalignment between client and team, and loss of traceability across meetings. Elio Minutes cuts the production time to under 10 minutes per meeting and guarantees that key information, decisions and actions are captured and shareable, including in French and English when needed.

## Core workflow
1. The user pastes or uploads the meeting transcript and selects one synthesis level (Exec summary / RIDA / High fidelity) and one or more output languages (FR, EN, or both).
2. The agent analyses the transcript and returns a structured “application view” in the meeting language with three editable sections: Key information, Decisions, Actions (with owners and due dates where possible).
3. The user reviews this structured view, editing, adding or deleting items until it accurately reflects the meeting.
4. The agent generates minutes at the selected synthesis level and language(s), plus ready-to-send email text, all aligned with the validated structured view.
5. The user performs a quick final review, copies the email into their mail client and/or downloads the minutes as a DOCX file for archiving and sharing.

## Output format
- **Step 1 – Structured view (on screen):**  
  Structured object rendered as three editable lists:
  - `key_infos[]`: items `{title, description}`
  - `decisions[]`: items `{title, description}`
  - `actions[]`: items `{title, description, owner, due_date, comments?}`  
  All content is in the language of the meeting transcript.

- **Step 2 – Final outputs (on screen + DOCX):**  
  For each selected output language (FR, EN):
  - `minutes`:
    - **Exec summary:** 1-page max, 5–10 bullet points covering key information, decisions and actions.
    - **RIDA:** sections “Information”, “Decisions”, “Actions” (Risks may be added later), populated from the structured view.
    - **High fidelity:** detailed narrative following the meeting chronology, explicitly incorporating all validated decisions and actions.
  - `email`: `{subject, body}` including meeting context, condensed key information, and a concise list of decisions and actions.  
  - A downloadable `.docx` file containing the generated minutes for the chosen language(s), with languages clearly separated.

## Constraints
- **Language:**
  - UI available in FR and EN.
  - Meeting transcripts supported in FR and EN.
  - Outputs can be generated in FR, EN, or both (FR+EN) from a single-language transcript.
- **Input:**
  - Text field to paste a raw transcript.
  - Upload of one or more files (`.pdf`, `.docx`, `.txt`, `.md`) containing the transcript (and, in future stories, possibly previous minutes) for the meeting.
  - Optional future upload of audio files (`.mp3`, `.wav`, `.m4a`) for transcription (as a later story).
  - No automatic retrieval from Teams or other tools.
- **Output:**
  - On-screen structured view, minutes and email text.
  - Downloadable DOCX for minutes.
  - No direct email sending, no external integrations.
- **Other constraints:**
  - Single-page, single-user, anonymous session; no persistent history between sessions.
  - Each run must complete within a few minutes; no long-running background jobs.

## Success criteria
- Within a pilot group, >70% of important client meetings generate minutes via Elio Minutes within 24 hours.
- Users report saving at least 20–30 minutes per set of minutes compared to manual drafting.
- ≥80% of pilot users rate the generated minutes as “ready to send after <5 minutes of review”.
- Managers perceive a clear reduction in forgotten decisions/actions (qualitative feedback or short survey).