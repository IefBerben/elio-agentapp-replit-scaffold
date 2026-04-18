/**
 * StarterPage — the 3-path on-ramp at /.
 *
 * Helps the consultant pick one of three entry points:
 *   1. They already have product.md → coach them to type "Build my app"
 *   2. They have a Google AI Studio export in Input/ → same, different prompt
 *   3. They have nothing → run the idea_lab agent to brainstorm 3 ideas
 *
 * DISPOSABLE — once the consultant picks a path, this page can be removed by
 * asking the Agent: "Remove the starter page". The `remove-starter` skill
 * deletes this file, the ideaLabStore, the back/agents/idea_lab/ folder, and
 * the matching AGENTS_MAP / route entries.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  FileText,
  Lightbulb,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  AgentAppCard,
  AgentAppPageShell,
  AgentAppSection,
  ErrorBanner,
  FileUploadZone,
  FormField,
  FormInput,
  FormTextarea,
  GenerateButton,
  LanguageToggle,
  ProgressBanner,
} from "@/components/agent-apps";
import { useIdeaLabStore } from "@/stores/agent-apps/ideaLabStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScaffoldStatus {
  hasProductMd: boolean;
  isProductMdTemplate: boolean;
  inputFiles: string[];
  dismissed: boolean;
}

type Path = "product-md" | "input-file" | "idea-lab";

// ─── Hook: scaffold-status ────────────────────────────────────────────────────

function useScaffoldStatus(): {
  status: ScaffoldStatus | null;
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState<ScaffoldStatus | null>(null);
  const refresh = async () => {
    try {
      const r = await fetch("/agent-apps/scaffold-status");
      if (r.ok) setStatus(await r.json());
    } catch {
      /* best-effort */
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  return { status, refresh };
}

// ─── Coach card — the prompt to paste into the Agent chat ─────────────────────

function CoachPanel({
  prompt,
  language,
}: {
  prompt: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const intro = language === "en"
    ? "Copy the prompt below and paste it into the Replit AI chat:"
    : "Copie l'instruction ci-dessous et colle-la dans le chat IA Replit :";

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs text-muted-foreground">{intro}</p>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-mono break-all">
          {prompt}
        </code>
        <button
          type="button"
          onClick={copy}
          className="px-3 rounded-lg bg-[#009de0] hover:bg-[#0088c4] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === "en" ? "Copied" : "Copié"}
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              {language === "en" ? "Copy" : "Copier"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Upload panel ─────────────────────────────────────────────────────────────

function UploadPanel({
  endpoint,
  accept,
  multiple,
  hint,
  detectedFiles,
  language,
  onUploaded,
}: {
  endpoint: "upload-spec" | "upload-prototype";
  accept: string;
  multiple: boolean;
  hint: string;
  detectedFiles: string[];
  language: string;
  onUploaded: () => Promise<void> | void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList) {
    setIsUploading(true);
    setError(null);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      const r = await fetch(`/agent-apps/${endpoint}`, {
        method: "POST",
        body: form,
      });
      if (!r.ok) {
        const detail = await r.text().catch(() => "");
        throw new Error(`Upload failed (${r.status}) ${detail}`);
      }
      await onUploaded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  }

  const detectedLabel =
    language === "en" ? "Detected in repo:" : "Détectés dans le repo :";

  return (
    <div className="space-y-2">
      <FileUploadZone
        onFileSelect={upload}
        accept={accept}
        multiple={multiple}
        isUploading={isUploading}
        hint={hint}
      />
      {detectedFiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">{detectedLabel}</span>
          {detectedFiles.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 font-mono"
            >
              <CheckCircle2 className="w-3 h-3" />
              {name}
            </span>
          ))}
        </div>
      )}
      <ErrorBanner error={error} />
    </div>
  );
}

// ─── Path card ────────────────────────────────────────────────────────────────

