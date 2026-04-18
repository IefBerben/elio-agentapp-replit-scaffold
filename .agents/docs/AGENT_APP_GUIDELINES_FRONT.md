# Agent App Front Guidelines — Toolkit

Ce document définit les règles et bonnes pratiques pour créer une nouvelle page d'Agent App dans ce **toolkit** (application React standalone).

Le toolkit est une application Vite + React + Zustand + Tailwind CSS autonome. Tous les composants nécessaires sont inclus dans `src/components/agent-apps/`.

---

## Structure du toolkit

Le toolkit est une application Vite + React standalone. Sa structure cible pour un nouvel agent app :

```
src/
├── components/
│   └── agent-apps/          # Tous les composants Agent App
│       ├── AgentAppPageShell.tsx
│       ├── AgentAppHeader.tsx
│       ├── AgentAppLayout.tsx
│       ├── AgentAppCard.tsx / AgentAppSection.tsx
│       ├── AgentAppSelect.tsx
│       ├── ActionBanner.tsx      # Toolkit uniquement
│       ├── ErrorBanner.tsx
│       ├── FilesList.tsx
│       ├── FileUploadZone.tsx
│       ├── FormField.tsx         # Toolkit uniquement
│       ├── GenerateButton.tsx
│       ├── GeneratingOverlay.tsx
│       ├── LanguageToggle.tsx
│       ├── ProgressBanner.tsx
│       ├── ResetButton.tsx
│       └── StepIndicator.tsx
├── pages/
│   └── YourUseCaseAgentPage.tsx  # Page exemple — à dupliquer/renommer
├── services/
│   └── sseStreamService.ts       # Service SSE
└── stores/
    └── yourUseCaseAgentStore.ts  # Store Zustand exemple — à dupliquer/renommer
```

### Composants inclus dans le toolkit

| Composant                                  | Rôle                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `FormField` / `FormInput` / `FormTextarea` | Label + input stylisé (pas de shadcn requis)                    |
| `ActionBanner`                             | Bandeau bleu pour afficher un résultat ou une action prominente |

---

## Gestion de fichiers

Le toolkit fournit un pipeline complet pour l'upload, le listing et le téléchargement de fichiers, intégré dans le store Zustand.

### Service : `fileUploadService.ts`

```typescript
import {
    listUploadedFiles, // GET  /files  — récupère les fichiers existants au démarrage
    uploadFiles, // POST /files/upload
    deleteUploadedFile, // DELETE /files/{filename}
    downloadUploadedFile, // GET /files/{filename}/download  — téléchargement navigateur
} from "@/services/fileUploadService";
```

### Composants UI

| Composant        | Rôle                                                               |
| ---------------- | ------------------------------------------------------------------ |
| `FileUploadZone` | Zone drag-and-drop, accepte `.pdf,.docx,.pptx,.xlsx,.csv,.txt,.md` |
| `FilesList`      | Liste les fichiers uploadés avec boutons download + delete         |

### Store Zustand requis

Le store doit contenir ces éléments (voir `yourUseCaseAgentStore.ts`) :

```typescript
interface UploadedFile {
  name: string;   // nom affiché (nom original)
  size: number;   // taille en octets
  path: string;   // chemin absolu backend (utilisé pour envoyer au LLM)
}

// Dans l'état
uploadedFiles: UploadedFile[];
isUploading: boolean;

// Actions
setUploadedFiles: (files: UploadedFile[]) => void;  // remplace tout le tableau
addUploadedFiles: (files: UploadedFile[]) => void;  // ajoute
removeUploadedFile: (name: string) => void;
setIsUploading: (uploading: boolean) => void;
```

### Pattern complet dans une page

**1. Synchronisation au démarrage (useEffect)**

Au montage, vérifier les fichiers déjà présents sur le serveur (ex : après un rafraîchissement).

```typescript
useEffect(() => {
    listUploadedFiles()
        .then((files) => setUploadedFiles(files))
        .catch((err) => console.warn("Could not load existing files:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**2. Handler d'upload**

```typescript
const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    setErrorMessage("");
    try {
        const result = await uploadFiles(files);
        addUploadedFiles(result);
    } catch (err) {
        setErrorMessage(String(err));
    } finally {
        setIsUploading(false);
    }
};
```

**3. Handler de suppression**

```typescript
const handleFileDelete = async (name: string) => {
    const file = useMyStore
        .getState()
        .uploadedFiles.find((f) => f.name === name);
    if (!file) return;
    const parts = file.path.split(/[\/\\]/);
    const basename = parts[parts.length - 1] ?? name;
    try {
        await deleteUploadedFile(basename);
    } catch {
        // Ignore — retirer du store quoi qu'il arrive
    }
    removeUploadedFile(name);
};
```

**4. Handler de téléchargement**

```typescript
const handleFileDownload = (name: string) => {
    const file = useMyStore
        .getState()
        .uploadedFiles.find((f) => f.name === name);
    if (!file) return;
    const parts = file.path.split(/[\/\\]/);
    const basename = parts[parts.length - 1] ?? name;
    downloadUploadedFile(basename);
};
```

**5. Rendu JSX**

```tsx
<FormField label={t("myAgent.documentsLabel")}>
    <FileUploadZone
        onFileSelect={handleFilesSelected}
        accept=".pdf,.docx,.pptx,.xlsx,.csv,.txt,.md"
        multiple
        isUploading={isUploading}
        hint={t("myAgent.documentsHint")}
        disabled={isProcessing}
    />
    {uploadedFiles.length > 0 && (
        <FilesList
            files={uploadedFiles}
            onDelete={isProcessing ? undefined : handleFileDelete}
            onDownload={handleFileDownload}
            className="mt-2"
        />
    )}
</FormField>
```

**6. Envoi des chemins au backend (payload SSE)**

```typescript
const payload = {
    topic,
    file_paths: uploadedFiles.map((f) => f.path), // chemins absolus backend
};
```

> **Important** : transmettre `file_paths` (les chemins `path` du store, pas les noms), car le backend a besoin des chemins absolus pour lire les fichiers dans `tempfiles/`.

### Formats acceptés

```
.pdf   .docx   .pptx   .xlsx   .csv   .txt   .md
```

Ces formats sont gérés nativement par `services/process_files.py` côté backend.

---

## Composants disponibles

```tsx
import {
    ActionBanner, // Bandeau résultat bleu (toolkit uniquement)
    AgentAppCard, // Container stylisé
    AgentAppPageShell, // Shell principal  ← TOUJOURS UTILISER
    AgentAppSection, // Header de section
    AgentAppSelect, // Dropdown stylisé
    ErrorBanner, // Bandeau d'erreur conditionnel
    FilesList, // Liste fichiers avec delete/download
    FileUploadZone, // Zone drag & drop
    FormField, // Label wrapper (toolkit uniquement)
    FormInput, // Input stylisé (toolkit uniquement)
    FormTextarea, // Textarea stylisé (toolkit uniquement)
    GenerateButton, // Bouton action principal
    GeneratingOverlay, // Overlay bloquant
    LanguageToggle, // Toggle FR/EN
    ProgressBanner, // Bannière inline non-bloquante
    ResetButton, // Bouton reset standalone
    StepIndicator, // Stepper multi-étapes
} from "@/components/agent-apps";
```

---

## AgentAppPageShell

Shell principal de toute page Agent App. Intègre header + layout scrollable + overlay bloquant. Élimine ~25-40 lignes de boilerplate.

```tsx
import { AgentAppPageShell } from "@/components/agent-apps";
import { Sparkles } from "lucide-react";

const step = useMyAgentStore((s) => s.currentStep);
const maxReachedStep = useMyAgentStore((s) => s.maxReachedStep);
const isProcessing = useMyAgentStore((s) => s.isProcessing);
const loadingAction = useMyAgentStore((s) => s.loadingAction);
const resetAll = useMyAgentStore((s) => s.resetAll);
const handleStop = useMyAgentStore((s) => s.handleStop);
const setCurrentStep = useMyAgentStore((s) => s.setCurrentStep);

const { t } = useTranslation();
const stepLabels = [t("myAgent.step1"), t("myAgent.step2")];

