import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GenerateButtonProps {
  readonly onClick: () => void;
  readonly isLoading: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly loadingLabel?: string;
  readonly className?: string;
  readonly variant?: "default" | "gradient";
}

export function GenerateButton({
  onClick,
  isLoading,
  disabled = false,
  label,
  loadingLabel,
  className,
  variant = "gradient",
}: GenerateButtonProps) {
  const { t } = useTranslation();
  const text = isLoading
    ? (loadingLabel ?? t("agentAppCommon.generating"))
    : (label ?? t("agentAppCommon.generate"));

  if (variant === "gradient") {
    return (
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          "relative flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold",
          "text-white rounded-full shadow-lg transition-all duration-200",
          "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700",
          "hover:shadow-xl hover:scale-[1.02]",
          (disabled || isLoading) && "opacity-60 cursor-not-allowed hover:scale-100",
          className,
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {text}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600",
        (disabled || isLoading) && "opacity-60 cursor-not-allowed",
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      {text}
    </button>
  );
}
