import { cn } from "@/lib/utils";
import { Loader2, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GenerateButtonProps {
  readonly onClick: () => void;
  readonly isLoading: boolean;
  readonly loadingText?: string;
  readonly label?: string;
  readonly fullWidth?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function GenerateButton({
  onClick,
  isLoading,
  loadingText,
  label,
  fullWidth = false,
  disabled = false,
  className,
}: GenerateButtonProps) {
  const { t } = useTranslation();
  const isDisabled = disabled || isLoading;
  const displayLabel = label || t("agentAppCommon.generate");
  const displayLoadingText = loadingText || t("agentAppCommon.generating");

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all py-3 px-6 text-sm md:text-base rounded-xl",
        "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white",
        "w-full md:w-auto max-w-full",
        "whitespace-nowrap overflow-hidden text-ellipsis",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        fullWidth && "md:w-full",
        className,
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin shrink-0" />
          <span className="truncate">{displayLoadingText}</span>
        </>
      ) : (
        <>
          <Wand2 className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </>
      )}
    </button>
  );
}