<AgentAppPageShell
    title={t("myAgent.title")}
    description={t("myAgent.description")}
    icon={<Sparkles className="w-5 h-5" />}
    iconContainerClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30"
    isProcessing={isProcessing}
    loadingMessage={loadingAction}
    onStop={handleStop}
    onReset={resetAll}
    headerActions={
        <StepIndicator
            steps={stepLabels}
            currentStep={step}
            maxReachedStep={maxReachedStep}
            onStepClick={setCurrentStep}
            variant="pills"
        />
    }
    useSimpleLayout
>
    {step === 1 && <StepOneContent />}
    {step === 2 && <StepTwoContent />}
</AgentAppPageShell>;
```

### Props de `AgentAppPageShell`

| Prop                     | Type          | Description                                                          |
| ------------------------ | ------------- | -------------------------------------------------------------------- |
| `title`                  | `string`      | Titre affiché dans le header                                         |
| `description`            | `string`      | Description sous le titre                                            |
| `icon`                   | `ReactNode`   | Icône du header                                                      |
| `iconContainerClassName` | `string?`     | Classes CSS pour le conteneur d'icône                                |
| `isProcessing`           | `boolean`     | Active l'overlay et désactive le reset                               |
| `loadingMessage`         | `string?`     | Message dans l'overlay (défaut: `t("agentAppCommon.generating")`)    |
| `onStop`                 | `() => void?` | Callback du bouton stop (si omis = pas de stop)                      |
| `onReset`                | `() => void?` | Callback du bouton reset (OBLIGATOIRE)                               |
| `resetDisabled`          | `boolean?`    | Désactiver le reset (défaut: `isProcessing`)                         |
| `headerActions`          | `ReactNode?`  | Actions dans le header (ex: `StepIndicator`)                         |
| `headerExtra`            | `ReactNode?`  | Éléments supplémentaires dans le header (ex: `LanguageToggle`)       |
| `overlayProps`           | `object?`     | `{ subMessage?, icon?, className? }` pour l'overlay                  |
| `useSimpleLayout`        | `boolean?`    | Wrap children dans `AgentAppSimpleLayout` (défaut: `false`)          |
| `rootClassName`          | `string?`     | Classes CSS racine (défaut: `"relative min-h-screen flex flex-col"`) |

### Variantes courantes

#### Avec StepIndicator (multi-step)

```tsx
<AgentAppPageShell
    title="..."
    description="..."
    icon={<AgentIcons.Sales />}
    isProcessing={isProcessing}
    onReset={reset}
    headerActions={
        <StepIndicator
            steps={stepLabels}
            currentStep={currentStep}
            maxReachedStep={maxReachedStep}
            onStepClick={setCurrentStep}
            variant="pills"
        />
    }
    useSimpleLayout
>
    {/* Contenu par step */}
</AgentAppPageShell>
```

#### Avec overlay personnalisé

```tsx
<AgentAppPageShell
    title="..."
    description="..."
    icon={<AgentIcons.Sales />}
    isProcessing={isProcessing}
    loadingMessage={progressInfo?.title}
    overlayProps={{
        subMessage: progressInfo?.description,
        icon: <Briefcase className="w-6 h-6" />,
    }}
    onStop={handleStop}
    onReset={reset}
>
    {/* Contenu */}
</AgentAppPageShell>
```

#### Layout plein écran sans SimpleLayout

```tsx
<AgentAppPageShell
    title="..."
    description="..."
    icon={<AgentIcons.Sales />}
    isProcessing={isProcessing}
    onReset={reset}
>
    {/* Contenu libre, pas wrappé dans AgentAppSimpleLayout */}
</AgentAppPageShell>
```

### Bouton Reset intégré

Le header affiche automatiquement un bouton "Réinitialiser" à droite des actions :

- `onReset` : callback appelé quand l'utilisateur clique sur reset (obligatoire)
- `resetDisabled` : désactiver le bouton pendant le traitement (défaut: `isProcessing`)

---

## Icône et couleurs du Header

**L'icône du header doit correspondre à la catégorie de l'agent**, pas à l'agent individuel.

### Catégories disponibles

| Catégorie        | Icône                     | Classes couleur                                          |
| ---------------- | ------------------------- | -------------------------------------------------------- |
| **Sales**        | `AgentIcons.Sales`        | `bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30` |
| **Marketing**    | `AgentIcons.Marketing`    | `bg-pink-100 text-pink-700 dark:bg-pink-900/30`          |
| **Design**       | `AgentIcons.Design`       | `bg-orange-100 text-orange-700 dark:bg-orange-900/30`    |
| **Office**       | `AgentIcons.Office`       | `bg-teal-100 text-teal-700 dark:bg-teal-900/30`          |
| **Juridique**    | `AgentIcons.Scale`        | `bg-slate-100 text-slate-700 dark:bg-slate-900/30`       |
| **Architecture** | `AgentIcons.Architecture` | `bg-purple-100 text-purple-700 dark:bg-purple-900/30`    |
| **Diagnostic**   | `AgentIcons.Diagnostic`   | `bg-blue-100 text-blue-700 dark:bg-blue-900/30`          |
| **Strategy**     | `AgentIcons.Strategy`     | `bg-purple-100 text-purple-700 dark:bg-purple-900/30`    |

---

## Thème Sombre (CRITIQUE)

Toutes les couleurs de fond légères (`bg-{color}-50`, `bg-{color}-100`, `bg-{color}-200`) **doivent obligatoirement** avoir une variante dark mode.

### Patterns obligatoires

| Light Mode           | Dark Mode                 | Usage                          |
| -------------------- | ------------------------- | ------------------------------ |
| `bg-{color}-50`      | `dark:bg-{color}-900/20`  | Fond très léger                |
| `bg-{color}-100`     | `dark:bg-{color}-900/30`  | Fond standard (badges, icônes) |
| `bg-{color}-200`     | `dark:bg-{color}-800/40`  | Fond moyen                     |
| `text-{color}-700`   | `dark:text-{color}-300`   | Texte coloré                   |
| `text-{color}-600`   | `dark:text-{color}-400`   | Texte coloré secondaire        |
| `border-{color}-100` | `dark:border-{color}-800` | Bordure légère                 |
| `border-{color}-200` | `dark:border-{color}-700` | Bordure standard               |

### Exemples

```tsx
// ✅ Correct - avec variante dark
<div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
  Badge
</div>

// ❌ Incorrect - pas de variante dark (aveuglant en mode sombre !)
<div className="bg-blue-100 text-blue-700">
  Badge
</div>
```

### Variables CSS sémantiques (préférées)

Pour les éléments génériques, préférer les variables CSS qui s'adaptent automatiquement :

```tsx
// ✅ Préféré - s'adapte automatiquement au thème
<div className="bg-muted text-muted-foreground">...</div>
<div className="hover:bg-[hsl(var(--grey))]">...</div>
<div className="bg-background text-foreground">...</div>
<div className="border-border">...</div>

// Quand utiliser les couleurs Tailwind directes
// → Badges colorés (vert/rouge/bleu pour statuts)
// → Indicateurs visuels spécifiques
// → Illustrations/graphiques
```

### Checklist thème sombre

- [ ] Tous les `bg-{color}-50|100|200` ont leur `dark:bg-{color}-900/xx`
- [ ] Tous les `text-{color}-600|700` ont leur `dark:text-{color}-300|400`
- [ ] Tester visuellement en mode sombre avant de valider
- [ ] Les panneaux/cartes utilisent `bg-muted` ou `bg-card` (pas de couleurs fixes)

---

## Comportement du Scroll (IMPORTANT)

Le header a un comportement de scroll responsive :

- **Desktop (≥768px)** : Le header reste **fixe/sticky** en haut de la page
- **Mobile (<768px)** : Le header **scroll** avec le reste du contenu

Cette règle est gérée automatiquement par `AgentAppHeader` via les classes `md:sticky md:top-0`.

**Ne pas modifier ce comportement** dans les pages individuelles.

---

## Layout Plein Écran (IMPORTANT)

Les formulaires et contenus principaux d'un Agent App **doivent prendre toute la largeur disponible**.

### Anti-patterns à éviter

```tsx
// ❌ Incorrect - ne pas centrer/limiter la largeur du contenu principal
<div className="flex-1 flex flex-col items-center">
  <div className="max-w-4xl mx-auto">...</div>
