import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface SectionBadge {
  readonly label: string;
  readonly color?: "blue" | "purple" | "orange" | "green" | "slate";
}

interface AgentAppSectionBadgeProps {
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly badge?: SectionBadge;
  readonly className?: string;
}

const badgeColorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  purple:
    "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
  orange:
    "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300",
  green:
    "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function AgentAppSectionBadge({
  title,
  description,
  actions,
  badge,
  className,
}: AgentAppSectionBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 mb-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {badge && (
          <span
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0",
              badgeColorMap[badge.color ?? "blue"],
            )}
          >
            {badge.label}
          </span>
        )}
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
