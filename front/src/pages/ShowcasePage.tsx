/**
 * ShowcasePage — interactive gallery of all design system components.
 * Use as reference when building new agent app pages.
 */

import { useState } from "react";
import { CheckCircle, Palette } from "lucide-react";
import {
  ActionBanner,
  AgentAppCard,
  AgentAppCardForm,
  AgentAppPageShell,
  AgentAppSection,
  AgentAppSectionBadge,
  AgentAppSelect,
  AgentAppSwitch,
  ErrorBanner,
  FileUploadZone,
  FormField,
  FormInput,
  FormTextarea,
  GenerateButton,
  GeneratingOverlay,
  LanguageToggle,
  ProgressBanner,
  ResetButton,
  StepIndicator,
} from "@/components/agent-apps";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-mono text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ShowcasePage() {
  const [step, setStep] = useState(1);
  const [selectVal, setSelectVal] = useState<string | null>(null);
  const [switchVal, setSwitchVal] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [textareaVal, setTextareaVal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const steps = [
    { key: "setup", label: "Setup" },
    { key: "results", label: "Results" },
    { key: "export", label: "Export" },
  ];

  const selectOptions = [
    { value: "opt1", label: "Option A" },
    { value: "opt2", label: "Option B" },
    { value: "opt3", label: "Option C" },
  ];

  return (
    <AgentAppPageShell
      title="Design System Showcase"
      description="All available components — reference when building new agent app pages."
      icon={<Palette className="w-5 h-5" />}
      iconContainerClassName="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      isProcessing={false}
      resetDisabled={false}
      onReset={() => {}}
      headerExtra={<LanguageToggle />}
      useSimpleLayout
      rootClassName="relative min-h-screen flex flex-col max-w-4xl mx-auto px-4 md:px-6 w-full"
    >
      <div className="space-y-10">

        {/* ── LAYOUT ──────────────────────────────────────────────────────────── */}
        <Section title="Layout">
          <Row label="AgentAppCard + AgentAppSection">
            <AgentAppCard>
              <AgentAppSection title="Section title" description="Optional subtitle" />
              <p className="text-sm text-muted-foreground">Card body content goes here.</p>
            </AgentAppCard>
          </Row>

          <Row label="AgentAppCardForm — lighter background for input sections">
            <AgentAppCardForm>
              <AgentAppSection title="Form card" />
              <p className="text-sm text-muted-foreground">Use for input-heavy sections.</p>
            </AgentAppCardForm>
          </Row>

          <Row label="AgentAppSectionBadge — numbered section header">
            <div className="space-y-2">
              {(["blue", "purple", "orange", "green", "slate"] as const).map((color, i) => (
                <AgentAppSectionBadge
                  key={color}
                  title={`Section ${i + 1}`}
                  description={`badge color="${color}"`}
                  badge={{ label: String(i + 1), color }}
                />
              ))}
            </div>
          </Row>
        </Section>

        {/* ── NAVIGATION ──────────────────────────────────────────────────────── */}
        <Section title="Navigation">
          <Row label='StepIndicator variant="pills" (click to navigate)'>
            <AgentAppCard>
              <StepIndicator
                steps={steps}
                currentStep={step}
                maxReachedStep={3}
                onStepClick={setStep}
                variant="pills"
              />
            </AgentAppCard>
          </Row>

          <Row label='StepIndicator variant="dots"'>
            <AgentAppCard>
              <StepIndicator
                steps={steps}
                currentStep={step}
                maxReachedStep={3}
                onStepClick={setStep}
                variant="dots"
              />
            </AgentAppCard>
          </Row>

          <Row label="LanguageToggle — switches app language (FR/EN)">
            <AgentAppCard>
              <LanguageToggle />
            </AgentAppCard>
          </Row>
        </Section>

        {/* ── ACTIONS ─────────────────────────────────────────────────────────── */}
        <Section title="Actions">
          <Row label="GenerateButton">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <GenerateButton
                onClick={() => { setIsGenerating(true); setTimeout(() => setIsGenerating(false), 2000); }}
                label="Generate"
                loadingLabel="Generating..."
                isLoading={isGenerating}
              />
              <GenerateButton onClick={() => {}} label="Disabled" isLoading={false} disabled />
            </div>
          </Row>

          <Row label="ResetButton — lives in the page shell header">
            <AgentAppCard>
              <div className="flex items-center gap-2">
                <ResetButton onReset={() => {}} />
                <ResetButton onReset={() => {}} loading />
                <ResetButton onReset={() => {}} disabled />
              </div>
            </AgentAppCard>
          </Row>
        </Section>

        {/* ── FEEDBACK ────────────────────────────────────────────────────────── */}
        <Section title="Feedback">
          <Row label="ErrorBanner — shown when agent step fails">
            <ErrorBanner error="Something went wrong. Check your Azure credentials and try again." />
          </Row>

          <Row label="ProgressBanner — shown during streaming">
            <ProgressBanner title="Generating your analysis..." progress={60} onStop={() => {}} />
          </Row>

          <Row label="ActionBanner variants">
            <div className="space-y-2">
              {(["info", "success", "warning", "error"] as const).map((variant) => (
                <ActionBanner
                  key={variant}
                  message={`ActionBanner variant="${variant}"`}
                  variant={variant}
                  action={<button className="text-xs font-bold underline">Action</button>}
                />
              ))}
            </div>
          </Row>

          <Row label="GeneratingOverlay — absolute overlay on a card (click to toggle)">
            <div className="relative">
              <AgentAppCard>
                <p className="text-sm text-muted-foreground py-4 text-center">Card content behind overlay.</p>
                <button
                  onClick={() => setShowOverlay(!showOverlay)}
                  className="block mx-auto text-xs text-[#009de0] hover:underline"
                >
                  {showOverlay ? "Hide overlay" : "Show overlay"}
                </button>
                <GeneratingOverlay
                  isVisible={showOverlay}
                  message="Processing your request..."
                  onStop={() => setShowOverlay(false)}
                />
              </AgentAppCard>
            </div>
          </Row>
        </Section>

        {/* ── FORM ────────────────────────────────────────────────────────────── */}
        <Section title="Form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Row label="FormField + FormInput">
              <AgentAppCard>
                <FormField label="Label" description="Optional description text" required>
                  <FormInput
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Type something..."
                  />
                </FormField>
              </AgentAppCard>
            </Row>

            <Row label="AgentAppSelect">
              <AgentAppCard>
                <AgentAppSelect
                  label="Select an option"
                  options={selectOptions}
                  value={selectVal}
                  onValueChange={setSelectVal}
                  placeholder="Choose..."
                />
              </AgentAppCard>
            </Row>

            <Row label="FormField + FormTextarea">
              <AgentAppCard>
                <FormField label="Notes">
                  <FormTextarea
                    value={textareaVal}
                    onChange={(e) => setTextareaVal(e.target.value)}
                    placeholder="Enter details..."
                    rows={3}
                  />
                </FormField>
              </AgentAppCard>
            </Row>

            <Row label="AgentAppSwitch">
              <AgentAppCard>
                <AgentAppSwitch
                  label="Enable feature"
                  checked={switchVal}
                  onCheckedChange={setSwitchVal}
                />
              </AgentAppCard>
            </Row>
          </div>
        </Section>

        {/* ── FILES ───────────────────────────────────────────────────────────── */}
        <Section title="Files">
          <Row label="FileUploadZone">
            <AgentAppCard>
              <FileUploadZone
                onFileSelect={(files) => console.log("Files:", files)}
                accept=".pdf,.docx,.pptx"
                multiple
                hint="PDF, Word, PowerPoint — optional"
              />
            </AgentAppCard>
          </Row>
        </Section>

        {/* ── COLORS ──────────────────────────────────────────────────────────── */}
        <Section title="Brand Colors">
          <AgentAppCard>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Ellis Blue", cls: "bg-[#009de0]", token: "#009de0" },
                { name: "Blue", cls: "bg-blue-100 dark:bg-blue-900/30", token: "blue-100" },
                { name: "Purple", cls: "bg-purple-100 dark:bg-purple-900/30", token: "purple-100" },
                { name: "Orange", cls: "bg-orange-100 dark:bg-orange-900/30", token: "orange-100" },
                { name: "Green", cls: "bg-green-100 dark:bg-green-900/30", token: "green-100" },
                { name: "Muted", cls: "bg-muted", token: "bg-muted" },
                { name: "Card", cls: "bg-card border border-border", token: "bg-card" },
                { name: "Background", cls: "bg-background border border-border", token: "bg-background" },
              ].map(({ name, cls, token }) => (
                <div key={name} className="space-y-1.5">
                  <div className={`h-10 rounded-lg ${cls}`} />
                  <p className="text-xs font-medium text-foreground">{name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{token}</p>
                </div>
              ))}
            </div>
          </AgentAppCard>
        </Section>

        {/* ── RULES REMINDER ──────────────────────────────────────────────────── */}
        <Section title="5 Rules — always apply">
          <AgentAppCard>
            <ul className="space-y-2">
              {[
                "LLM — never instantiate directly. Always from services.llm_config import get_llm",
                "State — never useState for results/loading/errors. Zustand store only (src/stores/agent-apps/)",
                "Step functions — every async def *_stream() must be decorated with @stream_safe",
                "Dark mode — every color class needs its pair: bg-blue-100 dark:bg-blue-900/30",
                "Protected — never modify back/agents/_reference/, _ReferencePage.tsx, or _referenceStore.ts",
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-[#009de0] shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </AgentAppCard>
        </Section>

      </div>
    </AgentAppPageShell>
  );
}