</div>

// ❌ Incorrect - padding horizontal excessif
<div className="flex-1 p-8">...</div>

// ❌ Incorrect - centrage vertical du formulaire
<div className="my-auto">...</div>
```

### Pattern correct

```tsx
// ✅ Correct - contenu utilise toute la largeur
<div className="flex-1 flex flex-col pt-4 md:pt-6">
    <div className="bg-card w-full rounded-2xl border border-border p-6 md:p-8">
        {/* Formulaire / Contenu */}
    </div>
</div>
```

---

## Inputs pendant le Processing (OBLIGATOIRE)

**TOUS** les contrôles de formulaire DOIVENT avoir `disabled={isProcessing}`.

```tsx
// ✅ Correct
<Input value={title} onChange={setTitle} disabled={isProcessing} />
<Textarea value={body} onChange={setBody} disabled={isProcessing} />
<AgentAppSelect value={lang} onValueChange={setLang} disabled={isProcessing} />
<FileUploadZone onFileSelect={onSelect} disabled={isProcessing} />
<GenerateButton onClick={handleGenerate} disabled={isProcessing || !isValid} />

// ❌ INTERDIT — inputs actifs pendant la génération
<Input value={title} onChange={setTitle} />
```

Pour les champs texte, utiliser les composants shadcn `Input` et `Textarea` depuis `@/components/ui/`. Jamais `<input>` ou `<textarea>` HTML bruts.

---

## ErrorBanner

Bandeau d'erreur conditionnel et mutualisé pour toutes les pages agent-apps. Remplace les patterns inline `{error && <div>...</div>}` ou `<Alert variant="destructive">`.

Affiche un message stylisé en rouge, ou rien si `message` est `null`/`undefined`.

```tsx
import { ErrorBanner } from "@/components/agent-apps";

// Affiche le bandeau uniquement si error est non-null
<ErrorBanner message={error} />

// Avec classes CSS additionnelles
<ErrorBanner message={error} className="mt-4" />
```

### Props

| Prop        | Type                          | Description                                          |
| ----------- | ----------------------------- | ---------------------------------------------------- |
| `message`   | `string \| null \| undefined` | Message d'erreur. Si falsy, le composant rend `null` |
| `className` | `string`                      | Classes CSS additionnelles (optionnel)               |

> **Important** : Ne plus utiliser `<Alert variant="destructive">` ni de `<div>` inline pour les erreurs dans les pages agent-apps. Utiliser systématiquement `<ErrorBanner />`.

---

## GenerateButton

Le `GenerateButton` est standardisé et **ne doit pas recevoir de prop `icon`**.

L'icône interne (Wand2) est fixe et ne doit pas être personnalisée.

```tsx
// ✅ Correct
<GenerateButton
  onClick={handleGenerate}
  isLoading={loading}
  loadingText="Génération en cours..."
  label="Générer"
/>

// ❌ Incorrect - ne pas passer d'icône
<GenerateButton
  onClick={handleGenerate}
  icon={<Sparkles />}  // INTERDIT
  ...
/>
```

### Props disponibles

| Prop          | Type                      | Description                         |
| ------------- | ------------------------- | ----------------------------------- |
| `onClick`     | `() => void`              | Handler de clic                     |
| `isLoading`   | `boolean`                 | État de chargement                  |
| `loadingText` | `string`                  | Texte affiché pendant le chargement |
| `label`       | `string`                  | Label du bouton                     |
| `variant`     | `"default" \| "gradient"` | Style visuel                        |
| `size`        | `"sm" \| "md" \| "lg"`    | Taille                              |
| `fullWidth`   | `boolean`                 | Largeur 100% (default: `false`)     |
| `disabled`    | `boolean`                 | Désactivé                           |

---

## AgentAppSelect

Sélecteur dropdown stylisé pour les Agent Apps, avec une UX cohérente (style AssistantHistory).

```tsx
import { AgentAppSelect } from "@/components/agent-apps";

// Build options (avec useMemo pour éviter re-renders)
const languageOptions = useMemo(
    () =>
        LANGUAGE_KEYS.map((key) => ({
            value: t(`translationModule.${key}`),
            label: t(`translationModule.${key}`),
        })),
    [t],
);

// Usage
<AgentAppSelect
    value={selectedLanguage}
    onValueChange={setSelectedLanguage}
    options={languageOptions}
    placeholder={t("translationModule.selectLanguage")}
    disabled={!uploadedFilePath || isProcessing}
/>;
```

### Props disponibles

| Prop            | Type                                 | Description                  |
| --------------- | ------------------------------------ | ---------------------------- |
| `value`         | `string \| null`                     | Valeur actuellement choisie  |
| `onValueChange` | `(value: string) => void`            | Callback au changement       |
| `options`       | `{ value: string; label: string }[]` | Liste des options            |
| `placeholder`   | `string`                             | Texte quand aucune sélection |
| `disabled`      | `boolean`                            | Désactivé                    |
| `className`     | `string`                             | Classes CSS additionnelles   |

### Style

- Utilise `DropdownMenu` de shadcn/ui (même composant que AssistantHistory)
- Trigger : `rounded-full h-8`, bordure légère, hover gris
- Menu : `rounded-2xl`, shadow prononcée, items arrondis
- Check icon sur l'option sélectionnée

---

## ProgressBanner

Banderole bleue **inline, non-bloquante** disponible si vous avez besoin d'un composant rapide pour un traitement simple. Pour les workflows multi-étapes, préférez le **Blue Step Banner** décrit ci-dessous.

```tsx
import { ProgressBanner } from "@/components/agent-apps";

<ProgressBanner
    title={progressInfo?.title ?? t("agent.generating")}
    progress={progressInfo?.progress} // 0-100
    onStop={handleStop}
/>;
```

---

## Blue Step Banner (pattern recommandé)

Dans les workflows multi-étapes, chaque étape dispose d'une **bannière bleue toujours visible** (jamais conditionnelle). Elle remplace le `ProgressBanner` conditionnel et est le **seul endroit** où placer les boutons qui agissent au niveau de la page (génération, stop, regénération, export…).

### Structure canonique

```
┌──────────────────────────────────────────────┐
│  GAUCHE : info sur l'étape en cours           │  DROITE : bouton principal
│  (ou état de chargement si isProcessing)      │  (absent si isProcessing)
└──────────────────────────────────────────────┘
```

- **Étapes intermédiaires** : bouton « générer l'étape suivante » à droite
- **Dernière étape** : stop (si en cours) ou regénérer (si terminé) à droite
- **Aucun autre bouton page** ne doit exister en dehors de cette bannière

### Implémentation

Utilisez un helper `renderStepBanner` pour éviter la répétition :

```tsx
const renderStepBanner = ({
    title,
    description,
    loadingTitle,
    progress,
    action,
}: {
    title: string;
    description?: string;
    loadingTitle?: string;
    progress?: number;
    action?: React.ReactNode;
}) => (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-2xl p-4 md:p-5 border border-blue-200 dark:border-blue-800 shadow-sm">
        <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
                {isProcessing && loadingTitle ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="text-base font-semibold text-foreground truncate">
                                {loadingTitle}
                            </span>
                        </div>
                        {progress !== undefined && (
                            <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <p className="text-base font-semibold text-foreground">
                            {title}
                        </p>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {description}
                            </p>
                        )}
                    </div>
                )}
            </div>
            {!isProcessing && action && (
                <div className="shrink-0">{action}</div>
            )}
        </div>
    </div>
);
```

### Utilisation par étape

```tsx
// Étape intermédiaire (bouton "générer l'étape suivante")
{
    renderStepBanner({
        title: t("agent.generateNextStep"),
        description: t("agent.inputFormDesc"),
        loadingTitle: progressInfo?.title ?? t("agent.generating"),
        progress: progressInfo?.progress,
        action: (
            <GenerateButton
                onClick={handleGenerate}
                isLoading={false}
                label={t("agent.generate")}
                disabled={!canGenerate}
            />
        ),
    });
}

