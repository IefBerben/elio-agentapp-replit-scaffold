import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface ActionBannerProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function ActionBanner({ children, className }: ActionBannerProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-2xl p-3 md:p-5 border border-blue-200 dark:border-blue-800 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">{children}</div>
    </div>
  );
}
