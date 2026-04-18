import { cn } from "@/lib/utils";
import { Loader2, Square } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProgressBannerProps {
  readonly title: string;
  readonly description?: string;
  readonly progress?: number;
  readonly onStop?: () => void;
  readonly className?: string;
}

export function ProgressBanner({
  title,
  description,
  progress = 0,
  onStop,
  className,
}: ProgressBannerProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800",
        "bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50",
        "dark:from-blue-950/30 dark:via-purple-950/20 dark:to-blue-950/30",
        "p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200 truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
            {Math.round(progress)}%
          </span>
          {onStop && (
            <button
              onClick={onStop}
              className="p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-colors"
              title={t("common.stop")}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {description && (
        <p className="text-xs text-blue-600/80 dark:text-blue-300/70 mb-2 truncate">
          {description}
        </p>
      )}
      <div className="h-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}