// Dernière étape (stop pendant le streaming, regénérer après)
<div className="shrink-0">
    {isProcessing ? (
        <button
            onClick={handleStop}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors"
        >
            <Square className="w-3.5 h-3.5 fill-current" />
            {t("agentAppCommon.stop")}
        </button>
    ) : results.length > 0 ? (
        <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground bg-card border border-border hover:bg-muted/50 transition-colors"
        >
            <RefreshCw className="w-3.5 h-3.5" />
            {t("agentAppCommon.regenerate")}
        </button>
    ) : null}
</div>;
```

### Pattern AgentAppPageShell avec Blue Step Banner

Désactiver l'overlay bloquant — le feedback est géré dans la bannière de chaque étape :

```tsx
<AgentAppPageShell
    title="..."
    description="..."
    icon={<Sparkles />}
    // Disable blocking overlay — feedback handled inline via Blue Step Banner
    isProcessing={false}
    resetDisabled={isProcessing}
    onReset={resetAll}
    useSimpleLayout
>
    {currentStep === 1 && (
        <div className="w-full py-4 md:py-6 space-y-4 animate-fade-in-up px-4 md:px-6">
            {renderStepBanner({
                title: "...",
                loadingTitle: "...",
                action: <GenerateButton />,
            })}
            <AgentAppCard>{/* Form */}</AgentAppCard>
        </div>
    )}
</AgentAppPageShell>
```

### Clés i18n à prévoir

```json
{
    "agentAppCommon": {
        "stop": "Stop",
        "regenerate": "Regenerate"
    }
}
```

---

## Auto-scroll (Streaming)

**OBLIGATOIRE** pour toute interface affichant des messages en streaming.

```tsx
const endRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]); // déclenché à chaque nouveau message

// Dans le JSX — placer APRÈS la liste de messages :
<div ref={endRef} />;
```

---

## GeneratingOverlay (IMPORTANT)

Le `GeneratingOverlay` est un composant commun qui affiche un overlay semi-transparent avec un bouton stop pendant les opérations longues.

### Elio vs Neo

- **Elio** : utiliser directement le composant partagé
- **Neo** : utiliser la même logique partagée, sans recréer un overlay local divergent. Le rendu Neo doit passer par des classes/overrides et des icônes Vuesax, tout en gardant le comportement partagé
- **Neo** : l'overlay ne doit pas recouvrir la navigation latérale ni casser le fond global de l'application

```tsx
import { GeneratingOverlay } from "@/components/agent-apps/GeneratingOverlay";

// Usage standard
<GeneratingOverlay
    isVisible={isProcessing}
    message={loadingAction} // Ex: "Phase 2 · Rédaction détaillée..."
    onStop={handleStop} // Optionnel - si omis, pas de bouton stop
/>;
```

### Props disponibles

| Prop         | Type          | Description                                    |
| ------------ | ------------- | ---------------------------------------------- |
| `isVisible`  | `boolean`     | Affiche/masque l'overlay                       |
| `message`    | `string`      | Message principal (obligatoire)                |
| `subMessage` | `string?`     | Message secondaire (optionnel)                 |
| `onStop`     | `() => void?` | Handler du bouton stop (si omis = pas de stop) |

### Comportement

- **Position** : `absolute` sur le conteneur parent (ne couvre PAS la sidebar)
- **Style** : Fond `bg-black/15`, blur léger, coins arrondis
- **Bouton stop** : Rouge, visible uniquement si `onStop` est fourni
- **Z-index** : 50

### isProcessing doit venir du Store Zustand

L'état `isProcessing` doit être géré dans le store Zustand (pas un `useState` local) pour que l'overlay persiste lors de la navigation entre pages :

```tsx
// ❌ MAUVAIS - l'overlay disparaît si l'utilisateur navigue ailleurs
const [isProcessing, setIsProcessing] = useState(false);

// ✅ BON - l'overlay reste visible car le store Zustand persiste en mémoire
const { isProcessing, setIsProcessing } = useMyAgentStore();
```

**Pourquoi ?** Le store Zustand reste en mémoire entre les navigations de route. Un `useState` local est réinitialisé à `false` à chaque montage du composant.

### Placement dans le JSX

Toujours placer l'overlay **à la fin** du composant, juste avant la fermeture du conteneur principal :

```tsx
return (
    <div className="relative min-h-screen ...">
        {/* Contenu de la page */}

        <GeneratingOverlay
            isVisible={isProcessing}
            message={loadingAction}
            onStop={handleStop}
        />
    </div>
);
```

---

## AgentAppSimpleLayout

Layout simple pour la zone de contenu, sans header intégré. Utiliser avec `AgentAppHeader` séparé pour un contrôle total.

```tsx
import { AgentAppSimpleLayout } from "@/components/agent-apps";

<AgentAppSimpleLayout fullHeight noPadding={false}>
    {/* Contenu scrollable */}
</AgentAppSimpleLayout>;
```

### Props disponibles

| Prop         | Type        | Default | Description                                |
| ------------ | ----------- | ------- | ------------------------------------------ |
| `children`   | `ReactNode` | -       | Contenu de la page                         |
| `className`  | `string`    | -       | Classes CSS additionnelles                 |
| `fullHeight` | `boolean`   | `true`  | Utilise `h-full` au lieu de `min-h-screen` |
| `noPadding`  | `boolean`   | `false` | Désactive le padding vertical par défaut   |

---

## AgentAppCard

Container stylisé pour regrouper du contenu. Bordure, ombre légère, coins arrondis.

```tsx
import { AgentAppCard } from "@/components/agent-apps";

<AgentAppCard>
  <h3>Titre de section</h3>
  <p>Contenu...</p>
</AgentAppCard>

<AgentAppCard noPadding className="overflow-hidden">
  <img src="..." className="w-full" />
</AgentAppCard>
```

### Props disponibles

| Prop        | Type        | Default | Description                     |
| ----------- | ----------- | ------- | ------------------------------- |
| `children`  | `ReactNode` | -       | Contenu de la carte             |
| `className` | `string`    | -       | Classes CSS additionnelles      |
| `noPadding` | `boolean`   | `false` | Désactive le padding par défaut |

---

## AgentAppSection

Header de section avec titre, description optionnelle et actions à droite.

```tsx
import { AgentAppSection } from "@/components/agent-apps";

<AgentAppSection
    title="Documents uploadés"
    description="3 fichiers"
    actions={<Button size="sm">Ajouter</Button>}
/>;
```

### Props disponibles

| Prop          | Type         | Description                |
| ------------- | ------------ | -------------------------- |
| `title`       | `string`     | Titre de la section        |
| `description` | `string?`    | Description secondaire     |
| `actions`     | `ReactNode?` | Actions alignées à droite  |
| `className`   | `string?`    | Classes CSS additionnelles |

---

## FilesList

Liste de fichiers avec boutons de téléchargement et suppression.

```tsx
import { FilesList } from "@/components/agent-apps";

<FilesList
    files={uploadedFiles}
    onDelete={(fileName) => handleDelete(fileName)}
    onDownload={(fileName) => handleDownload(fileName)}
    isLoading={isLoadingFiles}
    deletingFile={deletingFileName}
    showEmptyState={true}
/>;
```

### Props disponibles

| Prop             | Type                               | Default | Description                           |
| ---------------- | ---------------------------------- | ------- | ------------------------------------- |
| `files`          | `{ name: string; size: number }[]` | -       | Fichiers à afficher                   |
| `onDelete`       | `(fileName: string) => void`       | -       | Callback suppression                  |
| `onDownload`     | `(fileName: string) => void`       | -       | Callback téléchargement               |
| `isLoading`      | `boolean`                          | `false` | Affiche un loader                     |
| `deletingFile`   | `string \| null`                   | -       | Fichier en cours de suppression       |
| `type`           | `"input" \| "output"`              | -       | Type (backward compat, pas de visuel) |
| `title`          | `string`                           | -       | Titre au-dessus de la liste           |
| `showEmptyState` | `boolean`                          | `true`  | Affiche "Aucun fichier" si vide       |

---

## ResetButton

Bouton de réinitialisation standalone (utilisé automatiquement par le header, mais disponible séparément).

```tsx
import { ResetButton } from "@/components/agent-apps";

