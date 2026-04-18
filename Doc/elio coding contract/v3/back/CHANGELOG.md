# Changelog — Toolkit Agent Apps (Back)

## [1.2.0] — 2026-04-07

### Ajouté

- **Transcription audio** (`process_files.py`) — support des formats `.mp3`, `.m4a`, `.wav`, `.ogg`, `.webm` via Azure OpenAI Whisper. Le nom du déploiement se configure dans `services/config_llms.json` → `defaults.whisper` ou via la variable d'environnement `WHISPER_DEPLOYMENT_NAME`
- **Service de génération de documents** (`services/generate_files.py`) — deux modes :
    - _Free-form_ : `markdown_to_docx`, `text_to_docx`, `slides_to_pptx`
    - _Template filling_ : `fill_docx_template` (placeholders `{{clé}}`), `fill_pptx_template` (placeholders `<<clé>>`)
- **Templates DOCX par défaut** (`back/templates/`) — deux templates FR A4 branded copiés depuis le back principal : `FR_WORD TEMPLATE_OP_A4_2025.docx` (défaut) et `FR_WORD TEMPLATE_WE_A4_2025_BLANK PAGE.docx`. Accessible via les constantes `DOCX_TEMPLATE_OP` et `DOCX_TEMPLATE_WE_BLANK`
- **Prompts bilingues** — chaque agent doit maintenant exposer `prompt_fr.py` et `prompt_en.py` ; la sélection est automatique selon le paramètre `interface_language` reçu dans le payload SSE
- **Paramètre `interface_language`** sur toutes les fonctions de streaming — sélectionne le fichier de prompts correspondant (`"fr"` → `prompt_fr`, tout autre → `prompt_en`)
- Dépendances ajoutées : `markdown>=3.7`, `html2docx>=1.6.0`

### Modifié

- `fill_docx_template` — `template_path` devient optionnel (défaut : `DOCX_TEMPLATE_OP`), repositionné en dernier paramètre
- `services/process_files.py` — tous les imports déplacés en haut de module (plus d'imports lazy pour la lisibilité)
- `services/config_llms.json` — ajout de `defaults.whisper` pour configurer le déploiement Whisper

---

## [1.1.0] — 2026-03-xx

### Ajouté

- Pipeline upload / listing / téléchargement de fichiers (`POST /files/upload`, `GET /files`, `DELETE /files/{filename}`, `GET /files/{filename}/download`)
- Service `process_files.py` — extraction locale PDF/DOCX/PPTX/XLSX/CSV/texte + résumé conditionnel (`print_or_summarize`)
- Fallback Azure Document Intelligence pour les PDFs scannés (`AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`)
- Injection du contenu des fichiers dans le prompt de l'étape 1

---

## [1.0.0] — 2026-03-xx

### Initial

- Serveur FastAPI avec route SSE générique `POST /agent-apps/execute/{agent_id}/stream`
- Agent exemple `your_usecase` — étapes `step1_personas.py` et `step2_discussion.py`
- Service LLM (`llm_config.py`) — Azure OpenAI via `DefaultAzureCredential`
- Configuration centralisée dans `services/config_llms.json`