function PathCard({
  icon,
  title,
  description,
  primary,
  highlighted,
  onClick,
  selected,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  primary: string;
  highlighted: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left rounded-xl border p-5 transition-all flex flex-col gap-3",
        "hover:shadow-md hover:-translate-y-0.5",
        selected
          ? "border-[#009de0] bg-blue-50 dark:bg-blue-950/30 shadow-md"
          : highlighted
            ? "border-[#009de0]/40 bg-card ring-1 ring-[#009de0]/20"
            : "border-border bg-card",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div
          className={[
            "w-10 h-10 rounded-lg flex items-center justify-center",
            highlighted || selected
              ? "bg-[#009de0] text-white"
              : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {icon}
        </div>
        {highlighted && !selected && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#009de0]">
            ★
          </span>
        )}
      </div>
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#009de0] mt-auto">
        {primary}
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
}

// ─── Idea Lab form ────────────────────────────────────────────────────────────

function IdeaLabPanel({
  onBack,
  language,
  interfaceLanguage,
}: {
  onBack: () => void;
  language: string;
  interfaceLanguage: string;
}) {
  const { t } = useTranslation();
  const role = useIdeaLabStore((s) => s.context.role);
  const pain = useIdeaLabStore((s) => s.context.pain);
  const result = useIdeaLabStore((s) => s.result);
  const isProcessing = useIdeaLabStore((s) => s.isProcessing);
  const loadingMessage = useIdeaLabStore((s) => s.loadingMessage);
  const error = useIdeaLabStore((s) => s.error);

  function onGenerate() {
    useIdeaLabStore.getState().setContext({ language: language as "fr" | "en" });
    useIdeaLabStore.getState().runIdeaLab(interfaceLanguage);
  }

  const canGenerate = role.trim().length > 1 && pain.trim().length > 3;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        disabled={isProcessing}
      >
        <X className="w-3.5 h-3.5" />
        {t("starter.idea.back")}
      </button>

      <AgentAppCard>
        <AgentAppSection title={t("starter.idea.formTitle") as string} />
        <div className="space-y-3">
          <FormField
            label={t("starter.idea.roleLabel") as string}
            description={t("starter.idea.roleHint") as string}
            required
          >
            <FormInput
              value={role}
              onChange={(e) =>
                useIdeaLabStore.getState().setContext({ role: e.target.value })
              }
              placeholder={t("starter.idea.rolePlaceholder") as string}
              disabled={isProcessing}
            />
          </FormField>

          <FormField
            label={t("starter.idea.painLabel") as string}
            description={t("starter.idea.painHint") as string}
            required
          >
            <FormTextarea
              value={pain}
              onChange={(e) =>
                useIdeaLabStore.getState().setContext({ pain: e.target.value })
              }
              placeholder={t("starter.idea.painPlaceholder") as string}
              disabled={isProcessing}
              rows={3}
            />
          </FormField>

          <ErrorBanner error={error} />

          {isProcessing && (
            <ProgressBanner
              title={loadingMessage || (t("starter.idea.thinking") as string)}
              progress={50}
              onStop={() => useIdeaLabStore.getState().handleStop()}
            />
          )}

          <GenerateButton
            onClick={onGenerate}
            isLoading={isProcessing}
            disabled={!canGenerate}
            label={t("starter.idea.generate") as string}
            loadingLabel={t("starter.idea.generating") as string}
          />
        </div>
      </AgentAppCard>

      {result && result.ideas.length > 0 && (
        <AgentAppCard>
          <AgentAppSection title={t("starter.idea.resultsTitle") as string} />
          <div className="space-y-3">
            {result.ideas.map((idea, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-muted/30 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#009de0] text-white text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      {idea.title}
                    </h4>
                  </div>
                  <p className="text-xs text-foreground italic">
                    {idea.problem}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-muted-foreground">
                        {t("starter.idea.inputs")}:
                      </span>{" "}
                      <span className="text-foreground">{idea.inputs}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-muted-foreground">
                        {t("starter.idea.outputs")}:
                      </span>{" "}
                      <span className="text-foreground">{idea.outputs}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 {idea.why_it_fits}
                  </p>
                </div>
              ))}

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  {t("starter.idea.nextStep")}
                </p>
                <CoachPanel
                  prompt={
                    interfaceLanguage === "en"
                      ? "Talk to the PM — I want to refine idea #2 from the Idea Lab"
                      : "Parle au PM — je veux affiner l'idée #2 de l'Idea Lab"
                  }
                  language={interfaceLanguage}
                />
            </div>
          </div>
        </AgentAppCard>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function StarterPage() {
  const { t, i18n } = useTranslation();
  const { status, refresh } = useScaffoldStatus();
  const [selected, setSelected] = useState<Path | null>(null);

  const lang = i18n.language;

  // Smart highlight priority: Input file > product.md > Idea Lab
  const hasInput = (status?.inputFiles.length ?? 0) > 0;
  const hasProduct = status?.hasProductMd && !status.isProductMdTemplate;

  let primary: Path = "idea-lab";
  if (hasInput) primary = "input-file";
  else if (hasProduct) primary = "product-md";

  async function dismiss(path: Path) {
    setSelected(path);
    if (path === "idea-lab") return; // stay on the page to use Idea Lab
    try {
      await fetch("/agent-apps/dismiss-starter", { method: "POST" });
    } catch {
      /* best-effort */
    }
  }

  const productPrompt =
    lang === "en"
      ? "Build my app from the existing product.md and backlog.md"
      : "Construis mon app à partir des product.md et backlog.md existants";

  const inputPrompt = hasInput
    ? lang === "en"
      ? `Build my app from the Google AI Studio prototype in Input/${status?.inputFiles[0]}`
      : `Construis mon app à partir du prototype Google AI Studio dans Input/${status?.inputFiles[0]}`
    : lang === "en"
      ? "Build my app from the Google AI Studio prototype in Input/"
      : "Construis mon app à partir du prototype Google AI Studio dans Input/";

  return (
    <AgentAppPageShell
      title={t("starter.title")}
      description={t("starter.description")}
      icon={<Sparkles className="w-5 h-5" />}
      iconContainerClassName="bg-gradient-to-br from-[#009de0] to-purple-600 text-white"
      isProcessing={false}
      headerActions={<LanguageToggle />}
    >
      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-6">
        {selected === "idea-lab" ? (
          <IdeaLabPanel
            onBack={() => setSelected(null)}
            language={lang}
            interfaceLanguage={lang}
          />
        ) : (
          <>
            <div className="text-center space-y-2 pt-2">
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                {t("starter.intro")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("starter.subIntro")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PathCard
                icon={<FileText className="w-5 h-5" />}
                title={t("starter.cards.product.title")}
                description={t("starter.cards.product.desc")}
                primary={t("starter.cards.product.cta")}
                highlighted={primary === "product-md"}
                selected={selected === "product-md"}
                onClick={() => dismiss("product-md")}
              />
              <PathCard
                icon={<Upload className="w-5 h-5" />}
                title={t("starter.cards.input.title")}
                description={
                  hasInput
                    ? `${t("starter.cards.input.descDetected")} ${status?.inputFiles[0]}`
                    : t("starter.cards.input.desc")
                }
                primary={t("starter.cards.input.cta")}
                highlighted={primary === "input-file"}
                selected={selected === "input-file"}
                onClick={() => dismiss("input-file")}
              />
              <PathCard
                icon={<Lightbulb className="w-5 h-5" />}
                title={t("starter.cards.idea.title")}
                description={t("starter.cards.idea.desc")}
                primary={t("starter.cards.idea.cta")}
                highlighted={primary === "idea-lab"}
                selected={selected === "idea-lab"}
                onClick={() => dismiss("idea-lab")}
              />
            </div>

            {selected === "product-md" && (
              <AgentAppCard>
                <h3 className="text-sm font-bold text-foreground mb-3">
                  {t("starter.cards.product.title")}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {t("starter.upload.specHint")}
                </p>
                <UploadPanel
                  endpoint="upload-spec"
                  accept=".md"
                  multiple
                  hint={t("starter.upload.specDropHint") as string}
                  detectedFiles={hasProduct ? ["product.md"] : []}
                  language={lang}
                  onUploaded={refresh}
                />
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-foreground">
                    {t("starter.upload.thenStep")}
                  </p>
                  <CoachPanel prompt={productPrompt} language={lang} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("starter.cleanupHint")}
                </p>
              </AgentAppCard>
            )}

            {selected === "input-file" && (
              <AgentAppCard>
                <h3 className="text-sm font-bold text-foreground mb-3">
                  {t("starter.cards.input.title")}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {t("starter.upload.prototypeHint")}
                </p>
                <UploadPanel
                  endpoint="upload-prototype"
                  accept=".tsx,.jsx,.ts,.js,.zip,.json"
                  multiple
                  hint={t("starter.upload.prototypeDropHint") as string}
                  detectedFiles={status?.inputFiles ?? []}
                  language={lang}
                  onUploaded={refresh}
                />
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-foreground">
                    {t("starter.upload.thenStep")}
                  </p>
                  <CoachPanel prompt={inputPrompt} language={lang} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("starter.cleanupHint")}
                </p>
              </AgentAppCard>
            )}
          </>
        )}
      </div>
    </AgentAppPageShell>
  );
}
