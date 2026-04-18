import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import { ResetButton } from "./ResetButton";

interface AgentAppHeaderProps {
  readonly title: string;
  readonly description: string;
  readonly icon: ReactNode;
  readonly actions?: ReactNode;
  readonly trailing?: ReactNode;
  readonly className?: string;
  readonly iconContainerClassName?: string;
  readonly onResetClick?: () => void;
  readonly resetDisabled?: boolean;
  readonly resetLoading?: boolean;
  /**
   * When true, disables all interactions on the header (used during processing)
   */
  readonly disabled?: boolean;
}

/**
 * Common sticky header for agent app pages.
 * Renders icon, title, description, workflow actions, and a reset button.
 *
 * Args:
 *   title: The main title of the page
 *   description: A short description below the title
 *   icon: Icon element to display
 *   actions: Optional React node for workflow steps or custom actions
 *   className: Additional CSS classes for the container
 *   iconContainerClassName: CSS classes for the icon container
 *   onResetClick: Callback to reset the workflow
 *   resetDisabled: Whether the reset button should be disabled
 *   resetLoading: Whether the reset button should show a loading state
 *   disabled: When true, disables all header interactions
 *
 * Returns:
 *   A sticky header component with icon, title, actions, and reset button
 */
export function AgentAppHeader({
  title,
  description,
  icon,
  actions,
  trailing,
  className,
  iconContainerClassName,
  onResetClick,
  resetDisabled = false,
  resetLoading = false,
  disabled = false,
}: AgentAppHeaderProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl px-4 md:px-8 py-4 shadow-sm md:sticky md:top-0 z-20",
        disabled && "pointer-events-none",
        className,
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "bg-blue-600 p-2 rounded-lg text-white",
              iconContainerClassName,
            )}
          >
            {icon}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onResetClick && (
            <ResetButton
              onReset={onResetClick}
              disabled={resetDisabled}
              loading={resetLoading}
            />
          )}
          {trailing}
        </div>
      </div>
    </div>
  );
}
