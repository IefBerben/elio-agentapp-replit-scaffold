/**
 * Conversation Agent App — Main Page
 *
 * 3-step workflow:
 *   Step 1 (Input): Topic + optional persona hints
 *   Step 2 (Personas): Generated personas with editable fields
 *   Step 3 (Discussion): Streamed conversation between the two personas —
 *                        messages appear live as they arrive from the backend.
 *
 * This is the main file to customize for your own Agent App.
 */

import {
  AgentAppCard,
  AgentAppPageShell,
  AgentAppSection,
  ErrorBanner,
  FilesList,
  FileUploadZone,
  FormField,
  FormInput,
  FormTextarea,
  GenerateButton,
  LanguageToggle,
  StepIndicator,
} from "@/components/agent-apps";
import {
  deleteUploadedFile,
  downloadUploadedFile,
  listUploadedFiles,
  uploadFiles,
} from "@/services/fileUploadService";
import { readSSEStream, type SSEMessage } from "@/services/sseStreamService";
import {
  useConversationStore,
  type ConversationMessage,
  type Persona,
} from "@/stores/yourUseCaseAgentStore";
import {
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Square,
  User,
} from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

// ─── Constants ───────────────────────────────────────────

const API_BASE_URL = "/agent-apps";

const STEP_1_AGENT_ID = "conversation-step-1";
const STEP_2_AGENT_ID = "conversation-step-2";

const STEPS = [
  { id: 1, key: "input" },
  { id: 2, key: "personas" },
  { id: 3, key: "discussion" },
];

// ─── SSE Message types ───────────────────────────────────

interface PersonasSSEMessage extends SSEMessage {
  personas?: {
    persona1: Persona;
    persona2: Persona;
  };
}

interface DiscussionSSEMessage extends SSEMessage {
  conversation_message?: ConversationMessage;
  conversation?: ConversationMessage[];
}

// ─── Persona Card Component ──────────────────────────────

interface PersonaCardProps {
  readonly persona: Persona;
  readonly index: number;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, index }) => {
  const { t } = useTranslation();

  const fields: { key: string; label: string; value: string | string[] }[] = [
    { key: "name", label: t("conversation.name"), value: persona.name },
    { key: "age", label: t("conversation.age"), value: String(persona.age) },
    {
      key: "profession",
      label: t("conversation.profession"),
      value: persona.profession,
    },
    {
      key: "education",
      label: t("conversation.education"),
      value: persona.education,
    },
    {
      key: "personality",
      label: t("conversation.personalityType"),
      value: persona.personality_type,
    },
    {
      key: "description",
      label: t("conversation.descriptionLabel"),
      value: persona.description,
    },
    {
      key: "interests",
      label: t("conversation.interests"),
      value: persona.interests,
    },
    {
      key: "communication",
      label: t("conversation.communicationStyle"),
      value: persona.communication_style,
    },
    {
      key: "opinion",
      label: t("conversation.opinionOnTopic"),
      value: persona.opinion_on_topic,
    },
  ];

  return (
    <AgentAppCard>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${
            index === 0
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          }`}
        >
          <User className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">{persona.name}</h4>
          <p className="text-sm text-muted-foreground">
            {t("conversation.persona")} {index + 1}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map(({ key, label, value }) => (
          <div key={key}>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </span>
            {Array.isArray(value) ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {value.map((item) => (
                  <span
                    key={item}
                    className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground mt-0.5">{value}</p>
            )}
          </div>
        ))}
      </div>
    </AgentAppCard>
  );
};

// ─── Chat Message Component ──────────────────────────────

interface ChatBubbleProps {
  readonly msg: ConversationMessage;
  readonly isPersona1: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ msg, isPersona1 }) => (
  <div className={`flex ${isPersona1 ? "justify-start" : "justify-end"} mb-3`}>
    <div
      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
        isPersona1
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-bl-sm"
          : "bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 rounded-br-sm"
      }`}
    >
      <p className="text-xs font-semibold mb-0.5 opacity-70">{msg.speaker}</p>
      <p className="text-sm">{msg.message}</p>
      {msg.tone && msg.tone !== "neutral" && (
        <p className="text-[10px] mt-1 opacity-50 italic">{msg.tone}</p>
      )}
    </div>
  </div>
);