<ResetButton onReset={handleReset} disabled={isProcessing} showLabel={true} />;
```

### Props disponibles

| Prop        | Type         | Default | Description                  |
| ----------- | ------------ | ------- | ---------------------------- |
| `onReset`   | `() => void` | -       | Callback de réinitialisation |
| `disabled`  | `boolean`    | `false` | Désactivé                    |
| `showLabel` | `boolean`    | `true`  | Affiche le label texte       |
| `className` | `string`     | -       | Classes CSS additionnelles   |

---

## CopyButton

Bouton de copie dans le presse-papiers avec feedback visuel (icône Check pendant 2s). Composant partagé dans `@/components/ui/`.

```tsx
import { CopyButton } from "@/components/ui/CopyButton";

// Usage simple (icône seule)
<CopyButton content={textToCopy} className="h-7 w-7 rounded-full p-0 justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground" />

// Avec label
<CopyButton
  content={textToCopy}
  label={t("common.copy")}
  copiedLabel={t("common.copied")}
  iconSize="h-3 w-3"
  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20"
/>
```

### Props disponibles

| Prop          | Type     | Default     | Description                           |
| ------------- | -------- | ----------- | ------------------------------------- |
| `content`     | `string` | -           | Texte à copier (obligatoire)          |
| `label`       | `string` | -           | Label affiché à côté de l'icône       |
| `copiedLabel` | `string` | -           | Label affiché après la copie          |
| `className`   | `string` | -           | Classes CSS pour le bouton            |
| `iconSize`    | `string` | `"h-4 w-4"` | Classes Tailwind pour la taille icône |

> **Important** : Ne pas réimplémenter la logique copy + setTimeout dans les pages. Utiliser systématiquement `<CopyButton />`.

---

## FormField, FormInput, FormTextarea (toolkit uniquement)

Ces composants remplacent les `Input` / `Textarea` + `Label` de shadcn/ui qui ne sont pas disponibles dans le toolkit. Ils appliquent automatiquement les styles de formulaire standardisés.

```tsx
import { FormField, FormInput, FormTextarea } from "@/components/agent-apps";

// Champ texte simple
<FormField label="Sujet" required>
  <FormInput
    value={topic}
    onChange={(e) => setTopic(e.target.value)}
    placeholder="Ex: Le télétravail"
    disabled={isProcessing}
  />
</FormField>

// Textarea
<FormField label="Instructions">
  <FormTextarea
    value={instructions}
    onChange={(e) => setInstructions(e.target.value)}
    rows={4}
    placeholder="Décrivez le contexte..."
    disabled={isProcessing}
  />
</FormField>
```

### Props `FormField`

| Prop        | Type        | Default | Description                 |
| ----------- | ----------- | ------- | --------------------------- |
| `label`     | `string`    | —       | Label affiché au-dessus     |
| `required`  | `boolean`   | `false` | Affiche ` *` après le label |
| `className` | `string?`   | —       | Classes additionnelles      |
| `children`  | `ReactNode` | —       | L'input à wrapper           |

> **Note** : `FormInput` et `FormTextarea` acceptent toutes les props natives HTML (`<input>` / `<textarea>`). Toujours passer `disabled={isProcessing}`.

---

## ActionBanner (toolkit uniquement)

Bandeau bleu pour afficher un résultat ou une action prominente (appel à l'action, résumé, bouton de téléchargement, etc.).

```tsx
import { ActionBanner } from "@/components/agent-apps";

<ActionBanner>
    <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-blue-600" />
        <span className="font-medium text-blue-900 dark:text-blue-100">
            {t("myAgent.resultReady")}
        </span>
    </div>
    <Button size="sm" onClick={handleDownload}>
        {t("common.download")}
    </Button>
</ActionBanner>;
```

### Props

| Prop        | Type        | Description                                              |
| ----------- | ----------- | -------------------------------------------------------- |
| `children`  | `ReactNode` | Contenu du bandeau (flex row, space-between automatique) |
| `className` | `string?`   | Classes additionnelles                                   |

Style : fond dégradé bleu, bordure bleue, coins arrondis, shadow légère — avec variante dark mode intégrée.

---

## Store Zustand (OBLIGATOIRE)

Chaque Agent App utilise un **store Zustand dédié** dans `src/stores/agent-apps/`. Il a deux rôles :

1. **Zustand (en mémoire)** : le state survit à la navigation entre pages (SPA). Sans ça, un `useState` local est détruit quand le composant est démonté.
2. **`persist` middleware** : le state est aussi écrit dans le localStorage, et survit au refresh ou à la fermeture de l'onglet.

Concrètement :

| Situation                  | `useState` | Zustand  | Zustand + persist |
| -------------------------- | ---------- | -------- | ----------------- |
| Rester sur la page         | ✅         | ✅       | ✅                |
| Changer de page et revenir | ❌ perdu   | ✅       | ✅                |
| Refresh (F5)               | ❌ perdu   | ❌ perdu | ✅                |
| Fermer et rouvrir l'onglet | ❌ perdu   | ❌ perdu | ✅                |

### Structure recommandée

Créer un fichier `src/stores/agent-apps/{agentName}Store.ts` :

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MyAgentState {
    // Navigation
    step: number;

    // Données
    context: MyContext;
    results: MyResult[];

    // Processing (NON persisté)
    isProcessing: boolean;
    loadingAction: string;
    isCancelled: boolean;
    error: string | null;
}

interface MyAgentActions {
    // Setters
    setStep: (step: number) => void;
    setContext: (context: Partial<MyContext>) => void;
    setIsProcessing: (isProcessing: boolean) => void;
    setError: (error: string | null) => void;

    // Generation
    generate: () => Promise<void>;
    handleStop: () => void;
    reset: () => void;
}

export const useMyAgentStore = create<MyAgentState & MyAgentActions>()(
    persist(
        (set, get) => ({
            // Initial state
            step: 1,
            context: initialContext,
            results: [],
            isProcessing: false,
            loadingAction: "",
            isCancelled: false,
            error: null,

            // Actions
            setStep: (step) => set({ step }),
            setContext: (partial) =>
                set((s) => ({
                    context: { ...s.context, ...partial },
                })),
            setIsProcessing: (isProcessing) => set({ isProcessing }),
            setError: (error) => set({ error }),

            handleStop: () => set({ isCancelled: true, isProcessing: false }),

            generate: async () => {
                set({ isProcessing: true, isCancelled: false, error: null });
                try {
                    // Check cancellation at each step
                    if (get().isCancelled) return;

                    const result = await myApiCall();

                    if (get().isCancelled) return;

                    set({ results: result, step: 2 });
                } catch (err) {
                    set({
                        error: err instanceof Error ? err.message : "Erreur",
                    });
                } finally {
                    set({ isProcessing: false });
                }
            },

            reset: () =>
                set({
                    step: 1,
                    context: initialContext,
                    results: [],
                    isProcessing: false,
                    isCancelled: false,
                    error: null,
                }),
        }),
        {
            name: "my-agent-storage",
            partialize: (state) => ({
                // Persist ONLY data, NOT runtime state
                step: state.step,
                context: state.context,
                results: state.results,
                // NE PAS persister : isProcessing, loadingAction, isCancelled
            }),
        },
    ),
);
```

### Règles de persistance (`partialize`)

Tous les stores avec `persist` doivent utiliser `partialize` pour être explicites sur ce qui est sauvegardé dans le localStorage.

**Toujours exclure :**

- Les états runtime : `isProcessing`, `loadingAction`, `isCancelled`, `error`, `progressInfo`
- Les images base64 / data URL : `creativeImage`, `imageUrl`, `customLogo`, etc.
- Les tableaux contenant des images imbriquées : les nettoyer avec `.map()` ou `.filter()`

Le localStorage a une limite de ~5 Mo par origine. Une image base64 peut facilement dépasser ce quota et provoquer `DOMException: The quota has been exceeded`.

---

### Sélecteurs individuels (CRITIQUE — anti-pattern à éviter)

**Ne jamais destructurer le store entier** — c'est un anti-pattern qui provoque des re-renders inutiles et peut causer des boucles infinies.

