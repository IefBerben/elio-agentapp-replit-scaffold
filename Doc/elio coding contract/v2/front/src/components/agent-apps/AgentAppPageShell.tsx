import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AgentAppHeader } from "./AgentAppHeader";
import { AgentAppSimpleLayout } from "./AgentAppLayout";
import { GeneratingOverlay } from "./GeneratingOverlay";

interface AgentAppPageShellProps {
  /** Page title displayed in the header */
  readonly title: string;
  /** Page description displayed below the title */
  readonly description: string;
  /** Icon element for the header */
  readonly icon: ReactNode;
  /** CSS classes for the icon container in the header */
  readonly iconContainerClassName?: string;
  /** Whether the agent is currently processing */
  readonly isProcessing: boolean;
  /** Loading message to display in the overlay */
  readonly loadingMessage?: string;
  /** Callback to stop/cancel the current process */
  readonly onStop?: () => void;
  /** Callback to reset the workflow */
  readonly onReset?: () => void;
  /** Whether the reset button should be disabled */
  readonly resetDisabled?: boolean;
  /** Whether the reset button shows a loading spinner */
  readonly resetLoading?: boolean;
  /** Action elements for the header (e.g., StepIndicator) */
  readonly headerActions?: ReactNode;
  /** Additional props for the GeneratingOverlay component */
  readonly overlayProps?: {
    subMessage?: string;
    icon?: ReactNode;
    className?: string;
  };
  /** Whether to wrap children in AgentAppSimpleLayout (default: false) */
  readonly useSimpleLayout?: boolean;
  /** Additional CSS classes for the root container */
  readonly rootClassName?: string;
  /** Page content */
  readonly children: ReactNode;
}

/**
 * Common page shell for agent app pages.
 * Renders a sticky header, content area with optional simple layout, and generating overlay.
 * Eliminates boilerplate layout code duplicated across all agent app pages.
 *
 * Args:
 *   props: Shell configuration including header, overlay, and layout options
 *
 * Returns:
 *   A full-page layout with sticky header and generating overlay
 */
export function AgentAppPageShell({
  title,
  description,
  icon,
  iconContainerClassName,
  isProcessing,
  loadingMessage,
  onStop,
  onReset,
  resetDisabled,
  resetLoading,
  headerActions,
  overlayProps,
  useSimpleLayout = false,
  rootClassName,
  children,
}: AgentAppPageShellProps) {
  const { t } = useTranslation();

  const content = useSimpleLayout ? (
    <AgentAppSimpleLayout>{children}</AgentAppSimpleLayout>
  ) : (
    children
  );

  return (
    <div className={rootClassName ?? "relative min-h-screen flex flex-col"}>
      <AgentAppHeader
        title={title}
        description={description}
        icon={icon}
        iconContainerClassName={iconContainerClassName}
        onResetClick={onReset}
        resetDisabled={resetDisabled ?? isProcessing}
        resetLoading={resetLoading}
        disabled={isProcessing}
        actions={headerActions}
      />
      <div className="relative flex-1">
        {content}
        <GeneratingOverlay
          isVisible={isProcessing}
          message={loadingMessage || t("agentAppCommon.generating")}
          onStop={onStop}
          {...overlayProps}
        />
      </div>
      <footer className="text-center py-3 text-xs text-muted-foreground/50 select-none">
        v{__APP_VERSION__}
      </footer>
    </div>
  );
}
