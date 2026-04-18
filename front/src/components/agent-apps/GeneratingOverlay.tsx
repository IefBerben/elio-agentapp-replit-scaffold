import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface GeneratingOverlayProps {
  readonly isVisible: boolean;
  readonly message?: string;
  readonly subMessage?: string;
  readonly onStop?: () => void;
  readonly icon?: ReactNode;
  readonly className?: string;
}

export function GeneratingOverlay({
  isVisible,
  message,
  subMessage,
  onStop,
  icon,
  className,
}: GeneratingOverlayProps) {
  const { t } = useTranslation();
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex flex-col items-center justify-center gap-4",
        "bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      {icon || <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />}
      <p className="text-sm font-medium text-foreground animate-pulse">
        {message ?? t("agentAppCommon.generating")}
      </p>
      {subMessage && (
        <p className="text-xs text-muted-foreground">{subMessage}</p>
      )}
      {onStop && (
        <button
          onClick={onStop}
          className="px-4 py-1.5 text-xs font-medium rounded-full border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
        >
          {t("common.stop")}
        </button>
      )}
    </div>
  );
}
