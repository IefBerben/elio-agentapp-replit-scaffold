# Agent App Page Guidelines

Ce document définit les règles et bonnes pratiques pour créer une nouvelle page d'Agent App.

---

## Structure de base

Chaque Agent App Page doit utiliser les composants partagés :

```tsx
import {
    AgentAppCard,
    AgentAppPageShell,
    AgentAppSection,
    AgentAppSelect,
    ErrorBanner,
    FilesList,
    FileUploadZone,
    GenerateButton,
    StepIndicator,
} from "@/components/agent-apps";
import { AgentAppFileViewer } from "@/components/files/AgentAppFileViewer";
import { useAgentFiles } from "@/hooks/useAgentFiles";
import { Icons as AgentIcons } from "@/constants/agentsConstants";

// Store Zustand (dans /stores/agent-apps/)
import { useMyAgentStore } from "@/stores/agent-apps/myAgentStore";
```

---

## Liste des composants mutualisés

| Composant              | Description                                                | Section                                           |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| `AgentAppPageShell`    | **Shell complet** : header + layout + overlay (RECOMMANDÉ) | [Choix du Layout](#choix-du-layout)               |
| `AgentAppHeader`       | Header avec icône, titre, description et reset button      | [Choix du Layout](#choix-du-layout)               |
| `AgentAppSimpleLayout` | Layout simple avec scroll (flex container)                 | [AgentAppSimpleLayout](#agentappsimplelayout)     |
| `AgentAppCard`         | Container stylisé pour sections de contenu                 | [AgentAppCard](#agentappcard)                     |
| `AgentAppSection`      | Header de section avec titre/description/actions           | [AgentAppSection](#agentappsection)               |
| `AgentAppSelect`       | Dropdown stylisé (style AssistantHistory)                  | [AgentAppSelect](#agentappselect)                 |
| `ErrorBanner`          | Bandeau d'erreur conditionnel mutualisé                    | [ErrorBanner](#errorbanner)                       |
| `FileUploadZone`       | Zone de dépôt de fichiers drag & drop                      | [FileUploadZone](#fileuploadzone)                 |
| `FilesList`            | Liste de fichiers avec actions delete/download             | [FilesList](#fileslist)                           |
| `GenerateButton`       | Bouton d'action principal gradient bleu                    | [GenerateButton](#generatebutton)                 |
| `ProgressBanner`       | Banderole bleue inline (non-bloquant, avec ou sans barre)  | [ProgressBanner](#progressbanner)                 |
| `GeneratingOverlay`    | Overlay de chargement avec bouton stop                     | [GeneratingOverlay](#generatingoverlay-important) |
| `ResetButton`          | Bouton de réinitialisation (standalone)                    | [ResetButton](#resetbutton)                       |
| `StepIndicator`        | Indicateur d'étapes pour workflows multi-step              | [StepIndicator](#stepindicator)                   |
| `AgentAppFileViewer`   | Prévisualisation de fichiers (Office→PDF)                  | [AgentAppFileViewer](#agentappfileviewer)         |

### Composants UI partagés (depuis `@/components/ui/`)

| Composant    | Import                       | Description                                       |
| ------------ | ---------------------------- | ------------------------------------------------- |
| `CopyButton` | `@/components/ui/CopyButton` | Bouton copie presse-papiers avec feedback visuel  |
| `Tabs`       | `@/components/ui/tabs`       | Onglets (Radix UI) — préférer aux boutons manuels |

---

## Choix du Layout

### Pattern recommandé : `AgentAppPageShell` (NOUVEAU)

Le composant `AgentAppPageShell` remplace le pattern manuel `AgentAppHeader` + `AgentAppSimpleLayout` + `GeneratingOverlay`. Il élimine ~25-40 lignes de boilerplate par page.

```tsx
import { AgentAppPageShell } from "@/components/agent-apps";

const { reset, isProcessing } = useMyAgentStore();

<AgentAppPageShell
    title="Nom de l'Agent"
    description="Description courte"
    icon={<AgentIcons.Sales />}
    iconContainerClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30"
    isProcessing={isProcessing}
    loadingMessage={loadingAction}
    onStop={handleStop}
    onReset={reset}
    useSimpleLayout // Wrap children in AgentAppSimpleLayout
>
    <AgentAppCard>{/* Sections... */}</AgentAppCard>
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

Banderole bleue **inline, non-bloquante** pour afficher la progression d'une opération directement dans le contenu de la page. À préférer à `GeneratingOverlay` lorsque l'UI doit rester visible et interactive pendant le traitement (ex : streaming de messages).

```tsx
import { ProgressBanner } from "@/components/agent-apps";

// Avec barre de progression (étape de génération discrète)
<ProgressBanner
    title={progressInfo?.title ?? t("agent.generating")}
    description={progressInfo?.description}
    progress={progressInfo?.progress} // 0-100
    onStop={handleStop}
/>

// Sans barre de progression (streaming / durée inconnue)
<ProgressBanner
    title={t("agent.generatingDiscussion")}
    onStop={handleStop}
/>
```

### Props disponibles

| Prop          | Type          | Description                                                 |
| ------------- | ------------- | ----------------------------------------------------------- |
| `title`       | `string`      | Label principal affiché pendant le traitement (obligatoire) |
| `description` | `string?`     | Sous-titre / description de la phase courante               |
| `progress`    | `number?`     | 0–100. Si fourni, affiche une barre de progression animée   |
| `onStop`      | `() => void?` | Si fourni, affiche un bouton stop                           |
| `className`   | `string?`     | Classes CSS additionnelles                                  |

### Quand utiliser `ProgressBanner` vs `GeneratingOverlay`

| Situation                                                                  | Composant recommandé |
| -------------------------------------------------------------------------- | -------------------- |
| Streaming de messages (affichage progressif)                               | `ProgressBanner`     |
| Génération avec progression connue (0→100%)                                | `ProgressBanner`     |
| Opération bloquante courte, pas d'interaction nécessaire                   | `GeneratingOverlay`  |
| L'utilisateur doit voir ET interagir avec le contenu pendant le traitement | `ProgressBanner`     |

### Pattern non-bloquant pour AgentAppPageShell

Pour les pages avec streaming ou progression inline, désactiver l'overlay de `AgentAppPageShell` et utiliser `ProgressBanner` dans chaque étape :

```tsx
<AgentAppPageShell
    title="..."
    description="..."
    icon={<Sparkles />}
    // Disable blocking overlay — feedback handled inline via ProgressBanner
    isProcessing={false}
    // Still disable the reset button during processing
    resetDisabled={isProcessing}
    onReset={resetAll}
    useSimpleLayout
>
    {/* Step content with ProgressBanner rendered inline — banner at the TOP */}
    {currentStep === 1 && (
        <div className="space-y-4 px-4 md:px-6">
            {isProcessing ? (
                <ProgressBanner
                    title={progressInfo?.title}
                    progress={progressInfo?.progress}
                    onStop={handleStop}
                />
            ) : (
                <GenerateButton onClick={handleGenerate} ... />
            )}
            <AgentAppCard>{/* Form */}</AgentAppCard>
        </div>
    )}
</AgentAppPageShell>
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

- Les états runtime : `isProcessing`, `loadingAction`, `isCancelled`, `error`
- Les images base64 / data URL : `creativeImage`, `imageUrl`, `customLogo`, etc.
- Les tableaux contenant des images imbriquées : les nettoyer avec `.map()` ou `.filter()`

Le localStorage a une limite de ~5 Mo par origine. Une image base64 peut facilement dépasser ce quota et provoquer `DOMException: The quota has been exceeded`.

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

### Pattern AbortController (pour les appels agents)

Deux patterns d'exécution sont disponibles selon vos besoins. Les deux supportent l'annulation via `handleStop`.

#### Pattern 1 : SSE Streaming (`executeAgentStreaming`)

Pour les agents nécessitant des mises à jour en temps réel (streaming SSE). Retourne un `AbortController` natif :

```tsx
import { executeAgentStreaming } from "@/services/agentExecutionService";

const MyAgentPage: React.FC = () => {
    const abortControllerRef = useRef<AbortController | null>(null);
    const { setIsProcessing, handleStop: storeHandleStop } = useMyAgentStore();

    const handleStop = useCallback(() => {
        abortControllerRef.current?.abort(); // AbortController natif
        abortControllerRef.current = null;
        setIsProcessing(false);
        storeHandleStop();
    }, [storeHandleStop, setIsProcessing]);

    const handleGenerate = async () => {
        setIsProcessing(true);

        const controller = executeAgentStreaming(
            AGENT_ID,
            {
                /* params */
            },
            // onUpdate - appelé pour chaque chunk SSE
            (update) => {
                // update.partial_text contient le texte progressif
                setPartialResult(update.partial_text);
            },
            // onComplete
            (result) => {
                setIsProcessing(false);
                abortControllerRef.current = null;
            },
            // onError
            (err) => {
                setIsProcessing(false);
                abortControllerRef.current = null;
            },
        );

        abortControllerRef.current = controller; // AbortController natif
    };
};
```

**Caractéristiques SSE :**

- Retourne un `AbortController` natif
- Mises à jour en temps réel via Server-Sent Events
- Gère automatiquement les événements `keepalive`, `completed`, `error`
- Utiliser quand : génération de texte avec affichage progressif

#### Pattern 2 : Polling Fallback (`executeAgentWithPollingFallback`) - Recommandé

Pattern robuste qui tente SSE puis bascule sur polling si SSE échoue. Retourne `{ abort: () => void }` :

```tsx
import { executeAgentWithPollingFallback } from "@/services/agentExecutionService";

const MyAgentPage: React.FC = () => {
    const isCancelledRef = useRef(false);
    const abortRef = useRef<{ abort: () => void } | null>(null);

    const { setIsProcessing, handleStop: storeHandleStop } = useMyAgentStore();

    const handleStop = useCallback(() => {
        isCancelledRef.current = true;
        abortRef.current?.abort(); // Appelle la fonction abort()
        abortRef.current = null;
        setIsProcessing(false);
        storeHandleStop();
    }, [storeHandleStop, setIsProcessing]);

    const handleGenerate = async () => {
        isCancelledRef.current = false;
        setIsProcessing(true);

        const controller = executeAgentWithPollingFallback(
            AGENT_ID,
            {
                /* params */
            },
            // onUpdate
            (update) => {
                /* gérer les mises à jour progressives */
            },
            // onComplete
            (result) => {
                setIsProcessing(false);
                abortRef.current = null;
                // Traiter le résultat
            },
            // onError
            (err) => {
                setIsProcessing(false);
                abortRef.current = null;
                setError(err.message);
            },
        );

        abortRef.current = controller; // { abort: () => void }
    };
};
```

**Caractéristiques Polling Fallback :**

- Retourne `{ abort: () => void }` (pas un AbortController natif)
- Tente SSE d'abord, puis bascule automatiquement sur polling si erreur
- Plus robuste dans les environnements avec proxies/firewalls
- Utiliser quand : fiabilité prioritaire, ou si SSE peut échouer

#### Comparaison des patterns

| Aspect         | `executeAgentStreaming` | `executeAgentWithPollingFallback` |
| -------------- | ----------------------- | --------------------------------- |
| **Retour**     | `AbortController` natif | `{ abort: () => void }`           |
| **Fallback**   | Non                     | Oui (SSE → Polling)               |
| **Use case**   | Streaming temps réel    | Production robuste                |
| **Recommandé** | Développement           | Production ✅                     |

**Points clés communs :**

- Stocker le controller dans un `useRef` pour y accéder dans `handleStop`
- Appeler `.abort()` dans `handleStop` pour annuler la requête HTTP
- Nettoyer la ref à `null` dans les callbacks `onComplete` et `onError`
- `isCancelledRef` : flag **OBLIGATOIRE** pour vérifications dans les callbacks

### Vérifier isCancelledRef dans les callbacks SSE

Quand l'utilisateur clique "Stop", `abort()` annule la requête fetch, mais des messages SSE peuvent encore être en transit. Sans vérification, ces messages mettent à jour le state après l'arrêt.

Toujours vérifier `isCancelledRef.current` au début de chaque callback :

```tsx
const isCancelledRef = useRef(false);

// ❌ MAUVAIS - Les messages SSE en vol mettent à jour le state après stop
const processMessage = (update: SSEMessage): boolean => {
    if (update.status === "in_progress") {
        setProgressInfo({ title: update.title, progress: update.progress });
    }
    return false;
};

// ✅ BON - Ignorer les messages si l'utilisateur a cliqué Stop
const processMessage = (update: SSEMessage): boolean => {
    // Ignorer les updates si annulé
    if (isCancelledRef.current) {
        return false;
    }

    if (update.status === "in_progress") {
        setProgressInfo({ title: update.title, progress: update.progress });
    }
    return false;
};
```

**Séquence correcte de handleStop :**

```tsx
const handleStop = useCallback(() => {
    // 1. Set le flag AVANT d'appeler abort()
    isCancelledRef.current = true;

    // 2. Abort la requête
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    // 3. Mettre à jour le state du store
    setIsProcessing(false);
    storeHandleStop();
}, [storeHandleStop, setIsProcessing]);
```

**Pourquoi c'est important :**

- SSE = streaming, les messages arrivent de façon asynchrone
- `abort()` annule la requête mais les messages déjà reçus sont traités
- Sans `isCancelledRef`, la progression réapparaît après avoir cliqué Stop

### Usage dans le composant

```tsx
import { useMyAgentStore } from "@/stores/agent-apps/myAgentStore";

const MyAgentPage: React.FC = () => {
    const {
        step,
        setStep,
        context,
        setContext,
        results,
        isProcessing,
        loadingAction,
        error,
        generate,
        handleStop,
        reset,
    } = useMyAgentStore();

    // L'état est automatiquement restauré depuis le store
    // La génération continue même si l'utilisateur navigue ailleurs

    return (
        <AgentAppPageShell
            title="Mon Agent"
            description="Description"
            icon={<AgentIcons.Marketing />}
            iconContainerClassName="bg-pink-100 text-pink-700 dark:bg-pink-900/30"
            isProcessing={isProcessing}
            loadingMessage={loadingAction}
            onStop={handleStop}
            onReset={reset}
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

## Gestion des fichiers avec le backend (IMPORTANT)

**Les objets `File` JavaScript ne peuvent pas être sérialisés** dans un store Zustand. Pour persister les fichiers entre navigations, utiliser le hook `useAgentFiles`.

### Convention de nommage

| Élément    | Convention           | Exemple                                                 |
| ---------- | -------------------- | ------------------------------------------------------- |
| `MODULE`   | `"agent-app"` (fixe) | `"agent-app"`                                           |
| `AGENT_ID` | kebab-case           | `"dynamic-persona"`, `"content-studio"`                 |
| `suffix`   | fonction du fichier  | `"files"`, `"context"`, `"personas"`, `"existing-plan"` |

**Chemin blob** : `agent-app/{agent-id}/{suffix}/`

### Imports requis

```tsx
import { FilesList } from "@/components/agent-apps/FilesList";
import { FileUploadZone } from "@/components/agent-apps/FileUploadZone";
import { useAgentFiles } from "@/hooks/useAgentFiles";
```

### Pattern recommandé avec `useAgentFiles`

```tsx
const AGENT_ID = "my-agent"; // kebab-case

const MyAgentPage: React.FC = () => {
    // Hook pour la gestion des fichiers
    const {
        inputFiles, // Fichiers d'entrée
        outputFiles, // Fichiers de sortie
        isLoading, // État de chargement
        deletingFile, // Fichier en cours de suppression (format: "filename-suffix")
        uploadFiles, // Upload de fichiers
        deleteFile, // Suppression de fichier
        downloadFile, // Téléchargement de fichier
        refreshFiles, // Rafraîchir la liste
    } = useAgentFiles({
        agentId: AGENT_ID,
        inputSuffix: "files", // défaut
        outputSuffix: "output", // défaut
    });

    // Local copy for generation (File objects not serializable)
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Upload files handler
    const handleFileSelect = async (newFiles: File[]) => {
        if (newFiles.length === 0) return;
        try {
            setIsUploading(true);
            await uploadFiles(newFiles);
            setFiles((prev) => [...prev, ...newFiles]); // Keep local copy for generation
        } catch (err) {
            console.error("Failed to upload files:", err);
            setError("Failed to upload files");
        } finally {
            setIsUploading(false);
        }
    };

    // Delete file handler
    const handleDeleteFile = async (fileName: string) => {
        await deleteFile(fileName, "input");
        setFiles((prev) => prev.filter((f) => f.name !== fileName));
    };

    return (
        <>
            <FileUploadZone
                onFileSelect={handleFileSelect}
                accept=".pdf,.docx"
                multiple
                isUploading={isUploading}
                hint="PDF, Word"
            />
            <FilesList
                files={inputFiles}
                onDelete={handleDeleteFile}
                deletingFile={
                    deletingFile?.endsWith("-files")
                        ? deletingFile.replace("-files", "")
                        : null
                }
                isLoading={isLoading}
                className="mt-3"
            />
        </>
    );
};
```

### API du hook `useAgentFiles`

| Propriété/Méthode | Type                                                             | Description                  |
| ----------------- | ---------------------------------------------------------------- | ---------------------------- |
| `inputFiles`      | `FileItem[]`                                                     | Liste des fichiers d'entrée  |
| `outputFiles`     | `FileItem[]`                                                     | Liste des fichiers de sortie |
| `isLoading`       | `boolean`                                                        | État de chargement           |
| `deletingFile`    | `string \| null`                                                 | Fichier en suppression       |
| `uploadFiles`     | `(files: File[], suffix?: string) => Promise<void>`              | Upload de fichiers           |
| `deleteFile`      | `(fileName: string, type: "input" \| "output") => Promise<void>` | Supprime un fichier          |
| `downloadFile`    | `(fileName: string, type: "input" \| "output") => Promise<void>` | Télécharge un fichier        |
| `refreshFiles`    | `() => Promise<void>`                                            | Rafraîchit les listes        |
| `clearFiles`      | `() => void`                                                     | Vide l'état local            |
| `error`           | `string \| null`                                                 | Erreur éventuelle            |
| `clearError`      | `() => void`                                                     | Efface l'erreur              |

### Pages avec zones multiples

Pour les pages avec plusieurs zones de fichiers distinctes, utiliser des suffixes personnalisés :

```tsx
const AGENT_ID = "dynamic-persona";

// Hook avec suffixes personnalisés
const {
    inputFiles: contextFiles,
    outputFiles: personaFiles,
    uploadFiles,
    deleteFile,
} = useAgentFiles({
    agentId: AGENT_ID,
    inputSuffix: "context",
    outputSuffix: "personas",
});

// Upload vers zone contexte
await uploadFiles(files, "context");

// Upload vers zone personas
await uploadFiles(files, "personas");

// Suppression selon le type
await deleteFile(fileName, "input"); // → "context"
await deleteFile(fileName, "output"); // → "personas"
```

### Suffixes recommandés

| Suffix            | Usage                             |
| ----------------- | --------------------------------- |
| `"files"`         | Zone de fichiers d'entrée (input) |
| `"output"`        | Fichiers générés/sortie           |
| `"context"`       | Documents de contexte             |
| `"personas"`      | Fichiers de personas              |
| `"existing-plan"` | Documents de plan existant        |

⚠️ **Important** : Utiliser `"output"` (singulier) et non `"outputs"`.

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

## Reset avec cleanup des fichiers output (resetWithCleanup)

Pour les agents qui génèrent des fichiers output, le bouton reset doit également supprimer ces fichiers du backend.

### Pattern store (utilise filesApi directement)

> **Note** : Les stores Zustand ne peuvent pas utiliser les hooks React. Ils doivent donc utiliser `filesApi` directement pour les opérations asynchrones de nettoyage.

```tsx
// Dans le store Zustand
import { filesApi } from "@/services/files/FilesApi";

resetWithCleanup: async () => {
  // Lister et supprimer tous les fichiers output via filesApi (stores cannot use hooks)
  try {
    const resp = await filesApi.listFiles("agent-app", AGENT_ID, undefined, "output");
    if (resp.files && resp.files.length > 0) {
      for (const file of resp.files) {
        try {
          await filesApi.deleteFile(file.name, "agent-app", AGENT_ID, undefined, "output");
        } catch (error) {
          console.error(`Failed to delete output file ${file.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Failed to list/delete output files:", error);
  }

  // Reset l'état local
  get().reset();
},
```

### Pattern composant (utilise le hook)

```tsx
const { resetWithCleanup } = useMyAgentStore();
const { outputFiles, refreshFiles } = useAgentFiles({ agentId: AGENT_ID });

// Handler qui reset aussi l'affichage local
const handleResetWithCleanup = async () => {
  await resetWithCleanup();
  await refreshFiles(); // Rafraîchir pour voir les fichiers supprimés
};

<AgentAppHeader
  ...
  onResetClick={() => void handleResetWithCleanup()}
  resetDisabled={processing}
/>
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

| Prop             | Type                               | Description                                                |
| ---------------- | ---------------------------------- | ---------------------------------------------------------- |
| `steps`          | `{ key: string; label: string }[]` | Définition des étapes                                      |
| `currentStep`    | `number`                           | Étape actuellement affichée (1-indexed)                    |
| `maxReachedStep` | `number` (optional)                | Étape maximale atteinte. Permet la navigation vers l'avant |
| `onStepClick`    | `(step: number) => void`           | Callback lors du clic sur une étape                        |
| `variant`        | `"pills" \| "numbered" \| "line"`  | Style visuel de l'indicateur                               |

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

- **Variante** : Toujours `variant="pills"` dans les agent-apps
- **Navigation user** : `onStepClick` appelle `setStep` (jamais `advanceToStep`)
- **Pendant le processing** : désactiver la navigation par étapes

```tsx
// ✅ Correct — navigation disabled during processing
<StepIndicator
    steps={stepLabels}
    currentStep={currentStep}
    maxReachedStep={maxReachedStep}
    onStepClick={isProcessing ? undefined : setStep}
    variant="pills"
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

- [ ] Utiliser `AgentAppHeader` + `AgentAppSimpleLayout`
- [ ] Icône de header = icône de la catégorie (pas de l'agent)
- [ ] `iconContainerClassName` avec les bonnes couleurs + variante dark
- [ ] **Thème sombre** : tous les `bg-{color}-100` ont leur `dark:bg-{color}-900/30`
- [ ] **Thème sombre** : tous les `text-{color}-700` ont leur `dark:text-{color}-300`
- [ ] Pas de prop `icon` sur `GenerateButton`
- [ ] **GeneratingOverlay** : utiliser le composant commun (pas de custom)
- [ ] **Store Zustand** : pour les agents avec génération longue, créer un store dédié
- [ ] **Pattern stop** : vérifier `isCancelled` après chaque opération async
- [ ] **Gestion fichiers** : utiliser `useAgentFiles` hook (pas de `useState<File[]>` seul)
- [ ] **Suffix** : utiliser `"files"` pour les entrées, `"output"` (singulier) pour les sorties
- [ ] **FilesList** : afficher les fichiers backend avec `FilesList` (pas de badges custom)
- [ ] **FileUploadZone** : passer `isUploading` pendant l'upload
- [ ] **AgentAppFileViewer** : utiliser pour la prévisualisation de fichiers (conversion Office vers PDF automatique)
- [ ] **resetWithCleanup** : supprimer les fichiers output du backend lors du reset
- [ ] Responsive sur mobile (tester !)
- [ ] Header fixe sur desktop, scrollable sur mobile (géré automatiquement)
- [ ] Tous les textes traduits via i18n (pas de texte hardcodé)
- [ ] Utiliser `@/utils/download.ts` pour les téléchargements
- [ ] Nommage du fichier : `{AgentName}AgentAppPage.tsx`
- [ ] **Inputs** : `disabled={isProcessing}` sur TOUS les contrôles de formulaire
- [ ] **shadcn inputs** : `Input`/`Textarea` depuis `@/components/ui/`, jamais `<input>` brut
- [ ] **`.map()` keys** : clé stable (`item.id`), jamais l'index (`i`)
- [ ] **Auto-scroll** : `useRef` + `useEffect` sur `messages` pour toute interface streaming
- [ ] **StepIndicator** : `variant="pills"`, `onStepClick={isProcessing ? undefined : setStep}`
- [ ] **Tester en mode clair ET sombre avant validation**
