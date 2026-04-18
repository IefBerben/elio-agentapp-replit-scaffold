import { cn } from "@/lib/utils";
import { Loader2, Square } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface GeneratingOverlayProps {
  /** Whether the overlay is visible */
  readonly isVisible: boolean;
  /** Primary message to display */
  readonly message: string;
  /** Optional callback to stop/cancel the current generation */
  readonly onStop?: () => void;
  /** Secondary message below the main message */
  readonly subMessage?: string;
  /** Custom icon instead of the default spinner */
  readonly icon?: ReactNode;
  /** Additional CSS classes for the outer container */
  readonly className?: string;
  /** Additional CSS classes for the backdrop layer */
  readonly backdropClassName?: string;
  /** Additional CSS classes for the card */
  readonly cardClassName?: string;
  /** Additional CSS classes for the stop button */
  readonly stopButtonClassName?: string;
  /** Additional CSS classes for the main message */
  readonly messageClassName?: string;
  /** Additional CSS classes for the secondary message */
  readonly subMessageClassName?: string;
  /** Custom stop icon */
  readonly stopIcon?: ReactNode;
}

/**
 * Fullscreen overlay for agent app generation processes.
 *
 * Args:
 *   isVisible: Whether to show the overlay
 *   message: Primary loading message
 *   onStop: Optional callback to cancel — shows a stop button when provided
 *   subMessage: Optional secondary message
 *   icon: Custom icon (default: animated spinner)
 *   className: Extra classes for the outer wrapper
 *   backdropClassName: Extra classes for the translucent backdrop
 *   cardClassName: Extra classes for the card
 *   stopButtonClassName: Extra classes for the stop button
 *   messageClassName: Extra classes for the main message
 *   subMessageClassName: Extra classes for the sub message
 *   stopIcon: Custom icon for the stop button
 *
 * Returns:
 *   A fullscreen overlay with card containing loading state and optional stop button
 */
export function GeneratingOverlay({
  isVisible,
  message,
  onStop,
  subMessage,
  icon,
  className,
  backdropClassName,
  cardClassName,
  stopButtonClassName,
  messageClassName,
  subMessageClassName,
  stopIcon,
}: GeneratingOverlayProps) {
  const { t } = useTranslation();

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 left-0 right-0 z-50 pointer-events-none",
        "flex justify-center",
        className,
      )}
      aria-live="polite"
      aria-label={message}
    >
      <div
        className={cn(
          "absolute top-4 md:top-6 bottom-0 left-0 right-0 bg-card/20 rounded-2xl",
          backdropClassName,
        )}
      />
      <div
        className={cn(
          "sticky top-[30vh] h-fit z-10 bg-card rounded-3xl p-4 md:p-8 shadow-2xl text-center space-y-4 min-w-[280px] max-w-[320px] pointer-events-auto mt-[20vh]",
          cardClassName,
        )}
      >
        {icon || (
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-blue-600" />
        )}
        <p
          className={cn(
            "font-semibold text-foreground text-balance",
            messageClassName,
          )}
        >
          {message}
        </p>
        {subMessage && (
          <p
            className={cn("text-sm text-muted-foreground", subMessageClassName)}
          >
            {subMessage}
          </p>
        )}
        {onStop && (
          <button
            type="button"
            onClick={onStop}
            className={cn(
              "mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors",
              stopButtonClassName,
            )}
          >
            {stopIcon || <Square className="w-3 h-3 fill-current" />}
            {t("common.stop")}
          </button>
        )}
      </div>
    </div>
  );
}