**Pour les données utilisées dans le rendu**, utiliser des sélecteurs individuels :

```tsx
// ❌ MAUVAIS — souscrit au store entier, re-render à chaque changement d'état
const { topic, isProcessing, results } = useMyAgentStore();

// ✅ BON — souscrit uniquement aux slices nécessaires
const topic = useMyAgentStore((s) => s.topic);
const isProcessing = useMyAgentStore((s) => s.isProcessing);
const results = useMyAgentStore((s) => s.results);
```

**Pour les actions**, utiliser `getState()` dans les handlers — références stables, sans dépendance de re-render :

```tsx
// ❌ MAUVAIS — action dans le rendu, crée une dépendance inutile
const setTopic = useMyAgentStore((s) => s.setTopic);

// ✅ BON — getState() dans les handlers async ou les callbacks
const handleGenerate = async () => {
    const { setIsProcessing, setError, setResults } =
        useMyAgentStore.getState();
    setIsProcessing(true);
    try {
        const result = await myApiCall();
        setResults(result);
    } catch (err) {
        setError(String(err));
    } finally {
        setIsProcessing(false);
    }
};
```

**Pattern complet dans un composant** :

```tsx
const MyAgentPage: React.FC = () => {
    // ✅ Sélecteurs individuels pour le rendu
    const topic = useMyAgentStore((s) => s.topic);
    const isProcessing = useMyAgentStore((s) => s.isProcessing);
    const results = useMyAgentStore((s) => s.results);

    // ✅ Actions via getState() — stables, pas de dépendances re-render
    const { setTopic, resetAll } = useMyAgentStore.getState();

    const handleGenerate = async () => {
        const { setIsProcessing, setResults, setError } =
            useMyAgentStore.getState();
        // ...
    };
};
```

**Exemple** — exclure les images d'un tableau :

```tsx
partialize: (state) => ({
    step: state.step,
    context: state.context,
    // Strip image data before persistence
    results: state.results.map((r) => ({ ...r, imageUrl: undefined })),
    // NOT persisted: isProcessing, loadingAction, isCancelled, error
}),
```

> Voir `dynamicPersonaStore.ts` pour un exemple de référence.

---

### Pattern d'annulation

Vérifier `isCancelled` après chaque opération async :

```tsx
generate: async () => {
  set({ isProcessing: true, isCancelled: false });

  if (get().isCancelled) return; // Check 1
  const step1 = await firstApiCall();

  if (get().isCancelled) return; // Check 2
  const step2 = await secondApiCall(step1);

  if (get().isCancelled) return; // Check 3
  set({ results: step2, isProcessing: false });
},
```

### Pattern de génération SSE (toolkit)

Le toolkit utilise `readSSEStream` depuis `@/services/sseStreamService` — **pas** `executeAgentStreaming` ni `executeAgentWithPollingFallback` du repo principal (ces services n'existent pas dans le toolkit).

```tsx
import { readSSEStream, type SSEMessage } from "@/services/sseStreamService";

// Types de messages SSE spécifiques à l'agent
interface MyAgentSSEMessage extends SSEMessage {
    result?: MyResult;
}

const MyAgentPage: React.FC = () => {
    const abortControllerRef = useRef<AbortController | null>(null);
    const isCancelledRef = useRef(false);

    const isProcessing = useMyAgentStore((s) => s.isProcessing);
    const setIsProcessing = useMyAgentStore((s) => s.setIsProcessing);
    const handleStop = useMyAgentStore((s) => s.handleStop);

    const handleStopClick = useCallback(() => {
        // 1. Marquer comme annulé AVANT d'appeler abort()
        isCancelledRef.current = true;
        // 2. Abort la requête HTTP
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        handleStop();
    }, [handleStop]);

    const handleGenerate = async () => {
        isCancelledRef.current = false;
        setIsProcessing(true);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const response = await fetch(`/agent-apps/${AGENT_ID}/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...params }),
                signal: abortController.signal,
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            await readSSEStream<MyAgentSSEMessage>(
                response,
                (message) => {
                    // Vérifier l'annulation à chaque message
                    if (isCancelledRef.current) return true; // true = stop reading

                    if (message.status === "in_progress") {
                        setProgressInfo({
                            title: message.title ?? "",
                            progress: message.progress ?? 0,
                        });
                    }
                    if (message.status === "completed" && message.result) {
                        setResult(message.result);
                        advanceToStep(2);
                    }
                    if (message.status === "error") {
                        setErrorMessage(message.error ?? "Erreur inconnue");
                    }
                    return false; // false = continue reading
                },
                abortController.signal,
            );
        } catch (err) {
            if (!isCancelledRef.current) {
                setErrorMessage(err instanceof Error ? err.message : "Erreur");
            }
        } finally {
            setIsProcessing(false);
            abortControllerRef.current = null;
        }
    };
};
```

### Interface SSEMessage

```ts
// Depuis @/services/sseStreamService
interface SSEMessage {
    status?: string; // "in_progress" | "completed" | "error" | "keepalive"
    message?: string; // Message texte
    error?: string; // Message d'erreur
    title?: string; // Titre de progression
    progress?: number; // 0-100
    description?: string; // Sous-titre
    current_operation?: string;
    [key: string]: unknown; // Champs métier supplémentaires
}
```

La fonction `processMessage` retourne `boolean` :

- `false` → continuer à lire le stream
- `true` → arrêter la lecture (utile pour arrêter après un `completed`)

### Vérifier `isCancelledRef` dans les callbacks

Quand l'utilisateur clique "Stop", la requête est annulée mais des messages déjà reçus peuvent encore être traités. Toujours vérifier `isCancelledRef.current` en début de callback :

```tsx
(message) => {
    // ✅ Toujours vérifier en premier
    if (isCancelledRef.current) return true;

    // Traitement normal...
    return false;
};
```

### Usage dans le composant

```tsx
const MyAgentPage: React.FC = () => {
    const isProcessing = useMyAgentStore((s) => s.isProcessing);
    const loadingAction = useMyAgentStore((s) => s.loadingAction);
    const resetAll = useMyAgentStore((s) => s.resetAll);

    return (
        <AgentAppPageShell
            title={t("myAgent.title")}
            description={t("myAgent.description")}
            icon={<Sparkles className="w-5 h-5" />}
            iconContainerClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30"
            isProcessing={isProcessing}
            loadingMessage={loadingAction}
            onStop={handleStopClick}
            onReset={resetAll}
            useSimpleLayout
        >
            {/* Contenu */}
        </AgentAppPageShell>
    );
};
```

### Comportement attendu

| Scénario                      | Résultat                                                 |
| ----------------------------- | -------------------------------------------------------- |
| Navigation SPA (sans refresh) | ✅ Génération continue, overlay visible au retour        |
| Refresh pendant génération    | ⚠️ Génération interrompue, données partielles conservées |
| Clic sur Stop                 | ✅ Génération s'arrête proprement                        |

---

## FileUploadZone

Zone de dépôt de fichiers avec drag & drop :

```tsx
<FileUploadZone
    onFileSelect={(files) => handleFiles(files)}
    accept="image/*,.pdf,.docx"
    multiple={true}
    isDragging={isDragging}
    onDragStateChange={setIsDragging}
    label="Importer des fichiers"
    isUploading={isUploading}
    disabled={loading}
    variant={files.length > 0 ? "compact" : "default"}
/>
```

### Labels standardisés

| Contexte      | Label                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| **Générique** | "Ajouter un document" (label par défaut, i18n: `agentAppCommon.addDocument`) |
| **Persona**   | "Ajouter un persona" (i18n: `dynamicPersona.addPersona`)                     |

### Formats affichés (hint)

Utiliser des noms lisibles, pas les extensions techniques :

| ✅ Correct            | ❌ Incorrect              |
| --------------------- | ------------------------- |
| PDF, Word, PowerPoint | .pdf, .docx, .pptx        |
| PDF, Image            | application/pdf, image/\* |
| Image, PDF            | image/\*,.pdf             |

---

## Gestion des fichiers

**Les objets `File` JavaScript ne se sérialisent pas** — ne pas les stocker dans le store Zustand. Utiliser un `useState` local pour la liste des fichiers.

### Pattern recommandé (toolkit)

```tsx
const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
const [isUploading, setIsUploading] = useState(false);

