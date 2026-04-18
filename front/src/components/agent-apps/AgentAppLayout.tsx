import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

// ─── AgentAppSimpleLayout ─────────────────────────────────

interface AgentAppSimpleLayoutProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly fullHeight?: boolean;
  readonly noPadding?: boolean;
}

export function AgentAppSimpleLayout({
  children,
  className,
  fullHeight = true,
  noPadding = false,
}: AgentAppSimpleLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden",
        fullHeight ? "h-full" : "min-h-screen",
        className,
      )}
    >
      <div
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          !noPadding && "py-4 md:py-6",
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ─── AgentAppCard ─────────────────────────────────────────

export function AgentAppCard({
  children,
  className,
  noPadding = false,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly noPadding?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-sm",
        !noPadding && "p-3 md:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Alias for readability in form contexts */
export { AgentAppCard as AgentAppCardForm };

// ─── AgentAppSection ──────────────────────────────────────

export function AgentAppSection({
  title,
  description,
  actions,
  className,
}: {
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4",
        className,
      )}
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
