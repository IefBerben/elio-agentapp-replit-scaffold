# Backlog — Elio Minutes
> Written by the Value Office (PM). MoSCoW-prioritized. The Agent PO in the scaffold picks up stories in priority order, refines Should / Could acceptance criteria when promoting them to Must, and challenges scope creep. **Every story below carries a `Status:` checkbox — the Agent Builder reads the first unchecked Must Have, builds only that story, ticks the box, and stops.** This backlog is the plan and the progress ledger in one file. (The scaffold is delivered to consultants as a zip, not a git repo — the `[x]` tick is the ledger, nothing more.)

## Must Have — ship first

### US-01 — Import transcript and choose output configuration
**Status:** [ ] not started  
**Priority:** Must Have  

**As a** consultant or engagement manager  
**I want** to paste or upload a meeting transcript and choose one synthesis level and one or more output languages  
**So that** I can launch minutes generation tailored to my needs without complex setup  

**Acceptance criteria:**
- The user can paste a raw transcript into a text field or upload a transcript file in `.docx`, `.pdf`, `.txt` or `.md` format.
- Before starting analysis, the user must select exactly one synthesis level: Exec summary, RIDA or High fidelity.
- Before starting analysis, the user must select at least one output language: FR, EN or FR+EN.
- If the transcript is missing, or no synthesis level or output language is selected, a clear message explains what is missing and prevents analysis from starting.

**Out of scope:**
- Automatically fetching transcripts from Teams, Outlook, SharePoint or any other system.
- Supporting meeting or output languages other than French and English.

**Notes for the Builder:**
- Keep the entry screen simple: a text area for pasting, a file upload control, and two selectors (synthesis level and output language(s)); no additional configuration in v1.

---

### US-02 — Structured extraction of Key information / Decisions / Actions [PM-proposed]
**Status:** [ ] not started  
**Priority:** Must Have  

**As a** consultant  
**I want** the agent to turn the transcript into a structured view of key information, decisions and actions  
**So that** I immediately see what must be validated and followed up without re-reading the full transcript  

**Acceptance criteria:**
- After launching step 1, the agent displays three separate sections labelled “Key information”, “Decisions” and “Actions”.
- Each section contains a list of items automatically extracted from the transcript; no narrative minutes text is shown at this stage.
- Each Action item includes at least a description, an Owner field and a Due date field (prefilled when explicit in the transcript, otherwise empty).
- Each Decision item includes at least a clear decision description; when people involved are explicit in the transcript, they are reflected in the description.
- All labels and item content in the structured view are presented in the main language of the meeting transcript.

**Out of scope:**
- Perfect and exhaustive detection of owners and due dates; when uncertain, fields may remain empty for manual completion.
- Any generation of full minutes text or emails in step 1.

**Notes for the Builder:**
- Present the three lists in a compact layout so that long meetings remain readable on a single page (scrolling allowed but no complex navigation).

**PM rationale:** Forces decisions and actions to be explicit before writing minutes, directly tackling the “forgotten actions and decisions” pain.

---

### US-03 — Edit, add and delete Key information / Decisions / Actions
**Status:** [ ] not started  
**Priority:** Must Have  

**As a** consultant  
**I want** to modify, add or remove the proposed key information, decisions and actions  
**So that** the structured view exactly reflects what was actually agreed in the meeting  

**Acceptance criteria:**
- The user can edit the text of any Key information, Decision or Action item directly inside the structured view.
- The user can delete any item in any section; deleted items disappear from the view and are not used in later generation.
- The user can add new items in each section (Key information, Decisions, Actions); Actions can be created with description, Owner and Due date fields.
- Once the user is satisfied with the structured view, there is a clear action to move to the generation step; the next step uses the edited view as the single source of truth.

**Out of scope:**
- Saving the structured view beyond the current browser session (closing or refreshing the page loses the data).
- Real-time co-editing by multiple users on the same structured view.

**Notes for the Builder:**
- Make editing as lightweight as possible (inline edits, add/delete in place), without modal pop-ups or multi-page flows.