// Fichiers affichés dans FilesList (format compatible)
const fileItems = uploadedFiles.map((f) => ({ name: f.name, size: f.size }));

const handleFileSelect = async (newFiles: File[]) => {
  setIsUploading(true);
  try {
    // Uploader vers le backend si nécessaire
    const formData = new FormData();
    for (const file of newFiles) formData.append("files", file);
    await fetch(`/agent-apps/${AGENT_ID}/upload`, { method: "POST", body: formData });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  } catch (err) {
    setErrorMessage("Erreur lors de l'upload");
  } finally {
    setIsUploading(false);
  }
};

const handleDeleteFile = (fileName: string) => {
  setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
};

// JSX
<FileUploadZone
  onFileSelect={handleFileSelect}
  accept=".pdf,.docx"
  multiple
  isUploading={isUploading}
  disabled={isProcessing}
/>
<FilesList
  files={fileItems}
  onDelete={handleDeleteFile}
  isLoading={isUploading}
  showEmptyState
/>
```

---

## Prévisualisation de fichiers (AgentAppFileViewer)

Le composant `AgentAppFileViewer` permet d'afficher des fichiers avec **conversion automatique** des documents Office (Excel, Word, PowerPoint) en PDF pour la prévisualisation.

```tsx
import { AgentAppFileViewer } from "@/components/files/AgentAppFileViewer";

<AgentAppFileViewer
    agentId={AGENT_ID}
    fileName="rapport.xlsx"
    suffix="output"
    className="w-full h-[400px]"
/>;
```

### Props disponibles

| Prop        | Type     | Description                                    |
| ----------- | -------- | ---------------------------------------------- |
| `agentId`   | `string` | ID de l'agent app                              |
| `fileName`  | `string` | Nom du fichier à afficher                      |
| `suffix`    | `string` | Suffix du dossier (`"files"`, `"output"`, etc) |
| `className` | `string` | Classes CSS optionnelles                       |

### Types de fichiers supportés

| Type                        | Viewer         | Conversion         |
| --------------------------- | -------------- | ------------------ |
| PDF                         | `PdfViewer`    | -                  |
| Images (PNG, JPG, GIF, etc) | `ImageViewer`  | -                  |
| Word (.docx, .doc)          | `PdfViewer`    | ✅ Converti en PDF |
| Excel (.xlsx, .xls)         | `PdfViewer`    | ✅ Converti en PDF |
| PowerPoint (.pptx, .ppt)    | `PdfViewer`    | ✅ Converti en PDF |
| Texte (.txt, .md, .json)    | `TextViewer`   | -                  |
| HTML                        | `HtmlViewer`   | -                  |
| Autres                      | Téléchargement | -                  |

### Pattern recommandé : Viewer automatique

Afficher le viewer automatiquement dès qu'un fichier existe :

```tsx
{
    existingFileName && (
        <div className="h-[400px] border rounded-xl overflow-hidden">
            <AgentAppFileViewer
                agentId={AGENT_ID}
                fileName={existingFileName}
                suffix="files"
                className="w-full h-full"
            />
        </div>
    );
}
```

---

## Reset

Le reset remet le store à son état initial. Dans le toolkit, la gestion des fichiers est locale via `useState`, donc le reset store suffit — pas besoin de `resetWithCleanup`.

```tsx
const resetAll = useMyAgentStore((s) => s.resetAll);

// Passer onReset à AgentAppPageShell
<AgentAppPageShell
  ...
  onReset={resetAll}
  resetDisabled={isProcessing}
>
```

Si votre agent a uploadé des fichiers sur le backend, nettoyez-les manuellement dans le handler de reset du composant :

```tsx
const handleReset = async () => {
    // Nettoyer les fichiers backend si nécessaire
    await fetch(`/agent-apps/${AGENT_ID}/cleanup`, { method: "DELETE" }).catch(
        () => {},
    );
    // Reset du store
    resetAll();
    // Reset de l'état local
    setUploadedFiles([]);
};
```

---

## StepIndicator

Indicateur de progression multi-étapes avec navigation bidirectionnelle :

```tsx
<StepIndicator
    steps={[
        { key: "context", label: "Contexte" },
        { key: "generation", label: "Génération" },
        { key: "export", label: "Export" },
    ]}
    currentStep={step}
    maxReachedStep={maxReachedStep}
    onStepClick={setStep}
    variant="pills"
/>
```

### Props

| Prop             | Type                                             | Description                                                |
| ---------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| `steps`          | `readonly { key: string; label: string }[]`      | Définition des étapes                                      |
| `currentStep`    | `number`                                         | Étape actuellement affichée (1-indexed)                    |
| `maxReachedStep` | `number` (optional)                              | Étape maximale atteinte. Permet la navigation vers l'avant |
| `onStepClick`    | `(step: number) => void`                         | Callback lors du clic sur une étape                        |
| `variant`        | `"pills" \| "neo-pills" \| "numbered" \| "line"` | Style visuel de l'indicateur                               |

### Navigation bidirectionnelle

Quand `maxReachedStep` est fourni, l'utilisateur peut naviguer :

- **En arrière** : vers toutes les étapes précédentes (< currentStep)
- **En avant** : vers les étapes déjà visitées (> currentStep mais ≤ maxReachedStep)

Le store doit tracker `maxReachedStep` et le mettre à jour dans `setStep` :

```typescript
setStep: (step) =>
  set((state) => ({
    step,
    maxReachedStep: Math.max(state.maxReachedStep, step),
  })),
```

### Règles d'usage obligatoires

- **Variante Elio** : `variant="pills"` — style Elio classique avec badges colorés et numéros/check marks
- **Variante Neo** : `variant="neo-pills"` — gradient bleu, fond semi-transparent, responsive mobile avec overflow-x auto
- **Navigation user** : `onStepClick` appelle `setStep` (jamais `advanceToStep`)
- **Pendant le processing** : désactiver la navigation par étapes

```tsx
// ✅ Elio — variant pills
<StepIndicator
    steps={stepLabels}
    currentStep={currentStep}
    maxReachedStep={maxReachedStep}
    onStepClick={isProcessing ? undefined : setStep}
    variant="pills"
/>

// ✅ Neo — variant neo-pills
<StepIndicator
    steps={stepLabels}
    currentStep={currentStep}
    maxReachedStep={maxReachedStep}
    onStepClick={isProcessing ? undefined : setStep}
    variant="neo-pills"
/>
```

---

## Responsive Design

Toutes les pages doivent être responsive. Règles principales :

1. **Padding** : `px-4 md:px-6 lg:px-8`
2. **Gaps** : `gap-3 md:gap-6`
3. **Grids** : `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
4. **Texte** : Adapter les tailles avec `text-sm md:text-base`
5. **Visibilité** : Utiliser `hidden md:block` ou `md:hidden` pour afficher/masquer

---

## Traductions (i18n)

Tout texte affiché doit être traduit via `useTranslation` :

```tsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation();

// Utilisation avec namespace
<h2>{t("monAgent.titre")}</h2>
<p>{t("monAgent.description")}</p>
```

**Convention de nommage des clés** : Utiliser le nom de l'agent en camelCase comme namespace.
Exemple pour `UserJourneyAgentAppPage` → clés `userJourney.xxx`

Les traductions sont centralisées dans :

- `src/i18n/locales/fr.json`
- `src/i18n/locales/en.json`

⚠️ **Ne jamais hardcoder de texte** - toujours utiliser le système i18n.

### Langue applicative (store) et backend

Pour les Agent Apps, la langue **doit** venir du store global et être transmise
au backend (SSE inclus), sinon les messages restent en français par défaut.

**Règles obligatoires :**

- Utiliser `useLanguageStore()` pour récupérer la langue courante.
- Ne jamais forcer `"fr"` dans un composant.
- Envoyer `language` et `interface_language` dans les requêtes API/SSE.

Exemple minimal :

