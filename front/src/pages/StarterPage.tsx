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
const VALUE_OFFICE_URL = "https://elio.onepoint.com/agents/value-office";

interface ScaffoldStatus {
  hasProductMd: boolean;
  isProductMdTemplate: boolean;
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

export function StarterPage() {
  const { t, i18n } = useTranslation();
  const { status, refresh } = useScaffoldStatus();

  const lang = i18n.language;
  const hasProduct = !!(status?.hasProductMd && !status.isProductMdTemplate);
  const hasInput = (status?.inputFiles.length ?? 0) > 0;

  const prompt = buildPmPrompt({ lang, hasInput, inputFile: status?.inputFiles[0] });

  return (
    <AgentAppPageShell
      title={t("starter.title")}
      description={t("starter.description")}
      icon={<Sparkles className="w-5 h-5" />}
      iconContainerClassName="bg-gradient-to-br from-[#009de0] to-purple-600 text-white"
      isProcessing={false}
      headerActions={<LanguageToggle />}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 pt-2">
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
              <CoachPanel prompt={prompt} language={lang} />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {t("starter.cleanupHint")}
          </p>
        </AgentAppCard>

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
      </div>
    </AgentAppPageShell>
  );
}

function buildPmPrompt({
  lang,
  hasInput,
  inputFile,
}: {
  lang: string;
  hasInput: boolean;
  inputFile: string | undefined;
}): string {
  if (lang === "en") {
    if (hasInput) {
      return `Invoke the product-owner skill. I dropped my product.md (from the AgentApp Elio - Value Office) + a Google AI Studio prototype in Input/${inputFile}. Propose a backlog using both, iterate with me until I say it's OK, then hand off to the Builder.`;
    }
    return "Invoke the product-owner skill. I dropped my product.md (from the AgentApp Elio - Value Office). Propose a backlog, iterate with me until I say it's OK, then hand off to the Builder.";
  }
  if (hasInput) {
    return `Invoque la skill product-owner. J'ai déposé mon product.md (issu de l'AgentApp Elio - Value Office) + un prototype Google AI Studio dans Input/${inputFile}. Propose-moi un backlog en t'appuyant sur les deux, itère avec moi jusqu'à ce que je dise "backlog OK", puis passe la main au Builder.`;
  }
  return 'Invoque la skill product-owner. J\'ai déposé mon product.md (issu de l\'AgentApp Elio - Value Office). Propose-moi un backlog, itère avec moi jusqu\'à ce que je dise "backlog OK", puis passe la main au Builder.';
}