---

### US-04 — Generate minutes and email from the validated view and chosen languages [PM-proposed]
**Status:** [ ] not started  
**Priority:** Must Have  

**As a** consultant  
**I want** to generate minutes and ready-to-send emails, in the selected languages, based on the validated structured view  
**So that** I can quickly share professional, coherent outputs without manual drafting  

**Acceptance criteria:**
- From the validated structured view, the agent generates minutes in the selected synthesis level (Exec summary, RIDA or High fidelity) for each chosen output language (FR, EN or FR+EN).
- For Exec summary, the minutes fit on approximately one page and contain 5–10 bullet points covering key information, decisions and actions.
- For RIDA, the minutes contain at least “Information”, “Decisions” and “Actions” sections and reuse the items from the structured view; a “Risks” section is not required in v1.
- For High fidelity, the minutes follow the meeting chronology in narrative form and explicitly incorporate all validated decisions and actions.
- All Decisions and Actions present in the structured view appear explicitly in each minutes document, in every generated language.
- For each output language, the agent generates an editable ready-to-send email (subject + body) summarising context, key information, decisions and actions.
- When FR+EN is selected, minutes and emails are generated in both languages and are clearly separated on screen (for example: FR block followed by EN block).

**Out of scope:**
- Sending emails directly to participants or distribution lists.
- Generating minutes or emails in languages other than French and English.

**Notes for the Builder:**
- Clearly separate on screen the different outputs (by language and synthesis level) so users can easily review, copy and, if needed, lightly edit them.

**PM rationale:** Delivers the core promise: from structured content to shareable, bilingual-ready outputs without manual writing.

---

### US-05 — Download minutes as DOCX [PM-proposed]
**Status:** [ ] not started  
**Priority:** Must Have  

**As a** consultant  
**I want** to download a DOCX file containing the generated minutes  
**So that** I can archive, annotate or share the minutes in the formats expected by clients  

**Acceptance criteria:**
- From the results screen, the user can trigger a download of a `.docx` file containing the generated minutes.
- The DOCX includes the full minutes content for each selected output language (FR, EN or both) with languages clearly separated (e.g. FR section then EN section).
- The DOCX opens without errors in common office suites (e.g. Microsoft Word, LibreOffice).
- The DOCX focuses on the minutes text; it does not include the internal structured view or any UI-only elements.

**Out of scope:**
- Export in other formats (PDF, PPTX, etc.).
- Advanced branding or templating (logos, corporate headers/footers, client-specific styles).

**Notes for the Builder:**
- Keep document structure straightforward to minimise client-side formatting issues and to ease potential later reuse of the minutes.

**PM rationale:** Many clients expect a Word file; this export makes the agent usable in real project workflows from day one.

---

## Should Have — next, if time allows

### US-06 — Configure tone and length of the minutes [PM-proposed]
**Status:** [ ] not started  
**Priority:** Should Have  

**As a** consultant  
**I want** to choose the length and tone of the minutes (very short / standard / detailed, formal / neutral)  
**So that** the minutes better match the expectations of different audiences (steering committee, project team, CxO sponsor, etc.)  

**Hint on acceptance criteria:**
- When different tone/length options are selected, generated minutes visibly differ in volume (amount of detail, number of paragraphs) and style (more or less formal wording) while still covering all validated decisions and actions.

**Notes for the Builder:**
- Offer a small, clear set of tone/length options so configuration remains lightweight and does not clutter the main flow.

**PM rationale:** Adapting tone and volume by audience significantly increases perceived relevance for managers and clients.

---

### US-07 — Adapt style to meeting type / audience [PM-proposed]
**Status:** [ ] not started  
**Priority:** Should Have  

**As a** consultant  
**I want** to indicate the meeting type (e.g. steering committee, project review, workshop, 1:1)  
**So that** the structure and style of minutes and emails are aligned with expectations for that kind of meeting  

