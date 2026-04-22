/**
 * StarterPage — on-ramp at /.
 *
 * One entry point: the consultant uploads product.md (from the AgentApp Elio -
 * Value Office) and optionally a Google AI Studio prototype. The suggested
 * prompt triggers the PO skill in conversational mode — the PO iterates with
 * the consultant to produce backlog.md, then hands off to the Builder.
 *
 * Consultants without a product.md are pointed to the AgentApp Elio - Value Office.
 *
 * DISPOSABLE — removed by the `remove-starter` skill once the consultant
 * no longer needs the on-ramp.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  AgentAppCard,
  AgentAppPageShell,
  ErrorBanner,
  FileUploadZone,
  LanguageToggle,
} from "@/components/agent-apps";

// TODO: replace with the real Value Office AgentApp URL once provided.
const VALUE_OFFICE_URL = "https://elio.onepoint.cloud/marketplace/item/ab7c6c91-54b9-419d-b751-fbafa7e60bf8";

interface ScaffoldStatus {
  hasProductMd: boolean;
  isProductMdTemplate: boolean;
  productMdIssues: string[];
  hasBacklogMd: boolean;
  isBacklogMdTemplate: boolean;
  backlogMdIssues: string[];
  inputFiles: string[];
}

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

  const intro =
    language === "en"
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

function PastePanel({
  filename,
  placeholder,
  onSaved,
}: {
  filename: "product.md" | "backlog.md";
  placeholder: string;
  onSaved: () => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!content.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const r = await fetch("/agent-apps/save-spec-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content }),
      });
      if (!r.ok) {
        const detail = await r.text().catch(() => "");
        throw new Error(`Save failed (${r.status}) ${detail}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const label = isSaving
    ? t("starter.upload.pasteSaving")
    : saved
      ? t("starter.upload.pasteSaved")
      : t("starter.upload.pasteSave");

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t("starter.upload.pasteOr")}</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={5}
        disabled={isSaving}
        className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#009de0] disabled:opacity-50"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={isSaving || !content.trim()}
          className="px-3 py-1.5 rounded-lg bg-[#009de0] hover:bg-[#0088c4] text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saved && <CheckCircle2 className="w-3.5 h-3.5" />}
          {label}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}

function SpecIssues({ issues, exists }: { issues: string[]; exists: boolean }) {
  const { t } = useTranslation();
  if (!exists) return null;
  if (issues.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {t("starter.upload.specValid")}
      </p>
    );
  }
  return (
    <div className="mt-1 space-y-0.5">
      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
        {t("starter.upload.specIssuesLabel")}
      </p>
      <ul className="list-disc list-inside space-y-0.5">
        {issues.map((issue) => (
          <li key={issue} className="text-xs text-amber-600 dark:text-amber-400">
            {issue}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StarterPage() {
  const { t, i18n } = useTranslation();
  const { status, refresh } = useScaffoldStatus();

  const lang = i18n.language;
  const hasProduct = !!(status?.hasProductMd && !status.isProductMdTemplate);
  const hasBacklog = !!(status?.hasBacklogMd && !status.isBacklogMdTemplate);
  const hasInput = (status?.inputFiles.length ?? 0) > 0;

  const prompt = buildPmPrompt({
    lang,
    hasProduct,
    hasBacklog,
    hasInput,
    inputFile: status?.inputFiles[0],
  });

  return (
    <AgentAppPageShell
      title={t("starter.title")}
      description={t("starter.description")}
      icon={<Sparkles className="w-5 h-5" />}
      iconContainerClassName="bg-gradient-to-br from-[#009de0] to-purple-600 text-white"
      isProcessing={false}
      headerActions={<LanguageToggle />}
      rootClassName="relative min-h-screen flex flex-col max-w-7xl mx-auto px-4 md:px-6 w-full"
    >
      <div className="space-y-6 pt-6">
        {/* ── Secondary card: pointer to Value Office ────────────────────── */}
        <AgentAppCard>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground">
                {t("starter.cards.valueOffice.title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t("starter.cards.valueOffice.desc")}
              </p>
              <a
                href={VALUE_OFFICE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#009de0] hover:underline"
              >
                {t("starter.cards.valueOffice.cta")}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </AgentAppCard>

        {/* ── Main card: product.md (+ optional prototype) ───────────────── */}
        <AgentAppCard>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#009de0] text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t("starter.cards.product.title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t("starter.cards.product.desc")}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* product.md upload — always visible */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                {t("starter.upload.productStepTitle")}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                {t("starter.upload.productStepHint")}
              </p>
              <UploadPanel
                endpoint="upload-spec"
                accept=".md"
                multiple={false}
                hint={t("starter.upload.specDropHint") as string}
                detectedFiles={hasProduct ? ["product.md"] : []}
                language={lang}
                onUploaded={refresh}
              />
              <PastePanel
                filename="product.md"
                placeholder={t("starter.upload.productPastePlaceholder") as string}
                onSaved={refresh}
              />
              <SpecIssues
                issues={status?.productMdIssues ?? []}
                exists={!!(status?.hasProductMd)}
              />
            </div>

            {/* backlog.md upload — the second artifact from the Value Office */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                {t("starter.upload.backlogStepTitle")}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                {t("starter.upload.backlogStepHint")}
              </p>
              <UploadPanel
                endpoint="upload-spec"
                accept=".md"
                multiple={false}
                hint={t("starter.upload.backlogDropHint") as string}
                detectedFiles={hasBacklog ? ["backlog.md"] : []}
                language={lang}
                onUploaded={refresh}
              />
              <PastePanel
                filename="backlog.md"
                placeholder={t("starter.upload.backlogPastePlaceholder") as string}
                onSaved={refresh}
              />
              <SpecIssues
                issues={status?.backlogMdIssues ?? []}
                exists={!!(status?.hasBacklogMd)}
              />
            </div>

            {/* optional prototype upload */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                {t("starter.upload.prototypeStepTitle")}
                <span className="text-[10px] font-normal normal-case text-muted-foreground">
                  ({t("starter.upload.optional")})
                </span>
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                {t("starter.upload.prototypeStepHint")}
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
            </div>

            {/* next step — PO prompt */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {t("starter.upload.thenStep")}
              </h4>
              {prompt !== null ? (
                <CoachPanel prompt={prompt} language={lang} />
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("starter.upload.thenStepNoProduct")}
                </p>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {t("starter.cleanupHint")}
          </p>
        </AgentAppCard>
      </div>
    </AgentAppPageShell>
  );
}

function buildPmPrompt({
  lang,
  hasProduct,
  hasBacklog,
  hasInput,
  inputFile,
}: {
  lang: string;
  hasProduct: boolean;
  hasBacklog: boolean;
  hasInput: boolean;
  inputFile: string | undefined;
}): string | null {
  if (!hasProduct) return null;

  const prototypeRef = inputFile ? ` + a Google AI Studio prototype in Input/${inputFile}` : "";
  const prototypeRefFr = inputFile ? ` + une maquette Google AI Studio dans Input/${inputFile}` : "";

  if (lang === "en") {
    if (hasBacklog) {
      return `Invoke the product-owner skill. I have product.md and backlog.md (from AgentApp Elio - Value Office)${prototypeRef}. Review the user stories with me, confirm the backlog is correct, then invoke intake-from-markdown.`;
    }
    if (hasInput) {
      return `Invoke the product-owner skill. I have product.md (from AgentApp Elio - Value Office)${prototypeRef}. Propose a backlog using both, iterate with me until I say it's OK, then invoke intake-from-markdown.`;
    }
    return "Invoke the product-owner skill. I have product.md (from AgentApp Elio - Value Office). Propose a backlog, iterate with me until I say it's OK, then invoke intake-from-markdown.";
  }
  if (hasBacklog) {
    return `Invoque la skill product-owner. J'ai product.md et backlog.md (tous deux issus de l'AgentApp Elio - Value Office)${prototypeRefFr}. Relis les US avec moi, confirme que le backlog est correct, puis invoque intake-from-markdown.`;
  }
  if (hasInput) {
    return `Invoque la skill product-owner. J'ai product.md (issu de l'AgentApp Elio - Value Office)${prototypeRefFr}. Propose-moi un backlog en t'appuyant sur les deux, itère avec moi jusqu'à "backlog OK", puis invoque intake-from-markdown.`;
  }
  return 'Invoque la skill product-owner. J\'ai product.md (issu de l\'AgentApp Elio - Value Office). Propose-moi un backlog, itère jusqu\'à "backlog OK", puis invoque intake-from-markdown.';
}
