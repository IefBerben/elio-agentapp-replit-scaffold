import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface ErrorBannerProps {
  readonly error: string | null;
  readonly className?: string;
  readonly title?: string;
  readonly icon?: boolean;
}

export function ErrorBanner({
  error,
  className,
  title,
  icon = true,
}: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm",
        className,
      )}
    >
      {icon && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
      <div>
        {title && <span className="font-semibold">{title} </span>}
        {error}
      </div>
    </div>
  );
}
