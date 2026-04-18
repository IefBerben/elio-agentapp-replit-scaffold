import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface ActionBannerProps {
  readonly icon?: ReactNode;
  readonly message: string;
  readonly action?: ReactNode;
  readonly variant?: "info" | "warning" | "success" | "error";
  readonly className?: string;
}

const variantStyles = {
  info: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  warning:
    "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  success:
    "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  error:
    "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
} as const;

export function ActionBanner({
  icon,
  message,
  action,
  variant = "info",
  className,
}: ActionBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{message}</span>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
