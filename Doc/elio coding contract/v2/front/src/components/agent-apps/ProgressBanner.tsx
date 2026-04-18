import { cn } from "@/lib/utils";
import { Loader2, Square } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProgressBannerProps {
  /** Main label displayed during processing. */
  readonly title: string;
  /** Optional subtitle or phase description. */
  readonly description?: string;
  /**
   * Progress percentage (0–100).
   * If provided, renders a progress bar below the title.
   * Omit for indeterminate loading (e.g. streaming).
   */
  readonly progress?: number;
  /** If provided, renders a stop button on the right. */
  readonly onStop?: () => void;
  readonly className?: string;
}

/**
 * Inline blue progress banner for agent app pages.
 *
 * Non-blocking alternative to GeneratingOverlay: renders inline within the
 * page content so the rest of the UI remains visible and interactive.
 *
 * - With `progress`: shows a progress bar (use for discrete generation steps).
 * - Without `progress`: shows a spinner only (use for streaming / unknown duration).
 * - With `onStop`: shows a stop button.
 *
 * Args:
 *   title: Main label shown during processing
 *   description: Optional subtitle (phase description, hint…)
 *   progress: 0-100 — if provided, a progress bar is rendered
 *   onStop: If provided, renders a stop button
 *   className: Additional Tailwind classes
 *
 * Returns:
 *   Blue gradient banner with spinner, optional progress bar, and optional stop button
 */
export function ProgressBanner({
  title,
  description,
  progress,
  onStop,
  className,
}: ProgressBannerProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20",
        "rounded-2xl p-3 md:p-5 border border-blue-200 dark:border-blue-800 shadow-sm",
        className,
      )}
      aria-live="polite"
      role="status"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-sm font-semibold text-foreground truncate">
                {title}
              </span>
            </div>
            {progress !== undefined && (
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0">
                {progress}%
              </span>
            )}
          </div>

          {/* Progress bar */}
          {progress !== undefined && (
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Stop button */}
        {onStop && (
          <button
            onClick={onStop}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 dark:bg-destructive/20 text-destructive hover:bg-destructive/20 dark:hover:bg-destructive/30 transition-colors"
          >
            <Square className="w-3 h-3 fill-current" />
            {t("common.stop")}
          </button>
        )}
      </div>
    </div>
  );
}