```tsx
import { useLanguageStore } from "@/stores/language-store";

const { language } = useLanguageStore();
const resolvedLanguage = language ?? "fr";

const response = await fetch("/api/agent-apps/execute/.../stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        /* payload */
        language: resolvedLanguage,
        interface_language: resolvedLanguage,
    }),
});
```

---

## Utilitaires de téléchargement

Utiliser les fonctions de `@/utils/download.ts` pour les téléchargements :

```tsx
import {
    downloadFile,
    downloadText,
    downloadCsv,
    downloadJson,
} from "@/utils/download";

// Télécharger un Blob (ex: fichier provenant de l'API)
downloadFile(blob, "document.pdf");

// Télécharger du texte brut
downloadText(content, "script.txt");
downloadText(htmlContent, "page.html", "text/html");

// Télécharger un CSV (compatible Excel avec séparateur ;)
downloadCsv(
    ["Nom", "Email", "Rôle"],
    [["Alice", "alice@example.com", "Admin"]],
    "users",
);

// Télécharger du JSON
downloadJson({ data: "value" }, "export");
```

⚠️ **Ne pas recréer ces fonctions** dans chaque page - réutiliser l'utilitaire.

---

## Multi-Step Navigation Pattern (Stores)

Tous les stores Zustand d'agent-app multi-step **doivent** suivre ce pattern pour la navigation par étapes.

### State Shape

```typescript
interface StepState {
    step: StepType; // Current visible step (e.g. 1 | 2 | 3)
    maxReachedStep: StepType; // Highest step the user has validly reached
}
```

### Deux méthodes — Deux sémantiques

| Méthode               | Comportement                               | Quand l'utiliser                                                                                                                              |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `setStep(step)`       | `maxReachedStep = Math.max(current, step)` | **Navigation user** — clic sur le stepper. Préserve les étapes futures.                                                                       |
| `advanceToStep(step)` | `maxReachedStep = step`                    | **Après génération** — les nouvelles données invalident les étapes futures. Reset `maxReachedStep` pour empêcher l'accès à du contenu périmé. |

### Implémentation

```typescript
// In Actions interface
setStep: (step: StepType) => void;
advanceToStep: (step: StepType) => void;

// In store implementation
setStep: (step) =>
  set((state) => ({
    step,
    maxReachedStep: Math.max(state.maxReachedStep, step),
  })),
advanceToStep: (step) =>
  set({
    step,
    maxReachedStep: step,
  }),
```

### Utilisation dans les callbacks de génération

```typescript
// ✅ CORRECT — advanceToStep puis set le reste
get().advanceToStep(2);
set({
    result: data,
    isProcessing: false,
    loadingAction: "",
});

// ❌ WRONG — step + maxReachedStep inline dans set()
set({
    result: data,
    step: 2,
    maxReachedStep: 2,
    isProcessing: false,
    loadingAction: "",
});
```

### Convention de nommage

| Certains stores utilisent | D'autres utilisent | Les deux sont valides                                            |
| ------------------------- | ------------------ | ---------------------------------------------------------------- |
| `step`                    | `currentStep`      | Le nommage existant doit rester cohérent au sein de chaque store |

> **Règle** : Ne jamais setter `maxReachedStep` en inline. Toujours passer par `setStep()` ou `advanceToStep()`.

---

## Checklist de création

- [ ] Dupliquer `YourUseCaseAgentPage.tsx` → renommer `{AgentName}AgentAppPage.tsx`
- [ ] Dupliquer `yourUseCaseAgentStore.ts` → renommer `{agentName}Store.ts`
- [ ] **`AgentAppPageShell`** utilisé comme shell (pas de header + layout + overlay manuels)
- [ ] `iconContainerClassName` avec les bonnes couleurs + variante dark (`dark:bg-{color}-900/30`)
- [ ] **Thème sombre** : tous les `bg-{color}-100` ont leur `dark:bg-{color}-900/30`
- [ ] **Thème sombre** : tous les `text-{color}-700` ont leur `dark:text-{color}-300`
- [ ] Pas de prop `icon` sur `GenerateButton`
- [ ] **Store Zustand** : store dédié avec `setCurrentStep` / `advanceToStep` (pas de `maxReachedStep` inline)
- [ ] **Sélecteurs Zustand individuels** : pas de destructuring du store entier
- [ ] **SSE** : `readSSEStream` depuis `@/services/sseStreamService` (pas `executeAgentStreaming`)
- [ ] **Annulation** : `isCancelledRef` vérifié en début de chaque callback SSE
- [ ] **Files** : `useState<File[]>` local — pas de `useAgentFiles` (non disponible dans le toolkit)
- [ ] **FileUploadZone** : `disabled={isProcessing}` + `isUploading` pendant l'upload
- [ ] **Inputs** : `disabled={isProcessing}` sur TOUS les contrôles de formulaire
- [ ] **FormField/FormInput/FormTextarea** utilisés (pas de `<input>` / `<textarea>` HTML bruts)
- [ ] **ErrorBanner** utilisé pour les erreurs (pas de div inline)
- [ ] **StepIndicator** : `variant="pills"`, `onStepClick={isProcessing ? undefined : setCurrentStep}`
- [ ] Tous les textes traduits via i18n (`useTranslation`) — zéro chaîne en dur
- [ ] **LanguageToggle** : présent via `headerExtra={<LanguageToggle />}` dans le shell
- [ ] **interface_language** : `i18n.language` envoyé dans TOUS les payloads SSE
- [ ] **Étapes éditables** : chaque résultat intermédiaire est modifiable par l'utilisateur
- [ ] **Auto-scroll** si streaming : `useRef` + `useEffect` sur le tableau de messages
- [ ] Responsive sur mobile (tester en 375px)
- [ ] Tester en mode clair ET sombre

---

## Toggle de langue (OBLIGATOIRE)

Le toolkit inclut un composant `LanguageToggle` qui permet à l'utilisateur de basculer entre français et anglais. Ce toggle **doit** être présent sur chaque page Agent App.

### Composant

```tsx
import { LanguageToggle } from "@/components/agent-apps";
```

Le toggle est un pill EN/FR qui appelle `i18n.changeLanguage()`. Tous les textes traduits via `useTranslation()` se mettent à jour automatiquement.

### Placement dans AgentAppPageShell

Utiliser la prop `headerExtra` du shell pour placer le toggle dans le header, à côté du bouton reset :

```tsx
<AgentAppPageShell
    title={t("myAgent.title")}
    description={t("myAgent.description")}
    icon={<Sparkles className="w-5 h-5" />}
    isProcessing={false}
    onReset={resetAll}
    headerActions={<StepIndicator ... />}
    headerExtra={<LanguageToggle />}
    useSimpleLayout
>
    {/* Contenu */}
</AgentAppPageShell>
```

### Propagation au backend

La langue sélectionnée **doit** être envoyée au backend dans chaque payload SSE via le champ `interface_language` :

```typescript
const { i18n } = useTranslation();

body: JSON.stringify({
    topic,
    // ... autres paramètres
    interface_language: i18n.language,  // ← OBLIGATOIRE
}),
```

Le backend utilise `interface_language` pour sélectionner le fichier de prompts approprié (`prompt_fr.py` ou `prompt_en.py`).

---

## Étapes éditables (OBLIGATOIRE)

Les résultats générés par le LLM à chaque étape intermédiaire **doivent** être éditables par l'utilisateur avant de passer à l'étape suivante.

### Principe

- Le LLM génère un résultat initial (ex : personas, paramètres, texte)
- L'utilisateur peut modifier ces résultats via des champs éditables
- L'étape suivante utilise les données **modifiées**, pas les données brutes du LLM

### Pattern dans le store Zustand

```typescript
// Le store stocke les données générées ET les modifications utilisateur
persona1: Persona | null;
setPersona1: (persona: Persona) => void;
// ... idem pour chaque donnée éditable
```

### Pattern dans la page

```tsx
// Champs éditables pour chaque donnée générée
<FormInput
    value={persona1.name}
    onChange={(e) => setPersona1({ ...persona1, name: e.target.value })}
    disabled={isProcessing}
/>
```

> **Important** : les résultats LLM sont un **point de départ**, pas un résultat final. L'utilisateur doit toujours pouvoir ajuster avant de continuer.
