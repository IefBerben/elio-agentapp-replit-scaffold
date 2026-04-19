/**
 * _ReferencePage — REFERENCE EXAMPLE, do not modify.
 * Copy and rename to {AgentName}AgentAppPage.tsx for your use case.
 */

import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
// NOTE: In the real Elio platform, replace Sparkles with AgentIcons.{Category}
// from "@/constants/agentsConstants" — see AGENT_APP_GUIDELINES_FRONT.md
import { Sparkles } from "lucide-react";
import {
  AgentAppCard,
  AgentAppPageShell,
  AgentAppSection,
  ErrorBanner,
  FileUploadZone,
  GenerateButton,
  LanguageToggle,
  ProgressBanner,
  StepIndicator,
} from "@/components/agent-apps";
import { useReferenceStore } from "@/stores/agent-apps/_referenceStore";
import { cn } from "@/lib/utils";

const BADGE: Record<string, string> = {
  blue:   "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300",
};

function SectionBadge({ n, color }: { n: string; color: keyof typeof BADGE }) {
  return <span className={cn("w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0", BADGE[color])}>{n}</span>;
}

export function ReferencePage() {
  const { t } = useTranslation();
  const abortRef = useRef<{ abort: () => void } | null>(null);

  const {
    step, maxReachedStep,
    context, step1Result, step2Result,
    isProcessing, loadingMessage, error,
    setStep, setContext,
    runStep1, runStep2,
    handleStop, reset,
  } = useReferenceStore();

  const steps = [
    { key: "setup",   label: t("yourUsecase.step1Label") },
    { key: "results", label: t("yourUsecase.step2Label") },
  ];

  const handleGenerate = useCallback(() => {
    abortRef.current = runStep1();
  }, [runStep1]);

  const handleStop_ = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    handleStop();
  }, [handleStop]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    reset();
  }, [reset]);

  return (
    <AgentAppPageShell
      title={t("yourUsecase.title")}
      description={t("yourUsecase.description")}
      icon={<Sparkles className="w-5 h-5" />}
      iconContainerClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      isProcessing={isProcessing}
      resetDisabled={isProcessing}
      onReset={handleReset}
      headerActions={
        <StepIndicator
          steps={steps}
          currentStep={step}
          maxReachedStep={maxReachedStep}
          onStepClick={isProcessing ? undefined : setStep}
          variant="pills"
        />
      }
      headerExtra={<LanguageToggle />}
      useSimpleLayout
      rootClassName="relative min-h-screen flex flex-col max-w-4xl mx-auto px-4 md:px-6 w-full"
    >
      <ErrorBanner error={error} className="mb-4" />

      {/* ── STEP 1 ─────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up">

          {/* LEFT */}
          <div className="space-y-4">
            <AgentAppCard>
              <div className="flex items-center gap-2 mb-4">
                <SectionBadge n="1" color="blue" />
                <AgentAppSection title={t("yourUsecase.promptLabel")} />
              </div>
              <textarea
                value={context.prompt}
                onChange={(e) => setContext({ prompt: e.target.value })}
                placeholder={t("yourUsecase.promptPlaceholder")}
                rows={6}
                disabled={isProcessing}
                className="w-full p-4 bg-muted border border-border rounded-xl text-sm leading-relaxed resize-none
                           text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:ring-2 focus:ring-[#009de0]
                           disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-2">{context.prompt.length} {t("yourUsecase.chars")}</p>
            </AgentAppCard>

            <AgentAppCard>
              <div className="flex items-center gap-2 mb-4">
                <SectionBadge n="2" color="purple" />
                <AgentAppSection title={t("yourUsecase.documentsLabel")} description={`(${t("common.addDocument")})`} />
              </div>
              {/* To wire file upload in your copy:
                  1. import { uploadFiles } from "@/services/fileUploadService"
                  2. store the returned paths in your Zustand store
                  3. pass those paths as file_paths to your agent step */}
              <FileUploadZone
                onFileSelect={(files) => {
                  console.log("[Reference] File upload not wired — copy this page and use fileUploadService.uploadFiles()", files);
                }}
                accept=".pdf,.docx,.pptx"
                multiple
                disabled={isProcessing}
                hint={t("common.documentFormats")}
              />
            </AgentAppCard>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            <AgentAppCard>
              <div className="flex items-center gap-2 mb-4">
                <SectionBadge n="3" color="orange" />
                <AgentAppSection title={t("yourUsecase.contextLabel")} />
              </div>
              <textarea
                value={context.context}
                onChange={(e) => setContext({ context: e.target.value })}
                placeholder={t("yourUsecase.contextPlaceholder")}
                rows={4}
                disabled={isProcessing}
                className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800
                           rounded-xl text-sm leading-relaxed resize-none text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800
                           disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </AgentAppCard>

            <AgentAppCard>
              <AgentAppSection title={t("yourUsecase.languageLabel")} />
              <div className="flex gap-2">
                {(["fr", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setContext({ language: lang })}
                    disabled={isProcessing}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold rounded-lg border transition-colors disabled:opacity-50",
                      context.language === lang
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {lang === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
            </AgentAppCard>

            {isProcessing ? (
              <ProgressBanner title={loadingMessage || t("yourUsecase.step1Generating")} progress={50} onStop={handleStop_} />
            ) : (
              <GenerateButton
                onClick={handleGenerate}
                disabled={!context.prompt.trim()}
                label={t("common.generate")}
                loadingLabel={t("common.generating")}
                isLoading={isProcessing}
              />
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2 ─────────────────────────────────────────────────────────── */}
      {step === 2 && step1Result && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">{t("yourUsecase.resultsTitle")}</h2>
            <button onClick={handleReset} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
              {t("common.startOver")}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <AgentAppCard>
              <AgentAppSection title={t("yourUsecase.summaryLabel")} />
              <p className="text-sm text-foreground leading-relaxed">{step1Result.summary}</p>
            </AgentAppCard>

            <AgentAppCard>
              <AgentAppSection title={t("yourUsecase.keyPointsLabel")} />
              <ul className="space-y-2">
                {step1Result.key_points.map((point, i) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                    {point}
                  </li>
                ))}
              </ul>
            </AgentAppCard>
          </div>

          {!step2Result && (
            isProcessing ? (
              <ProgressBanner title={loadingMessage || t("yourUsecase.step2Generating")} progress={50} onStop={handleStop_} />
            ) : (
              <GenerateButton
                onClick={() => { abortRef.current = runStep2(); }}
                label={t("yourUsecase.deepenAnalysis")}
                isLoading={isProcessing}
                variant="default"
              />
            )
          )}

          {step2Result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up">
              <AgentAppCard>
                <AgentAppSection title={t("yourUsecase.recommendationsLabel")} />
                <ul className="space-y-2">
                  {step2Result.recommendations.map((r) => (
                    <li key={r} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-[#009de0] font-bold shrink-0">→</span>{r}
                    </li>
                  ))}
                </ul>
              </AgentAppCard>
              <AgentAppCard>
                <AgentAppSection title={t("yourUsecase.nextStepsLabel")} />
                <ul className="space-y-2">
                  {step2Result.next_steps.map((s, i) => (
                    <li key={s} className="text-sm text-foreground flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full border-2 border-[#009de0] text-[#009de0] flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>{s}
                    </li>
                  ))}
                </ul>
              </AgentAppCard>
              <AgentAppCard>
                <AgentAppSection title={t("yourUsecase.conclusionLabel")} />
                <p className="text-sm text-foreground leading-relaxed italic">{step2Result.conclusion}</p>
              </AgentAppCard>
            </div>
          )}
        </div>
      )}
    </AgentAppPageShell>
  );
}
