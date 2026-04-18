import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  readonly message: string | null | undefined;
  readonly className?: string;
}

export function ErrorBanner({ message, className }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div
      className={cn(
        "rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400",
        className,
      )}
      role="alert"
    >
      {message}
    </div>
  );
}
