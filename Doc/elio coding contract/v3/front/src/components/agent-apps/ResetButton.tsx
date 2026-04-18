import { cn } from "@/lib/utils";
import { Loader2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ResetButtonProps {
  readonly onReset: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly showLabel?: boolean;
  readonly className?: string;
}

/**
 * Reset button for agent app workflows.
 * Allows users to start over from the beginning.
 *
 * Args:
 *   onReset: Callback function to reset the workflow
 *   disabled: Whether the button is disabled
 *   loading: Whether the button shows a loading spinner
 *   showLabel: Whether to show the text label (hidden on small screens by default)
 *   className: Additional CSS classes
 *
 * Returns:
 *   A styled reset button with icon and optional label
 */
export function ResetButton({
  onReset,
  disabled = false,
  loading = false,
  showLabel = true,
  className,
}: ResetButtonProps) {
  const { t } = useTranslation();
  const Icon = loading ? Loader2 : RotateCcw;

  return (
    <button
      type="button"
      onClick={onReset}
      disabled={disabled || loading}
      title={t("agentAppCommon.reset")}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
        "text-muted-foreground hover:text-destructive hover:bg-muted",
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <Icon className={cn("w-4 h-4", loading && "animate-spin")} />
      {showLabel && (
        <span className="hidden sm:inline">{t("agentAppCommon.reset")}</span>
      )}
    </button>
  );
}