// ─── Main Page Component ─────────────────────────────────

const ConversationAgentPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Store — individual selectors (never destructure the full store)
  const topic = useConversationStore((s) => s.topic);
  const persona1Hint = useConversationStore((s) => s.persona1Hint);
  const persona2Hint = useConversationStore((s) => s.persona2Hint);
  const numExchanges = useConversationStore((s) => s.numExchanges);
  const uploadedFiles = useConversationStore((s) => s.uploadedFiles);
  const currentStep = useConversationStore((s) => s.currentStep);
  const maxReachedStep = useConversationStore((s) => s.maxReachedStep);
  const persona1 = useConversationStore((s) => s.persona1);
  const persona2 = useConversationStore((s) => s.persona2);
  const conversation = useConversationStore((s) => s.conversation);
  const isProcessing = useConversationStore((s) => s.isProcessing);
  const isUploading = useConversationStore((s) => s.isUploading);
  const errorMessage = useConversationStore((s) => s.errorMessage);
  const progressInfo = useConversationStore((s) => s.progressInfo);

  // Actions via getState() — stable references, no re-render dependency
  const {
    setTopic,
    setPersona1Hint,
    setPersona2Hint,
    setNumExchanges,
    setUploadedFiles,
    addUploadedFiles,
    removeUploadedFile,
    setIsUploading,
    setCurrentStep,
    advanceToStep,
    setPersonas,
    addConversationMessage,
    setConversation,
    setIsProcessing,
    setErrorMessage,
    setProgressInfo,
    handleStop: storeHandleStop,
    resetAll,
  } = useConversationStore.getState();

  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);
  // Ref used to auto-scroll to the latest message while streaming
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Sync uploaded files with backend on mount — in case the page was refreshed
  // while the server kept running with existing files in tempfiles/
  useEffect(() => {
    listUploadedFiles()
      .then((files) => setUploadedFiles(files))
      .catch((err) => console.warn("Could not load existing files:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStop = useCallback(() => {
    isCancelledRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    storeHandleStop();
  }, [storeHandleStop]);

  // ── File upload ────────────────────────────────────────

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

  const handleFileDelete = async (name: string) => {
    const file = useConversationStore
      .getState()
      .uploadedFiles.find((f) => f.name === name);
    if (!file) return;
    // Extract the unique backend filename from the path (basename)
    const parts = file.path.split(/[/\\]/);
    const basename = parts[parts.length - 1] ?? name;
    try {
      await deleteUploadedFile(basename);
    } catch {
      // Ignore deletion errors — remove from UI regardless
    }
    removeUploadedFile(name);
  };

  const handleFileDownload = (name: string) => {
    const file = useConversationStore
      .getState()
      .uploadedFiles.find((f) => f.name === name);
    if (!file) return;
    // Extract the unique backend filename from the path (basename)
    const parts = file.path.split(/[/\\]/);
    const basename = parts[parts.length - 1] ?? name;
    downloadUploadedFile(basename);
  };

  // ── Step 1: Generate Personas ──────────────────────────

  const handleGeneratePersonas = async () => {
    if (!topic.trim()) {
      setErrorMessage(t("conversation.topicRequired"));
      return;
    }

    setErrorMessage("");
    setIsProcessing(true);
    setProgressInfo({
      title: t("conversation.generatingPersonas"),
      progress: 0,
    });
    isCancelledRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(
        `${API_BASE_URL}/execute/${STEP_1_AGENT_ID}/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            persona1_hint: persona1Hint,
            persona2_hint: persona2Hint,
            file_paths: uploadedFiles.map((f) => f.path),
            interface_language: i18n.language,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      await readSSEStream<PersonasSSEMessage>(
        response,
        (update) => {
          if (isCancelledRef.current) return true;

          if (update.status === "completed" && update.personas) {
            setPersonas(update.personas.persona1, update.personas.persona2);
            setIsProcessing(false);
            setProgressInfo(null);
            advanceToStep(2);
            return true;
          }

          if (update.status === "error") {
            setErrorMessage(update.message || "Error");
            setIsProcessing(false);
            setProgressInfo(null);
            return true;
          }

          if (update.progress !== undefined) {
            setProgressInfo({
              title: update.message || t("conversation.generatingPersonas"),
              progress: update.progress,
            });
          }

          return false;
        },
        controller.signal,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setErrorMessage(String(error));
      setIsProcessing(false);
      setProgressInfo(null);
    }
  };

  // ── Step 2: Generate Discussion ────────────────────────
  // Navigate to step 3 BEFORE starting the stream so messages appear live.

  const handleGenerateDiscussion = async () => {
    if (!persona1 || !persona2) return;

    setErrorMessage("");
    setConversation([]);
    setIsProcessing(true);
    advanceToStep(3); // Show step 3 immediately so the user sees messages arrive
    isCancelledRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(
        `${API_BASE_URL}/execute/${STEP_2_AGENT_ID}/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            persona1,
            persona2,
            num_exchanges: numExchanges,
            interface_language: i18n.language,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      await readSSEStream<DiscussionSSEMessage>(
        response,
        (update) => {
          if (isCancelledRef.current) return true;

          // Each conversation_message event adds a bubble in real time
          if (update.conversation_message) {
            addConversationMessage(update.conversation_message);
          }

          if (update.status === "completed") {
            setIsProcessing(false);
            return true;
          }

          if (update.status === "error") {
            setErrorMessage(update.message || "Error");
            setIsProcessing(false);
            return true;
          }

          return false;
        },
        controller.signal,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setErrorMessage(String(error));
      setIsProcessing(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────

  /**
   * Blue gradient banner used at the top of every step.
   * Left: contextual info (or loading state). Right: primary action button.
   */
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
              <p className="text-base font-semibold text-foreground">{title}</p>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
        {!isProcessing && action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );

  // ── Render: Step 1 — Input ─────────────────────────────

  const renderInputStep = () => (
    <div className="w-full py-4 md:py-6 space-y-4 animate-fade-in-up px-4 md:px-6">
      {/* Always-visible banner: loading or action */}
      {renderStepBanner({
        title: t("conversation.generatePersonas"),
        description: t("conversation.topicPlaceholder"),
        loadingTitle:
          progressInfo?.title ?? t("conversation.generatingPersonas"),
        progress: progressInfo?.progress,
        action: (
          <GenerateButton
            onClick={handleGeneratePersonas}
            isLoading={false}
            label={t("conversation.generatePersonas")}
            disabled={!topic.trim()}
          />
        ),
      })}

      <AgentAppCard>
        <AgentAppSection title={t("conversation.topicLabel")} />

        <div className="space-y-4">
          {/* Topic (required) */}
          <FormField label={t("conversation.topicLabel")} required>
            <FormInput
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("conversation.topicPlaceholder")}
              disabled={isProcessing}
            />
          </FormField>

          {/* Optional documents to ground the discussion */}
          <FormField label={t("conversation.documentsLabel")}>
            <FileUploadZone
              onFileSelect={handleFilesSelected}
              accept=".pdf,.docx,.pptx,.xlsx,.csv,.txt,.md"
              multiple
              isUploading={isUploading}
              hint={t("conversation.documentsHint")}
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

          {/* Persona 1 hint (optional) */}
          <FormField label={t("conversation.persona1HintLabel")}>
            <FormTextarea
              value={persona1Hint}
              onChange={(e) => setPersona1Hint(e.target.value)}
              placeholder={t("conversation.persona1HintPlaceholder")}
              rows={2}
              disabled={isProcessing}
            />
          </FormField>

          {/* Persona 2 hint (optional) */}
          <FormField label={t("conversation.persona2HintLabel")}>
            <FormTextarea
              value={persona2Hint}
              onChange={(e) => setPersona2Hint(e.target.value)}
              placeholder={t("conversation.persona2HintPlaceholder")}
              rows={2}
              disabled={isProcessing}
            />
          </FormField>
        </div>

        <ErrorBanner message={errorMessage} className="mt-4" />
      </AgentAppCard>
    </div>
  );

  // ── Render: Step 2 — Personas ──────────────────────────

  const renderPersonasStep = () => (
    <div className="w-full py-4 md:py-6 space-y-4 animate-fade-in-up px-4 md:px-6">
      {persona1 && persona2 ? (
        <>
          {/* Always-visible banner with persona info + generate discussion */}
          {renderStepBanner({
            title: t("conversation.generateDiscussion"),
            description: `${persona1.name} & ${persona2.name} · ${numExchanges} ${t("conversation.exchangesLabel").toLowerCase()}`,
            action: (
              <GenerateButton
                onClick={handleGenerateDiscussion}
                isLoading={false}
                label={t("conversation.generateDiscussion")}
              />
            ),
          })}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PersonaCard persona={persona1} index={0} />
            <PersonaCard persona={persona2} index={1} />
          </div>

          {/* Exchange count control */}
          <AgentAppCard>
            <AgentAppSection title={t("conversation.exchangesLabel")} />
            <div className="flex items-center gap-3 mt-3">
              <input
                type="range"
                min={2}
                max={20}
                value={numExchanges}
                onChange={(e) => setNumExchanges(Number(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-sm font-medium text-foreground w-8 text-center">
                {numExchanges}
              </span>
            </div>
          </AgentAppCard>

          <ErrorBanner message={errorMessage} />
        </>
      ) : (
        <AgentAppCard>
          <p className="text-center text-muted-foreground py-8">
            {t("common.noData")}
          </p>
        </AgentAppCard>
      )}
    </div>
  );

  // ── Render: Step 3 — Discussion ────────────────────────

  const renderDiscussionStep = () => (
    <div className="w-full py-4 md:py-6 space-y-4 animate-fade-in-up px-4 md:px-6">
      {/* Always-visible banner: streaming state or results summary */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-2xl p-4 md:p-5 border border-blue-200 dark:border-blue-800 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground">
                    {t("conversation.generatingDiscussion")}
                  </p>
                  {conversation.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t("conversation.messageCount", {
                        current: conversation.length,
                        total: numExchanges * 2,
                      })}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-foreground">
                  {persona1 && persona2
                    ? `${persona1.name} & ${persona2.name}`
                    : t("conversation.conversationTitle")}
                </p>
                {conversation.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("conversation.messageCount", {
                      current: conversation.length,
                      total: numExchanges * 2,
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right actions: stop button while streaming, regenerate when done */}
          <div className="shrink-0">
            {isProcessing && (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                {t("agentAppCommon.stop")}
              </button>
            )}
            {!isProcessing && conversation.length > 0 && (
              <button
                onClick={handleGenerateDiscussion}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground bg-card border border-border hover:bg-muted/50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t("agentAppCommon.regenerate")}
              </button>
            )}
          </div>
        </div>
      </div>

      <AgentAppCard>
        <div className="min-h-[300px] max-h-[500px] overflow-y-auto py-2">
          {conversation.length === 0 && !isProcessing ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">{t("conversation.noMessages")}</p>
            </div>
          ) : (
            <>
              {conversation.map((msg, i) => (
                <ChatBubble
                  key={`${msg.speaker}-${i}`}
                  msg={msg}
                  isPersona1={
                    persona1 ? msg.speaker === persona1.name : i % 2 === 0
                  }
                />
              ))}
              {/* Anchor element keeps the view scrolled to the latest message */}
              <div ref={conversationEndRef} />
            </>
          )}
        </div>
      </AgentAppCard>

      <ErrorBanner message={errorMessage} />
    </div>
  );

  // ── Step labels for StepIndicator ─────────────────────

  const stepLabels = STEPS.map((s) => ({
    key: s.key,
    label: t(`conversation.${s.key}Step`),
  }));

  // ── Main render ────────────────────────────────────────

  return (
    <AgentAppPageShell
      title={t("conversation.title")}
      description={t("conversation.description")}
      icon={<Sparkles className="w-5 h-5" />}
      iconContainerClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      // Pass isProcessing=false to disable the blocking GeneratingOverlay —
      // loading feedback is handled inline via ProgressBanner in each step.
      isProcessing={false}
      resetDisabled={isProcessing}
      onReset={resetAll}
      headerActions={
        <StepIndicator
          steps={stepLabels}
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          onStepClick={isProcessing ? undefined : setCurrentStep}
          variant="pills"
        />
      }
      headerExtra={<LanguageToggle />}
      useSimpleLayout
    >
      {currentStep === 1 && renderInputStep()}
      {currentStep === 2 && renderPersonasStep()}
      {currentStep === 3 && renderDiscussionStep()}
    </AgentAppPageShell>
  );
};

export default ConversationAgentPage;
