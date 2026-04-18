# Changelog — Toolkit Agent Apps (Front)

## [1.2.0] — 2026-04-07

### Ajouté

- **Toggle langue FR / EN** (`LanguageToggle`) — affiché à droite du bouton Réinitialiser dans le header de chaque page Agent App
- **Propagation de la langue au backend** — `interface_language: i18n.language` ajouté automatiquement dans tous les payloads SSE (step 1 et step 2)
- Prop `headerExtra` sur `AgentAppPageShell` — permet d'injecter du contenu après le bouton Réinitialiser
- Prop `trailing` sur `AgentAppHeader` — contenu rendu après le bouton Reset

### Modifié

- `AgentAppPageShell` : `headerExtra` positionné via la prop `trailing` de `AgentAppHeader` (après le bouton Reset, avant la fin du header)
- Mise à jour du composant `index.ts` pour exporter `LanguageToggle`

---

## [1.1.0] — 2026-03-xx

### Ajouté

- Pipeline upload / listing / téléchargement de fichiers (`FileUploadZone`, `FilesList`, `fileUploadService`)
- Route `GET /files` — synchronisation des fichiers au démarrage via `useEffect`
- Bouton de téléchargement sur chaque fichier uploadé (`onDownload`)
- Affichage de la version en pied de page (`__APP_VERSION__` via `vite.config.ts`)

### Corrigé

- Alignement des bulles de chat (`ChatBubble`) — logique `isPersona1` corrigée

---

## [1.0.0] — 2026-03-xx

### Initial

- Page exemple `YourUseCaseAgentPage` — workflow 3 étapes : Input → Personas → Discussion
- Streaming SSE via `readSSEStream`
- Store Zustand `yourUseCaseAgentStore` avec persistence localStorage
- Composants Agent App partagés : `AgentAppPageShell`, `AgentAppHeader`, `StepIndicator`, `GenerateButton`, `ProgressBanner`, `ErrorBanner`, `AgentAppCard`, `AgentAppSection`
- i18n FR/EN via i18next
