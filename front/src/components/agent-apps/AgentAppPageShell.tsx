import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AgentAppHeader } from "./AgentAppHeader";
import { AgentAppSimpleLayout } from "./AgentAppLayout";
import { GeneratingOverlay } from "./GeneratingOverlay";

interface AgentAppPageShellProps {
  readonly title: string;
  readonly description: string;
  readonly icon: ReactNode;
  readonly iconContainerClassName?: string;
  readonly isProcessing: boolean;
  readonly loadingMessage?: string;
  readonly onStop?: () => void;
  readonly onReset?: () => void;
  readonly resetDisabled?: boolean;
  readonly resetLoading?: boolean;
  readonly headerActions?: ReactNode;
  readonly headerExtra?: ReactNode;
  readonly overlayProps?: {
    subMessage?: string;
    icon?: ReactNode;
    className?: string;
  };
  readonly useSimpleLayout?: boolean;
  readonly rootClassName?: string;
  readonly children: ReactNode;
}

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
  headerExtra,
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
        trailing={headerExtra}
      />
      <div className="relative flex-1">
        {content}
        <GeneratingOverlay
          isVisible={isProcessing}
          message={loadingMessage || t("common.generating")}
          onStop={onStop}
          {...overlayProps}
        />
      </div>
    </div>
  );
}