**Hint on acceptance criteria:**
- When the user selects a meeting type from a short list (e.g. steering committee, project committee, workshop, weekly check-in), the structure and wording of minutes and email change in recognisable ways tailored to that context.

**Notes for the Builder:**
- Start with a limited set of high-frequency meeting types; keep it easy to extend later if needed.

**PM rationale:** Adds a “tailored” feel to outputs for minimal configuration effort, supporting wider adoption across practices.

---

### US-08 — Quality check of Actions before generation [PM-proposed]
**Status:** [ ] not started  
**Priority:** Should Have  

**As a** consultant  
**I want** the agent to highlight incomplete or ambiguous Actions before generating the minutes  
**So that** I avoid sending minutes with vague follow-ups or missing owners/due dates  

**Hint on acceptance criteria:**
- Before or during generation, Actions with missing owner or due date, or with obviously vague wording (e.g. “to be confirmed”), are clearly flagged so the user can quickly review and, if needed, correct them; the user can still proceed to generation after reviewing the warnings.

**Notes for the Builder:**
- Keep this as a lightweight checklist or visual highlighting on the existing structured view, without adding extra steps to the main flow.

**PM rationale:** Reinforces the core value of “no forgotten actions” by nudging users to clean up unclear Actions before sending minutes.

---

## Could Have — nice if easy

### US-09 — Add a Risks section for full RIDA [PM-proposed]
**Status:** [ ] not started  
**Priority:** Could Have  

**As a** consultant  
**I want** to have a “Risks” section in the structured view and in RIDA-level minutes  
**So that** I can produce full RIDA minutes (Risks, Information, Decisions, Actions) when required by project governance  

**PM rationale:** Completes the familiar RIDA pattern while reusing the same structuring approach as for information, decisions and actions.

---

### US-10 — Suggest an agenda for the next meeting [PM-proposed]
**Status:** [ ] not started  
**Priority:** Could Have  

**As a** manager or project lead  
**I want** the agent to suggest an agenda for the next meeting based on current decisions and actions  
**So that** I can quickly prepare the follow-up session and ensure important topics remain tracked  

**PM rationale:** Reuses the structured view to “pre-plan” the next meeting, giving a 10x feel to value without changing inputs.

---

### US-11 — Accept a meeting audio recording directly [PM-proposed]
**Status:** [ ] not started  
**Priority:** Could Have  

**As a** consultant  
**I want** to upload an audio recording of the meeting instead of a text transcript  
**So that** I can generate minutes even when no separate transcript file is available  

**PM rationale:** Extends usage to phone calls and non-Teams meetings while staying within the platform’s synchronous audio-transcription capability.

---

### US-12 — Compare with previous minutes to track continuity [PM-proposed]
**Status:** [ ] not started  
**Priority:** Could Have  

**As a** manager or project lead  
**I want** to optionally provide the previous meeting’s minutes or action list in addition to the current transcript  
**So that** the agent can highlight continuity (closed actions, carried-over topics, new decisions) and help me demonstrate follow-through across meetings  

**PM rationale:** Pushes the product beyond “one-off minutes” towards supporting governance continuity, without requiring any persistent storage (the user simply uploads the previous document when needed).

---

## Won't Have (this version) — explicitly out

- **Automatic retrieval of transcripts from Teams, Outlook, SharePoint or other tools** — out because the platform does not support inbound integrations; users paste or upload transcripts themselves.
- **Sending minutes or emails directly to participants from the agent** — out because the platform cannot send emails or chat messages; users copy the generated email into their usual mail or messaging tool.
- **Persistent history and search across past minutes** — out because there is no long-term storage or database; each session starts fresh, and users re-upload past outputs if needed.
- **Exposing the agent as an automatically triggered service (e.g. after each calendar meeting)** — out because the agent runs as a browser-based app started manually, not as a background job or public API.
- **Real-time multi-user collaboration on the same session** — out because the app is single-user per session; each user runs their own copy of the agent.
- **Support for additional languages beyond French and English** — out in this version to keep scope focused and quality high on FR/EN minutes and translations.




